import { Request, Response } from 'express';
import Pengajuan from '../models/Pengajuan';
import PengajuanFile from '../models/PengajuanFile';
import PengajuanAuditLog from '../models/PengajuanAuditLog';
import Pegawai from '../models/Pegawai';
import Letter from '../models/Letter';
import JobTypeConfiguration from '../models/JobTypeConfiguration';
import User from '../models/User';
import Office from '../models/Office';
import { Op } from 'sequelize';
import { db } from '../models/index';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AdminWilayahFileConfig from '../models/AdminWilayahFileConfig';
import { 
  getKabupatenByGroupFromDB, 
  kabupatenGroups, 
  getAllGroupPatterns,
  normalizeKabupatenName,
  matchesKabupatenPattern
} from '../config/kabupatenGroups';

// Helper function to format file names to user-friendly format
function formatFileNameToUserFriendly(fileName: string): string {
  console.log('Formatting file name:', fileName);
  const fileMapping: { [key: string]: string } = {
    // SK (Surat Keputusan)
    'surat_keputusan_kenaikan_pangkat_terakhir': 'SK Kenaikan Pangkat Terakhir',
    'surat_keputusan_kenaikan_pangkat_ter': 'SK Kenaikan Pangkat Terakhir',
    'surat_keputusan_pns': 'SK PNS',
    'surat_keputusan_cpns': 'SK CPNS',
    'surat_keputusan_jabatan_terakhir': 'SK Jabatan Terakhir',
    
    // Surat Keterangan
    'surat_keterangan_anjab_abk_instansi_asal': 'SK Anjab ABK Instansi Asal',
    'surat_keterangan_anjab_abk_instansi_penerima': 'SK Anjab ABK Instansi Penerima',
    'surat_keterangan_anjab_abk_instansi_pembina': 'SK Anjab ABK Instansi Pembina',
    'surat_keterangan_anjab_abk_instansi_a': 'SK Anjab ABK Instansi A',
    'surat_keterangan_anjab_abk_instansi_p': 'SK Anjab ABK Instansi P',
    
    // Surat Lainnya
    'surat_rekomendasi_instansi_pembina': 'Surat Rekomendasi Instansi Pembina',
    'surat_persetujuan_mutasi_asal': 'Surat Persetujuan Mutasi Asal',
    'surat_permohonan_dari_yang_bersangkut': 'Surat Permohonan dari Yang Bersangkutan',
    'surat_permohonan_dari_yang_bersangk': 'Surat Permohonan dari Yang Bersangkutan',
    'surat_lolos_butuh_ppk': 'Surat Lolos Butuh PPK',
    
    // Anjab ABK
    'anjab_abk_instansi_asal': 'Anjab ABK Instansi Asal',
    'anjab_abk_instansi_penerima': 'Anjab ABK Instansi Penerima',
    'anjab_abk_instansi_pembina': 'Anjab ABK Instansi Pembina',
    
    // Dokumen Lainnya
    'peta_jabatan': 'Peta Jabatan',
    'hasil_evaluasi_pertimbangan_baperjaka': 'Hasil Evaluasi Pertimbangan Baperjaka',
    'hasil_evaluasi_pertimbangan_baperjakat': 'Hasil Evaluasi Pertimbangan Baperjakat'
  };
  
  // Return mapped name if exists, otherwise format the underscore name
  return fileMapping[fileName] || fileName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// =============== REKAP AGGREGATE (Admin Wilayah & Superadmin) ===============
export async function getRekapAggregate(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { q, dateFrom, dateTo } = req.query as any;
    const statusFilters = (req.query.status as any) ? ([] as string[]).concat(req.query.status as any) : undefined;
    const kabFilters = (req.query.kabupaten as any) ? ([] as string[]).concat(req.query.kabupaten as any) : undefined;

    // Build where clause for pengajuan
    const where: any = {};
    if (statusFilters && statusFilters.length > 0) {
      where.status = { [Op.in]: statusFilters };
    }
    if (dateFrom || dateTo) {
      where.created_at = {
        ...(dateFrom ? { [Op.gte]: new Date(dateFrom) } : {}),
        ...(dateTo ? { [Op.lte]: new Date(dateTo) } : {}),
      };
    }

    // Scope: superadmin (role 'admin') melihat semua; lainnya dibatasi office_id
    if (user.role !== 'admin' && user.office_id) {
      where.office_id = user.office_id;
    }

    // Include for joins and optional search/kabupaten filter
    const include: any[] = [
      { model: Pegawai, as: 'pegawai', attributes: ['nama', 'nip'], required: false },
      { model: Office, as: 'office', attributes: ['kabkota', 'name'], required: true }
    ];
    if (q) {
      include[0] = {
        model: Pegawai,
        as: 'pegawai',
        attributes: ['nama', 'nip'],
        where: {
          [Op.or]: [
            { nama: { [Op.like]: `%${q}%` } },
            { nip: { [Op.like]: `%${q}%` } }
          ]
        },
        required: true
      };
    }
    if (kabFilters && kabFilters.length > 0) {
      include[1] = {
        model: Office,
        as: 'office',
        attributes: ['kabkota', 'name'],
        where: { kabkota: { [Op.in]: kabFilters } },
        required: true
      };
    }

    // Fetch rows (limited set is fine; aggregation performed in memory per current scale)
    const rows = await Pengajuan.findAll({ where, include, attributes: ['id', 'status', 'created_at'], order: [['created_at', 'DESC']] });

    // Aggregate by kabupaten and status
    const map: Record<string, Record<string, number>> = {};
    rows.forEach((r: any) => {
      const kab = r.office?.kabkota || r.office?.name || 'Lainnya';
      const st = r.status;
      map[kab] = map[kab] || {};
      map[kab][st] = (map[kab][st] || 0) + 1;
    });

    const aggregation = Object.entries(map).map(([kabupaten, statuses]) => ({
      kabupaten,
      total: Object.values(statuses).reduce((a: number, b: any) => a + (b as number), 0),
      statuses: Object.entries(statuses).map(([status, count]) => ({ status, count }))
    }));

    return res.json({ success: true, data: { aggregation, total: rows.length } });
  } catch (error) {
    console.error('Error in getRekapAggregate:', error);
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

export async function getRekapList(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { kabupaten, status, q, page = 1, pageSize = 25 } = req.query as any;
    const offset = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (status) where.status = status;
    if (user.role !== 'admin' && user.office_id) where.office_id = user.office_id;

    const include: any[] = [
      { model: Pegawai, as: 'pegawai', attributes: ['nama', 'nip'], required: false },
      { model: Office, as: 'office', attributes: ['kabkota', 'name'], required: true }
    ];

    if (kabupaten) {
      include[1] = { model: Office, as: 'office', attributes: ['kabkota', 'name'], where: { kabkota: kabupaten }, required: true };
    }
    if (q) {
      include[0] = {
        model: Pegawai,
        as: 'pegawai',
        attributes: ['nama', 'nip'],
        where: {
          [Op.or]: [
            { nama: { [Op.like]: `%${q}%` } },
            { nip: { [Op.like]: `%${q}%` } }
          ]
        },
        required: true
      };
    }

    const { rows, count } = await Pengajuan.findAndCountAll({ where, include, order: [['created_at', 'DESC']], limit: Number(pageSize), offset, distinct: true });
    const data = rows.map((p: any) => ({
      id: p.id,
      nama: p.pegawai?.nama || '-',
      nip: p.pegawai?.nip || '-',
      kabupaten: p.office?.kabkota || p.office?.name || '-',
      status: p.status,
      jenis_jabatan: p.jenis_jabatan,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    return res.json({ success: true, data: { items: data, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error) {
    console.error('Error in getRekapList:', error);
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

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

    // Validasi duplikasi: cek apakah pegawai sudah punya pengajuan untuk jenis jabatan yang sama
    console.log('🔍 Checking for duplicate pengajuan:', {
      pegawai_nip,
      jenis_jabatan: finalJenisJabatan,
      office_id: user.office_id
    });

    const existingPengajuan = await Pengajuan.findOne({
      where: {
        pegawai_nip: pegawai_nip,
        jenis_jabatan: finalJenisJabatan,
        office_id: user.office_id || null
      }
    });

    if (existingPengajuan) {
      console.log('❌ Duplicate pengajuan found:', {
        existing_id: existingPengajuan.id,
        existing_status: existingPengajuan.status,
        pegawai_nip,
        jenis_jabatan: finalJenisJabatan,
        office_id: user.office_id
      });
      
      return res.status(400).json({ 
        success: false, 
        message: `Pegawai ${pegawai.nama} (NIP: ${pegawai_nip}) sudah memiliki pengajuan untuk jabatan "${finalJenisJabatan}". Tidak dapat membuat pengajuan duplikat.` 
      });
    }

    console.log('✅ No duplicate found, proceeding with pengajuan creation');

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
    const { file_type, file_category } = req.body;
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

    // Enforce per-type file size limits (default 500KB, SKP 2 Tahun Terakhir up to 1.7MB)
    const onePointSevenMB = Math.floor(1.7 * 1024 * 1024);
    const fiveHundredKB = 500 * 1024;
    const allowedSize = file_type === 'skp_2_tahun_terakhir' ? onePointSevenMB : fiveHundredKB;
    
    logger.info('File size validation', {
      fileType: file_type,
      fileSize: file.size,
      fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      allowedSize: allowedSize,
      allowedSizeMB: (allowedSize / (1024 * 1024)).toFixed(2) + 'MB',
      isSKP2Tahun: file_type === 'skp_2_tahun_terakhir',
      fileName: file.originalname
    });
    
    if (file.size > allowedSize) {
      logger.error('File size exceeded limit', {
        fileType: file_type,
        fileSize: file.size,
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
        allowedSize: allowedSize,
        allowedSizeMB: (allowedSize / (1024 * 1024)).toFixed(2) + 'MB',
        fileName: file.originalname
      });
      
      return res.status(400).json({
        success: false,
        message: file_type === 'skp_2_tahun_terakhir'
          ? 'File SKP 2 Tahun Terakhir maksimal 1.7MB.'
          : 'File terlalu besar. Maksimal 500KB.'
      });
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

    // Validasi: Pastikan file yang diupload sesuai dengan jabatan pengajuan
    if (pengajuan.jabatan_id) {
      const jobTypeConfig = await JobTypeConfiguration.findByPk(pengajuan.jabatan_id);
      if (jobTypeConfig && jobTypeConfig.required_files) {
        let requiredFiles: string[] = [];
        try {
          requiredFiles = JSON.parse(jobTypeConfig.required_files);
        } catch (parseError) {
          logger.error('Error parsing required_files', { parseError, jabatanId: pengajuan.jabatan_id });
        }

        // Cek apakah file_type ada di requiredFiles untuk jabatan pengajuan
        const isRequiredFile = requiredFiles.includes(file_type);
        
        // Untuk admin wilayah files, cek di admin wilayah config
        let isAdminWilayahFile = false;
        if (file_category === 'admin_wilayah') {
          const AdminWilayahFileConfig = (await import('../models/AdminWilayahFileConfig')).default;
          const adminWilayahConfig = await AdminWilayahFileConfig.findOne({
            where: {
              jenis_jabatan_id: pengajuan.jabatan_id,
              file_type: file_type,
              is_active: true
            }
          });
          isAdminWilayahFile = !!adminWilayahConfig;
        }

        if (!isRequiredFile && !isAdminWilayahFile) {
          logger.error('File upload failed - file type not allowed for this jabatan', {
            pengajuanId: pengajuan_id,
            fileType: file_type,
            jabatanId: pengajuan.jabatan_id,
            jenisJabatan: pengajuan.jenis_jabatan,
            requiredFiles: requiredFiles,
            fileName: file.originalname,
            userId: user?.id,
            ip: req.ip
          });
          
          return res.status(400).json({
            success: false,
            message: `File "${file_type}" tidak sesuai dengan jabatan pengajuan "${pengajuan.jenis_jabatan}". Silakan upload file yang sesuai dengan jabatan pengajuan.`
          });
        }
      }
    }

    // Office access check (admin, admin_wilayah, dan kanwil dapat akses pengajuan kantornya)
    if (user?.role !== 'admin' && user?.role !== 'admin_wilayah' && user?.role !== 'kanwil' && user?.office_id && pengajuan.office_id !== user.office_id) {
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
        file_size: file.size,
        file_category: file_category || 'kabupaten'
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
        file_size: file.size,
        file_category: file_category || 'kabupaten'
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

    // Office access check (admin dan admin_wilayah dapat akses pengajuan kantornya)
    if (user?.role !== 'admin' && user?.role !== 'admin_wilayah' && user?.office_id && pengajuan.office_id !== user.office_id) {
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

    // Update status pengajuan dari rejected ke draft jika status saat ini adalah rejected
    if (pengajuan.status === 'rejected') {
      logger.info('Updating pengajuan status from rejected to draft', {
        pengajuanId: pengajuan_id,
        oldStatus: pengajuan.status,
        newStatus: 'draft',
        userId: user?.id
      });

      await pengajuan.update({
        status: 'draft',
        updated_at: new Date()
      });

      logger.info('Pengajuan status updated successfully', {
        pengajuanId: pengajuan_id,
        newStatus: 'draft',
        userId: user?.id
      });
    }

    return res.json({ 
      success: true, 
      message: 'Dokumen berhasil diperbarui dan status pengajuan diubah ke draft', 
      data: { 
        files: updatedFiles,
        pengajuan_status: pengajuan.status === 'rejected' ? 'draft' : pengajuan.status
      } 
    });
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

    // Office access check (admin dan admin_wilayah dapat submit pengajuan kantornya)
    if (user?.role !== 'admin' && user?.role !== 'admin_wilayah' && user?.office_id && pengajuan.office_id !== user.office_id) {
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

// Submit pengajuan kanwil (langsung ke admin, skip admin wilayah)
export async function submitKanwil(req: AuthRequest, res: Response) {
  try {
    const { pengajuan_id } = req.params;
    const { catatan } = req.body;
    const user = req.user;

    // Validasi: hanya role kanwil yang bisa submit
    if (user?.role !== 'kanwil') {
      return res.status(403).json({ success: false, message: 'Forbidden: Hanya role kanwil yang dapat menggunakan endpoint ini' });
    }

    const pengajuan = await Pengajuan.findByPk(pengajuan_id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Office access check
    if (user?.office_id && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Validasi: status harus draft
    if (pengajuan.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Pengajuan hanya dapat disubmit saat status draft' 
      });
    }

    // Get all uploaded files
    const uploadedFiles = await PengajuanFile.findAll({
      where: { pengajuan_id }
    });

    // Validasi file kabupaten (dari job type config)
    if (pengajuan.jabatan_id) {
      const JobTypeConfiguration = (await import('../models/JobTypeConfiguration')).default;
      const jobTypeConfig = await JobTypeConfiguration.findByPk(pengajuan.jabatan_id);
      
      if (jobTypeConfig && jobTypeConfig.required_files) {
        const requiredKabupatenFiles = Array.isArray(jobTypeConfig.required_files) 
          ? jobTypeConfig.required_files 
          : JSON.parse(jobTypeConfig.required_files);
        
        const uploadedKabupatenFiles = uploadedFiles.filter(f => 
          !f.file_category || f.file_category === 'kabupaten'
        );
        
        const missingKabupatenFiles = requiredKabupatenFiles.filter((fileType: string) => 
          !uploadedKabupatenFiles.some(f => f.file_type === fileType)
        );
        
        if (missingKabupatenFiles.length > 0) {
          return res.status(400).json({ 
            success: false, 
            message: `File kabupaten belum lengkap. File yang belum diupload: ${missingKabupatenFiles.join(', ')}` 
          });
        }
      }
    }

    // Validasi file admin wilayah (dari admin wilayah config)
    if (pengajuan.jabatan_id) {
      const AdminWilayahFileConfig = (await import('../models/AdminWilayahFileConfig')).default;
      const adminWilayahConfigs = await AdminWilayahFileConfig.findAll({
        where: { 
          jenis_jabatan_id: pengajuan.jabatan_id,
          is_active: true 
        }
      });
      
      if (adminWilayahConfigs.length > 0) {
        const requiredAdminWilayahFiles = adminWilayahConfigs
          .filter(config => config.is_required)
          .map(config => config.file_type);
        
        const uploadedAdminWilayahFiles = uploadedFiles.filter(f => 
          f.file_category === 'admin_wilayah'
        );
        
        const missingAdminWilayahFiles = requiredAdminWilayahFiles.filter((fileType: string) => 
          !uploadedAdminWilayahFiles.some(f => f.file_type === fileType)
        );
        
        if (missingAdminWilayahFiles.length > 0) {
          return res.status(400).json({ 
            success: false, 
            message: `File admin wilayah belum lengkap. File yang belum diupload: ${missingAdminWilayahFiles.join(', ')}` 
          });
        }
      }
    }

    // Update status ke kanwil_submitted
    await pengajuan.update({ 
      status: 'kanwil_submitted',
      catatan 
    });

    res.json({ success: true, data: pengajuan, message: 'Pengajuan kanwil berhasil disubmit ke admin' });
  } catch (error) {
    console.error('Error in submitKanwil:', error);
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
        { model: Office, as: 'office', attributes: ['id', 'name', 'kabkota', 'address'] },
        { 
          model: PengajuanFile, 
          as: 'files'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email', 'role', 'office_id'],
          include: [
            {
              model: Office,
              as: 'office',
              attributes: ['id', 'name', 'kabkota']
            }
          ],
          required: false
        }
      ]
    });

    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Check if user has access to this pengajuan
    // - admin: full access
    // - admin_wilayah: access to pengajuan from their office for verification
    // - user (admin pusat read-only): global access only for final_approved
    // - bimas: can access pengajuan kabupaten (can view detail and files)
    // - others: must match office_id
    if (user.role === 'user') {
      if (pengajuan.status !== 'final_approved') {
        return res.status(403).json({ success: false, message: 'Forbidden: Hanya pengajuan final_approved yang dapat diakses' });
      }
    } else if (user.role === 'admin_wilayah') {
      // Admin wilayah can access pengajuan from their office for verification
      if (pengajuan.office_id !== user.office_id) {
        return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke pengajuan ini' });
      }
    } else if (user.role === 'bimas') {
      // Bimas can access pengajuan kabupaten (can view detail and files)
      // No office_id restriction for bimas role
    } else if (user.role !== 'admin' && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Get required files based on jenis_jabatan
    let requiredFiles: string[] = [];
    let jobTypeConfig = null;
    
    try {
      // Get from job type configuration - use case-insensitive comparison
      const jenisJabatanLower = pengajuan.jenis_jabatan?.toLowerCase().trim();
      console.log('🔍 Looking for job type config with jenis_jabatan:', pengajuan.jenis_jabatan, '(normalized:', jenisJabatanLower, ')');
      
      // Try exact match first
      jobTypeConfig = await JobTypeConfiguration.findOne({
        where: { 
          jenis_jabatan: pengajuan.jenis_jabatan,
          is_active: true 
        }
      });
      
      // If not found, try case-insensitive match
      if (!jobTypeConfig && jenisJabatanLower) {
        const allConfigs = await JobTypeConfiguration.findAll({
          where: { 
            is_active: true 
          }
        });
        jobTypeConfig = allConfigs.find(config => 
          config.jenis_jabatan?.toLowerCase().trim() === jenisJabatanLower
        ) || null;
        
        if (jobTypeConfig) {
          console.log('✅ Found job type config with case-insensitive match:', jobTypeConfig.jenis_jabatan);
        }
      }
      
      if (jobTypeConfig && jobTypeConfig.required_files) {
        // Parse JSON string to array
        try {
          requiredFiles = JSON.parse(jobTypeConfig.required_files);
          console.log('✅ Using job type config for:', pengajuan.jenis_jabatan);
          console.log('✅ Found config jenis_jabatan:', jobTypeConfig.jenis_jabatan);
          console.log('✅ Required files count:', requiredFiles.length);
          console.log('✅ Required files:', requiredFiles);
        } catch (parseError) {
          console.error('Error parsing required_files JSON:', parseError);
          requiredFiles = [];
        }
      } else {
        // Log why we're using fallback
        if (!jobTypeConfig) {
          console.log('⚠️  No job type config found for:', pengajuan.jenis_jabatan);
          // Try to see what configs exist
          const allConfigs = await JobTypeConfiguration.findAll({
            where: { is_active: true },
            attributes: ['id', 'jenis_jabatan']
          });
          console.log('⚠️  Available job type configs:', allConfigs.map(c => c.jenis_jabatan));
        } else {
          console.log('⚠️  Job type config found but required_files is empty');
        }
        
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
        
        requiredFiles = defaultFiles[pengajuan.jenis_jabatan?.toLowerCase() || ''] || fungsionalUmum;
        console.log('⚠️  Using fallback for:', pengajuan.jenis_jabatan);
        console.log('⚠️  Fallback required files count:', requiredFiles.length);
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

    // Sort files by file_type alphabetically
    if (pengajuan && (pengajuan as any).files) {
      (pengajuan as any).files.sort((a: any, b: any) => a.file_type.localeCompare(b.file_type));
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
    const { status, page = 1, limit = 50, created_by, search, jenis_jabatan, kabupaten_group } = req.query;
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const where: any = {};
    
    // RBAC filter
    // - admin: lihat semua
    // - user (admin pusat read-only): global final_approved saja
    // - admin_wilayah: lihat pengajuan dari wilayahnya (termasuk yang sudah di-submit ke superadmin)
    // - operator: lihat pengajuan yang mereka buat
    // - kanwil: lihat pengajuan yang mereka buat
    // - bimas: read-only, hanya pengajuan dengan jenis_jabatan penghulu/penyuluh, status selain draft/rejected
    if (user.role === 'user') {
      where.status = 'final_approved';
    } else if (user.role === 'admin_wilayah') {
      where.office_id = user.office_id;
      // Admin wilayah bisa filter by status dari query parameter
      if (status) {
        where.status = status;
      }
    } else if (user.role === 'operator' || user.role === 'kanwil') {
      where.created_by = user.id;
      // Operator/Kanwil bisa filter by status dari query parameter
      if (status) {
        where.status = status;
      }
    } else if (user.role === 'bimas') {
      // Filter status: selain draft dan rejected (mandatory untuk bimas)
      where.status = { [Op.notIn]: ['draft', 'rejected'] };
      
      // Filter jenis_jabatan: hanya penghulu dan penyuluh (cek di job_type_configuration)
      const bimasJobTypes = await JobTypeConfiguration.findAll({
        where: {
          is_active: true,
          jenis_jabatan: {
            [Op.or]: [
              { [Op.like]: '%penghulu%' },
              { [Op.like]: '%penyuluh%' }
            ]
          }
        },
        attributes: ['jenis_jabatan']
      });
      
      const allowedJenisJabatan = bimasJobTypes.map(jt => jt.jenis_jabatan);
      if (allowedJenisJabatan.length > 0) {
        where.jenis_jabatan = { [Op.in]: allowedJenisJabatan };
      } else {
        // Jika tidak ada jenis jabatan yang match, return empty result
        where.jenis_jabatan = { [Op.in]: [] };
      }
    } else {
      // admin: bisa filter by status dari query parameter
      if (status) {
        where.status = status;
      }
    }

    // Filter berdasarkan created_by (siapa yang membuat) - hanya untuk admin
    if (created_by && created_by !== 'all' && user.role === 'admin') {
      where.created_by = created_by;
    }

    // Filter berdasarkan jenis jabatan dari query parameter - untuk admin, user, dan admin_wilayah (bimas sudah di-filter di atas)
    if (jenis_jabatan && jenis_jabatan !== 'all' && (user.role === 'admin' || user.role === 'user' || user.role === 'admin_wilayah')) {
      where.jenis_jabatan = jenis_jabatan;
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Debug logging
    console.log('🔍 getAllPengajuan Debug:', {
      status,
      page,
      limit,
      created_by,
      search,
      jenis_jabatan,
      userRole: user.role,
      userOfficeId: user.office_id,
      whereClause: where,
      offset: (Number(page) - 1) * Number(limit)
    });

    // Build include conditions for search
    const includeConditions: any[] = [
      { model: Pegawai, as: 'pegawai', required: false },
      { model: PengajuanFile, as: 'files', required: false },
      { model: Office, as: 'office', attributes: ['id', 'kabkota', 'name'], required: false }
    ];

    // Handle kabupaten_group filter
    if (kabupaten_group && kabupaten_group !== 'all') {
      // Get all unique kabupaten from offices database
      const allOffices = await Office.findAll({
        attributes: ['kabkota'],
        group: ['kabkota'],
        raw: true
      });
      const allKabupatenFromDB = allOffices.map((o: any) => o.kabkota).filter(Boolean);
      
      // Get kabupaten that match the selected group (using pattern matching)
      const kabupatenList = getKabupatenByGroupFromDB(
        kabupaten_group as string,
        allKabupatenFromDB
      );
      
      if (kabupatenList.length > 0) {
        includeConditions[2] = {
          model: Office,
          as: 'office',
          attributes: ['id', 'kabkota', 'name'],
          where: {
            kabkota: { [Op.in]: kabupatenList }
          },
          required: true
        };
      }
    }

    // Add search functionality
    if (search) {
      // Search in pegawai nama, jabatan, or office name
      includeConditions[0] = {
        model: Pegawai,
        as: 'pegawai',
        where: {
          [Op.or]: [
            { nama: { [Op.like]: `%${search}%` } },
            { jabatan: { [Op.like]: `%${search}%` } },
            { unit_kerja: { [Op.like]: `%${search}%` } }
          ]
        },
        required: true
      };
    }

    // Special handling for admin_wilayah_submitted filter
    if (status === 'admin_wilayah_submitted') {
      // Add condition to only include pengajuan that have admin_wilayah files
      includeConditions[1] = {
        model: PengajuanFile,
        as: 'files',
        where: {
          file_category: 'admin_wilayah'
        },
        required: true
      };
    }
    
    // Special handling for kanwil_submitted filter
    if (status === 'kanwil_submitted') {
      // kanwil_submitted is a direct status, no special file filtering needed
      // The status filter in where clause already handles this
    }

    // For admin_wilayah_approved status, use a simpler approach to avoid count issues
    let pengajuan: { count: number; rows: any[] };
    if (status === 'admin_wilayah_approved') {
      // Get count separately to avoid issues with includes
      const count = await Pengajuan.count({ where });
      
      // Get data with includes
      const rows = await Pengajuan.findAll({
        where,
        include: includeConditions,
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
      });
      
      pengajuan = { count, rows };
    } else {
      pengajuan = await Pengajuan.findAndCountAll({
        where,
        include: includeConditions,
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset,
        distinct: true
      });
    }

    // Debug logging for query results
    console.log('📊 Query Results:', {
      totalCount: pengajuan.count,
      returnedRows: pengajuan.rows.length,
      status: status,
      limit: Number(limit),
      offset: offset
    });

    // Additional debug: Check total count for admin_wilayah_approved status specifically
    if (status === 'admin_wilayah_approved') {
      const totalAdminWilayahApproved = await Pengajuan.count({
        where: { status: 'admin_wilayah_approved' }
      });
      console.log('🔍 Total admin_wilayah_approved in database:', totalAdminWilayahApproved);
      
      // Check by office
      const byOffice = await Pengajuan.findAll({
        where: { status: 'admin_wilayah_approved' },
        include: [{ model: Office, as: 'office', attributes: ['id', 'kabkota', 'name'] }],
        attributes: ['id', 'office_id'],
        raw: false
      });
      
      const officeCounts = byOffice.reduce((acc: any, p: any) => {
        const officeName = p.office?.kabkota || p.office?.name || 'Unknown';
        acc[officeName] = (acc[officeName] || 0) + 1;
        return acc;
      }, {});
      
      console.log('🏢 admin_wilayah_approved by office:', officeCounts);
      
      // Debug: Check what the actual query returns
      console.log('🔍 Actual query where clause:', where);
      console.log('🔍 Include conditions:', includeConditions);
      
      // Test query without includes
      const testQuery = await Pengajuan.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset,
        distinct: true
      });
      console.log('🔍 Test query without includes - count:', testQuery.count, 'rows:', testQuery.rows.length);
    }

    // Additional debug: Check total count for admin_wilayah_submitted filter
    if (status === 'admin_wilayah_submitted') {
      const totalAdminWilayahSubmitted = await Pengajuan.count({
        where: { status: 'submitted' },
        include: [{
          model: PengajuanFile,
          as: 'files',
          where: { file_category: 'admin_wilayah' },
          required: true
        }]
      });
      console.log('🔍 Total admin_wilayah_submitted in database:', totalAdminWilayahSubmitted);
      
      // Check by office
      const byOffice = await Pengajuan.findAll({
        where: { status: 'submitted' },
        include: [
          { model: Office, as: 'office', attributes: ['id', 'kabkota', 'name'] },
          {
            model: PengajuanFile,
            as: 'files',
            where: { file_category: 'admin_wilayah' },
            required: true
          }
        ],
        attributes: ['id', 'office_id'],
        raw: false
      });
      
      const officeCounts = byOffice.reduce((acc: any, p: any) => {
        const officeName = p.office?.kabkota || p.office?.name || 'Unknown';
        acc[officeName] = (acc[officeName] || 0) + 1;
        return acc;
      }, {});
      
      console.log('🏢 admin_wilayah_submitted by office:', officeCounts);
    }

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

    // Tambahkan grouping berdasarkan kabupaten/kota untuk admin dan user read-only
    let groupedByKabkota: Record<string, any[]> | undefined = undefined;
    if (user.role === 'admin' || user.role === 'user') {
      groupedByKabkota = updatedPengajuanRows.reduce((acc: any, row: any) => {
        const kab = row.office?.kabkota || row.office?.name || row.pegawai?.induk_unit || row.pegawai?.unit_kerja || 'Lainnya';
        if (!acc[kab]) acc[kab] = [];
        acc[kab].push(row);
        return acc;
      }, {} as Record<string, any[]>);
      
      console.log('🔍 Backend grouped data:', groupedByKabkota);
      console.log('🔍 Backend grouped data keys:', Object.keys(groupedByKabkota || {}));
    }

    const paginationData = {
      total: pengajuan.count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(pengajuan.count / Number(limit))
    };


    res.json({ 
      success: true, 
      data: updatedPengajuanRows,
      ...(groupedByKabkota ? { grouped_by_kabkota: groupedByKabkota } : {}),
      pagination: paginationData
    });
    return;
  } catch (error) {
    console.error('Error in getAllPengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
    return;
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

    // Office access check (admin dan admin_wilayah dapat akses pengajuan kantornya)
    if (user.role !== 'admin' && user.role !== 'admin_wilayah' && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Pengajuan dengan status rejected, draft, atau admin_wilayah_rejected yang bisa diresubmit
    if (pengajuan.status !== 'rejected' && pengajuan.status !== 'draft' && pengajuan.status !== 'admin_wilayah_rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected, draft, or admin_wilayah_rejected pengajuan can be resubmitted' });
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

// Replace pengajuan file (superadmin only)
export async function replacePengajuanFile(req: AuthRequest, res: Response) {
  try {
    const { pengajuanId, fileId } = req.params;
    const user = req.user;
    const file = req.file;

    // Validasi role - admin dan admin_wilayah bisa mengganti file
    if (user?.role !== 'admin' && user?.role !== 'admin_wilayah') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin dan admin_wilayah yang bisa mengganti file'
      });
    }

    // Validasi file upload
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File tidak ditemukan'
      });
    }

    // Debug file info
    console.log('🔍 Debug file upload:', {
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname,
      destination: file.destination,
      path: file.path
    });

    // Validasi pengajuan
    const pengajuan = await Pengajuan.findByPk(pengajuanId);
    if (!pengajuan) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan tidak ditemukan'
      });
    }

    // Validasi status - tidak boleh draft
    if (pengajuan.status === 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Tidak bisa mengganti file yang masih dalam draft. Tunggu operator submit terlebih dahulu.'
      });
    }

    // Validasi file exists
    console.log('🔍 Looking for file:', { fileId, pengajuanId, userRole: user?.role });
    
    const existingFile = await PengajuanFile.findByPk(fileId);
    console.log('🔍 File found in DB:', { 
      found: !!existingFile, 
      fileId: existingFile?.id,
      pengajuanId: existingFile?.pengajuan_id,
      fileCategory: existingFile?.file_category,
      fileType: existingFile?.file_type,
      fileName: existingFile?.file_name
    });
    
    if (!existingFile) {
      console.log('❌ File not found in database:', { fileId });
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan di database'
      });
    }
    
    if (existingFile.pengajuan_id !== pengajuanId) {
      console.log('❌ File pengajuan_id mismatch:', { 
        filePengajuanId: existingFile.pengajuan_id, 
        requestPengajuanId: pengajuanId 
      });
      return res.status(404).json({
        success: false,
        message: 'File tidak terkait dengan pengajuan ini'
      });
    }

    // Debug file category untuk super admin
    console.log('🔍 Super admin replacing file:', {
      fileId,
      fileCategory: existingFile.file_category,
      fileType: existingFile.file_type,
      fileName: existingFile.file_name
    });

    // Simpan path file lama untuk audit
    const oldFilePath = existingFile.file_path;

    // Untuk file admin wilayah, pastikan tidak ada duplikasi dengan file type yang sama
    if (existingFile.file_category === 'admin_wilayah') {
      // Cek apakah ada file lain dengan file_type yang sama
      const duplicateFiles = await PengajuanFile.findAll({
        where: {
          pengajuan_id: pengajuanId,
          file_type: existingFile.file_type,
          file_category: 'admin_wilayah',
          id: { [require('sequelize').Op.ne]: fileId } // Exclude current file
        }
      });
      
      // Hapus file duplikat jika ada
      if (duplicateFiles.length > 0) {
        console.log(`🗑️ Removing ${duplicateFiles.length} duplicate admin wilayah files for type: ${existingFile.file_type}`);
        await PengajuanFile.destroy({
          where: {
            id: { [require('sequelize').Op.in]: duplicateFiles.map(f => f.id) }
          }
        });
      }
    }

    // Update file record - untuk file admin wilayah, pastikan tidak ada duplikasi
    await existingFile.update({
      file_name: file.originalname,
      file_path: `uploads/pengajuan/${file.filename}`,
      file_size: file.size,
      // Reset verification status saat file diganti
      verification_status: 'pending',
      verified_by: undefined,
      verification_notes: undefined,
      verified_at: undefined
    });

    // Log file replacement (optional - bisa ditambah tabel audit log)
    console.log(`File replaced: ${fileId} by ${user.full_name} (${user.role})`);

    res.json({
      success: true,
      message: 'File berhasil diganti',
      data: {
        id: existingFile.id,
        file_name: file.originalname,
        file_size: file.size,
        replaced_by: user.full_name,
        replaced_by_role: user.role
      }
    });

  } catch (error) {
    console.error('Error in replacePengajuanFile:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengganti file'
    });
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

    // RBAC: admin selalu boleh; admin_wilayah boleh jika pengajuan milik kantornya dan status sesuai
    if (user.role !== 'admin') {
      const pengajuan = await Pengajuan.findByPk(file.pengajuan_id);
      if (!pengajuan) {
        return res.status(404).json({ success: false, message: 'Pengajuan not found for this file' });
      }
      const sameOffice = user.office_id && pengajuan.office_id === user.office_id;
      const statusAllowed = (pengajuan.status === 'approved' || pengajuan.status === 'submitted' || pengajuan.status === 'admin_wilayah_submitted');
      if (!(user.role === 'admin_wilayah' && sameOffice && statusAllowed)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak berhak memverifikasi file ini' });
      }
    }

    // Update file verification status
    await file.update({
      verification_status: verification_status,
      verification_notes: verification_notes || null,
      verified_by: user.id,
      verified_at: new Date()
    });

    // Jika superadmin reject file admin_wilayah, cek apakah semua file admin wilayah ditolak
    // Jika ya, ubah status pengajuan ke admin_wilayah_rejected
    if (user.role === 'admin' && file.file_category === 'admin_wilayah' && verification_status === 'rejected') {
      const pengajuan = await Pengajuan.findByPk(file.pengajuan_id);
      if (pengajuan && pengajuan.status === 'admin_wilayah_submitted') {
        // Ambil konfigurasi file admin wilayah yang required
        let requiredFileTypes: string[] = [];
        try {
          const jobType = await JobTypeConfiguration.findOne({
            where: { jenis_jabatan: pengajuan.jenis_jabatan, is_active: true }
          });
          if (jobType) {
            const jobTypeId = (jobType as any).id;
            const requiredConfigs = await AdminWilayahFileConfig.findAll({
              where: { jenis_jabatan_id: jobTypeId, is_required: true, is_active: true } as any
            });
            requiredFileTypes = requiredConfigs.map((c: any) => c.file_type);
          }
        } catch (error) {
          console.error('Error fetching admin wilayah file config:', error);
        }

        // Cek apakah semua file admin wilayah yang required sudah ditolak
        if (requiredFileTypes.length > 0) {
          const allRequiredFiles = await PengajuanFile.findAll({
            where: {
              pengajuan_id: file.pengajuan_id,
              file_category: 'admin_wilayah',
              file_type: { [Op.in]: requiredFileTypes }
            } as any
          });

          const allRejected = allRequiredFiles.every(f => f.verification_status === 'rejected');
          
          if (allRejected && allRequiredFiles.length === requiredFileTypes.length) {
            // Semua file admin wilayah yang required sudah ditolak, ubah status pengajuan
            await pengajuan.update({
              status: 'admin_wilayah_rejected',
              final_rejected_by: user.email || user.id,
              final_rejected_at: new Date(),
              final_rejection_reason: `Semua dokumen admin wilayah ditolak oleh Superadmin`
            });
          }
        }
      }
    }

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

    // Semua user yang authenticated bisa akses filter options
    // (tidak perlu restrict ke admin saja karena filter options berguna untuk semua user)
    
    // For admin_wilayah, we need to ensure user has office_id loaded
    if (user.role === 'admin_wilayah' && !user.office_id) {
      const userWithOffice = await User.findByPk(user.id, {
        include: [{ model: Office, as: 'office' }]
      });
      if (userWithOffice) {
        user.office_id = userWithOffice.office_id;
        console.log('🔍 Loaded office_id for admin_wilayah:', user.office_id);
      }
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

    // Build where clause based on user role for status filtering
    // Konsisten dengan getAllPengajuan
    let whereClause: any = {};
    
    console.log('🔍 Filter Options - User role:', user.role, 'Office ID:', user.office_id, 'User ID:', user.id);
    
    // RBAC filter - konsisten dengan getAllPengajuan
    // - admin: lihat semua
    // - user (admin pusat read-only): global final_approved saja
    // - admin_wilayah: lihat pengajuan dari wilayahnya (termasuk yang sudah di-submit ke superadmin)
    // - operator: lihat pengajuan yang mereka buat
    // - kanwil: lihat pengajuan yang mereka buat
    if (user.role === 'user') {
      whereClause.status = 'final_approved';
      console.log('🔍 Read-only user filter - status: final_approved');
    } else if (user.role === 'admin_wilayah') {
      whereClause.office_id = user.office_id;
      console.log('🔍 Admin wilayah filter - office_id:', user.office_id);
    } else if (user.role === 'operator' || user.role === 'kanwil') {
      whereClause.created_by = user.id;
      console.log('🔍 Operator/Kanwil filter - created_by:', user.id);
    }
    // admin: no restrictions
    
    console.log('🔍 Where clause for status filter:', whereClause);

    // Get unique statuses from pengajuan with count - only show statuses that actually exist in database
    console.log('🔍 Getting status data with whereClause:', whereClause);
    const statusData = await Pengajuan.findAll({
      attributes: [
        'status',
        [db.fn('COUNT', db.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status'],
      having: db.where(db.fn('COUNT', db.col('id')), '>', 0),
      raw: true,
      order: [['status', 'ASC']]
    });

    // Get unique jenis jabatan from pengajuan with count
    console.log('🔍 Getting jenis jabatan data with whereClause:', whereClause);
    const jenisJabatanData = await Pengajuan.findAll({
      attributes: [
        'jenis_jabatan',
        [db.fn('COUNT', db.col('id')), 'count']
      ],
      where: whereClause,
      group: ['jenis_jabatan'],
      having: db.where(db.fn('COUNT', db.col('id')), '>', 0),
      raw: true,
      order: [['jenis_jabatan', 'ASC']]
    });

    console.log('🔍 Status data from database:', statusData);
    console.log('🔍 Jenis jabatan data from database:', jenisJabatanData);

    // Tidak perlu special handling lagi karena status 'admin_wilayah_submitted' sudah ada di database
    // Logika lama sudah tidak digunakan karena sekarang ada status 'admin_wilayah_submitted' yang terpisah

    // Format status options with count - only include statuses that exist in database
    const statusOptions = statusData
      .filter(item => item.status && item.status.trim() !== '') // Filter out null/empty statuses
      .map(item => ({
        value: item.status,
        label: getStatusDisplayName(item.status),
        count: parseInt((item as any).count as string)
      }));

    console.log('🔍 Backend - Status data from DB:', statusData);
    console.log('🔍 Backend - Formatted status options:', statusOptions);

    // Format jenis jabatan options with count
    const jenisJabatanOptions = jenisJabatanData
      .filter(item => item.jenis_jabatan && item.jenis_jabatan.trim() !== '')
      .map(item => ({
        value: item.jenis_jabatan,
        label: item.jenis_jabatan,
        count: parseInt((item as any).count as string)
      }));

    console.log('🔍 Backend - Jenis jabatan options:', jenisJabatanOptions);

    // Get kabupaten groups with counts (only for admin and user roles)
    let kabupatenGroupOptions: Array<{ groupName: string; kabupaten: string[]; count: number }> = [];
    let kabupatenOptions: Array<{ name: string; count: number }> = [];
    
    if (user.role === 'admin' || user.role === 'user') {
      // Get all unique kabupaten from pengajuan with their office
      const pengajuanWithOffice = await Pengajuan.findAll({
        where: whereClause,
        include: [
          { model: Office, as: 'office', attributes: ['kabkota', 'name'], required: false }
        ],
        attributes: ['id'],
        raw: false
      });

      // Count pengajuan per kabupaten
      const kabupatenCounts: Record<string, number> = {};
      pengajuanWithOffice.forEach((p: any) => {
        const kab = p.office?.kabkota || p.office?.name || 'Lainnya';
        kabupatenCounts[kab] = (kabupatenCounts[kab] || 0) + 1;
      });

      // Build kabupaten options (individual)
      kabupatenOptions = Object.entries(kabupatenCounts)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Get all unique kabupaten from offices database for pattern matching
      const allOffices = await Office.findAll({
        attributes: ['kabkota'],
        group: ['kabkota'],
        raw: true
      });
      const allKabupatenFromDB = allOffices.map((o: any) => o.kabkota).filter(Boolean);

      // Build group options with counts using pattern matching
      for (const group of kabupatenGroups) {
        // Get kabupaten from DB that match this group's patterns
        const matchedKabupaten = getKabupatenByGroupFromDB(
          group.groupName,
          allKabupatenFromDB
        );
        
        // Count pengajuan for matched kabupaten
        let groupCount = 0;
        for (const kab of matchedKabupaten) {
          groupCount += kabupatenCounts[kab] || 0;
        }

        // Only include groups that have at least one kabupaten with data
        // Always include Sumbawa group (even if count is 0, for completeness)
        if (groupCount > 0 || group.groupName === 'Sumbawa') {
          kabupatenGroupOptions.push({
            groupName: group.groupName,
            kabupaten: matchedKabupaten, // Use actual kabupaten names from DB
            count: groupCount
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        users: users,
        statuses: statusOptions,
        jenisJabatan: jenisJabatanOptions,
        kabupatenGroups: kabupatenGroupOptions,
        kabupaten: kabupatenOptions
      }
    });
  } catch (error) {
    console.error('Error in getFilterOptions:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Helper function to get display name for status
function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'submitted': 'Diajukan',
    'approved': 'Disetujui',
    'rejected': 'Ditolak Admin Wilayah',
    'resubmitted': 'Diajukan Ulang',
    'admin_wilayah_approved': 'Disetujui Admin Wilayah',
    'admin_wilayah_rejected': 'Ditolak Superadmin',
    'admin_wilayah_submitted': 'Diajukan Admin Wilayah',
    'kanwil_submitted': 'Diajukan Kanwil',
    'kanwil_approved': 'Disetujui Kanwil',
    'final_approved': 'Final Approved',
    'final_rejected': 'Final Rejected'
  };
  
  return statusMap[status] || status;
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









// Final approval pengajuan oleh superadmin
export async function finalApprovePengajuan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya superadmin yang bisa approve final
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can approve final' });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Hanya bisa approve final jika status admin_wilayah_submitted atau kanwil_submitted
    const currentStatus = pengajuan.status as string;
    if (currentStatus !== 'admin_wilayah_submitted' && currentStatus !== 'kanwil_submitted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Hanya pengajuan yang sudah diajukan admin wilayah atau kanwil yang bisa diapprove final' 
      });
    }

    // Update status pengajuan menjadi final_approved
    await pengajuan.update({
      status: 'final_approved',
      final_approved_by: user.email || user.id,
      final_approved_at: new Date()
    });




    res.json({ 
      success: true, 
      message: 'Pengajuan final approved successfully',
      data: pengajuan
    });
  } catch (error) {
    console.error('Error in finalApprovePengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Final rejection pengajuan oleh superadmin
export async function finalRejectPengajuan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya superadmin yang bisa reject final
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can reject final' });
    }

    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Alasan penolakan final wajib diisi' 
      });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Hanya bisa reject final jika status admin_wilayah_submitted atau kanwil_submitted
    const currentStatus = pengajuan.status as string;
    if (currentStatus !== 'admin_wilayah_submitted' && currentStatus !== 'kanwil_submitted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Hanya pengajuan yang sudah diajukan admin wilayah atau kanwil yang bisa direject final' 
      });
    }

    // Update status pengajuan
    // Untuk admin_wilayah_submitted: kembali ke admin_wilayah_rejected
    // Untuk kanwil_submitted: kembali ke draft agar kanwil bisa revisi
    const rejectionTimestamp = new Date();
    const rejectionIdentity = user.email || user.id;
    
    const newStatus = (pengajuan.status as string) === 'kanwil_submitted' ? 'draft' : 'admin_wilayah_rejected';

    await pengajuan.update({
      status: newStatus,
      rejected_by: rejectionIdentity,
      rejected_at: rejectionTimestamp,
      rejection_reason: rejection_reason.trim(),
      final_rejected_by: rejectionIdentity,
      final_rejected_at: rejectionTimestamp,
      final_rejection_reason: rejection_reason.trim()
    });




    res.json({ 
      success: true, 
      message: 'Pengajuan final rejected successfully',
      data: pengajuan
    });
  } catch (error) {
    console.error('Error in finalRejectPengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Edit jabatan pengajuan oleh superadmin
export async function editJabatanPengajuan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { jabatan_id, jenis_jabatan, reason } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya superadmin yang bisa edit jabatan
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can edit jabatan' });
    }

    if (!jabatan_id || !jenis_jabatan) {
      return res.status(400).json({ 
        success: false, 
        message: 'jabatan_id dan jenis_jabatan wajib diisi' 
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Alasan perubahan jabatan wajib diisi' 
      });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Simpan nilai lama untuk audit log
    const oldJabatanId = pengajuan.jabatan_id;
    const oldJenisJabatan = pengajuan.jenis_jabatan;

    // Get required files for new jabatan
    const newJobType = await JobTypeConfiguration.findByPk(jabatan_id);
    if (!newJobType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Jenis jabatan tidak ditemukan' 
      });
    }

    const requiredFiles = JSON.parse(newJobType.required_files || '[]');
    
    // Get current uploaded files
    const currentFiles = await PengajuanFile.findAll({
      where: { 
        pengajuan_id: id,
        file_category: 'kabupaten'
      }
    });
    
    const currentFileTypes = currentFiles.map(f => f.file_type);
    const missingFiles = requiredFiles.filter((req: string) => !currentFileTypes.includes(req));
    const extraFiles = currentFileTypes.filter(current => !requiredFiles.includes(current));

    // Delete admin wilayah files when jabatan is changed
    // This ensures clean workflow - admin wilayah must upload new files for new jabatan
    await PengajuanFile.destroy({
      where: { 
        pengajuan_id: id,
        file_category: 'admin_wilayah'
      }
    });

    // Update jabatan pengajuan
    await pengajuan.update({
      jabatan_id: jabatan_id,
      jenis_jabatan: jenis_jabatan
    });

    // SELALU reset status ke draft ketika jabatan diubah
    // Ini memastikan operator bisa upload file baru yang diperlukan untuk jabatan baru
    let statusUpdate: { status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'resubmitted' | 'admin_wilayah_approved' | 'admin_wilayah_rejected' | 'admin_wilayah_submitted' | 'final_approved' | 'final_rejected'; catatan?: string } = {};
    let additionalNote = '';

    // Reset status to draft SELALU ketika jabatan diubah
    // Ini memastikan operator bisa upload file baru yang diperlukan untuk jabatan baru
    statusUpdate = { 
      status: 'draft',
      catatan: `Jabatan diubah dari ${oldJenisJabatan} ke ${jenis_jabatan}. `
    };
    
    if (missingFiles.length > 0) {
      console.log('Missing files before format:', missingFiles);
      const userFriendlyMissingFiles = missingFiles.map(formatFileNameToUserFriendly);
      console.log('Missing files after format:', userFriendlyMissingFiles);
      additionalNote += `Berkas yang kurang: ${userFriendlyMissingFiles.join(', ')}. `;
    }
    
    if (extraFiles.length > 0) {
      console.log('Extra files before format:', extraFiles);
      const userFriendlyExtraFiles = extraFiles.map(formatFileNameToUserFriendly);
      console.log('Extra files after format:', userFriendlyExtraFiles);
      additionalNote += `Berkas yang tidak diperlukan: ${userFriendlyExtraFiles.join(', ')}. `;
    }
    
    if (missingFiles.length > 0 || extraFiles.length > 0) {
      additionalNote += 'Silakan sesuaikan berkas yang diupload.';
    } else {
      additionalNote += 'Silakan pastikan semua berkas sesuai dengan jabatan baru.';
    }
    
    await pengajuan.update({
      ...statusUpdate,
      catatan: statusUpdate.catatan + additionalNote
    });

    // Buat audit log
    await PengajuanAuditLog.create({
      id: uuidv4(),
      pengajuan_id: id,
      action: 'jabatan_changed',
      field_name: 'jabatan',
      old_value: JSON.stringify({ jabatan_id: oldJabatanId, jenis_jabatan: oldJenisJabatan }),
      new_value: JSON.stringify({ jabatan_id, jenis_jabatan }),
      reason: reason.trim(),
      changed_by: user.id,
      changed_by_name: user.full_name || user.email || 'Unknown User'
    });

    logger.info('Jabatan pengajuan changed by superadmin', {
      pengajuanId: id,
      oldJabatan: { jabatan_id: oldJabatanId, jenis_jabatan: oldJenisJabatan },
      newJabatan: { jabatan_id, jenis_jabatan },
      changedBy: user.id,
      reason: reason.trim()
    });

    res.json({ 
      success: true, 
      message: 'Jabatan pengajuan berhasil diubah',
      data: {
        pengajuan,
        old_jabatan: { jabatan_id: oldJabatanId, jenis_jabatan: oldJenisJabatan },
        new_jabatan: { jabatan_id, jenis_jabatan },
        file_validation: {
          required_files: requiredFiles,
          current_files: currentFileTypes,
          missing_files: missingFiles,
          extra_files: extraFiles,
          needs_adjustment: missingFiles.length > 0 || extraFiles.length > 0,
          status_changed: Object.keys(statusUpdate).length > 0
        }
      }
    });
  } catch (error) {
    console.error('Error in editJabatanPengajuan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Get audit log untuk pengajuan
export async function getPengajuanAuditLog(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya superadmin yang bisa lihat audit log
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can view audit log' });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const totalCount = await PengajuanAuditLog.count({
      where: { pengajuan_id: id }
    });

    // Get paginated audit logs
    const auditLogs = await PengajuanAuditLog.findAll({
      where: { pengajuan_id: id },
      order: [['changed_at', 'DESC']],
      limit: limitNum,
      offset: offset,
      include: [
        { model: User, as: 'changer', attributes: ['id', 'full_name', 'email'] }
      ]
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({ 
      success: true, 
      data: {
        audit_logs: auditLogs,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_count: totalCount,
          limit: limitNum,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error in getPengajuanAuditLog:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Get available jabatan untuk edit
// Update status pengajuan (superadmin only)
export async function updatePengajuanStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya superadmin yang bisa update status
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can update status' });
    }

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status wajib diisi' 
      });
    }

    // Validasi status yang diizinkan
    const allowedStatuses = ['draft', 'submitted', 'approved', 'rejected', 'resubmitted', 
      'admin_wilayah_approved', 'admin_wilayah_rejected', 'admin_wilayah_submitted', 
      'final_approved', 'final_rejected'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Status tidak valid. Status yang diizinkan: ${allowedStatuses.join(', ')}` 
      });
    }

    const pengajuan = await Pengajuan.findByPk(id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Simpan nilai lama untuk audit log
    const oldStatus = pengajuan.status;

    // Update status
    await pengajuan.update({
      status: status as any,
      catatan: reason ? `${pengajuan.catatan || ''}\n[Status diubah oleh superadmin: ${oldStatus} → ${status}] ${reason}`.trim() : pengajuan.catatan
    });

    // Buat audit log
    await PengajuanAuditLog.create({
      id: uuidv4(),
      pengajuan_id: id,
      action: 'status_changed',
      field_name: 'status',
      old_value: oldStatus,
      new_value: status,
      reason: reason || 'Status diubah oleh superadmin',
      changed_by: user.id,
      changed_by_name: user.full_name || user.email || 'Unknown User'
    });

    logger.info('Status pengajuan changed by superadmin', {
      pengajuanId: id,
      oldStatus,
      newStatus: status,
      changedBy: user.id,
      reason: reason || 'No reason provided'
    });

    res.json({ 
      success: true, 
      message: 'Status pengajuan berhasil diubah',
      data: {
        pengajuan,
        old_status: oldStatus,
        new_status: status
      }
    });
  } catch (error) {
    console.error('Error in updatePengajuanStatus:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

export async function getAvailableJabatan(req: AuthRequest, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Hanya superadmin yang bisa lihat daftar jabatan
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only superadmin can view available jabatan' });
    }

    const jobTypes = await JobTypeConfiguration.findAll({
      where: { is_active: true },
      order: [['jenis_jabatan', 'ASC']],
      attributes: ['id', 'jenis_jabatan', 'min_dokumen', 'max_dokumen', 'required_files']
    });

    res.json({ 
      success: true, 
      data: jobTypes
    });
  } catch (error) {
    console.error('Error in getAvailableJabatan:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

export default {
  getPegawaiGroupedByKabupaten,
  createPengajuan,
  uploadPengajuanFile,
  submitPengajuan,
  getPengajuanDetail,
  getAllPengajuan,
  approvePengajuan,
  rejectPengajuan,
  resubmitPengajuan,
  deletePengajuan,
  verifyFile,
  generatePrintReport,
  getFilterOptions,
  updatePengajuanFiles,
  finalApprovePengajuan,
  finalRejectPengajuan,
  replacePengajuanFile,
  editJabatanPengajuan,
  getPengajuanAuditLog,
  getAvailableJabatan,
  updatePengajuanStatus
};