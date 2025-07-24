import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import officesRouter from './routes/offices';
import employeesRouter from './routes/employees';
import lettersRouter from './routes/letters';
import filesRouter from './routes/files';

const app = express();

const allowedOrigins = ['https://mutasisurat.rivaldev.site'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/offices', officesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/letters', lettersRouter);
app.use('/api/files', filesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

export default app;
