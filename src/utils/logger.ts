import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.warn('Could not create logs directory:', error);
}

// Simple logger like Laravel
const logger = {
  error: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
    
    // Always log to console
    console.error(`[ERROR] ${message}`, data || '');
    
    // Try to write to error log file, but don't crash if it fails
    try {
      const errorLogPath = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(errorLogPath, logEntry);
    } catch (error) {
      console.warn('Could not write to error log file:', error);
    }
  },

  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] WARN: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
    
    // Always log to console
    console.warn(`[WARN] ${message}`, data || '');
    
    // Try to write to combined log file, but don't crash if it fails
    try {
      const combinedLogPath = path.join(logsDir, `combined-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(combinedLogPath, logEntry);
    } catch (error) {
      console.warn('Could not write to combined log file:', error);
    }
  },

  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] INFO: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
    
    // Always log to console
    console.log(`[INFO] ${message}`, data || '');
    
    // Try to write to combined log file, but don't crash if it fails
    try {
      const combinedLogPath = path.join(logsDir, `combined-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(combinedLogPath, logEntry);
    } catch (error) {
      console.warn('Could not write to combined log file:', error);
    }
  }
};

export default logger;
