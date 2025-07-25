import { Request, Response } from 'express';
import User from '../models/User';
import Office from '../models/Office';
import { verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  let kabkota = undefined;
  if (user.office_id) {
    const office = await Office.findByPk(user.office_id);
    kabkota = office?.kabkota;
  }
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, office_id: user.office_id, kabkota } });
}

export async function me(req: Request, res: Response) {
  // @ts-ignore
  const user = req.user;
  let kabkota = undefined;
  if (user.office_id) {
    const office = await Office.findByPk(user.office_id);
    kabkota = office?.kabkota;
  }
  res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, office_id: user.office_id, kabkota } });
}

export async function impersonate(req: any, res: Response) {
  const { userId } = req.body;
  // Pastikan hanya admin yang bisa impersonate
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Only admin can impersonate' });
  }
  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Payload JWT user target + original_admin_id
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    office_id: user.office_id,
    original_admin_id: req.user.id,
  };
  const token = generateToken(payload);
  res.json({ token, user: payload });
} 