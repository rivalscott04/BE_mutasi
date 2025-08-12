import Office from '../models/Office';
import db from '../utils/db';

const kodeKabkoMap: Record<string, string> = {
  'KABUPATEN LOMBOK BARAT': '01',
  'KABUPATEN LOMBOK TENGAH': '02',
  'KABUPATEN LOMBOK TIMUR': '03',
  'KABUPATEN SUMBAWA': '04',
  'KABUPATEN DOMPU': '05',
  'KABUPATEN BIMA': '06',
  'KOTA MATARAM': '07',
  'KOTA BIMA': '08',
  'KABUPATEN SUMBAWA BARAT': '09',
  'KABUPATEN LOMBOK UTARA': '10',
};

async function seedKodeKabkoOffice() {
  await db.sync();
  for (const [kabkota, kode_kabko] of Object.entries(kodeKabkoMap)) {
    const office = await Office.findOne({ where: { kabkota } });
    if (office) {
      office.kode_kabko = kode_kabko;
      await office.save();
      console.log(`Updated ${kabkota} with kode_kabko: ${kode_kabko}`);
    } else {
      console.warn(`Office not found for kabkota: ${kabkota}`);
    }
  }
  console.log('Seeder selesai: kode_kabko sudah diisi untuk semua kantor.');
}

// Only run directly if this file is executed directly
if (require.main === module) {
  seedKodeKabkoOffice().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  // Export function for use by other scripts
  seedKodeKabkoOffice().catch((err) => {
    console.error('Seed kode kabko office failed:', err);
    throw err;
  });
} 