import { Request, Response } from 'express';
import Pengajuan from '../models/Pengajuan';
import PengajuanFile from '../models/PengajuanFile';
import Pegawai from '../models/Pegawai';
import Letter from '../models/Letter';
import JobTypeConfiguration from '../models/JobTypeConfiguration';
import User from '../models/User';
import Office from '../models/Office';
import { Op } from 'sequelize';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

// Get pegawai grouped by kabupaten with surat generated
export async function getPegawaiGroupedByKabupaten(req: AuthRequest, res: Response) {
  try {
    const { search, kabupaten } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('User data:', { role: user.role, id: user.id, email: user.email, office_id: user.office_id });

    // Debug: Check total letters
    const totalLetters = await Letter.count();
    console.log('Total letters in database:', totalLetters);

    // Debug: Check letters created by this user
    const lettersByUser = await Letter.count({
      where: { created_by: user.id }
    });
    console.log('Letters created by user:', lettersByUser);

    // Debug: Check sample letters by user
    const sampleLettersByUser = await Letter.findAll({
      attributes: ['id', 'created_by', 'recipient_employee_nip'],
      where: { created_by: user.id },
      limit: 5
    });
    console.log('Sample letters by user:', sampleLettersByUser.map(l => l.toJSON()));

    // Build where clause untuk letters berdasarkan office/user
    const letterWhereClause: any = {
      recipient_employee_nip: { [Op.not]: '' }
    };

    // Filter letters berdasarkan office (kecuali admin yang bisa lihat semua)
    if (user.role !== 'admin' && user.office_id) {
      letterWhereClause.office_id = user.office_id;
    }

    console.log('Letter where clause:', JSON.stringify(letterWhereClause, null, 2));

    // Dapatkan semua NIP pegawai yang memiliki surat dari user ini
    const lettersByUserResult = await Letter.findAll({
      attributes: ['recipient_employee_nip'],
      where: letterWhereClause,
      group: ['recipient_employee_nip']
    });

    const recipientNips = lettersByUserResult.map(l => l.recipient_employee_nip);
    console.log('Recipient NIPs from user:', recipientNips.length);
    console.log('Sample recipient NIPs:', recipientNips.slice(0, 5));

    // Build where clause untuk pegawai
    const whereClause: any = {
      aktif: true,
      nip: { [Op.in]: recipientNips }
    };

    if (search) {
      whereClause[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { jabatan: { [Op.like]: `%${search}%` } },
        { unit_kerja: { [Op.like]: `%${search}%` } }
      ];
    }

    if (kabupaten) {
      whereClause.induk_unit = kabupaten;
    }

    console.log('Where clause for pegawai:', JSON.stringify(whereClause, null, 2));

    // Query untuk pegawai yang memiliki surat generated
    const pegawai = await Pegawai.findAll({
      where: whereClause as any,
      order: [['nama', 'ASC']]
    });

    console.log('Total pegawai found:', pegawai.length);

    // Count surat for each pegawai
    const pegawaiWithSuratCount = await Promise.all(
      pegawai.map(async (p) => {
        const suratCount = await Letter.count({
          where: { 
            recipient_employee_nip: p.nip,
            ...(user.role !== 'admin' ? { created_by: user.id } : {})
          }
        });
        return {
          ...p.toJSON(),
          total_surat: suratCount
        };
      })
    );

    // Filter only pegawai with surat generated
    const pegawaiWithSurat = pegawaiWithSuratCount.filter(p => p.total_surat > 0);

    console.log('Pegawai with surat:', pegawaiWithSurat.length);

    // Group by kabupaten (induk_unit)
    const grouped = pegawaiWithSurat.reduce((acc, p) => {
      const kab = p.induk_unit || 'Lainnya';
      if (!acc[kab]) acc[kab] = [];
      acc[kab].push(p);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('Grouped data:', Object.keys(grouped));
    
    res.json({ success: true, data: grouped });
  } catch (error) {
    console.error('Error in getPegawaiGroupedByKabupaten:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Create pengajuan baru
export async function createPengajuan(req: AuthRequest, res: Response) {
  try {
    const { pegawai_nip, jabatan_id, jenis_jabatan } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get pegawai data
    const pegawai = await Pegawai.findByPk(pegawai_nip);
    if (!pegawai) {
      return res.status(404).json({ success: false, message: 'Pegawai tidak ditemukan' });
    }

    // Get job type configuration untuk menentukan jumlah dokumen yang diperlukan
    let finalJenisJabatan = jenis_jabatan;
    let totalDokumen = 0;
    
    if (finalJenisJabatan) {
      // Cari job type configuration berdasarkan jenis_jabatan
      const jobTypeConfig = await JobTypeConfiguration.findOne({
        where: { 
          jenis_jabatan: finalJenisJabatan,
          is_active: true 
        }
      });
      
      if (jobTypeConfig) {
        totalDokumen = jobTypeConfig.max_dokumen || 0;
        console.log('✅ Using job type config for:', finalJenisJabatan, 'with max_dokumen:', totalDokumen);
      } else {
        return res.status(400).json({ success: false, message: `Konfigurasi jabatan "${finalJenisJabatan}" tidak ditemukan atau tidak aktif` });
      }
    } else {
      // Jika jenis_jabatan tidak disediakan, gunakan default
      finalJenisJabatan = 'fungsional';
      const jobTypeConfig = await JobTypeConfiguration.findOne({
        where: { 
          jenis_jabatan: finalJenisJabatan,
          is_active: true 
        }
      });
      
      if (jobTypeConfig) {
        totalDokumen = jobTypeConfig.max_dokumen || 0;
        console.log('✅ Using default job type config for:', finalJenisJabatan, 'with max_dokumen:', totalDokumen);
      } else {
        return res.status(400).json({ success: false, message: 'Konfigurasi jabatan default tidak ditemukan' });
      }
    }

    // Validasi kantor untuk non-admin
    if (user.role !== 'admin') {
      if (!user.office_id) {
        return res.status(400).json({ success: false, message: 'Akun Anda tidak terhubung ke kantor manapun' });
      }
    }

    // Create pengajuan (office_id mengikuti user)
    const pengajuan = await Pengajuan.create({
      pegawai_nip,
      total_dokumen: totalDokumen,
      jenis_jabatan: finalJenisJabatan,
      created_by: user.id,
      office_id: user.office_id || null
    });

    res.json({ success: true, data: pengajuan });
  } catch (error) {
    console.error('Error in createPengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Upload file untuk pengajuan
export async function uploadPengajuanFile(req: AuthRequest, res: Response) {
  try {
    const { pengajuan_id } = req.params;
    const { file_type } = req.body;
    const file = req.file as any;
    const user = req.user;

    logger.info('File upload attempt', {
      pengajuanId: pengajuan_id,
      fileType: file_type,
      userId: user?.id,
      userEmail: user?.email,
      ip: req.ip
    });

    if (!file) {
      logger.error('File upload failed - no file provided', {
        pengajuanId: pengajuan_id,
        fileType: file_type,
        userId: user?.id,
        ip: req.ip
      });
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    if (!file_type) {
      logger.error('File upload failed - no file type provided', {
        pengajuanId: pengajuan_id,
        fileName: file.originalname,
        fileSize: file.size,
        userId: user?.id,
        ip: req.ip
      });
      return res.status(400).json({ success: false, message: 'File type tidak ditemukan' });
    }

    logger.info('File details received', {
      pengajuanId: pengajuan_id,
      fileType: file_type,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: file.path,
      userId: user?.id
    });

    // Check if pengajuan exists
    const pengajuan = await Pengajuan.findByPk(pengajuan_id);
    if (!pengajuan) {
      logger.error('File upload failed - pengajuan not found', {
        pengajuanId: pengajuan_id,
        fileType: file_type,
        fileName: file.originalname,
        userId: user?.id,
        ip: req.ip
      });
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Office access check (non-admin hanya boleh akses pengajuan kantornya)
    if (user?.role !== 'admin' && user?.office_id && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda hanya dapat mengelola pengajuan dari kantor Anda' });
    }

    // Check if file already exists for this type
    const existingFile = await PengajuanFile.findOne({
      where: { pengajuan_id, file_type }
    });

    if (existingFile) {
      logger.info('Updating existing file', {
        pengajuanId: pengajuan_id,
        fileType: file_type,
        oldFileName: existingFile.file_name,
        newFileName: file.originalname,
        oldFileSize: existingFile.file_size,
        newFileSize: file.size,
        userId: user?.id
      });

      // Update existing file
      await existingFile.update({
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size
      });
    } else {
      logger.info('Creating new file record', {
        pengajuanId: pengajuan_id,
        fileType: file_type,
        fileName: file.originalname,
        fileSize: file.size,
        userId: user?.id
      });

      // Create new file
      await PengajuanFile.create({
        pengajuan_id,
        file_type,
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size
      });
    }

    logger.info('File upload completed successfully', {
      pengajuanId: pengajuan_id,
      fileType: file_type,
      fileName: file.originalname,
      fileSize: file.size,
      userId: user?.id,
      ip: req.ip
    });

    res.json({ success: true, message: 'File berhasil diupload' });
  } catch (error) {
    logger.error('File upload failed with error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      pengajuanId: req.params.pengajuan_id,
      fileType: req.body.file_type,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      userId: req.user?.id,
      ip: req.ip
    });

    console.error('Error in uploadPengajuanFile:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Update/replace multiple rejected files for a pengajuan
export async function updatePengajuanFiles(req: AuthRequest, res: Response) {
  try {
    const { pengajuan_id } = req.params as any;
    const files = (req as any).files as Express.Multer.File[] | undefined;
    let { file_types } = req.body as { file_types?: string | string[] };
    const user = req.user;

    logger.info('Multiple file upload attempt', {
      pengajuanId: pengajuan_id,
      filesCount: files?.length || 0,
      fileTypes: file_types,
      userId: user?.id,
      userEmail: user?.email,
      ip: req.ip
    });

    if (!files || files.length === 0) {
      logger.warn('Multiple file upload failed - no files provided', {
        pengajuanId: pengajuan_id,
        userId: user?.id,
        ip: req.ip
      });
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
    }

    // Normalisasi file_types menjadi array paralel dengan files
    if (!file_types) {
      logger.warn('Multiple file upload failed - no file types provided', {
        pengajuanId: pengajuan_id,
        filesCount: files.length,
        userId: user?.id,
        ip: req.ip
      });
      return res.status(400).json({ success: false, message: 'file_types diperlukan' });
    }
    if (!Array.isArray(file_types)) {
      file_types = [file_types];
    }
    if (file_types.length !== files.length) {
      logger.warn('Multiple file upload failed - file types count mismatch', {
        pengajuanId: pengajuan_id,
        filesCount: files.length,
        fileTypesCount: file_types.length,
        userId: user?.id,
        ip: req.ip
      });
      return res.status(400).json({ success: false, message: 'Jumlah file_types tidak sesuai dengan jumlah files' });
    }

    logger.info('File validation passed', {
      pengajuanId: pengajuan_id,
      filesCount: files.length,
      fileTypes: file_types,
      userId: user?.id
    });

    // Log details of each file
    files.forEach((file, index) => {
      logger.info(`File ${index + 1} details`, {
        pengajuanId: pengajuan_id,
        fileIndex: index + 1,
        fileType: file_types[index],
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath: file.path,
        userId: user?.id
      });
    });

    // Pastikan pengajuan ada
    const pengajuan = await Pengajuan.findByPk(pengajuan_id);
    if (!pengajuan) {
      logger.error('Multiple file upload failed - pengajuan not found', {
        pengajuanId: pengajuan_id,
        filesCount: files.length,
        userId: user?.id,
        ip: req.ip
      });
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Office access check (non-admin hanya boleh akses pengajuan kantornya)
    if (user?.role !== 'admin' && user?.office_id && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda hanya dapat mengelola pengajuan dari kantor Anda' });
    }

    logger.info('Pengajuan found for multiple file upload', {
      pengajuanId: pengajuan_id,
      pengajuanStatus: pengajuan.status,
      pegawaiNip: pengajuan.pegawai_nip,
      jenisJabatan: pengajuan.jenis_jabatan,
      filesCount: files.length
    });

    // Untuk setiap file yang diunggah, update atau buat record dan reset status verifikasi ke pending
    const updatedFiles = [] as any[];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const type = file_types[i];

      logger.info(`Processing file ${i + 1}/${files.length}`, {
        pengajuanId: pengajuan_id,
        fileIndex: i + 1,
        fileType: type,
        fileName: f.originalname,
        fileSize: f.size,
        userId: user?.id
      });

      const existing = await PengajuanFile.findOne({ where: { pengajuan_id, file_type: type } });
      if (existing) {
        logger.info(`Updating existing file ${i + 1}`, {
          pengajuanId: pengajuan_id,
          fileType: type,
          oldFileName: existing.file_name,
          newFileName: f.originalname,
          oldFileSize: existing.file_size,
          newFileSize: f.size,
          userId: user?.id
        });

        await existing.update({
          file_name: f.originalname,
          file_path: f.path,
          file_size: f.size,
          upload_status: 'uploaded',
          verification_status: 'pending',
          verification_notes: null,
          verified_by: null as any,
          verified_at: null as any,
        } as any);
        updatedFiles.push(existing);

        logger.info(`File ${i + 1} updated successfully`, {
          pengajuanId: pengajuan_id,
          fileType: type,
          fileName: f.originalname,
          fileSize: f.size,
          userId: user?.id
        });
      } else {
        logger.info(`Creating new file record ${i + 1}`, {
          pengajuanId: pengajuan_id,
          fileType: type,
          fileName: f.originalname,
          fileSize: f.size,
          userId: user?.id
        });

        const created = await PengajuanFile.create({
          pengajuan_id,
          file_type: type,
          file_name: f.originalname,
          file_path: f.path,
          file_size: f.size,
          upload_status: 'uploaded',
          verification_status: 'pending',
        } as any);
        updatedFiles.push(created);

        logger.info(`File ${i + 1} created successfully`, {
          pengajuanId: pengajuan_id,
          fileType: type,
          fileName: f.originalname,
          fileSize: f.size,
          userId: user?.id
        });
      }
    }

    logger.info('Multiple file upload completed successfully', {
      pengajuanId: pengajuan_id,
      filesCount: files.length,
      updatedFilesCount: updatedFiles.length,
      userId: user?.id,
      ip: req.ip
    });

    return res.json({ success: true, message: 'Dokumen berhasil diperbarui', data: { files: updatedFiles } });
  } catch (error) {
    logger.error('Multiple file upload failed with error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      pengajuanId: req.params.pengajuan_id,
      filesCount: (req as any).files?.length || 0,
      fileTypes: req.body.file_types,
      userId: req.user?.id,
      ip: req.ip
    });

    console.error('Error in updatePengajuanFiles:', error);
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Submit pengajuan
export async function submitPengajuan(req: AuthRequest, res: Response) {
  try {
    const { pengajuan_id } = req.params;
    const { catatan } = req.body;
    const user = req.user;

    const pengajuan = await Pengajuan.findByPk(pengajuan_id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Office access check (non-admin hanya boleh submit pengajuan kantornya)
    if (user?.role !== 'admin' && user?.office_id && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Check if all required files uploaded
    const uploadedFiles = await PengajuanFile.findAll({
      where: { pengajuan_id }
    });

    // For now, just check if at least one file is uploaded
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Belum ada berkas diupload' 
      });
    }

    await pengajuan.update({ 
      status: 'submitted',
      catatan 
    });

    res.json({ success: true, data: pengajuan });
  } catch (error) {
    console.error('Error in submitPengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Get pengajuan detail
export async function getPengajuanDetail(req: AuthRequest, res: Response) {
  try {
    const { pengajuan_id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pengajuan = await Pengajuan.findByPk(pengajuan_id, {
      include: [
        { model: Pegawai, as: 'pegawai' },
        { model: PengajuanFile, as: 'files' }
      ]
    });

    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Check if user has access to this pengajuan (kecuali admin)
    if (user.role !== 'admin' && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Get required files based on jenis_jabatan
    let requiredFiles: string[] = [];
    let jobTypeConfig = null;
    
    try {
      // Get from job type configuration
      jobTypeConfig = await JobTypeConfiguration.findOne({
        where: { 
          jenis_jabatan: pengajuan.jenis_jabatan,
          is_active: true 
        }
      });
      
      if (jobTypeConfig && jobTypeConfig.required_files) {
        // Parse JSON string to array
        try {
          requiredFiles = JSON.parse(jobTypeConfig.required_files);
          console.log('✅ Using job type config for:', pengajuan.jenis_jabatan);
          console.log('✅ Required files:', requiredFiles);
        } catch (parseError) {
          console.error('Error parsing required_files JSON:', parseError);
          requiredFiles = [];
        }
      } else {
        // Fallback: use default required files based on jenis_jabatan
        const fungsionalUmum = [
          'surat_pengantar',
          'surat_permohonan_dari_yang_bersangkutan',
          'surat_keputusan_cpns',
          'surat_keputusan_pns',
          'surat_keputusan_kenaikan_pangkat_terakhir',
          'surat_keputusan_jabatan_terakhir',
          'skp_2_tahun_terakhir',
          'surat_keterangan_bebas_temuan_inspektorat'
        ];
        
        const defaultFiles: Record<string, string[]> = {
          'guru': [
            'surat_pengantar',
            'surat_permohonan_dari_yang_bersangkutan',
            'surat_keputusan_cpns',
            'surat_keputusan_pns',
            'surat_keputusan_kenaikan_pangkat_terakhir',
            'surat_keputusan_jabatan_terakhir',
            'skp_2_tahun_terakhir',
            'surat_keterangan_bebas_temuan_inspektorat'
          ],
          'eselon_iv': [
            'surat_pengantar',
            'surat_permohonan_dari_yang_bersangkutan',
            'surat_keputusan_cpns',
            'surat_keputusan_pns',
            'surat_keputusan_kenaikan_pangkat_terakhir',
            'surat_keputusan_jabatan_terakhir',
            'skp_2_tahun_terakhir',
            'surat_keterangan_bebas_temuan_inspektorat',
            'surat_keterangan_anjab_abk_instansi_asal',
            'surat_keterangan_anjab_abk_instansi_penerima'
          ],
          'fungsional': fungsionalUmum,
          'pelaksana': [
            'surat_pengantar',
            'surat_permohonan_dari_yang_bersangkutan',
            'surat_keputusan_cpns',
            'surat_keputusan_pns',
            'surat_keputusan_kenaikan_pangkat_terakhir',
            'surat_keputusan_jabatan_terakhir',
            'skp_2_tahun_terakhir'
          ]
        };
        
        requiredFiles = defaultFiles[pengajuan.jenis_jabatan] || fungsionalUmum;
        console.log('⚠️  Using fallback for:', pengajuan.jenis_jabatan);
        console.log('⚠️  Required files:', requiredFiles);
      }
    } catch (error) {
      console.error('Error getting required files:', error);
      // Use empty array as fallback
      requiredFiles = [];
    }

    // Update total_dokumen berdasarkan job type configuration jika berbeda
    let updatedTotalDokumen = pengajuan.total_dokumen;
    if (jobTypeConfig && jobTypeConfig.max_dokumen !== pengajuan.total_dokumen) {
      updatedTotalDokumen = jobTypeConfig.max_dokumen;
      console.log('🔄 Updating total_dokumen from', pengajuan.total_dokumen, 'to', updatedTotalDokumen);
    }

    res.json({ 
      success: true, 
      data: { 
        pengajuan: {
          ...pengajuan.toJSON(),
          total_dokumen: updatedTotalDokumen
        },
        requiredFiles,
        jobTypeConfig: jobTypeConfig ? {
          id: jobTypeConfig.id,
          jenis_jabatan: jobTypeConfig.jenis_jabatan,
          min_dokumen: jobTypeConfig.min_dokumen,
          max_dokumen: jobTypeConfig.max_dokumen,
          is_active: jobTypeConfig.is_active
        } : null
      } 
    });
  } catch (error) {
    console.error('Error in getPengajuanDetail:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Get all pengajuan
export async function getAllPengajuan(req: AuthRequest, res: Response) {
  try {
    const { status, page = 1, limit = 10, created_by } = req.query;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Filter berdasarkan office_id user (kecuali admin yang bisa lihat semua)
    if (user.role !== 'admin') {
      where.office_id = user.office_id;
    }

    // Filter berdasarkan created_by (siapa yang membuat)
    if (created_by) {
      where.created_by = created_by;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const pengajuan = await Pengajuan.findAndCountAll({
      where,
      include: [
        { model: Pegawai, as: 'pegawai' },
        { model: PengajuanFile, as: 'files' },
        { model: Office, as: 'office', attributes: ['id', 'kabkota', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset
    });

    // Update total_dokumen untuk setiap pengajuan berdasarkan job type configuration
    const updatedPengajuanRows = await Promise.all(
      pengajuan.rows.map(async (row) => {
        const jobTypeConfig = await JobTypeConfiguration.findOne({
          where: { 
            jenis_jabatan: row.jenis_jabatan,
            is_active: true 
          }
        });
        
        let updatedTotalDokumen = row.total_dokumen;
        if (jobTypeConfig && jobTypeConfig.max_dokumen !== row.total_dokumen) {
          updatedTotalDokumen = jobTypeConfig.max_dokumen;
        }
        
        const rowJson = row.toJSON() as any;
        return {
          ...rowJson,
          // Normalize status: treat 'resubmitted' as 'submitted' for processing
          status: rowJson.status === 'resubmitted' ? 'submitted' : rowJson.status,
          total_dokumen: updatedTotalDokumen
        };
      })
    );

    // Jika admin, tambahkan grouping berdasarkan kabupaten/kota
    let groupedByKabkota: Record<string, any[]> | undefined = undefined;
    if (user.role === 'admin') {
      groupedByKabkota = updatedPengajuanRows.reduce((acc: any, row: any) => {
        const kab = row.office?.kabkota || row.office?.name || row.pegawai?.induk_unit || row.pegawai?.unit_kerja || 'Lainnya';
        if (!acc[kab]) acc[kab] = [];
        acc[kab].push(row);
        return acc;
      }, {} as Record<string, any[]>);
    }

    res.json({ 
      success: true, 
      data: updatedPengajuanRows,
      ...(groupedByKabkota ? { grouped_by_kabkota: groupedByKabkota } : {}),
      pagination: {
        total: pengajuan.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(pengajuan.count / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in getAllPengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Approve pengajuan
export async function approvePengajuan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { catatan } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya admin yang bisa approve
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can approve pengajuan' });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan not found' });
    }

    // Hanya pengajuan dengan status submitted yang bisa diapprove
    if (pengajuan.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted pengajuan can be approved' });
    }

    // Update pengajuan
    await pengajuan.update({
      status: 'approved',
      catatan: catatan || null,
      approved_by: user.email || user.id,
      approved_at: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Pengajuan approved successfully',
      data: pengajuan
    });
  } catch (error) {
    console.error('Error in approvePengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Reject pengajuan
export async function rejectPengajuan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya admin yang bisa reject
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can reject pengajuan' });
    }

    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan not found' });
    }

    // Hanya pengajuan dengan status submitted yang bisa direject
    if (pengajuan.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted pengajuan can be rejected' });
    }

    // Update pengajuan
    await pengajuan.update({
      status: 'rejected',
      rejection_reason: rejection_reason.trim(),
      rejected_by: user.email || user.id,
      rejected_at: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Pengajuan rejected successfully',
      data: pengajuan
    });
  } catch (error) {
    console.error('Error in rejectPengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Resubmit pengajuan
export async function resubmitPengajuan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan not found' });
    }

    // Office access check (non-admin hanya boleh resubmit pengajuan kantornya)
    if (user.role !== 'admin' && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Hanya pengajuan dengan status rejected yang bisa diresubmit
    if (pengajuan.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected pengajuan can be resubmitted' });
    }

    // Update pengajuan: kembalikan ke status 'submitted' agar bisa diproses admin
    await pengajuan.update({
      status: 'submitted',
      resubmitted_by: user.email || user.id,
      resubmitted_at: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Pengajuan submitted ulang successfully',
      data: pengajuan
    });
  } catch (error) {
    console.error('Error in resubmitPengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Delete pengajuan
export async function deletePengajuan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan not found' });
    }

    console.log('🔍 Debug deletePengajuan:', {
      pengajuanId: id,
      pengajuanStatus: pengajuan.status,
      userRole: user.role,
      userOfficeId: user.office_id,
      pengajuanOfficeId: pengajuan.office_id
    });

    // Admin bisa hapus semua pengajuan dengan status apapun
    if (user.role !== 'admin') {
      // User biasa hanya bisa hapus pengajuan dengan status draft
      if (pengajuan.status !== 'draft') {
        return res.status(400).json({ success: false, message: 'Only draft pengajuan can be deleted by non-admin users' });
      }
      
      // User biasa hanya bisa hapus pengajuan dari office yang sama
      if (pengajuan.office_id !== user.office_id) {
        return res.status(400).json({ success: false, message: 'You can only delete pengajuan from your office' });
      }
    } else {
      // Admin bisa hapus semua pengajuan dengan status apapun tanpa batasan office
      console.log('✅ Admin deleting pengajuan with status:', pengajuan.status);
    }

    // Delete pengajuan (akan cascade delete files juga)
    await pengajuan.destroy();

    res.json({ 
      success: true, 
      message: 'Pengajuan deleted successfully'
    });
  } catch (error) {
    console.error('Error in deletePengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Verifikasi file individual
export async function verifyFile(req: AuthRequest, res: Response) {
  try {
    const { file_id } = req.params;
    const { verification_status, verification_notes } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Ambil file dan pengajuan terkait
    const file = await PengajuanFile.findByPk(file_id);
    
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // RBAC: admin selalu boleh; admin_wilayah boleh jika pengajuan milik kantornya dan status 'approved'
    if (user.role !== 'admin') {
      const pengajuan = await Pengajuan.findByPk(file.pengajuan_id);
      if (!pengajuan) {
        return res.status(404).json({ success: false, message: 'Pengajuan not found for this file' });
      }
      const sameOffice = user.office_id && pengajuan.office_id === user.office_id;
      const statusAllowed = (pengajuan.status === 'approved' || pengajuan.status === 'submitted');
      if (!(user.role === 'admin_wilayah' && sameOffice && statusAllowed)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak berhak memverifikasi file ini' });
      }
    }

    // Update file verification status
    await file.update({
      verification_status: verification_status,
      verification_notes: verification_notes || null,
      verified_by: user.email || user.id,
      verified_at: new Date()
    });

    res.json({ 
      success: true, 
      message: 'File verification status updated successfully',
      data: file
    });
  } catch (error) {
    console.error('Error in verifyFile:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Get filter options for admin
export async function getFilterOptions(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya admin yang bisa akses filter options
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can access filter options' });
    }

    // Get unique created_by from pengajuan
    const createdByUsers = await Pengajuan.findAll({
      attributes: ['created_by'],
      group: ['created_by'],
      raw: true
    });

                            // Get user details for created_by
                        const userIds = createdByUsers.map(u => u.created_by).filter(Boolean);
                        const users = await User.findAll({
                          where: { id: { [Op.in]: userIds } },
                          attributes: ['id', 'email', 'full_name'],
                          raw: true
                        });

                        console.log('🔍 Debug getFilterOptions - Users found:', users);

    res.json({
      success: true,
      data: {
        users: users
      }
    });
  } catch (error) {
    console.error('Error in getFilterOptions:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Generate laporan cetak
export async function generatePrintReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pengajuan = await Pengajuan.findByPk(id, {
      include: [
        { model: Pegawai, as: 'pegawai' },
        { model: PengajuanFile, as: 'files' }
      ]
    });

    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan not found' });
    }

    // Hanya pengajuan yang sudah approved yang bisa dicetak
    if (pengajuan.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved pengajuan can be printed' });
    }

    // Siapkan data untuk laporan
    const pengajuanWithRelations = pengajuan as any;
    const reportData = {
      pengajuan: {
        id: pengajuan.id,
        status: pengajuan.status,
        created_at: pengajuan.created_at,
        approved_at: pengajuan.approved_at
      },
      pegawai: {
        nama: pengajuanWithRelations.pegawai.nama,
        nip: pengajuanWithRelations.pegawai.nip,
        jabatan: pengajuanWithRelations.pegawai.jabatan
      },
      files: pengajuanWithRelations.files.map((file: any) => ({
        file_type: file.file_type,
        file_name: file.file_name,
        verification_status: file.verification_status
      }))
    };

    res.json({ 
      success: true, 
      message: 'Print report data generated successfully',
      data: reportData
    });
  } catch (error) {
    console.error('Error in generatePrintReport:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}