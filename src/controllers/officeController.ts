import { Request, Response } from 'express';
import Office from '../models/Office';

export async function getAllOffices(req: Request, res: Response) {
  const offices = await Office.findAll();
  res.json({ offices });
}

export async function getOfficeById(req: Request, res: Response) {
  const { id } = req.params;
  const office = await Office.findByPk(id);
  if (!office) return res.status(404).json({ message: 'Office not found' });
  res.json({ office });
}

export async function createOffice(req: Request, res: Response) {
  const { name, kabkota, address, phone, fax, email, website } = req.body;
  if (!name || !kabkota || !address) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const office = await Office.create({ name, kabkota, address, phone, fax, email, website });
  res.status(201).json({ office });
}

export async function updateOffice(req: Request, res: Response) {
  const { id } = req.params;
  const { name, kabkota, address, phone, fax, email, website } = req.body;
  const office = await Office.findByPk(id);
  if (!office) return res.status(404).json({ message: 'Office not found' });
  if (name) office.name = name;
  if (kabkota) office.kabkota = kabkota;
  if (address) office.address = address;
  if (phone) office.phone = phone;
  if (fax) office.fax = fax;
  if (email) office.email = email;
  if (website) office.website = website;
  await office.save();
  res.json({ office });
}

export async function deleteOffice(req: Request, res: Response) {
  const { id } = req.params;
  const office = await Office.findByPk(id);
  if (!office) return res.status(404).json({ message: 'Office not found' });
  await office.destroy();
  res.json({ message: 'Office deleted' });
} 