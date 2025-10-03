import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { Maintenance } from '../models';
import logger from '../utils/logger';

const router = express.Router();

// Get maintenance status
router.get('/status', async (req, res) => {
  try {
    const maintenance = await Maintenance.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      isMaintenanceMode: maintenance?.isActive || false,
      message: maintenance?.message || 'Sistem sedang dalam mode maintenance',
      startTime: maintenance?.startTime,
      endTime: maintenance?.endTime
    });
  } catch (error) {
    logger.error('Error fetching maintenance status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle maintenance mode (superadmin only)
router.post('/toggle', authMiddleware, async (req, res) => {
  try {
    const { user } = req as any;
    
    // Check if user is superadmin (admin with no office_id)
    if (user.role !== 'admin' || user.office_id !== null) {
      return res.status(403).json({ message: 'Only superadmin can toggle maintenance mode' });
    }
    
    const { isActive, message, endTime } = req.body;
    
    // Create new maintenance record
    const maintenance = await Maintenance.create({
      isActive: isActive || false,
      message: message || 'Sistem sedang dalam mode maintenance',
      startTime: new Date(),
      endTime: endTime ? new Date(endTime) : null,
      createdBy: user.id
    });
    
    logger.info(`Maintenance mode ${isActive ? 'enabled' : 'disabled'} by ${user.full_name}`, {
      userId: user.id,
      maintenanceId: maintenance.id
    });
    
    res.json({
      success: true,
      maintenance: {
        id: maintenance.id,
        isActive: maintenance.isActive,
        message: maintenance.message,
        startTime: maintenance.startTime,
        endTime: maintenance.endTime
      }
    });
  } catch (error) {
    logger.error('Error toggling maintenance mode:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get maintenance history (superadmin only)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { user } = req as any;
    
    // Check if user is superadmin
    if (user.role !== 'admin' || user.office_id !== null) {
      return res.status(403).json({ message: 'Only superadmin can view maintenance history' });
    }
    
    const history = await Maintenance.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json({ history });
  } catch (error) {
    logger.error('Error fetching maintenance history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
