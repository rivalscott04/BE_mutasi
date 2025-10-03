import { Request, Response, NextFunction } from 'express';
import { Maintenance } from '../models';
import logger from '../utils/logger';

export const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip maintenance check for certain routes
    const skipRoutes = [
      '/api/auth/login',
      '/api/auth/me',
      '/api/health',
      '/api/maintenance/status',
      '/api/maintenance/history',
      '/api/maintenance/toggle'
    ];
    
    if (skipRoutes.includes(req.path)) {
      return next();
    }
    
    // Get current maintenance status
    const maintenance = await Maintenance.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    // If maintenance is not active, continue normally
    if (!maintenance?.isActive) {
      return next();
    }
    
    // Check if user is superadmin (can bypass maintenance)
    const user = (req as any).user;
    if (user && user.role === 'admin' && user.office_id === null) {
      return next();
    }
    
    // Return maintenance mode response
    res.status(503).json({
      success: false,
      message: 'Sistem sedang dalam mode maintenance',
      maintenance: {
        isActive: true,
        message: maintenance.message,
        startTime: maintenance.startTime,
        endTime: maintenance.endTime
      }
    });
    
  } catch (error) {
    logger.error('Error in maintenance middleware:', error);
    // If there's an error checking maintenance, allow request to continue
    next();
  }
};
