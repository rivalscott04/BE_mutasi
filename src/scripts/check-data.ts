import { db, User, Office, Pegawai, Letter } from '../models';

(async () => {
  try {
    await db.authenticate();
    console.log('Database connection established.');

    // Check users
    const userCount = await User.count();
    console.log(`Users: ${userCount}`);

    // Check offices
    const officeCount = await Office.count();
    console.log(`Offices: ${officeCount}`);

    // Check pegawai
    const pegawaiCount = await Pegawai.count();
    console.log(`Pegawai: ${pegawaiCount}`);

    // Check letters
    const letterCount = await Letter.count();
    console.log(`Letters: ${letterCount}`);

    // Show some sample users
    const users = await User.findAll({ limit: 3 });
    console.log('\nSample users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error checking data:', err);
    process.exit(1);
  }
})(); 