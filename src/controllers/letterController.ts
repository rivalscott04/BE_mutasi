import { Request, Response } from 'express';
import Letter from '../models/Letter';
import LetterFile from '../models/LetterFile';
import Pegawai from '../models/Pegawai';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import '../models';

// File logging function
function writeLog(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

export async function getAllLetters(req: Request, res: Response) {
  const letters = await Letter.findAll({
    include: [
      { model: Pegawai, as: 'recipient', attributes: ['nip', 'nama'], required: false },
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
  
  // Debug logging for Template 2
  if (template_id === 2) {
    writeLog('=== TEMPLATE 2 DEBUG ===');
    writeLog(`office_id: ${office_id}`);
    writeLog(`created_by: ${created_by}`);
    writeLog(`template_id: ${template_id}`);
    writeLog(`template_name: ${template_name}`);
    writeLog(`letter_number: ${letter_number}`);
    writeLog(`subject: ${subject}`);
    writeLog(`recipient_employee_nip: ${recipient_employee_nip}`);
    writeLog(`signing_official_nip: ${signing_official_nip}`);
    writeLog(`form_data keys: ${Object.keys(form_data)}`);
    writeLog(`form_data values: ${JSON.stringify(form_data, null, 2)}`);
    writeLog(`status: ${status}`);
    writeLog('=== END TEMPLATE 2 DEBUG ===');
  }
  
  // Check required fields based on template
  const isTemplate2 = template_id === 2; // Template 2: Surat Keterangan Analisis Jabatan
  const isTemplate9 = template_id === 9; // Template 9: SPTJM
  
  if (!office_id || !created_by || !template_id || !template_name || !letter_number || !subject || !signing_official_nip || !form_data) {
    writeLog('=== VALIDATION FAILED ===');
    writeLog(`office_id missing: ${!office_id}`);
    writeLog(`created_by missing: ${!created_by}`);
    writeLog(`template_id missing: ${!template_id}`);
    writeLog(`template_name missing: ${!template_name}`);
    writeLog(`letter_number missing: ${!letter_number}`);
    writeLog(`subject missing: ${!subject}`);
    writeLog(`signing_official_nip missing: ${!signing_official_nip}`);
    writeLog(`form_data missing: ${!form_data}`);
    writeLog(`Request body: ${JSON.stringify(req.body, null, 2)}`);
    writeLog('=== END VALIDATION FAILED ===');
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Only require recipient_employee_nip for templates that need employee data (not Template 2 and Template 9)
  if (!isTemplate2 && !isTemplate9 && !recipient_employee_nip) {
    writeLog('=== RECIPIENT EMPLOYEE NIP MISSING ===');
    writeLog(`template_id: ${template_id}`);
    writeLog(`recipient_employee_nip: ${recipient_employee_nip}`);
    writeLog('=== END RECIPIENT EMPLOYEE NIP MISSING ===');
    return res.status(400).json({ message: 'Missing required fields: recipient_employee_nip' });
  }
  
  try {
    // Ensure form_data is properly structured for Template 2
    let processedFormData = form_data;
    if (template_id === 2) {
      writeLog('=== TEMPLATE 2 FORM_DATA PROCESSING ===');
      writeLog(`Original unitkerja: ${(form_data as any).unitkerja}`);
      
      // Ensure unitkerja is preserved exactly as sent
      if ((form_data as any).unitkerja) {
        processedFormData = {
          ...form_data,
          unitkerja: (form_data as any).unitkerja.toString() // Ensure it's a string
        };
        writeLog(`Processed unitkerja: ${(processedFormData as any).unitkerja}`);
      }
      writeLog('=== END TEMPLATE 2 FORM_DATA PROCESSING ===');
    }
    
    const letter = await Letter.create({ 
      office_id, 
      created_by, 
      template_id, 
      template_name, 
      letter_number, 
      subject, 
      recipient_employee_nip, 
      signing_official_nip, 
      form_data: processedFormData, 
      status 
    });
    
    writeLog('=== LETTER CREATED SUCCESSFULLY ===');
    writeLog(`Letter ID: ${letter.id}`);
    writeLog(`Template ID: ${template_id}`);
    if (template_id === 2) {
      writeLog(`Saved unitkerja: ${(letter.form_data as any).unitkerja}`);
    }
    writeLog('=== END LETTER CREATED SUCCESSFULLY ===');
    res.status(201).json({ letter });
  } catch (error: any) {
    writeLog('=== LETTER CREATION ERROR ===');
    writeLog(`Error: ${error}`);
    writeLog(`Error message: ${error.message}`);
    writeLog(`Error stack: ${error.stack}`);
    writeLog('=== END LETTER CREATION ERROR ===');
    res.status(500).json({ message: 'Internal server error' });
  }
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
  const letter = await Letter.findByPk(id, {
    include: [{ model: LetterFile, as: 'files' }]
  });
  if (!letter) return res.status(404).json({ message: 'Letter not found' });
  
  // Hapus file fisik dari storage sebelum menghapus surat
  if (letter.files && Array.isArray(letter.files)) {
    for (const file of letter.files) {
      try {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        // Lanjutkan meskipun ada error saat menghapus file
      }
    }
  }
  
  // Hapus surat (file records akan otomatis terhapus karena cascade delete)
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