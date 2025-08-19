import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import JobTypeConfiguration from '../models/JobTypeConfiguration';

const router = express.Router();

// Get all job type configurations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { active_only } = req.query;
    
    const whereClause: any = {};
    if (active_only === 'true') {
      whereClause.is_active = true;
    }
    
    const configs = await JobTypeConfiguration.findAll({
      where: whereClause,
      order: [['jenis_jabatan', 'ASC']]
    });
    
    // Parse required_files from string to array
    const parsedConfigs = configs.map(config => ({
      ...config.toJSON(),
      required_files: JSON.parse(config.required_files || '[]')
    }));
    
    res.json({ success: true, data: parsedConfigs });
  } catch (error) {
    console.error('Error fetching job type configs:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new job type configuration
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { jenis_jabatan, total_dokumen, required_files, is_active } = req.body;
    
    // Validate required fields
    if (!jenis_jabatan || !required_files || !Array.isArray(required_files)) {
      return res.status(400).json({ 
        success: false, 
        message: 'jenis_jabatan dan required_files (array) harus diisi' 
      });
    }
    
    // Check if jenis_jabatan already exists
    const existing = await JobTypeConfiguration.findOne({
      where: { jenis_jabatan }
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Jenis jabatan sudah ada' 
      });
    }
    
    const config = await JobTypeConfiguration.create({
      jenis_jabatan,
      min_dokumen: 1,
      max_dokumen: total_dokumen || required_files.length,
      required_files: JSON.stringify(required_files),
      is_active: is_active !== undefined ? is_active : true
    });
    
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    console.error('Error creating job type config:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update job type configuration
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { jenis_jabatan, total_dokumen, required_files, is_active } = req.body;
    
    const config = await JobTypeConfiguration.findByPk(id);
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Konfigurasi tidak ditemukan' 
      });
    }
    
    // Check if jenis_jabatan already exists (if changed)
    if (jenis_jabatan && jenis_jabatan !== config.jenis_jabatan) {
      const existing = await JobTypeConfiguration.findOne({
        where: { jenis_jabatan }
      });
      
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'Jenis jabatan sudah ada' 
        });
      }
    }
    
    await config.update({
      jenis_jabatan: jenis_jabatan || config.jenis_jabatan,
      min_dokumen: 1,
      max_dokumen: total_dokumen || config.max_dokumen,
      required_files: required_files ? JSON.stringify(required_files) : config.required_files,
      is_active: is_active !== undefined ? is_active : config.is_active
    });
    
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating job type config:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete job type configuration
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await JobTypeConfiguration.findByPk(id);
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Konfigurasi tidak ditemukan' 
      });
    }
    
    // Hard delete
    await config.destroy();
    
    res.json({ success: true, message: 'Konfigurasi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting job type config:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get job type configuration by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await JobTypeConfiguration.findByPk(id);
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Konfigurasi tidak ditemukan' 
      });
    }
    
    // Parse required_files from string to array
    const parsedConfig = {
      ...config.toJSON(),
      required_files: JSON.parse(config.required_files || '[]')
    };
    
    res.json({ success: true, data: parsedConfig });
  } catch (error) {
    console.error('Error fetching job type config:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
