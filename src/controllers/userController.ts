import { Request, Response } from 'express';
import User from '../models/User';
import { hashPassword } from '../utils/password';

export async function getAllUsers(req: Request, res: Response) {
  const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
  res.json({ users });
}

export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const user = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
}

export async function createUser(req: Request, res: Response) {
  const { email, password, full_name, role, office_id } = req.body;
  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const password_hash = await hashPassword(password);
  const user = await User.create({ email, password_hash, full_name, role, office_id });
  res.status(201).json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, office_id: user.office_id } });
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { email, password, full_name, role, office_id, is_active } = req.body;
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (email) user.email = email;
  if (password) user.password_hash = await hashPassword(password);
  if (full_name) user.full_name = full_name;
  if (role) user.role = role;
  if (office_id) user.office_id = office_id;
  if (typeof is_active === 'boolean') user.is_active = is_active;
  await user.save();
  res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, office_id: user.office_id, is_active: user.is_active } });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.destroy();
  res.json({ message: 'User deleted' });
} 