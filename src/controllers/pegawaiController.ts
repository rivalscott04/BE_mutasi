import { Request, Response } from 'express';
import Pegawai from '../models/Pegawai';
import { Op } from 'sequelize';

export async function getAllPegawai(req: Request, res: Response) {
  const pegawai = await Pegawai.findAll();
  res.json({ pegawai });
}

export async function getPegawaiById(req: Request, res: Response) {
  const { id } = req.params;
  const lookup = (id || '').toString().trim();
  // Robust lookup: try by NIP first, then fallback to UUID id
  let pegawai = await Pegawai.findOne({ where: { nip: lookup } });
  if (!pegawai) {
    pegawai = await Pegawai.findOne({ where: { id: lookup } });
  }
  if (!pegawai) return res.status(404).json({ message: 'Pegawai not found' });
  res.json({ pegawai });
}

export async function createPegawai(req: Request, res: Response) {
  const { nip, nama, golongan, tmt_pensiun, unit_kerja, induk_unit, jabatan, kantor_id, jenis_pegawai, aktif } = req.body;
  if (!nip || !nama) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const pegawai = await Pegawai.create({ nip, nama, golongan, tmt_pensiun, unit_kerja, induk_unit, jabatan, kantor_id, jenis_pegawai, aktif });
  res.status(201).json({ pegawai });
}

export async function updatePegawai(req: Request, res: Response) {
  const { id } = req.params;
  const { nama, golongan, tmt_pensiun, unit_kerja, induk_unit, jabatan, kantor_id, jenis_pegawai, aktif } = req.body;
  const lookup = (id || '').toString().trim();
  // Robust lookup: by NIP or by UUID id
  let pegawai = await Pegawai.findOne({ where: { nip: lookup } });
  if (!pegawai) {
    pegawai = await Pegawai.findOne({ where: { id: lookup } });
  }
  if (!pegawai) return res.status(404).json({ message: 'Pegawai not found' });
  if (nama) pegawai.nama = nama;
  if (golongan) pegawai.golongan = golongan;
  if (tmt_pensiun) pegawai.tmt_pensiun = tmt_pensiun;
  if (unit_kerja) pegawai.unit_kerja = unit_kerja;
  if (induk_unit) pegawai.induk_unit = induk_unit;
  if (jabatan) pegawai.jabatan = jabatan;
  if (kantor_id) pegawai.kantor_id = kantor_id;
  if (jenis_pegawai) pegawai.jenis_pegawai = jenis_pegawai;
  if (typeof aktif === 'boolean') pegawai.aktif = aktif;
  await pegawai.save();
  res.json({ pegawai });
}

export async function deletePegawai(req: Request, res: Response) {
  const { id } = req.params;
  const pegawai = await Pegawai.findOne({ where: { nip: id } });
  if (!pegawai) return res.status(404).json({ message: 'Pegawai not found' });
  await pegawai.destroy();
  res.json({ message: 'Pegawai deleted' });
}

export async function searchPegawai(req: Request, res: Response) {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }
  
  console.log(`🔍 Search query: "${q}"`);
  
  const pegawai = await Pegawai.findAll({ 
    where: { 
      [Op.or]: [
        { nama: { [Op.like]: `%${q}%` } },
        { nip: { [Op.like]: `%${q}%` } }
      ]
    } 
  });
  
  console.log(`📊 Found ${pegawai.length} results for query "${q}"`);
  console.log(`📋 First 5 results:`, pegawai.slice(0, 5).map(p => ({ nip: p.nip, nama: p.nama })));
  
  res.json({ pegawai });
}

export async function getPegawaiByIndukUnit(req: Request, res: Response) {
  const { induk_unit } = req.query;
  if (!induk_unit || typeof induk_unit !== 'string') {
    return res.status(400).json({ message: 'Query parameter induk_unit is required' });
  }
  const pegawai = await Pegawai.findAll({ where: { induk_unit } });
  res.json({ pegawai });
} 