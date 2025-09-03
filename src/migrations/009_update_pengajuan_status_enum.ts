import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.sequelize.query(`
    ALTER TABLE pengajuan
    MODIFY COLUMN status ENUM('draft', 'submitted', 'approved', 'rejected', 'resubmitted', 'admin_wilayah_approved', 'admin_wilayah_rejected') NOT NULL DEFAULT 'draft';
  `);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.sequelize.query(`
    ALTER TABLE pengajuan
    MODIFY COLUMN status ENUM('draft', 'submitted', 'approved', 'rejected', 'resubmitted') NOT NULL DEFAULT 'draft';
  `);
}
