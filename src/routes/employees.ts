import { Router } from 'express';
import { getAllPegawai, getPegawaiById, createPegawai, updatePegawai, deletePegawai, searchPegawai, getPegawaiByIndukUnit } from '../controllers/pegawaiController';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// authMiddleware sudah dipasang di app level

router.get('/', getAllPegawai);
router.get('/search', searchPegawai);
router.get('/by-induk-unit', getPegawaiByIndukUnit);
router.get('/:id', getPegawaiById);
router.post('/', requireRole('admin', 'operator'), createPegawai);
router.put('/:id', requireRole('admin', 'operator'), updatePegawai);
router.delete('/:id', requireRole('admin', 'operator'), deletePegawai);

export default router; 