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
  getRekapAggregate,
  getRekapList,
  replacePengajuanFile,
  editJabatanPengajuan,
  getPengajuanAuditLog,
  getAvailableJabatan,
  updatePengajuanStatus
} from '../controllers/pengajuanController';
import { authMiddleware } from '../middleware/auth';
import { blockReadOnlyRoles } from '../middleware/role';
import logger from '../utils/logger';

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
    // Safe size calculation
    const fileSize = file.size || 0;
    const sizeMB = fileSize > 0 ? (fileSize / (1024 * 1024)).toFixed(2) + 'MB' : '0MB';
    
    logger.info('File upload filter check', {
      fileName: file.originalname,
      mimeType: file.mimetype,
      fieldName: file.fieldname,
      size: fileSize,
      sizeMB: sizeMB,
      ip: req.ip,
      userId: (req as any).user?.id
    });

    if (file.mimetype === 'application/pdf') {
      logger.info('File accepted by multer filter', {
        fileName: file.originalname,
        size: fileSize,
        sizeMB: sizeMB
      });
      cb(null, true);
    } else {
      logger.error('File rejected - not PDF', {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: fileSize,
        sizeMB: sizeMB,
        ip: req.ip,
        userId: (req as any).user?.id
      });
      cb(new Error('Only PDF files are allowed'));
    }
  },
  // Set a permissive upper bound (3MB) here; enforce per-type limits in controller
  limits: { 
    fileSize: 3 * 1024 * 1024
  }
});

// Error handling middleware for multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error occurred', {
      error: err.message,
      code: err.code,
      field: err.field,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      ip: req.ip,
      userId: req.user?.id
    });

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File terlalu besar. Maksimal 3MB per file.' 
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Terlalu banyak file yang diupload.' 
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: `Upload error: ${err.message}` 
    });
  }

  if (err) {
    logger.error('File upload error', {
      error: err.message,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      ip: req.ip,
      userId: req.user?.id
    });

    return res.status(400).json({ 
      success: false, 
      message: err.message || 'File upload failed' 
    });
  }

  next();
};

// Routes
router.get('/pegawai-grouped', authMiddleware, getPegawaiGroupedByKabupaten);
router.get('/available-jabatan', authMiddleware, getAvailableJabatan);
router.post('/', authMiddleware, blockReadOnlyRoles, createPengajuan);
router.post('/:pengajuan_id/upload', authMiddleware, blockReadOnlyRoles, upload.single('file'), handleMulterError, uploadPengajuanFile);
router.put('/:pengajuan_id/submit', authMiddleware, blockReadOnlyRoles, submitPengajuan);
// Update multiple files (FormData: files[], file_types[])
router.put('/:pengajuan_id/update-files', authMiddleware, blockReadOnlyRoles, upload.array('files'), handleMulterError, updatePengajuanFiles);

// File verification routes - HARUS SEBELUM ROUTE DENGAN PARAMETER
router.put('/files/:file_id/verify', authMiddleware, blockReadOnlyRoles, verifyFile);

// File replacement routes - HARUS SEBELUM ROUTE DENGAN PARAMETER
router.put('/:pengajuan_id/files/:file_id/replace', authMiddleware, blockReadOnlyRoles, upload.single('file'), handleMulterError, replacePengajuanFile);

// Download file endpoint - HARUS SEBELUM ROUTE DENGAN PARAMETER  
router.get('/files/:file_id', authMiddleware, async (req, res) => {
  try {
    const { file_id } = req.params;
    const user = (req as any).user;
    const PengajuanFile = require('../models/PengajuanFile').default;
    const Pengajuan = require('../models/Pengajuan').default;
    
    console.log(`🔍 Requesting file with ID: ${file_id}`);
    
    const file = await PengajuanFile.findByPk(file_id);
    if (!file) {
      console.log(`❌ File record not found in database for ID: ${file_id}`);
      return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
    }

    console.log(`📁 File record found: ${file.file_name}, path: ${file.file_path}`);

    // Check if user has access to the pengajuan that owns this file
    const pengajuan = await Pengajuan.findByPk(file.pengajuan_id);
    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Apply same access control as getPengajuanDetail
    if (user.role === 'user') {
      if (pengajuan.status !== 'final_approved') {
        return res.status(403).json({ success: false, message: 'Forbidden: Hanya pengajuan final_approved yang dapat diakses' });
      }
    } else if (user.role === 'admin_wilayah') {
      if (pengajuan.office_id !== user.office_id) {
        return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke file ini' });
      }
    } else if (user.role === 'bimas') {
      // Bimas can access files from pengajuan kabupaten
      // No office_id restriction for bimas role
    } else if (user.role !== 'admin' && pengajuan.office_id !== user.office_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Anda tidak memiliki akses ke file ini' });
    }

    // Check if file exists on disk
    const fs = require('fs');
    const path = require('path');
    
    // Resolve file path - handle both absolute and relative paths
    let filePath = file.file_path;
    if (!path.isAbsolute(filePath)) {
      // If path is relative, resolve it relative to backend directory
      filePath = path.resolve(__dirname, '../../', filePath);
    }
    
    console.log(`🔍 Checking file existence at: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Physical file not found at: ${filePath}`);
      // List directory contents for debugging
      const dir = path.dirname(filePath);
      try {
        const files = fs.readdirSync(dir);
        console.log(`📂 Directory ${dir} contains:`, files);
      } catch (dirError) {
        console.log(`❌ Cannot read directory ${dir}:`, dirError);
      }
      return res.status(404).json({ success: false, message: 'File tidak ditemukan di server' });
    }

    console.log(`✅ File found, serving: ${file.file_name}`);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Pengajuan routes - SETELAH FILE ROUTES
router.get('/filter-options', authMiddleware, getFilterOptions);
// Rekap endpoints (aggregate + list) - for admin_wilayah (scoped) and superadmin (all)
router.get('/rekap/aggregate', authMiddleware, getRekapAggregate);
router.get('/rekap/list', authMiddleware, getRekapList);
router.get('/:pengajuan_id', authMiddleware, getPengajuanDetail);
router.get('/', authMiddleware, getAllPengajuan);

// Approval system routes
router.put('/:id/approve', authMiddleware, blockReadOnlyRoles, approvePengajuan);
router.put('/:id/reject', authMiddleware, blockReadOnlyRoles, rejectPengajuan);
router.put('/:id/resubmit', authMiddleware, blockReadOnlyRoles, resubmitPengajuan);

// Final approval system routes (superadmin only)
router.post('/:id/final-approve', authMiddleware, blockReadOnlyRoles, finalApprovePengajuan);
router.post('/:id/final-reject', authMiddleware, blockReadOnlyRoles, finalRejectPengajuan);

// Edit jabatan route (superadmin only)
router.put('/:id/edit-jabatan', authMiddleware, blockReadOnlyRoles, editJabatanPengajuan);

// Update status route (superadmin only)
router.put('/:id/update-status', authMiddleware, blockReadOnlyRoles, updatePengajuanStatus);

// Get audit log route (superadmin only)
router.get('/:id/audit-log', authMiddleware, getPengajuanAuditLog);

// Get available jabatan route moved to top to avoid conflict with /:id route

router.delete('/:id', authMiddleware, blockReadOnlyRoles, deletePengajuan);



// Print report routes
router.get('/:id/print-report', authMiddleware, generatePrintReport);

export default router; 