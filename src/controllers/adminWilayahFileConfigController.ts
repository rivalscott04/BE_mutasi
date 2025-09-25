import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AdminWilayahFileConfig from '../models/AdminWilayahFileConfig';
import JobTypeConfiguration from '../models/JobTypeConfiguration';
import { db } from '../models';

// Get all file configs with job type names
export const getAllFileConfigs = async (req: Request, res: Response) => {
  try {
    console.log('📡 Backend: Fetching all file configs...');
    
    const configs = await AdminWilayahFileConfig.findAll({
      include: [{
        model: JobTypeConfiguration,
        as: 'jenis_jabatan',
        attributes: ['id', 'jenis_jabatan']
      }],
      order: [['jenis_jabatan_id', 'ASC'], ['file_type', 'ASC']]
    });

    console.log('📊 Backend: Found configs:', configs.length);
    console.log('📋 Backend: Configs data:', configs.map(c => ({
      id: c.id,
      file_type: c.file_type,
      display_name: c.display_name,
      jenis_jabatan_id: c.jenis_jabatan_id,
      is_active: c.is_active
    })));

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('❌ Backend: Error fetching file configs:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data konfigurasi file'
    });
  }
};

// Get file configs by job type
export const getFileConfigsByJobType = async (req: Request, res: Response) => {
  try {
    const { jobTypeId } = req.params;
    
    // Parse jobTypeId - bisa berupa ID atau nama
    let parsedJobTypeId: number;
    
    if (isNaN(Number(jobTypeId))) {
      // Jika bukan angka, cari berdasarkan nama jabatan
      const jobType = await JobTypeConfiguration.findOne({
        where: { jenis_jabatan: jobTypeId }
      });
      
      if (!jobType) {
        return res.status(404).json({
          success: false,
          message: 'Jenis jabatan tidak ditemukan'
        });
      }
      
      parsedJobTypeId = jobType.id;
    } else {
      parsedJobTypeId = parseInt(jobTypeId);
    }

    const configs = await AdminWilayahFileConfig.findAll({
      where: { 
        jenis_jabatan_id: parsedJobTypeId,
        is_active: true
      },
      include: [{
        model: JobTypeConfiguration,
        as: 'jenis_jabatan',
        attributes: ['id', 'jenis_jabatan']
      }],
      order: [['file_type', 'ASC']]
    });

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error fetching file configs by job type:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data konfigurasi file'
    });
  }
};

// Get available job types for admin wilayah config
export const getAvailableJobTypes = async (req: Request, res: Response) => {
  try {
    const jobTypes = await JobTypeConfiguration.findAll({
      where: { is_active: true },
      attributes: ['id', 'jenis_jabatan'],
      order: [['jenis_jabatan', 'ASC']]
    });

    res.json({
      success: true,
      data: jobTypes
    });
  } catch (error) {
    console.error('Error fetching available job types:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data jenis jabatan'
    });
  }
};

// Create new file config (admin only)
export const createFileConfig = async (req: AuthRequest, res: Response) => {
  try {
    // Role check sudah ditangani oleh middleware requireRole('admin')
    // Tidak perlu double check di sini
    
    const {
      jenis_jabatan_id,
      file_type,
      display_name,
      is_required = true,
      description,
      is_active = true
    } = req.body;

    // Validate required fields
    if (!jenis_jabatan_id || !file_type || !display_name) {
      return res.status(400).json({
        success: false,
        message: 'jenis_jabatan_id, file_type, dan display_name wajib diisi'
      });
    }

    // Check if job type exists
    const jobType = await JobTypeConfiguration.findByPk(jenis_jabatan_id);
    if (!jobType) {
      return res.status(400).json({
        success: false,
        message: 'Jenis jabatan tidak ditemukan'
      });
    }

    // PERBAIKAN: Hapus logic cek duplikasi yang tidak perlu untuk create juga
    // Logic ini menyebabkan error "File type sudah ada untuk jenis jabatan ini"
    // Padahal seharusnya bisa create multiple file types untuk jenis jabatan yang sama
    
    const newConfig = await AdminWilayahFileConfig.create({
      jenis_jabatan_id,
      file_type,
      display_name,
      is_required,
      description,
      is_active
    });

    // Fetch the created config with job type info
    const createdConfig = await AdminWilayahFileConfig.findByPk(newConfig.id, {
      include: [{
        model: JobTypeConfiguration,
        as: 'jenis_jabatan',
        attributes: ['id', 'jenis_jabatan']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Konfigurasi file berhasil dibuat',
      data: createdConfig
    });
  } catch (error) {
    console.error('Error creating file config:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat konfigurasi file'
    });
  }
};

// Update file config (admin only) - Logic sama dengan job type
export const updateFileConfig = async (req: AuthRequest, res: Response) => {
  try {
    // Role check sudah ditangani oleh middleware requireRole('admin')
    
    const { id } = req.params;
    const {
      jenis_jabatan_id,
      selectedFiles, // Array file types yang dipilih
      selectedVariant, // Varian untuk Surat Rekomendasi Kanwil
      is_active
    } = req.body;

    const config = await AdminWilayahFileConfig.findByPk(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi file tidak ditemukan'
      });
    }

    // Check if job type exists if jenis_jabatan_id is being updated
    if (jenis_jabatan_id && jenis_jabatan_id !== config.jenis_jabatan_id) {
      const jobType = await JobTypeConfiguration.findByPk(jenis_jabatan_id);
      if (!jobType) {
        return res.status(400).json({
          success: false,
          message: 'Jenis jabatan tidak ditemukan'
        });
      }
    }

    // LOGIC SAMA DENGAN JOB TYPE: Update multiple file types
    // 1. Hapus semua config existing untuk jenis jabatan ini
    await AdminWilayahFileConfig.destroy({
      where: { 
        jenis_jabatan_id: jenis_jabatan_id || config.jenis_jabatan_id
      }
    });

    // 2. Buat config baru untuk setiap file type yang dipilih
    const fileConfigs = [];
    
    // Available file types untuk admin wilayah (hardcoded seperti di frontend)
    const adminWilayahAvailableFileTypes = [
      { id: 'surat_rekomendasi_kanwil', name: 'Surat Rekomendasi dari Instansi Pembina', category: 'Dokumen Instansi Pembina', is_required: true, description: 'Surat rekomendasi dari instansi pembina dengan pilihan varian 6.1-6.9' },
      { id: 'surat_persetujuan_kepala_wilayah', name: 'Surat Persetujuan Kepala Wilayah', category: 'Dokumen Kanwil', is_required: true, description: 'Surat persetujuan dari Kepala Wilayah Kementerian Agama Provinsi' },
      { id: 'surat_pengantar_permohonan_rekomendasi', name: 'Surat Pengantar Permohonan Rekomendasi', category: 'Dokumen Pengantar', is_required: true, description: 'Surat pengantar permohonan rekomendasi pindah tugas' },
      { id: 'surat_pernyataan_tidak_tugas_belajar', name: 'Surat Pernyataan Tidak Sedang Menjalani Tugas Belajar atau Ikatan Dinas', category: 'Dokumen Pernyataan', is_required: true, description: 'Surat pernyataan tidak sedang menjalani tugas belajar atau ikatan dinas' },
      { id: 'surat_pernyataan_tidak_hukuman_disiplin', name: 'Surat Pernyataan Tidak Sedang Dijatuhi Hukuman Disiplin Tingkat Sedang atau Berat', category: 'Dokumen Pernyataan', is_required: true, description: 'Surat pernyataan tidak sedang dijatuhi hukuman disiplin tingkat sedang atau berat' },
      { id: 'surat_pernyataan_tidak_proses_pidana', name: 'Surat Pernyataan Tidak Sedang Menjalani Proses Pidana atau Pernah Dipidana Penjara', category: 'Dokumen Pernyataan', is_required: true, description: 'Surat pernyataan tidak sedang menjalani proses pidana atau pernah dipidana penjara' },
      { id: 'surat_pernyataan_tanggung_jawab_mutlak', name: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)', category: 'Dokumen Pernyataan', is_required: true, description: 'Surat pernyataan tanggung jawab mutlak untuk pengajuan mutasi' },
      { id: 'surat_keterangan_bebas_temuan_inspektorat', name: 'Surat Keterangan Bebas Temuan (SKBT)', category: 'Dokumen Keterangan', is_required: true, description: 'Surat keterangan bebas temuan untuk pengajuan mutasi' },
      { id: 'surat_keterangan_kanwil', name: 'Surat Keterangan dari Kanwil', category: 'Dokumen Keterangan', is_required: true, description: 'Surat keterangan resmi dari Kanwil Provinsi' },
      { id: 'surat_rekomendasi_kanwil_khusus', name: 'Surat Rekomendasi Khusus dari Kanwil', category: 'Dokumen Keterangan', is_required: true, description: 'Surat rekomendasi khusus dari Kanwil Provinsi' }
    ];

    for (const [fileType, isSelected] of Object.entries(selectedFiles)) {
      if (isSelected) {
        // Cari file config dari adminWilayahAvailableFileTypes
        const fileConfig = adminWilayahAvailableFileTypes.find((f: any) => f.id === fileType);
        if (fileConfig) {
          fileConfigs.push({
            jenis_jabatan_id: jenis_jabatan_id || config.jenis_jabatan_id,
            file_type: fileType,
            display_name: fileConfig.name,
            is_required: fileConfig.is_required,
            description: fileConfig.description,
            is_active: is_active !== undefined ? is_active : true
          });
        }
      }
    }

    // 3. Insert semua config baru
    if (fileConfigs.length > 0) {
      await AdminWilayahFileConfig.bulkCreate(fileConfigs);
    }

    // 4. Fetch updated configs
    const updatedConfigs = await AdminWilayahFileConfig.findAll({
      where: { 
        jenis_jabatan_id: jenis_jabatan_id || config.jenis_jabatan_id,
        is_active: true
      },
      include: [{
        model: JobTypeConfiguration,
        as: 'jenis_jabatan',
        attributes: ['id', 'jenis_jabatan']
      }],
      order: [['file_type', 'ASC']]
    });

    res.json({
      success: true,
      message: 'Konfigurasi file berhasil diperbarui',
      data: updatedConfigs
    });
  } catch (error) {
    console.error('Error updating file config:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui konfigurasi file'
    });
  }
};

// Delete file config (admin only)
export const deleteFileConfig = async (req: AuthRequest, res: Response) => {
  try {
    // Role check sudah ditangani oleh middleware requireRole('admin')
    
    const { id } = req.params;
    console.log('🗑️ Backend: Deleting file config with ID:', id);

    const config = await AdminWilayahFileConfig.findByPk(id);
    if (!config) {
      console.log('❌ Backend: File config not found for ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Konfigurasi file tidak ditemukan'
      });
    }

    console.log('📁 Backend: Found config to delete:', {
      id: config.id,
      file_type: config.file_type,
      display_name: config.display_name,
      jenis_jabatan_id: config.jenis_jabatan_id
    });

    await config.destroy();
    console.log('✅ Backend: File config successfully deleted');

    res.json({
      success: true,
      message: 'Konfigurasi file berhasil dihapus'
    });
  } catch (error) {
    console.error('❌ Backend: Error deleting file config:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus konfigurasi file'
    });
  }
};
