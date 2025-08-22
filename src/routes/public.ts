import { Router } from 'express';
import { getAllPegawaiPublic, getAllPegawaiPublicSimple } from '../controllers/publicController';

const router = Router();

// Public endpoint untuk mendapatkan semua pegawai tanpa autentikasi (dengan pagination
router.get('/employees', getAllPegawaiPublic);

// Public endpoint untuk mendapatkan semua pegawai tanpa autentikasi (tanpa pagination)
router.get('/employees/all', getAllPegawaiPublicSimple);

export default router;
