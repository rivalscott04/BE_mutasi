import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadFile, getFile, deleteFile } from '../controllers/fileController';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

const storagePath = process.env.STORAGE_PATH || './storage';
const lettersPath = path.join(storagePath, 'letters');
if (!fs.existsSync(lettersPath)) fs.mkdirSync(lettersPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, lettersPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${name}_${timestamp}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

// authMiddleware sudah dipasang di app level

router.post('/upload', requireRole('admin', 'operator'), upload.single('file'), uploadFile);
router.get('/:id', getFile);
router.delete('/:id', requireRole('admin', 'operator'), deleteFile);

export default router; 