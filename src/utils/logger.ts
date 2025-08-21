import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger like Laravel
const logger = {
  error: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
    
    // Write to error log file
    const errorLogPath = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(errorLogPath, logEntry);
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, data || '');
    }
  },

  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] WARN: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
    
    // Write to combined log file
    const combinedLogPath = path.join(logsDir, `combined-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(combinedLogPath, logEntry);
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },

  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] INFO: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
    
    // Write to combined log file
    const combinedLogPath = path.join(logsDir, `combined-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(combinedLogPath, logEntry);
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, data || '');
    }
  }
};

export default logger;
