import { Request, Response } from 'express';
import User from '../models/User';
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
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
}

export async function me(req: Request, res: Response) {
  // @ts-ignore
  const user = req.user;
  res.json({ user });
} 