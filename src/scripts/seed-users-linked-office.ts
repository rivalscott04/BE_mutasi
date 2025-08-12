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
      office_id: null, // Admin kanwil bisa akses semua office
    },
    {
      email: 'mataram@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Mataram',
      role: 'operator' as const,
      office_id: '11111111-1111-1111-1111-111111111111', // KOTA MATARAM
    },
    {
      email: 'lotim@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Lotim',
      role: 'operator' as const,
      office_id: '22222222-2222-2222-2222-222222222222', // KABUPATEN LOMBOK TIMUR
    },
    {
      email: 'loteng@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Loteng',
      role: 'operator' as const,
      office_id: '33333333-3333-3333-3333-333333333333', // KABUPATEN LOMBOK TENGAH
    },
    {
      email: 'ksb@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator KSB',
      role: 'operator' as const,
      office_id: '44444444-4444-4444-4444-444444444444', // KABUPATEN SUMBAWA BARAT
    },
    {
      email: 'klu@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator KLU',
      role: 'operator' as const,
      office_id: '55555555-5555-5555-5555-555555555555', // KABUPATEN LOMBOK UTARA
    },
    {
      email: 'dompu@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Dompu',
      role: 'operator' as const,
      office_id: '66666666-6666-6666-6666-666666666666', // KABUPATEN DOMPU
    },
    {
      email: 'kabbima@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Kab Bima',
      role: 'operator' as const,
      office_id: '77777777-7777-7777-7777-777777777777', // KABUPATEN BIMA
    },
    {
      email: 'kobi@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Kobi',
      role: 'operator' as const,
      office_id: '88888888-8888-8888-8888-888888888888', // KOTA BIMA
    },
    {
      email: 'lobar@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Lobar',
      role: 'operator' as const,
      office_id: '99999999-9999-9999-9999-999999999999', // KABUPATEN LOMBOK BARAT
    },
    {
      email: 'sumbawa@kemenag.go.id',
      password: 'operator123',
      full_name: 'Operator Sumbawa',
      role: 'operator' as const,
      office_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // KABUPATEN SUMBAWA
    },
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

  console.log('Seeder selesai: Semua user operator sudah langsung ter-link ke kantor (UUID manual).');
}

// Only run directly if this file is executed directly
if (require.main === module) {
  seedUsersLinkedToOffice().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  // Export function for use by other scripts
  seedUsersLinkedToOffice().catch((err) => {
    console.error('Seed users linked office failed:', err);
    throw err;
  });
} 