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
  try {
    const { email, password, full_name, role, office_id } = req.body;
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    
    const password_hash = await hashPassword(password);
    
    // Convert empty string to null for office_id
    const finalOfficeId = office_id === '' ? null : office_id;
    
    const user = await User.create({ 
      email, 
      password_hash, 
      full_name, 
      role, 
      office_id: finalOfficeId 
    });
    
    res.status(201).json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name, 
        role: user.role, 
        office_id: user.office_id 
      } 
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Data tidak valid: ' + error.message });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Office ID tidak valid atau tidak ditemukan' });
    }
    
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { email, password, full_name, role, office_id, is_active } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (email) user.email = email;
    if (password) user.password_hash = await hashPassword(password);
    if (full_name) user.full_name = full_name;
    if (role) user.role = role;
    if (office_id !== undefined) {
      // Convert empty string to null for office_id
      user.office_id = office_id === '' ? null : office_id;
    }
    if (typeof is_active === 'boolean') user.is_active = is_active;
    
    await user.save();
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name, 
        role: user.role, 
        office_id: user.office_id, 
        is_active: user.is_active 
      } 
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Office ID tidak valid atau tidak ditemukan' });
    }
    
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

export async function updateUserOffice(req: Request, res: Response) {
  const { id } = req.params;
  const { office_id } = req.body;
  // @ts-ignore
  const currentUser = req.user;
  // Hanya boleh update office_id user sendiri, atau admin
  if (currentUser.role !== 'admin' && currentUser.id !== id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.office_id = office_id;
  await user.save();
  res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, office_id: user.office_id } });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.destroy();
  res.json({ message: 'User deleted' });
} 