import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getPegawaiGroupedByKabupaten, 
  createPengajuan, 
  uploadPengajuanFile, 
  submitPengajuan, 
  getPengajuanDetail,
  getAllPengajuan
} from '../controllers/pengajuanController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsPath = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { 
    fileSize: 500 * 1024 // 500KB per file
  }
});

// Routes
router.get('/pegawai-grouped', authMiddleware, getPegawaiGroupedByKabupaten);
router.post('/', authMiddleware, createPengajuan);
router.post('/:pengajuan_id/upload', authMiddleware, upload.single('file'), uploadPengajuanFile);
router.put('/:pengajuan_id/submit', authMiddleware, submitPengajuan);
router.get('/:pengajuan_id', authMiddleware, getPengajuanDetail);
router.get('/', authMiddleware, getAllPengajuan);

// Download file endpoint
router.get('/files/:file_id', async (req, res) => {
  try {
    const { file_id } = req.params;
    const PengajuanFile = require('../models/PengajuanFile').default;
    
    const file = await PengajuanFile.findByPk(file_id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
    }

    // Check if file exists on disk
    const fs = require('fs');
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan di server' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router; 