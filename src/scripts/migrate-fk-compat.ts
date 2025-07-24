import { db } from '../models';
import { QueryTypes } from 'sequelize';

async function migrateFKCompat() {
  // 1. Samakan tipe dan collation kolom UUID (id, office_id, created_by, dsb)
  await db.query(
    `ALTER TABLE offices MODIFY id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;`,
    { type: QueryTypes.RAW }
  );
  await db.query(
    `ALTER TABLE users MODIFY id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;`,
    { type: QueryTypes.RAW }
  );
  await db.query(
    `ALTER TABLE letters MODIFY id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;`,
    { type: QueryTypes.RAW }
  );
  await db.query(
    `ALTER TABLE letters MODIFY office_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;`,
    { type: QueryTypes.RAW }
  );
  await db.query(
    `ALTER TABLE letters MODIFY created_by CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;`,
    { type: QueryTypes.RAW }
  );

  // 2. Samakan tipe dan collation kolom NIP pegawai
  await db.query(
    `ALTER TABLE pegawai MODIFY nip VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;`,
    { type: QueryTypes.RAW }
  );
  await db.query(
    `ALTER TABLE letters MODIFY recipient_employee_nip VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`,
    { type: QueryTypes.RAW }
  );
  await db.query(
    `ALTER TABLE letters MODIFY signing_official_nip VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;`,
    { type: QueryTypes.RAW }
  );

  console.log('Migration success: Semua kolom foreign key sudah disamakan tipe dan collation-nya.');
  process.exit(0);
}

migrateFKCompat().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 