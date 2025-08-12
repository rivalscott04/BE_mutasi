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

// JSON parsing with better error handling
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/offices', officesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/letters', lettersRouter);
app.use('/api/files', filesRouter);
app.use('/api/pengajuan', pengajuanRouter);
app.use('/api/job-type-configurations', jobTypeConfigRouter);

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
