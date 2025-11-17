import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Middleware untuk block read-only roles (bimas, user) dari write operations
export function blockReadOnlyRoles(req: AuthRequest, res: Response, next: NextFunction) {
  const userRole = req.user?.role;
  if (userRole === 'bimas' || userRole === 'user') {
    return res.status(403).json({ message: 'Forbidden: read-only access. This role cannot perform write operations.' });
  }
  next();
} 