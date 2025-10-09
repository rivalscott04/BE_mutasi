import express from 'express';
import multer from 'multer';
import { 
  getAdminWilayahDashboard, 
  getPengajuanDetail, 
  approvePengajuan,
  rejectPengajuan,
  uploadAdminWilayahFile, 
  submitToSuperadmin,
  getAdminWilayahHistory,
  getPengajuanDataTable,
  replaceAdminWilayahFile
} from '../controllers/adminWilayahController';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({ 
  dest: 'uploads/pengajuan/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware);
// Allow both admin_wilayah and admin (superadmin) to access these routes
router.use((req, res, next) => {
  const user = (req as any).user;
  if (!user || (user.role !== 'admin_wilayah' && user.role !== 'admin')) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
});

// Dashboard admin wilayah
router.get('/dashboard', getAdminWilayahDashboard);
// Data table pengajuan untuk dashboard admin wilayah
router.get('/pengajuan-datatable', getPengajuanDataTable);
// Arsip/riwayat admin wilayah
router.get('/history', getAdminWilayahHistory);

// Detail pengajuan untuk admin wilayah
router.get('/pengajuan/:id', getPengajuanDetail);

// Admin Wilayah APPROVE pengajuan (bisa langsung, file upload opsional)
router.post('/pengajuan/:pengajuanId/approve', approvePengajuan);

// Admin Wilayah REJECT pengajuan (bisa langsung, file upload opsional)
router.post('/pengajuan/:pengajuanId/reject', rejectPengajuan);

// Upload file admin wilayah (OPSIONAL sesuai konfigurasi superadmin)
router.post('/pengajuan/:pengajuanId/upload', upload.single('file'), uploadAdminWilayahFile);

// Replace file kabupaten/kota (admin wilayah only - untuk file di wilayahnya)
router.put('/pengajuan/:pengajuanId/files/:fileId/replace', upload.single('file'), replaceAdminWilayahFile);

// Submit pengajuan admin wilayah ke superadmin (setelah approve/reject)
router.post('/pengajuan/:pengajuanId/submit-to-superadmin', submitToSuperadmin);

export default router;
