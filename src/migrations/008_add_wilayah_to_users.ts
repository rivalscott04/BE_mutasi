import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // Add wilayah column to users table
  await queryInterface.addColumn('users', 'wilayah', {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Wilayah coverage for admin_wilayah role (e.g., "Lombok Barat", "Sumbawa")'
  });
}

export async function down(queryInterface: QueryInterface) {
  // Remove wilayah column from users table
  await queryInterface.removeColumn('users', 'wilayah');
}
