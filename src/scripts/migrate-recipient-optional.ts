import { db, Letter, User, Office, LetterFile } from '../models';
import { QueryTypes } from 'sequelize';

async function migrate() {
  // 1. Sync (buat) semua tabel kecuali pegawai
  await Office.sync({ alter: true });
  await User.sync({ alter: true });
  await LetterFile.sync({ alter: true });
  await Letter.sync({ alter: true }); // Letter di-sync agar tabel pasti ada

  // 2. Alter kolom recipient_employee_nip pada tabel letters agar nullable
  await db.query(
    `ALTER TABLE letters MODIFY recipient_employee_nip VARCHAR(20) NULL;`,
    { type: QueryTypes.RAW }
  );

  console.log('Migration success: tabel sudah di-sync dan kolom recipient_employee_nip sudah nullable.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 