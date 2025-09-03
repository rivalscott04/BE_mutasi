import db from '../utils/db';

async function checkAdminWilayah() {
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');

    // Check table structure
    const [structureResults] = await db.query('DESCRIBE users');
    console.log('📋 Users table structure:');
    structureResults.forEach((row: any) => {
      console.log(`${row.Field} | ${row.Type} | ${row.Null} | ${row.Key} | ${row.Default}`);
    });

    console.log('\n🔍 Checking admin wilayah users...');
    
    // Check admin wilayah users
    const [userResults] = await db.query(`
      SELECT id, email, role, wilayah, office_id 
      FROM users 
      WHERE role = 'admin_wilayah' 
      LIMIT 5
    `);
    
    console.log('\n👥 Admin wilayah users found:', userResults.length);
    userResults.forEach((user: any) => {
      console.log(`- ${user.email} | Role: ${user.role} | Wilayah: ${user.wilayah || 'NULL'} | Office: ${user.office_id || 'NULL'}`);
    });

    await db.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await db.close();
    process.exit(1);
  }
}

checkAdminWilayah();
