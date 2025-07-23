import { db } from '../models';

(async () => {
  try {
    await db.authenticate();
    console.log('Database connection established.');
    await db.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unable to sync database:', err);
    process.exit(1);
  }
})(); 