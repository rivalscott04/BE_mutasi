import db from '../utils/db';

async function simpleTestAdminWilayah() {
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');

    console.log('🔍 Testing Admin Wilayah Access...\n');

    // 1. Check admin wilayah users
    const [adminWilayahUsers] = await db.query(`
      SELECT u.id, u.email, u.role, u.office_id, o.name as office_name
      FROM users u
      LEFT JOIN offices o ON u.office_id = o.id
      WHERE u.role = 'admin_wilayah' 
      ORDER BY u.email
    `);
    
    console.log('👥 Admin Wilayah Users:');
    (adminWilayahUsers as any[]).forEach((user: any) => {
      console.log(`- ${user.email} | Office: ${user.office_name || 'NULL'} (${user.office_id || 'NULL'})`);
    });

    console.log('\n🔍 Checking Pengajuan Status...');
    
    // 2. Check pengajuan status distribution
    const [pengajuanStatus] = await db.query(`
      SELECT status, COUNT(*) as count
      FROM pengajuan
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('📊 Pengajuan Status Distribution:');
    (pengajuanStatus as any[]).forEach((status: any) => {
      console.log(`- ${status.status}: ${status.count}`);
    });

    // 3. Check pengajuan by office
    const [pengajuanByOffice] = await db.query(`
      SELECT o.name as office_name, o.kabkota, COUNT(*) as pengajuan_count
      FROM pengajuan p
      JOIN offices o ON p.office_id = o.id
      GROUP BY o.id, o.name, o.kabkota
      ORDER BY pengajuan_count DESC
    `);
    
    console.log('\n🏢 Pengajuan by Office:');
    (pengajuanByOffice as any[]).forEach((office: any) => {
      console.log(`- ${office.office_name} (${office.kabkota}): ${office.pengajuan_count} pengajuan`);
    });

    // 4. Test specific admin wilayah access (hardcoded office_id)
    const adminMataram = (adminWilayahUsers as any[]).find((u: any) => u.email === 'admin.mataram@kemenag.go.id');
    
    if (adminMataram && adminMataram.office_id) {
      console.log(`\n🔍 Testing Admin Mataram Access (Office ID: ${adminMataram.office_id})...`);
      
      const [mataramPengajuan] = await db.query(`
        SELECT p.id, p.status, p.jenis_jabatan, pe.nama as pegawai_nama, o.name as office_name
        FROM pengajuan p
        JOIN pegawai pe ON p.pegawai_nip = pe.nip
        JOIN offices o ON p.office_id = o.id
        WHERE p.office_id = '${adminMataram.office_id}'
        ORDER BY p.created_at DESC
        LIMIT 5
      `);
      
      console.log('📋 Pengajuan yang bisa diakses Admin Mataram:');
      (mataramPengajuan as any[]).forEach((p: any) => {
        console.log(`- ID: ${p.id} | Status: ${p.status} | Jabatan: ${p.jenis_jabatan} | Pegawai: ${p.pegawai_nama} | Office: ${p.office_name}`);
      });
    }

    await db.close();
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await db.close();
    process.exit(1);
  }
}

simpleTestAdminWilayah();
