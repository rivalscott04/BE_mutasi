import { hashPassword } from '../utils/password';
import User from '../models/User';
import db from '../utils/db';

async function seedSimpleUsers() {
  try {
    console.log('Connecting to database...');
    await db.authenticate();
    console.log('Database connected successfully');
    
    console.log('Syncing database...');
    await db.sync({ force: false });
    console.log('Database synced');

    // Clear existing users first
    console.log('Clearing existing users...');
    await User.destroy({ where: {} });
    console.log('Existing users cleared');

    const users = [
      {
        email: 'admin@test.com',
        password: 'admin123',
        full_name: 'Admin Test',
        role: 'admin' as const,
      },
      {
        email: 'operator@test.com',
        password: 'operator123',
        full_name: 'Operator Test',
        role: 'operator' as const,
      },
    ];

    console.log('Creating users...');
    for (const u of users) {
      console.log(`Creating user: ${u.email}`);
      const password_hash = await hashPassword(u.password);
      console.log(`Password hashed: ${password_hash.substring(0, 20)}...`);
      
      const user = await User.create({
        email: u.email,
        password_hash,
        full_name: u.full_name,
        role: u.role,
        is_active: true,
      });
      
      console.log(`User created: ${user.email} with ID: ${user.id}`);
    }

    // Verify users were created
    console.log('Verifying users...');
    const allUsers = await User.findAll();
    console.log(`Total users in database: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.is_active}`);
    });

    console.log('Seeder selesai: Users berhasil dibuat.');
    process.exit(0);
  } catch (error) {
    console.error('Error in seeder:', error);
    process.exit(1);
  }
}

seedSimpleUsers();
