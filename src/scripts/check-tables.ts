import db from '../utils/db';

async function checkTables() {
  try {
    console.log('🔍 Checking tables in database...');
    
    // Get all tables
    const [tables] = await db.query("SHOW TABLES");
    console.log('Tables found:', tables);
    
    // Check if offices table exists
    const tableNames = tables.map((table: any) => Object.values(table)[0]);
    console.log('Table names:', tableNames);
    
    if (tableNames.includes('offices')) {
      console.log('✅ Offices table exists');
    } else {
      console.log('❌ Offices table NOT found');
    }
    
    // Check structure of each table
    for (const tableName of tableNames) {
      console.log(`\n📋 Structure of table: ${tableName}`);
      const [columns] = await db.query(`DESCRIBE ${tableName}`);
      console.log(columns);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkTables();
