import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Office from '../models/Office';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

function generateToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    office_id: user.office_id,
  };
  
  const token = generateToken(payload);
  res.json({ token, user: payload });
}

export async function me(req: any, res: Response) {
  const user = req.user;
  let kabkota;
  if (user.office_id) {
    const office = await Office.findByPk(user.office_id);
    kabkota = office?.kabkota;
  }
  res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, office_id: user.office_id, kabkota } });
}

export async function impersonate(req: any, res: Response) {
  const { userId } = req.body;
  
  // Pastikan hanya admin kanwil yang bisa impersonate
  if (!req.user || req.user.role !== 'admin' || req.user.office_id !== null) {
    return res.status(403).json({ message: 'Forbidden: Only admin kanwil can impersonate' });
  }
  
  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Start impersonation session
  const { startImpersonation } = await import('../middleware/sessionManager');
  startImpersonation(req, req.user.id, userId);

  // Payload JWT user target + original_admin_id
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    office_id: user.office_id,
    original_admin_id: req.user.id,
    impersonating: true,
  };
  
  const token = generateToken(payload);
  res.json({ 
    token, 
    user: payload,
    impersonation: {
      original_admin: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
      },
      target_user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        office_id: user.office_id,
      }
    }
  });
}

export async function stopImpersonate(req: any, res: Response) {
  const { stopImpersonation } = await import('../middleware/sessionManager');
  
  // Stop impersonation session
  stopImpersonation(req);
  
  // Return to original admin token
  if (!req.user?.original_admin_id) {
    return res.status(400).json({ message: 'Not currently impersonating' });
  }
  
  const originalAdmin = await User.findByPk(req.user.original_admin_id);
  if (!originalAdmin) {
    return res.status(404).json({ message: 'Original admin not found' });
  }
  
  const payload = {
    id: originalAdmin.id,
    email: originalAdmin.email,
    role: originalAdmin.role,
    office_id: originalAdmin.office_id,
  };
  
  const token = generateToken(payload);
  res.json({ token, user: payload, message: 'Impersonation stopped' });
}

export async function refreshToken(req: Request, res: Response) {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      office_id: user.office_id,
    };
    
    const newToken = generateToken(payload);
    res.json({ token: newToken, user: payload });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}