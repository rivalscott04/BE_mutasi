import express from 'express';
import {
  getAllFileConfigs,
  getFileConfigsByJobType,
  createFileConfig,
  updateFileConfig,
  deleteFileConfig,
  getAvailableJobTypes
} from '../controllers/adminWilayahFileConfigController';
import { requireRole } from '../middleware/role';

const router = express.Router();

// Public routes (for authenticated users)
router.get('/', getAllFileConfigs);
router.get('/job-type/:jobTypeId', getFileConfigsByJobType);
router.get('/available-job-types', getAvailableJobTypes);

// Admin-only routes (protected with role check)
router.post('/', requireRole('admin'), createFileConfig);
router.put('/:id', requireRole('admin'), updateFileConfig);
router.delete('/:id', requireRole('admin'), deleteFileConfig);

export default router;


