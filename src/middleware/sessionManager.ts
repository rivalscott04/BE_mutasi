import session from 'express-session';
import { Request, Response, NextFunction } from 'express';

// Session store untuk impersonate tracking
interface ImpersonateSession {
  original_admin_id?: string;
  impersonated_user_id?: string;
  impersonation_start?: Date;
}

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    impersonate?: ImpersonateSession;
  }
}

// Session middleware configuration
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

/**
 * Start impersonation session
 */
export function startImpersonation(req: Request, adminId: string, targetUserId: string) {
  if (!req.session) {
    throw new Error('Session not initialized');
  }

  req.session.impersonate = {
    original_admin_id: adminId,
    impersonated_user_id: targetUserId,
    impersonation_start: new Date(),
  };
}

/**
 * Stop impersonation session
 */
export function stopImpersonation(req: Request) {
  if (req.session?.impersonate) {
    delete req.session.impersonate;
  }
}

/**
 * Get current impersonation info
 */
export function getImpersonationInfo(req: Request): ImpersonateSession | null {
  return req.session?.impersonate || null;
}

/**
 * Check if currently impersonating
 */
export function isImpersonating(req: Request): boolean {
  return !!(req.session?.impersonate?.original_admin_id);
}

/**
 * Middleware to track impersonation in request
 */
export function trackImpersonation(req: Request, res: Response, next: NextFunction) {
  const impersonationInfo = getImpersonationInfo(req);
  
  if (impersonationInfo) {
    // Add impersonation context to request
    (req as any).impersonationContext = {
      isImpersonating: true,
      originalAdminId: impersonationInfo.original_admin_id,
      impersonatedUserId: impersonationInfo.impersonated_user_id,
      startTime: impersonationInfo.impersonation_start,
    };
  }

  next();
}
