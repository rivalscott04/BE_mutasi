import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { cleanupExpiredGeneratedZips } from './controllers/pengajuanController';

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Run cleanup immediately on startup
  cleanupExpiredGeneratedZips();
  
  // Schedule cleanup to run every 24 hours (86400000 ms)
  const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
  setInterval(() => {
    console.log('🧹 Running scheduled cleanup for expired generated ZIP files...');
    cleanupExpiredGeneratedZips();
  }, cleanupInterval);
  
  console.log('✅ Scheduled cleanup task initialized (runs every 24 hours)');
});
