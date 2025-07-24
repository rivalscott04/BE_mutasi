import Office from '../models/Office';
import User from '../models/User';
import db from '../utils/db';

// UUID kantor ditentukan manual
const officeData = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KOTA MATARAM', address: '' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KABUPATEN LOMBOK TIMUR', address: '' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KABUPATEN LOMBOK TENGAH', address: '' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KABUPATEN SUMBAWA BARAT', address: '' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KABUPATEN LOMBOK UTARA', address: '' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KABUPATEN DOMPU', address: '' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KABUPATEN BIMA', address: '' },
  { id: '88888888-8888-8888-8888-888888888888', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KOTA BIMA', address: '' },
  { id: '99999999-9999-9999-9999-999999999999', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KABUPATEN LOMBOK BARAT', address: '' },
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'KANTOR KEMENTERIAN AGAMA', kabkota: 'KABUPATEN SUMBAWA', address: '' },
];

const emailMap: Record<string, string> = {
  'KOTA MATARAM': 'mataram@kemenag.go.id',
  'KABUPATEN LOMBOK TIMUR': 'lotim@kemenag.go.id',
  'KABUPATEN LOMBOK TENGAH': 'loteng@kemenag.go.id',
  'KABUPATEN SUMBAWA BARAT': 'ksb@kemenag.go.id',
  'KABUPATEN LOMBOK UTARA': 'klu@kemenag.go.id',
  'KABUPATEN DOMPU': 'dompu@kemenag.go.id',
  'KABUPATEN BIMA': 'kabbima@kemenag.go.id',
  'KOTA BIMA': 'kobi@kemenag.go.id',
  'KABUPATEN LOMBOK BARAT': 'lobar@kemenag.go.id',
  'KABUPATEN SUMBAWA': 'sumbawa@kemenag.go.id',
};

async function seedOfficeUserSync() {
  await db.sync();
  for (const office of officeData) {
    // Buat office dengan UUID manual jika belum ada
    let officeRecord = await Office.findByPk(office.id);
    if (!officeRecord) {
      officeRecord = await Office.create(office);
    }
    // Update user operator agar office_id sinkron
    const email = emailMap[office.kabkota];
    if (email) {
      await User.update({ office_id: office.id }, { where: { email } });
    }
  }
  console.log('Seeder selesai: Office (UUID manual) dan user operator sudah sinkron.');
  process.exit(0);
}

seedOfficeUserSync().catch((err) => {
  console.error(err);
  process.exit(1);
}); 