import { Router } from 'express';
import { getAllLetters, getLetterById, createLetter, updateLetter, deleteLetter, generatePdfLetter } from '../controllers/letterController';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllLetters);
router.get('/:id', getLetterById);
router.post('/', requireRole('admin', 'operator'), createLetter);
router.put('/:id', requireRole('admin', 'operator'), updateLetter);
router.delete('/:id', requireRole('admin', 'operator'), deleteLetter);
router.post('/:id/generate-pdf', requireRole('admin', 'operator'), generatePdfLetter);

export default router; 