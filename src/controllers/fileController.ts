import { Request, Response } from 'express';
import LetterFile from '../models/LetterFile';
import fs from 'fs';
import path from 'path';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const { letter_id } = req.body;
  if (!letter_id) return res.status(400).json({ message: 'letter_id is required' });
  const { filename, path: filePath, size, mimetype } = req.file;
  const file = await LetterFile.create({
    letter_id,
    file_name: filename,
    file_path: filePath,
    file_size: size,
    mime_type: mimetype,
    file_hash: '', // hash bisa diisi nanti
  });
  res.status(201).json({ file });
}

export async function getFile(req: Request, res: Response) {
  const { id } = req.params;
  const file = await LetterFile.findByPk(id);
  if (!file) return res.status(404).json({ message: 'File not found' });
  res.sendFile(path.resolve(file.file_path));
}

export async function deleteFile(req: Request, res: Response) {
  const { id } = req.params;
  const file = await LetterFile.findByPk(id);
  if (!file) return res.status(404).json({ message: 'File not found' });
  try {
    fs.unlinkSync(file.file_path);
  } catch (e) {}
  await file.destroy();
  res.json({ message: 'File deleted' });
} 