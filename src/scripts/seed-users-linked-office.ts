import { hashPassword } from '../utils/password';
import User from '../models/User';
import db from '../utils/db';

async function seedUsersLinkedToOffice() {
  await db.sync();

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
      full_name: 'Operator Mataram',
      role: 'operator' as const,
      office_id: '11111111-1111-1111-1111-111111111111', // UUID kantor KOTA MATARAM
    },
    {
      email: 'lotim@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Lotim',
      role: 'operator' as const,
      office_id: '22222222-2222-2222-2222-222222222222', // UUID kantor KABUPATEN LOMBOK TIMUR
    },
    // Tambahkan user lain sesuai kebutuhan...
  ];

  for (const u of users) {
    const password_hash = await hashPassword(u.password);
    await User.create({
      email: u.email,
      password_hash,
      full_name: u.full_name,
      role: u.role,
      office_id: u.office_id,
      is_active: true,
    });
  }

  console.log('Seeder selesai: User operator sudah langsung ter-link ke kantor (UUID manual).');
  process.exit(0);
}

seedUsersLinkedToOffice().catch((err) => {
  console.error(err);
  process.exit(1);
}); 