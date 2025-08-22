import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Office from '../models/Office';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import logger from '../utils/logger';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    logger.info('Login attempt', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      logger.warn('Login failed - user not found', {
        email,
        ip: req.ip
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      logger.warn('Login failed - invalid password', {
        email,
        ip: req.ip,
        userId: user.id
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      office_id: user.office_id,
    };
    
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken({ id: user.id });
    
    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    const userInfo = { 
      id: user.id, 
      email: user.email, 
      full_name: user.full_name, 
      role: user.role, 
      office_id: user.office_id 
    };
    
    logger.info('Login successful', {
      userId: user.id,
      email: user.email,
      role: user.role,
      officeId: user.office_id,
      ip: req.ip
    });
    
    res.json({ token, user: userInfo });
  } catch (error) {
    logger.error('Login error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email: req.body.email,
      ip: req.ip
    });
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function me(req: any, res: Response) {
  try {
    const user = req.user;
    let kabkota;
    if (user.office_id) {
      const office = await Office.findByPk(user.office_id);
      kabkota = office?.kabkota;
    }
    
    logger.info('User profile accessed', {
      userId: user.id,
      email: user.email,
      role: user.role,
      officeId: user.office_id
    });
    
    res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, office_id: user.office_id, kabkota } });
  } catch (error) {
    logger.error('Error fetching user profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function impersonate(req: any, res: Response) {
  try {
    const { userId } = req.body;
    
    logger.info('Impersonation attempt', {
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      targetUserId: userId,
      ip: req.ip
    });
    
    // Pastikan hanya admin kanwil yang bisa impersonate
    if (!req.user || req.user.role !== 'admin' || req.user.office_id !== null) {
      logger.warn('Impersonation denied - insufficient privileges', {
        adminId: req.user?.id,
        adminRole: req.user?.role,
        adminOfficeId: req.user?.office_id,
        targetUserId: userId,
        ip: req.ip
      });
      return res.status(403).json({ message: 'Forbidden: Only admin kanwil can impersonate' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      logger.warn('Impersonation failed - target user not found', {
        adminId: req.user.id,
        targetUserId: userId,
        ip: req.ip
      });
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
    
    logger.info('Impersonation successful', {
      adminId: req.user.id,
      targetUserId: user.id,
      targetEmail: user.email,
      targetRole: user.role,
      ip: req.ip
    });
    
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
  } catch (error) {
    logger.error('Impersonation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      adminId: req.user?.id,
      targetUserId: req.body.userId,
      ip: req.ip
    });
    res.status(500).json({ message: 'Internal server error' });
  }
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
    const decoded = verifyRefreshToken(refreshToken) as any;
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Include kabkota info like in 'me' endpoint
    let kabkota;
    if (user.office_id) {
      const office = await Office.findByPk(user.office_id);
      kabkota = office?.kabkota;
    }
    
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      office_id: user.office_id,
    };
    
    const newToken = generateToken(payload);
    const userInfo = { 
      id: user.id, 
      email: user.email, 
      full_name: user.full_name, 
      role: user.role, 
      office_id: user.office_id, 
      kabkota 
    };
    
    res.json({ token: newToken, user: userInfo });
  } catch (error) {
    logger.error('Refresh token error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}