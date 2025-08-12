import { db } from '../models';

(async () => {
  try {
    await db.authenticate();
    console.log('Database connection established.');
    
    // SAFETY CHECK: Never use force: true in production!
    // force: true will DROP ALL TABLES AND DATA!
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      console.error('❌ SAFETY CHECK FAILED: Cannot use force sync in production!');
      console.error('This would DELETE ALL DATA! Use migrations instead.');
      process.exit(1);
    }
    
    // Use alter: true to safely add new columns/tables without dropping data
    await db.sync({ alter: true });
    console.log('✅ All models were synchronized safely (alter mode).');
    console.log('⚠️  WARNING: force: true was removed for safety!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Unable to sync database:', err);
    process.exit(1);
  }
})(); 