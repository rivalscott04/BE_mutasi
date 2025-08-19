import { Request, Response } from 'express';
import Pengajuan from '../models/Pengajuan';
import PengajuanFile from '../models/PengajuanFile';
import Pegawai from '../models/Pegawai';
import Letter from '../models/Letter';
import JobTypeConfiguration from '../models/JobTypeConfiguration';
import { Op } from 'sequelize';
import { AuthRequest } from '../middleware/auth';

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

    // Build where clause untuk letters berdasarkan created_by user
    const letterWhereClause: any = {
      recipient_employee_nip: { [Op.not]: '' }
    };

    // Filter letters berdasarkan created_by user (kecuali admin yang bisa lihat semua)
    if (user.role !== 'admin') {
      letterWhereClause.created_by = user.id;
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

    // Count generated surat berdasarkan created_by user
    const totalDokumen = await Letter.count({
      where: { 
        recipient_employee_nip: pegawai_nip,
        created_by: user.id
      }
    });

    if (totalDokumen === 0) {
      return res.status(400).json({ success: false, message: 'Pegawai belum memiliki surat yang di-generate oleh Anda' });
    }

    // Use jenis_jabatan from request body if provided, otherwise determine based on surat count
    let finalJenisJabatan = jenis_jabatan;
    if (!finalJenisJabatan) {
      if (totalDokumen >= 9) {
        finalJenisJabatan = 'guru'; // Guru dengan surat lengkap (9+ surat)
      } else {
        finalJenisJabatan = 'fungsional'; // Fungsional dengan surat parsial (<9 surat)
      }
    }

    // Create pengajuan
    const pengajuan = await Pengajuan.create({
      pegawai_nip,
      total_dokumen: totalDokumen,
      jenis_jabatan: finalJenisJabatan,
      created_by: user.id,
      office_id: user.office_id || 'default'
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

    if (!file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    if (!file_type) {
      return res.status(400).json({ success: false, message: 'File type tidak ditemukan' });
    }

    // Check if pengajuan exists
    const pengajuan = await Pengajuan.findByPk(pengajuan_id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Check if file already exists for this type
    const existingFile = await PengajuanFile.findOne({
      where: { pengajuan_id, file_type }
    });

    if (existingFile) {
      // Update existing file
      await existingFile.update({
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size
      });
    } else {
      // Create new file
      await PengajuanFile.create({
        pengajuan_id,
        file_type,
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size
      });
    }

    res.json({ success: true, message: 'File berhasil diupload' });
  } catch (error) {
    console.error('Error in uploadPengajuanFile:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// Submit pengajuan
export async function submitPengajuan(req: AuthRequest, res: Response) {
  try {
    const { pengajuan_id } = req.params;
    const { catatan } = req.body;

    const pengajuan = await Pengajuan.findByPk(pengajuan_id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
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
    try {
      // Get from job type configuration
      const jobTypeConfig = await JobTypeConfiguration.findOne({
        where: { 
          jenis_jabatan: pengajuan.jenis_jabatan,
          is_active: true 
        }
      });
      
      if (jobTypeConfig && jobTypeConfig.required_files) {
        // Parse JSON string to array
        try {
          requiredFiles = JSON.parse(jobTypeConfig.required_files);
        } catch (parseError) {
          console.error('Error parsing required_files JSON:', parseError);
          requiredFiles = [];
        }
      } else {
        // Fallback: use default required files based on jenis_jabatan
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
          'fungsional': [
            'surat_pengantar',
            'surat_permohonan_dari_yang_bersangkutan',
            'surat_keputusan_cpns',
            'surat_keputusan_pns',
            'surat_keputusan_kenaikan_pangkat_terakhir',
            'surat_keputusan_jabatan_terakhir',
            'skp_2_tahun_terakhir',
            'surat_keterangan_bebas_temuan_inspektorat'
          ],
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
        requiredFiles = defaultFiles[pengajuan.jenis_jabatan] || [];
      }
    } catch (error) {
      console.error('Error getting required files:', error);
      // Use empty array as fallback
      requiredFiles = [];
    }

    res.json({ 
      success: true, 
      data: { 
        pengajuan,
        requiredFiles 
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
    const { status, page = 1, limit = 10 } = req.query;
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

    const offset = (Number(page) - 1) * Number(limit);

    const pengajuan = await Pengajuan.findAndCountAll({
      where,
      include: [
        { model: Pegawai, as: 'pegawai' },
        { model: PengajuanFile, as: 'files' }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({ 
      success: true, 
      data: pengajuan.rows,
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