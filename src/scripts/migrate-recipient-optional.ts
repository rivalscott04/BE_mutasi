import { db, Letter } from '../models';
import { QueryTypes } from 'sequelize';

async function migrate() {
  // 1. Sync model agar tabel pasti ada (tidak menghapus data)
  await Letter.sync({ alter: true });

  // 2. Pastikan kolom recipient_employee_nip nullable (opsional, jika sync belum cukup)
  await db.query(
    `ALTER TABLE letters MODIFY recipient_employee_nip VARCHAR(20) NULL;`,
    { type: QueryTypes.RAW }
  );

  console.log('Migration success: recipient_employee_nip is now nullable.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 