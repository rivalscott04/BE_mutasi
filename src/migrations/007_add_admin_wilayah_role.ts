import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // Add admin_wilayah role to the ENUM
  await queryInterface.sequelize.query(`
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('admin', 'operator', 'user', 'admin_wilayah') NOT NULL;
  `);
}

export async function down(queryInterface: QueryInterface) {
  // Remove admin_wilayah role from the ENUM
  await queryInterface.sequelize.query(`
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('admin', 'operator', 'user') NOT NULL;
  `);
}
