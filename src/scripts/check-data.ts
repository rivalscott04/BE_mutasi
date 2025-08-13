import db from '../utils/db';

async function checkData() {
  try {
    console.log('🔍 Checking data in database...');
    
    // Check offices data
    console.log('\n📋 Offices data:');
    const [offices] = await db.query("SELECT id, name, kabkota FROM offices");
    console.log(offices);
    
    // Check users data
    console.log('\n👥 Users data:');
    const [users] = await db.query("SELECT id, email, full_name, role FROM users");
    console.log(users);
    
    // Check if admin user exists
    const adminExists = users.some((user: any) => user.email === 'admin@kemenag.go.id');
    if (adminExists) {
      console.log('✅ Admin user exists');
    } else {
      console.log('❌ Admin user NOT found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkData(); 