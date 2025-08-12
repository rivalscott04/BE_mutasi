import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware untuk bypass office filtering untuk admin kanwil
 * Admin kanwil (role=admin, office_id=null) bisa akses semua data
 */
export function bypassOfficeFilterForAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Set flag untuk admin kanwil yang bisa akses semua
  req.canAccessAllOffices = user.role === 'admin' && !user.office_id;
  
  next();
}

/**
 * Helper function untuk build where clause dengan office filtering
 * Gunakan ini di controller untuk filter berdasarkan office_id
 */
export function buildOfficeWhereClause(req: AuthRequest, additionalWhere: any = {}) {
  const user = req.user;
  
  // Admin kanwil bisa akses semua
  if (req.canAccessAllOffices) {
    return additionalWhere;
  }
  
  // User biasa hanya bisa akses office mereka
  return {
    ...additionalWhere,
    office_id: user?.office_id
  };
}

// Extend AuthRequest interface
declare module './auth' {
  interface AuthRequest {
    canAccessAllOffices?: boolean;
  }
}
