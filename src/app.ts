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
import { sessionMiddleware, trackImpersonation } from './middleware/sessionManager';
import { bypassOfficeFilterForAdmin } from './middleware/adminAccess';
import { authMiddleware } from './middleware/auth';

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

app.use('/api/auth', authRouter);

// Routes with their own authMiddleware + admin access control
app.use('/api/users', authMiddleware, bypassOfficeFilterForAdmin, usersRouter);
app.use('/api/offices', authMiddleware, bypassOfficeFilterForAdmin, officesRouter);
app.use('/api/employees', authMiddleware, bypassOfficeFilterForAdmin, employeesRouter);
app.use('/api/letters', authMiddleware, bypassOfficeFilterForAdmin, lettersRouter);
app.use('/api/files', authMiddleware, bypassOfficeFilterForAdmin, filesRouter);
app.use('/api/pengajuan', authMiddleware, bypassOfficeFilterForAdmin, pengajuanRouter);
app.use('/api/job-type-configurations', authMiddleware, bypassOfficeFilterForAdmin, jobTypeConfigRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server Error:', err);
  
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
