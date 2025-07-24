import Office from '../models/Office';
import User from '../models/User';
import db from '../utils/db';

const kabkotaList = [
  'KOTA MATARAM',
  'KABUPATEN LOMBOK TIMUR',
  'KABUPATEN LOMBOK TENGAH',
  'KABUPATEN SUMBAWA BARAT',
  'KABUPATEN LOMBOK UTARA',
  'KABUPATEN DOMPU',
  'KABUPATEN BIMA',
  'KOTA BIMA',
  'KABUPATEN LOMBOK BARAT',
  'KABUPATEN SUMBAWA',
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
  for (const kabkota of kabkotaList) {
    // Buat office jika belum ada
    let office = await Office.findOne({ where: { kabkota } });
    if (!office) {
      office = await Office.create({ name: 'KANTOR KEMENTERIAN AGAMA', kabkota, address: '' });
    }
    // Update user operator agar office_id sinkron
    const email = emailMap[kabkota];
    if (email) {
      await User.update({ office_id: office.id }, { where: { email } });
    }
  }
  console.log('Seeder selesai: Office dan user operator sudah sinkron.');
  process.exit(0);
}

seedOfficeUserSync().catch((err) => {
  console.error(err);
  process.exit(1);
}); 