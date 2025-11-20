import { Router } from 'express';
import { getAllLetters, getLetterById, createLetter, updateLetter, deleteLetter, generatePdfLetter } from '../controllers/letterController';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// authMiddleware sudah dipasang di app level

router.get('/', getAllLetters);
router.get('/:id', getLetterById);
router.post('/', requireRole('admin', 'operator', 'kanwil'), createLetter);
router.put('/:id', requireRole('admin', 'operator', 'kanwil'), updateLetter);
router.delete('/:id', requireRole('admin', 'operator', 'kanwil'), deleteLetter);
router.post('/:id/generate-pdf', requireRole('admin', 'operator', 'kanwil'), generatePdfLetter);

export default router; 