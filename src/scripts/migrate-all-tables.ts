import { Office, User, Pegawai, Letter } from '../models';

async function migrateAll() {
  await Office.sync({ alter: true });
  await User.sync({ alter: true });
  await Pegawai.sync({ alter: true });
  await Letter.sync({ alter: true }); // harus paling akhir

  console.log('Semua tabel sudah di-sync dengan urutan benar.');
  process.exit(0);
}

migrateAll().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 