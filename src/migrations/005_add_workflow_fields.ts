import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add workflow fields to pengajuan table
  await queryInterface.addColumn('pengajuan', 'workflows', {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON field untuk tracking multiple workflows (admin_wilayah, verifikasi_pusat, dll)'
  });

  await queryInterface.addColumn('pengajuan', 'workflow_metadata', {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadata untuk tracking progress dan performance workflow'
  });

  // Add workflow tracking fields to pengajuan_files table
  await queryInterface.addColumn('pengajuan_files', 'file_category', {
    type: DataTypes.ENUM('kabupaten', 'admin_wilayah'),
    allowNull: false,
    defaultValue: 'kabupaten',
    comment: 'Kategori file: kabupaten atau admin_wilayah'
  });

  await queryInterface.addColumn('pengajuan_files', 'uploaded_by', {
    type: DataTypes.CHAR(36),
    allowNull: true,
    comment: 'UUID user yang upload file'
  });

  await queryInterface.addColumn('pengajuan_files', 'uploaded_by_role', {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'kabupaten',
    comment: 'Role user yang upload file'
  });

  await queryInterface.addColumn('pengajuan_files', 'uploaded_by_name', {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nama user yang upload file'
  });

  await queryInterface.addColumn('pengajuan_files', 'uploaded_by_office', {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Kantor/office user yang upload file'
  });

  // Create indexes for optimization
  await queryInterface.addIndex('pengajuan', ['workflows'], {
    name: 'idx_pengajuan_workflows',
    using: 'BTREE'
  });

  await queryInterface.addIndex('pengajuan_files', ['file_category'], {
    name: 'idx_pengajuan_files_file_category',
    using: 'BTREE'
  });

  await queryInterface.addIndex('pengajuan_files', ['uploaded_by'], {
    name: 'idx_pengajuan_files_uploaded_by',
    using: 'BTREE'
  });

  await queryInterface.addIndex('pengajuan_files', ['uploaded_by_role'], {
    name: 'idx_pengajuan_files_uploaded_by_role',
    using: 'BTREE'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove indexes
  await queryInterface.removeIndex('pengajuan', 'idx_pengajuan_workflows');
  await queryInterface.removeIndex('pengajuan_files', 'idx_pengajuan_files_file_category');
  await queryInterface.removeIndex('pengajuan_files', 'idx_pengajuan_files_uploaded_by');
  await queryInterface.removeIndex('pengajuan_files', 'idx_pengajuan_files_uploaded_by_role');

  // Remove columns from pengajuan_files
  await queryInterface.removeColumn('pengajuan_files', 'uploaded_by_office');
  await queryInterface.removeColumn('pengajuan_files', 'uploaded_by_name');
  await queryInterface.removeColumn('pengajuan_files', 'uploaded_by_role');
  await queryInterface.removeColumn('pengajuan_files', 'uploaded_by');
  await queryInterface.removeColumn('pengajuan_files', 'file_category');

  // Remove columns from pengajuan
  await queryInterface.removeColumn('pengajuan', 'workflow_metadata');
  await queryInterface.removeColumn('pengajuan', 'workflows');
}
