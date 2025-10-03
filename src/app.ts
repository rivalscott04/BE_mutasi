import express from 'express';
import cors from 'cors';
import './models'; // Initialize models and associations
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import officesRouter from './routes/offices';
import employeesRouter from './routes/employees';
import lettersRouter from './routes/letters';
import filesRouter from './routes/files';
import pengajuanRouter from './routes/pengajuan';
import jobTypeConfigRouter from './routes/jobTypeConfig';
import adminWilayahRouter from './routes/adminWilayah';
import adminWilayahFileConfigRouter from './routes/adminWilayahFileConfig';
import publicRouter from './routes/public';
import maintenanceRouter from './routes/maintenance';
import { sessionMiddleware, trackImpersonation } from './middleware/sessionManager';
import { bypassOfficeFilterForAdmin } from './middleware/adminAccess';
import { authMiddleware } from './middleware/auth';
import { maintenanceMiddleware } from './middleware/maintenance';
import logger from './utils/logger';

const app = express();

const allowedOrigins = [
  'https://mutasisurat.rivaldev.site',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Session middleware untuk impersonation tracking
app.use(sessionMiddleware);

// JSON parsing with better error handling
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));

// Impersonation tracking middleware
app.use(trackImpersonation);

// Maintenance mode middleware (before auth routes)
app.use(maintenanceMiddleware);

app.use('/api/auth', authRouter);

// Public routes (no authentication required)
app.use('/api/public', publicRouter);

// Routes with their own authMiddleware + admin access control
app.use('/api/users', authMiddleware, bypassOfficeFilterForAdmin, usersRouter);
app.use('/api/offices', authMiddleware, bypassOfficeFilterForAdmin, officesRouter);
app.use('/api/employees', authMiddleware, bypassOfficeFilterForAdmin, employeesRouter);
app.use('/api/letters', authMiddleware, bypassOfficeFilterForAdmin, lettersRouter);
app.use('/api/files', authMiddleware, bypassOfficeFilterForAdmin, filesRouter);
app.use('/api/pengajuan', authMiddleware, bypassOfficeFilterForAdmin, pengajuanRouter);
app.use('/api/job-type-configurations', authMiddleware, bypassOfficeFilterForAdmin, jobTypeConfigRouter);

// Admin Wilayah routes
app.use('/api/admin-wilayah', adminWilayahRouter);

// Admin Wilayah File Config routes - dipindah ke level yang sama
app.use('/api/admin-wilayah-file-config', authMiddleware, bypassOfficeFilterForAdmin, adminWilayahFileConfigRouter);

// Maintenance routes
app.use('/api/maintenance', maintenanceRouter);

// Health check
app.get('/api/health', (req, res) => {
  logger.info('Health check requested', { ip: req.ip });
  res.json({ status: 'ok' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server Error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.id || 'anonymous',
    ip: req.ip
  });
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      message: 'Invalid JSON format in request body',
      error: 'JSON parsing failed'
    });
  }
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
