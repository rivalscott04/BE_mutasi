import db from '../utils/db';

async function simpleUpdateAdminWilayah() {
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');

    console.log('🔧 Updating admin wilayah users with office_id...');
    
    // All 10 kabupaten/kota in NTB
    const updates = [
      { email: 'admin.mataram@kemenag.go.id', office_id: '11111111-1111-1111-1111-111111111111' }, // KOTA MATARAM
      { email: 'admin.wilayah.lombok.barat@kemenag.go.id', office_id: '22222222-2222-2222-2222-222222222222' }, // KABUPATEN LOMBOK BARAT
      { email: 'admin.wilayah.lombok.timur@kemenag.go.id', office_id: '33333333-3333-3333-3333-333333333333' }, // KABUPATEN LOMBOK TIMUR
      { email: 'admin.wilayah.lombok.tengah@kemenag.go.id', office_id: '44444444-4444-4444-4444-444444444444' }, // KABUPATEN LOMBOK TENGAH
      { email: 'admin.wilayah.lombok.utara@kemenag.go.id', office_id: '55555555-5555-5555-5555-555555555555' }, // KABUPATEN LOMBOK UTARA
      { email: 'admin.wilayah.sumbawa@kemenag.go.id', office_id: '66666666-6666-6666-6666-666666666666' }, // KABUPATEN SUMBAWA
      { email: 'admin.wilayah.sumbawa.barat@kemenag.go.id', office_id: '77777777-7777-7777-7777-777777777777' }, // KABUPATEN SUMBAWA BARAT
      { email: 'admin.wilayah.bima@kemenag.go.id', office_id: '88888888-8888-8888-8888-888888888888' }, // KOTA BIMA
      { email: 'admin.wilayah.dompu@kemenag.go.id', office_id: '99999999-9999-9999-9999-999999999999' }, // KABUPATEN DOMPU
      { email: 'admin.wilayah.bima.kabupaten@kemenag.go.id', office_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } // KABUPATEN BIMA
    ];

    for (const update of updates) {
      await db.query(`
        UPDATE users 
        SET office_id = '${update.office_id}' 
        WHERE email = '${update.email}' AND role = 'admin_wilayah'
      `);
      
      console.log(`✅ Updated ${update.email} with office_id: ${update.office_id}`);
    }

    console.log('\n🔍 Verifying updates...');
    
    // Check updated users
    const [userResults] = await db.query(`
      SELECT u.id, u.email, u.role, u.office_id, o.name as office_name
      FROM users u
      LEFT JOIN offices o ON u.office_id = o.id
      WHERE u.role = 'admin_wilayah' 
      ORDER BY u.email
    `);
    
    console.log('\n👥 Admin wilayah users after update:');
    (userResults as any[]).forEach((user: any) => {
      console.log(`- ${user.email} | Role: ${user.role} | Office: ${user.office_name || 'NULL'} (${user.office_id || 'NULL'})`);
    });

    await db.close();
    console.log('\n🎉 Update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await db.close();
    process.exit(1);
  }
}

simpleUpdateAdminWilayah();
