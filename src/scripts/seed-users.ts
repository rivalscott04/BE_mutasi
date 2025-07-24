import { hashPassword } from '../utils/password';
import User from '../models/User';
import db from '../utils/db';
import Office from '../models/Office';

async function seed() {
  await db.sync(); // pastikan tabel sudah ada

  // Seed 10 kabupaten/kota ke tabel offices
  const offices = [
    { name: 'Kantor Kemenag Kota Mataram', kabkota: 'Mataram', address: 'Alamat Mataram' },
    { name: 'Kantor Kemenag Lombok Timur', kabkota: 'Lotim', address: 'Alamat Lombok Timur' },
    { name: 'Kantor Kemenag Lombok Tengah', kabkota: 'Loteng', address: 'Alamat Lombok Tengah' },
    { name: 'Kantor Kemenag Sumbawa Barat', kabkota: 'KSB', address: 'Alamat Sumbawa Barat' },
    { name: 'Kantor Kemenag Lombok Utara', kabkota: 'KLU', address: 'Alamat Lombok Utara' },
    { name: 'Kantor Kemenag Dompu', kabkota: 'Dompu', address: 'Alamat Dompu' },
    { name: 'Kantor Kemenag Kabupaten Bima', kabkota: 'KabBima', address: 'Alamat Kabupaten Bima' },
    { name: 'Kantor Kemenag Kota Bima', kabkota: 'Kobi', address: 'Alamat Kota Bima' },
    { name: 'Kantor Kemenag Lombok Barat', kabkota: 'Lobar', address: 'Alamat Lombok Barat' },
    { name: 'Kantor Kemenag Sumbawa', kabkota: 'Sumbawa', address: 'Alamat Sumbawa' },
  ];
  // Simpan hasil create office agar bisa dipakai untuk user
  const officeRecords = [];
  for (const o of offices) {
    const office = await Office.create(o);
    officeRecords.push(office);
  }

  const users = [
    {
      email: 'admin.kanwil@kemenag.go.id',
      password: 'admin123',
      full_name: 'Admin Kanwil',
      role: 'admin' as const,
      office_id: undefined,
    },
    // Operator untuk setiap office
    ...officeRecords.map(office => ({
      email: `${office.kabkota.toLowerCase()}@kemenag.go.id`,
      password: 'operator123',
      full_name: `Operator ${office.kabkota}`,
      role: 'operator' as const,
      office_id: office.id,
    })),
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

  console.log('Seeder selesai: 1 admin & 10 operator berhasil dibuat.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
}); 