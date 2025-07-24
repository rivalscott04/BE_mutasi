import { Letter } from '../models';

async function migrateLetterTable() {
  await Letter.sync({ alter: true });
  console.log('Migration success: tabel letters sudah di-sync dengan model Letter.');
  process.exit(0);
}

migrateLetterTable().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 