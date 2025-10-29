import express from 'express';
import { 
  getTrackingStatusMaster,
  getAllTrackingStatusMaster,
  createTrackingStatusMaster,
  updateTrackingStatusMaster,
  deleteTrackingStatusMaster,
  getPengajuanForTracking,
  createPengajuanTracking,
  getPengajuanTrackingHistory,
  getTrackingForSuperadmin,
  getTrackingForAdmin
} from '../controllers/trackingController';
import { authMiddleware } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// Middleware untuk semua routes
router.use(authMiddleware);

// GET /api/tracking/status-master - Ambil semua status master (untuk dropdown)
router.get('/status-master', getTrackingStatusMaster);

// GET /api/tracking/status-master/all - Ambil semua status master untuk admin (termasuk yang tidak aktif)
router.get('/status-master/all', getAllTrackingStatusMaster);

// POST /api/tracking/status-master - Buat status master baru (hanya admin)
router.post('/status-master', createTrackingStatusMaster);

// PUT /api/tracking/status-master/:id - Update status master (hanya admin)
router.put('/status-master/:id', updateTrackingStatusMaster);

// DELETE /api/tracking/status-master/:id - Hapus status master (hanya admin)
router.delete('/status-master/:id', deleteTrackingStatusMaster);

// GET /api/tracking/pengajuan - Ambil berkas yang sudah final approved untuk ditrack (admin pusat)
router.get('/pengajuan', getPengajuanForTracking);

// POST /api/tracking/pengajuan/:pengajuanId - Input tracking status untuk berkas (admin pusat)
router.post('/pengajuan/:pengajuanId', createPengajuanTracking);

// GET /api/tracking/pengajuan/:pengajuanId/history - Ambil history tracking untuk berkas
router.get('/pengajuan/:pengajuanId/history', getPengajuanTrackingHistory);

// GET /api/tracking/superadmin - Ambil tracking untuk superadmin (berkas dari wilayahnya)
router.get('/superadmin', getTrackingForSuperadmin);

// GET /api/tracking/admin - Ambil tracking untuk admin biasa (readonly)
router.get('/admin', getTrackingForAdmin);

// Error handling middleware
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Tracking route error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

export default router;
