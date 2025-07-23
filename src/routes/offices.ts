import { Router } from 'express';
import { getAllOffices, getOfficeById, createOffice, updateOffice, deleteOffice } from '../controllers/officeController';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllOffices);
router.get('/:id', getOfficeById);
router.post('/', requireRole('admin', 'operator'), createOffice);
router.put('/:id', requireRole('admin', 'operator'), updateOffice);
router.delete('/:id', requireRole('admin', 'operator'), deleteOffice);

export default router; 