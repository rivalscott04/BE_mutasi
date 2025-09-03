import db from '../utils/db';

async function updateAdminWilayahOffice() {
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');

    console.log('🔧 Linking admin wilayah users to their office_id...');
    
    // Map admin wilayah to their office_id based on existing offices
    const adminWilayahMapping = [
      { email: 'admin.mataram@kemenag.go.id', office_name: 'KOTA MATARAM' },
      { email: 'admin.wilayah.lombok.barat@kemenag.go.id', office_name: 'KABUPATEN LOMBOK BARAT' },
      { email: 'admin.wilayah.lombok.timur@kemenag.go.id', office_name: 'KABUPATEN LOMBOK TIMUR' },
      { email: 'admin.wilayah.lombok.tengah@kemenag.go.id', office_name: 'KABUPATEN LOMBOK TENGAH' },
      { email: 'admin.wilayah.lombok.utara@kemenag.go.id', office_name: 'KABUPATEN LOMBOK UTARA' },
      { email: 'admin.wilayah.sumbawa@kemenag.go.id', office_name: 'KABUPATEN SUMBAWA' },
      { email: 'admin.wilayah.sumbawa.barat@kemenag.go.id', office_name: 'KABUPATEN SUMBAWA BARAT' },
      { email: 'admin.wilayah.bima@kemenag.go.id', office_name: 'KOTA BIMA' }
    ];

    for (const mapping of adminWilayahMapping) {
      // Find office by name
      const [officeResults] = await db.query(`
        SELECT id FROM offices WHERE name LIKE ?
      `, {
        bind: [`%${mapping.office_name}%`]
      });
      
      if (officeResults && (officeResults as any[]).length > 0) {
        const officeId = (officeResults as any[])[0].id;
        
        // Update user with office_id
        await db.query(`
          UPDATE users 
          SET office_id = ? 
          WHERE email = ? AND role = 'admin_wilayah'
        `, {
          bind: [officeId, mapping.email]
        });
        
        console.log(`✅ Linked ${mapping.email} to office: ${mapping.office_name} (${officeId})`);
      } else {
        console.log(`❌ Office not found for: ${mapping.office_name}`);
      }
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

updateAdminWilayahOffice();
