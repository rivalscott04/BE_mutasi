import { Router } from 'express';
import { login, me, impersonate } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/impersonate', authMiddleware, requireRole('admin'), impersonate);

export default router; 