import { Request, Response, NextFunction } from 'express';

// In-memory session store untuk impersonation
// Dalam produksi, sebaiknya gunakan Redis atau database session
const impersonationSessions = new Map<string, {
  originalAdminId: string;
  targetUserId: string;
  startTime: Date;
}>();

// Middleware untuk session management
export function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Basic session middleware - could be expanded for more functionality
  next();
}

// Middleware untuk tracking impersonation
export function trackImpersonation(req: Request, res: Response, next: NextFunction) {
  // Track impersonation activity if needed
  next();
}

export function startImpersonation(req: Request, originalAdminId: string, targetUserId: string) {
  const sessionKey = `${originalAdminId}_${targetUserId}_${Date.now()}`;
  
  impersonationSessions.set(sessionKey, {
    originalAdminId,
    targetUserId,
    startTime: new Date()
  });
  
  // Store session key in request for cleanup
  (req as any).impersonationSessionKey = sessionKey;
  
  console.log(`Impersonation started: Admin ${originalAdminId} -> User ${targetUserId}`);
}

export function stopImpersonation(req: Request) {
  const sessionKey = (req as any).impersonationSessionKey;
  
  if (sessionKey && impersonationSessions.has(sessionKey)) {
    const session = impersonationSessions.get(sessionKey);
    impersonationSessions.delete(sessionKey);
    
    console.log(`Impersonation stopped: Admin ${session?.originalAdminId} -> User ${session?.targetUserId}`);
  } else {
    // Fallback: try to find session by user data
    const userId = (req as any).user?.id;
    const originalAdminId = (req as any).user?.original_admin_id;
    
    if (userId && originalAdminId) {
      // Find and remove matching session
      for (const [key, session] of impersonationSessions.entries()) {
        if (session.originalAdminId === originalAdminId && session.targetUserId === userId) {
          impersonationSessions.delete(key);
          console.log(`Impersonation stopped (fallback): Admin ${originalAdminId} -> User ${userId}`);
          break;
        }
      }
    }
  }
}

export function getActiveImpersonations(): Array<{key: string, session: any}> {
  return Array.from(impersonationSessions.entries()).map(([key, session]) => ({
    key,
    session
  }));
}

export function cleanupExpiredSessions(maxAgeHours = 24) {
  const now = new Date();
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  
  for (const [key, session] of impersonationSessions.entries()) {
    const age = now.getTime() - session.startTime.getTime();
    if (age > maxAge) {
      impersonationSessions.delete(key);
      console.log(`Expired impersonation session removed: ${key}`);
    }
  }
}

// Cleanup expired sessions every hour
setInterval(() => {
  cleanupExpiredSessions();
}, 60 * 60 * 1000);