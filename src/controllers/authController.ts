import { Request, Response } from 'express';
import User from '../models/User';
import Office from '../models/Office';
import { verifyPassword } from '../utils/password';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

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
  const payload = { id: user.id, email: user.email, role: user.role, office_id: user.office_id };
  const token = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);
  // Set refresh token di cookie HTTP-only
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
  });
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

export async function refreshToken(req: Request, res: Response) {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token' });
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    // Buat access token baru
    const token = generateToken({ id: payload.id, email: payload.email, role: payload.role, office_id: payload.office_id });
    res.json({ token });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
} 