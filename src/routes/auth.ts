import { Router } from 'express';
import { login, me, impersonate, stopImpersonate, refreshToken } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/impersonate', authMiddleware, requireRole('admin'), impersonate);
router.post('/stop-impersonate', authMiddleware, stopImpersonate);
router.post('/refresh', refreshToken);

export default router; 