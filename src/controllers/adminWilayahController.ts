import { Request, Response } from 'express';
import { normalizeJobTypeName } from '../utils/jobTypeAlias';
import { Pengajuan, PengajuanFile, AdminWilayahFileConfig, Pegawai, Office } from '../models';

// Dashboard untuk admin wilayah - lihat pengajuan yang sudah di-ACC admin wilayah
export async function getAdminWilayahDashboard(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Ambil pengajuan yang sudah di-ACC admin wilayah
    const pengajuanList = await Pengajuan.findAll({
      where: {
        status: 'admin_wilayah_approved',
        office_id: user.office_id // Hanya lihat pengajuan dari wilayah admin
      },
      include: [
        { model: Pegawai, as: 'pegawai', attributes: ['nip', 'nama'] },
        { model: Office, as: 'office', attributes: ['id', 'name', 'kabkota'] }
      ],
      order: [['created_at', 'DESC']]
    });


    // Per-pengajuan progress info
    const enriched = await Promise.all(pengajuanList.map(async (p: any) => {
      // total required admin wilayah files
      // NOTE: pengajuan.jenis_jabatan disimpan sebagai string nama jabatan,
      // sedangkan konfigurasi admin wilayah menggunakan id numerik.
      let requiredCount = 0;
      try {
        const jobType = await (await import('../models/JobTypeConfiguration')).default.findOne({
          where: { jenis_jabatan: p.jenis_jabatan, is_active: true }
        });
        const jobTypeId = jobType ? (jobType as any).id : null;
        requiredCount = await AdminWilayahFileConfig.count({
          where: { jenis_jabatan_id: jobTypeId, is_active: true } as any
        });
      } catch {
        requiredCount = 0;
      }

      // approved admin wilayah files for this pengajuan
      const approvedAwFiles = await PengajuanFile.count({
        where: { pengajuan_id: p.id, file_category: 'admin_wilayah', verification_status: 'approved' } as any
      });

      // kabupaten files count (non admin_wilayah)
      const kabupatenFiles = await PengajuanFile.count({
        where: { pengajuan_id: p.id } as any
      });

      return {
        ...p.toJSON(),
        progress_admin_wilayah: {
          required: requiredCount,
          approved: approvedAwFiles
        },
        // Tambahkan uploadProgress untuk konsistensi dengan upload page
        uploadProgress: {
          required: approvedAwFiles, // file yang sudah diupload
          total: requiredCount,      // total file yang dibutuhkan
          isComplete: approvedAwFiles >= requiredCount
        },
        kabupaten_files_count: kabupatenFiles
      };
    }));

    // Hitung statistik sederhana
    const stats = {
      totalPengajuan: enriched.length,
      pendingUpload: enriched.filter((e) => e.progress_admin_wilayah.approved < e.progress_admin_wilayah.required).length,
      completedUpload: enriched.filter((e) => e.progress_admin_wilayah.required > 0 && e.progress_admin_wilayah.approved >= e.progress_admin_wilayah.required).length,
      totalFiles: enriched.reduce((acc, e) => acc + e.kabupaten_files_count, 0),
      verifiedFiles: enriched.reduce((acc, e) => acc + e.progress_admin_wilayah.approved, 0),
      rejectedFiles: 0,
    };


    res.json({ 
      success: true,
      data: {
        stats,
        pengajuan: enriched,
        recentUploads: []
      }
    });

  } catch (error) {
    console.error('Error in getAdminWilayahDashboard:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Arsip pengajuan untuk Admin Wilayah (sudah final oleh Superadmin)
export async function getAdminWilayahHistory(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const pengajuanList = await Pengajuan.findAll({
      where: {
        status: ['approved', 'rejected'] as any,
        office_id: user.office_id
      },
      include: [
        { model: Pegawai, as: 'pegawai', attributes: ['nip', 'nama'] },
        { model: Office, as: 'office', attributes: ['id', 'name', 'kabkota'] }
      ],
      order: [['updated_at', 'DESC']]
    });

    res.json({ success: true, pengajuan: pengajuanList });
  } catch (error) {
    console.error('Error in getAdminWilayahHistory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Lihat detail pengajuan untuk admin wilayah
export async function getPengajuanDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const pengajuan = await Pengajuan.findByPk(id, {
      include: [
        { model: Pegawai, as: 'pegawai', attributes: ['nip', 'nama'] },
        { model: Office, as: 'office', attributes: ['id', 'name', 'kabkota'] },
        { 
          model: PengajuanFile, 
          as: 'files',
          attributes: ['id', 'file_type', 'file_category', 'file_name', 'file_size', 'uploaded_by', 'uploaded_by_role', 'uploaded_by_name', 'uploaded_by_office', 'created_at']
        }
      ]
    });

    if (!pengajuan) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });
    }

    // Validasi office_id
    if (pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Ambil konfigurasi file yang perlu diupload admin wilayah
    const adminWilayahFileConfig = await AdminWilayahFileConfig.findAll({
      where: {
        jenis_jabatan_id: pengajuan.jenis_jabatan,
        is_active: true
      }
    });

    // Cek file mana yang sudah diupload admin wilayah
    const uploadedAdminWilayahFiles = (pengajuan as any).files?.filter((f: any) => f.file_category === 'admin_wilayah') || [];
    const requiredFiles = adminWilayahFileConfig.filter(config => config.is_required);
    const optionalFiles = adminWilayahFileConfig.filter(config => !config.is_required);

    // Sort files by file_type alphabetically
    if (pengajuan && (pengajuan as any).files) {
      (pengajuan as any).files.sort((a: any, b: any) => a.file_type.localeCompare(b.file_type));
    }

    res.json({
      success: true,
      pengajuan,
      adminWilayahFileConfig: {
        required: requiredFiles,
        optional: optionalFiles
      },
      uploadedAdminWilayahFiles,
      uploadProgress: {
        required: uploadedAdminWilayahFiles.length,
        total: requiredFiles.length,
        isComplete: uploadedAdminWilayahFiles.length >= requiredFiles.length
      }
    });

  } catch (error) {
    console.error('Error in getPengajuanDetail:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Admin Wilayah APPROVE pengajuan (bisa langsung, file upload opsional)
export async function approvePengajuan(req: Request, res: Response) {
  try {
    const { pengajuanId } = req.params;
    const { notes } = req.body;
    const user = (req as any).user;

    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const pengajuan = await Pengajuan.findByPk(pengajuanId);

    if (!pengajuan) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });
    }

    // Validasi office_id
    if (pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Hanya boleh approve saat status submitted dari kab/kota
    if (pengajuan.status !== 'submitted') {
      return res.status(400).json({ message: 'Pengajuan harus berstatus submitted untuk disetujui Admin Wilayah' });
    }

    // Update status pengajuan
    await pengajuan.update({ 
      status: 'admin_wilayah_approved',
      catatan: notes || 'Disetujui oleh Admin Wilayah'
    });

    res.json({
      success: true,
      message: 'Pengajuan berhasil disetujui oleh Admin Wilayah',
      pengajuan
    });

  } catch (error) {
    console.error('Error in approvePengajuan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Admin Wilayah REJECT pengajuan (bisa langsung, file upload opsional)
export async function rejectPengajuan(req: Request, res: Response) {
  try {
    const { pengajuanId } = req.params;
    const { rejection_reason, notes } = req.body;
    const user = (req as any).user;

    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const pengajuan = await Pengajuan.findByPk(pengajuanId);

    if (!pengajuan) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });
    }

    // Validasi office_id
    if (pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Hanya boleh reject saat status submitted dari kab/kota
    if (pengajuan.status !== 'submitted') {
      return res.status(400).json({ message: 'Pengajuan harus berstatus submitted untuk ditolak Admin Wilayah' });
    }

    // Update status pengajuan
    await pengajuan.update({ 
      status: 'admin_wilayah_rejected',
      rejection_reason: rejection_reason,
      catatan: notes || 'Ditolak oleh Admin Wilayah',
      rejected_by: user.id,
      rejected_at: new Date()
    });

    res.json({
      success: true,
      message: 'Pengajuan berhasil ditolak oleh Admin Wilayah',
      pengajuan
    });

  } catch (error) {
    console.error('Error in rejectPengajuan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Upload file admin wilayah (OPSIONAL sesuai konfigurasi superadmin)
export async function uploadAdminWilayahFile(req: Request, res: Response) {
  try {
    const { pengajuanId } = req.params;
    const { file_type, description } = req.body;
    const user = (req as any).user;

    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validasi pengajuan
    const pengajuan = await Pengajuan.findByPk(pengajuanId);

    if (!pengajuan) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });
    }

    // Validasi office_id
    if (pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Bisa upload file untuk pengajuan yang sudah approved atau sudah diapprove/ditolak admin wilayah
    if (pengajuan.status !== 'approved' && pengajuan.status !== 'admin_wilayah_approved' && pengajuan.status !== 'admin_wilayah_rejected') {
      return res.status(400).json({ message: 'Pengajuan belum approved atau sudah selesai' });
    }

    // Validasi file type sesuai konfigurasi (resolve id dari nama jabatan)
    let jobTypeId: number | null = null;
    try {
      // Normalize legacy/renamed job type names
      const normalizedJobTypeName = normalizeJobTypeName((pengajuan as any).jenis_jabatan);
      if (normalizedJobTypeName !== (pengajuan as any).jenis_jabatan) {
        console.log('ℹ️ Normalized job type name:', (pengajuan as any).jenis_jabatan, '→', normalizedJobTypeName);
      }
      console.log('🔍 Debug upload - pengajuan.jenis_jabatan:', normalizedJobTypeName);
      const jobType = normalizedJobTypeName ? await (await import('../models/JobTypeConfiguration')).default.findOne({
        where: { jenis_jabatan: normalizedJobTypeName, is_active: true }
      }) : null;
      jobTypeId = jobType ? (jobType as any).id : null;
      console.log('🔍 Debug upload - jobType found:', jobType);
      console.log('🔍 Debug upload - jobTypeId:', jobTypeId);
    } catch (error) {
      console.error('❌ Error finding job type:', error);
    }

    console.log('🔍 Debug upload - file_type:', file_type);
    console.log('🔍 Debug upload - jobTypeId for query:', jobTypeId);
    
    const fileConfig = await AdminWilayahFileConfig.findOne({
      where: {
        jenis_jabatan_id: jobTypeId as any,
        file_type,
        is_active: true
      }
    });

    console.log('🔍 Debug upload - fileConfig found:', fileConfig);

    if (!fileConfig) {
      console.log('❌ No file config found for:', { jobTypeId, file_type });
      return res.status(400).json({ message: 'File type tidak valid untuk jenis jabatan ini' });
    }

    // Upload file
    if (!req.file) {
      return res.status(400).json({ message: 'File tidak ditemukan' });
    }

    // Buat record file
    const fileRecord = await PengajuanFile.create({
      pengajuan_id: pengajuanId,
      file_type,
      file_category: 'admin_wilayah',
      file_name: req.file.originalname,
      file_path: `uploads/pengajuan/${req.file.filename}`,
      file_size: req.file.size,
      upload_status: 'uploaded',
      verification_notes: description,
      uploaded_by: user.id,
      uploaded_by_role: 'admin_wilayah',
      uploaded_by_name: user.full_name,
      uploaded_by_office: user.office_id
    });

    res.json({
      success: true,
      message: 'File berhasil diupload',
      data: fileRecord
    });

  } catch (error) {
    console.error('Error in uploadAdminWilayahFile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Submit pengajuan admin wilayah ke superadmin (setelah approve/reject)
export async function submitToSuperadmin(req: Request, res: Response) {
  try {
    const { pengajuanId } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const pengajuan = await Pengajuan.findByPk(pengajuanId);

    if (!pengajuan) {
      return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });
    }

    // Validasi office_id
    if (pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke pengajuan ini' });
    }

    // Hanya bisa submit ke superadmin jika sudah diapprove admin wilayah
    if (pengajuan.status !== 'admin_wilayah_approved') {
      return res.status(400).json({ message: 'Pengajuan harus disetujui Admin Wilayah sebelum diajukan ke Superadmin' });
    }

    // Validasi kelengkapan dokumen Admin Wilayah (wajib)
    let requiredCount = 0;
    try {
      const jobType = await (await import('../models/JobTypeConfiguration')).default.findOne({
        where: { jenis_jabatan: pengajuan.jenis_jabatan, is_active: true }
      });
      const jobTypeId = jobType ? (jobType as any).id : null;
      requiredCount = await AdminWilayahFileConfig.count({
        where: { jenis_jabatan_id: jobTypeId, is_active: true } as any
      });
    } catch {
      requiredCount = 0;
    }
    const approvedAwFiles = await PengajuanFile.count({
      where: { pengajuan_id: pengajuanId, file_category: 'admin_wilayah', verification_status: 'approved' } as any
    });

    if (requiredCount > 0 && approvedAwFiles < requiredCount) {
      return res.status(400).json({ message: 'Dokumen Kanwil belum lengkap/sesuai. Lengkapi dan setujui semua dokumen wajib terlebih dahulu.' });
    }

    // Update status untuk review superadmin
    await pengajuan.update({ status: 'submitted' });

    res.json({
      success: true,
      message: 'Pengajuan berhasil dikirim ke Superadmin untuk review final',
      pengajuan
    });

  } catch (error) {
    console.error('Error in submitToSuperadmin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Replace pengajuan file (admin wilayah only - untuk file kabupaten/kota di wilayahnya)
export async function replaceAdminWilayahFile(req: Request, res: Response) {
  try {
    const { pengajuanId, fileId } = req.params;
    const user = (req as any).user;
    const file = req.file;

    // Validasi role - hanya admin wilayah
    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin wilayah yang bisa mengganti file'
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
    console.log('🔍 Debug admin wilayah file upload:', {
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

    // Validasi office_id - hanya wilayah admin wilayah
    if (pengajuan.office_id !== user.office_id) {
      return res.status(403).json({
        success: false,
        message: 'Anda hanya bisa mengganti file di wilayah Anda'
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
    const existingFile = await PengajuanFile.findByPk(fileId);
    if (!existingFile || existingFile.pengajuan_id !== pengajuanId) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan'
      });
    }

    // Validasi file category - admin wilayah hanya bisa ganti file kabupaten/kota
    if (existingFile.file_category === 'admin_wilayah') {
      return res.status(403).json({
        success: false,
        message: 'Admin wilayah tidak bisa mengganti file admin wilayah'
      });
    }

    // Simpan path file lama untuk audit
    const oldFilePath = existingFile.file_path;

    // Update file record
    await existingFile.update({
      file_name: file.originalname,
      file_path: `uploads/pengajuan/${file.filename}`,
      file_size: file.size
    });

    // Log file replacement
    console.log(`File replaced by admin wilayah: ${fileId} by ${user.full_name} (${user.office_id})`);

    res.json({
      success: true,
      message: 'File berhasil diganti',
      data: {
        id: existingFile.id,
        file_name: file.originalname,
        file_size: file.size,
        replaced_by: user.full_name,
        replaced_by_role: user.role,
        replaced_by_office: user.office_id
      }
    });

  } catch (error) {
    console.error('Error in replaceAdminWilayahFile:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengganti file'
    });
  }
}

// Get pengajuan data table untuk dashboard admin wilayah
export async function getPengajuanDataTable(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (user.role !== 'admin_wilayah') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Ambil semua pengajuan dari wilayah admin (tidak hanya yang approved)
    const pengajuanList = await Pengajuan.findAll({
      where: {
        office_id: user.office_id // Hanya lihat pengajuan dari wilayah admin
      },
      include: [
        { 
          model: Pegawai, 
          as: 'pegawai', 
          attributes: ['nip', 'nama'] 
        },
        { 
          model: Office, 
          as: 'office', 
          attributes: ['id', 'name', 'kabkota'] 
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Format data untuk datatable
    const dataTableData = pengajuanList.map((p: any) => ({
      id: p.id,
      nama: p.pegawai?.nama || '-',
      nip: p.pegawai?.nip || '-',
      kabupaten: p.office?.kabkota || '-',
      status: p.status,
      jenis_jabatan: p.jenis_jabatan,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    // Hitung aggregasi per status per kabupaten
    const statusAggregation: { [kabupaten: string]: { [status: string]: number } } = {};
    
    dataTableData.forEach(item => {
      const kabupaten = item.kabupaten;
      const status = item.status;
      
      if (!statusAggregation[kabupaten]) {
        statusAggregation[kabupaten] = {};
      }
      
      if (!statusAggregation[kabupaten][status]) {
        statusAggregation[kabupaten][status] = 0;
      }
      
      statusAggregation[kabupaten][status]++;
    });

    // Format aggregasi untuk frontend
    const aggregationData = Object.entries(statusAggregation).map(([kabupaten, statuses]) => ({
      kabupaten,
      total: Object.values(statuses).reduce((sum, count) => sum + count, 0),
      statuses: Object.entries(statuses).map(([status, count]) => ({
        status,
        count
      }))
    }));

    res.json({
      success: true,
      data: {
        pengajuan: dataTableData,
        aggregation: aggregationData,
        total: dataTableData.length
      }
    });

  } catch (error) {
    console.error('Error in getPengajuanDataTable:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
