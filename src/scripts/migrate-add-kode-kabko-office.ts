import { db } from '../models';
import { QueryTypes } from 'sequelize';

async function migrateAddKodeKabkoOffice() {
  // Alasan VARCHAR: kode kabko bisa saja mengandung angka dengan leading zero (misal '08'),
  // atau format khusus lain di masa depan, sehingga lebih aman pakai VARCHAR daripada INT.
  await db.query(
    `ALTER TABLE offices ADD COLUMN kode_kabko VARCHAR(10) DEFAULT NULL;`,
    { type: QueryTypes.RAW }
  );
  console.log('Migration success: kolom kode_kabko sudah ditambahkan ke tabel offices.');
  process.exit(0);
}

migrateAddKodeKabkoOffice().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 