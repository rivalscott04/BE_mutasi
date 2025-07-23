import { hashPassword } from '../utils/password';
import User from '../models/User';
import db from '../utils/db';

async function seed() {
  await db.sync(); // pastikan tabel sudah ada

  const users = [
    {
      email: 'admin.kanwil@kemenag.go.id',
      password: 'admin123',
      full_name: 'Admin Kanwil',
      role: 'admin' as const,
      office_id: undefined,
    },
    {
      email: 'mataram@kemenag.go.id',
      password: 'operator123',
      full_name: 'Kota Mataram',
      role: 'operator' as const,
      office_id: undefined,
    },
    {
      email: 'lotim@kemenag.go.id',
      password: 'operator123',
      full_name: 'Kab Lotim',
      role: 'operator' as const,
      office_id: undefined,
    },
  ];

  for (const u of users) {
    const password_hash = await hashPassword(u.password);
    await User.create({
      email: u.email,
      password_hash,
      full_name: u.full_name,
      role: u.role,
      ...(u.office_id ? { office_id: u.office_id } : {}),
      is_active: true,
    });
  }

  console.log('Seeder selesai: 1 admin & 2 operator berhasil dibuat.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
}); 