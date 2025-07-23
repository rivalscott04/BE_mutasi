import { Request, Response } from 'express';
import Letter from '../models/Letter';
import LetterFile from '../models/LetterFile';
import Pegawai from '../models/Pegawai';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function getAllLetters(req: Request, res: Response) {
  const letters = await Letter.findAll({
    include: [
      { model: Pegawai, as: 'recipient', attributes: ['nip', 'nama'] },
      { model: Pegawai, as: 'signing_official', attributes: ['nip', 'nama'] }
    ]
  });
  res.json({ letters });
}

export async function getLetterById(req: Request, res: Response) {
  const { id } = req.params;
  const letter = await Letter.findByPk(id, {
    include: [
      { model: Pegawai, as: 'recipient', attributes: ['nip', 'nama'] },
      { model: Pegawai, as: 'signing_official', attributes: ['nip', 'nama'] }
    ]
  });
  if (!letter) return res.status(404).json({ message: 'Letter not found' });
  res.json({ letter });
}

export async function createLetter(req: Request, res: Response) {
  const { office_id, created_by, template_id, template_name, letter_number, subject, recipient_employee_nip, signing_official_nip, form_data, status } = req.body;
  if (!office_id || !created_by || !template_id || !template_name || !letter_number || !subject || !recipient_employee_nip || !signing_official_nip || !form_data) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const letter = await Letter.create({ office_id, created_by, template_id, template_name, letter_number, subject, recipient_employee_nip, signing_official_nip, form_data, status });
  res.status(201).json({ letter });
}

export async function updateLetter(req: Request, res: Response) {
  const { id } = req.params;
  const { office_id, template_id, template_name, letter_number, subject, recipient_employee_nip, signing_official_nip, form_data, status } = req.body;
  const letter = await Letter.findByPk(id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });
  if (office_id) letter.office_id = office_id;
  if (template_id) letter.template_id = template_id;
  if (template_name) letter.template_name = template_name;
  if (letter_number) letter.letter_number = letter_number;
  if (subject) letter.subject = subject;
  if (recipient_employee_nip) letter.recipient_employee_nip = recipient_employee_nip;
  if (signing_official_nip) letter.signing_official_nip = signing_official_nip;
  if (form_data) letter.form_data = form_data;
  if (status) letter.status = status;
  await letter.save();
  res.json({ letter });
}

export async function deleteLetter(req: Request, res: Response) {
  const { id } = req.params;
  const letter = await Letter.findByPk(id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });
  await letter.destroy();
  res.json({ message: 'Letter deleted' });
}

export async function generatePdfLetter(req: Request, res: Response) {
  const { id } = req.params;
  const letter = await Letter.findByPk(id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });

  // 1. Generate PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  let y = height - 50;

  page.drawText('SURAT RESMI KEMENAG', { x: 50, y, size: 18, font, color: rgb(0,0,0) });
  y -= 40;
  page.drawText(`Nomor: ${letter.letter_number}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Perihal: ${letter.subject}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Template: ${letter.template_name}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Dibuat oleh: ${letter.created_by}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Tanggal: ${letter.created_at?.toISOString().slice(0,10)}`, { x: 50, y, size: 12, font });

  // Bisa tambahkan data lain dari letter.form_data jika perlu

  const pdfBytes = await pdfDoc.save();

  // 2. Simpan file ke storage dengan format baru
  const storagePath = process.env.STORAGE_PATH || './storage';
  const lettersPath = path.join(storagePath, 'letters');
  if (!fs.existsSync(lettersPath)) fs.mkdirSync(lettersPath, { recursive: true });

  // Format nama file: {nip}_{jenis_template_singkat}_{timestamp}.pdf
  const nip = letter.recipient_employee_nip;
  let jenis_template = letter.template_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const timestamp = Date.now();
  const fileName = `${nip}_${jenis_template}_${timestamp}.pdf`;
  const filePath = path.join(lettersPath, fileName);
  fs.writeFileSync(filePath, pdfBytes);

  // 3. Hitung hash file
  const fileHash = crypto.createHash('sha256').update(pdfBytes).digest('hex');

  // 4. Catat ke letter_files
  const file = await LetterFile.create({
    letter_id: letter.id,
    file_name: fileName,
    file_path: filePath,
    file_size: pdfBytes.length,
    mime_type: 'application/pdf',
    file_hash: fileHash,
  });

  res.status(201).json({ message: 'PDF generated', file });
} 