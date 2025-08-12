import User from '../models/User';
import { verifyPassword } from '../utils/password';
import db from '../utils/db';

async function testLogin() {
  try {
    console.log('Testing login logic...');
    await db.authenticate();
    
    // Test user credentials
    const testCredentials = [
      { email: 'admin@test.com', password: 'admin123' },
      { email: 'operator@test.com', password: 'operator123' },
    ];

    for (const cred of testCredentials) {
      console.log(`\nTesting login for: ${cred.email}`);
      
      // Find user
      const user = await User.findOne({ where: { email: cred.email } });
      if (!user) {
        console.log(`❌ User not found: ${cred.email}`);
        continue;
      }
      
      console.log(`✅ User found: ${user.email} (${user.role}) - Active: ${user.is_active}`);
      console.log(`Password hash: ${user.password_hash.substring(0, 20)}...`);
      
      // Test password verification
      const isValid = await verifyPassword(cred.password, user.password_hash);
      console.log(`Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (isValid) {
        console.log(`🎉 Login successful for ${cred.email}`);
      } else {
        console.log(`💥 Login failed for ${cred.email}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  }
}

testLogin();
