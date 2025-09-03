import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create admin_wilayah_file_configuration table
  await queryInterface.createTable('admin_wilayah_file_configuration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    jenis_jabatan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'job_type_configuration',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Foreign key ke job_type_configuration'
    },
    file_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Identifier unik untuk tipe file (e.g., surat_rekomendasi_kanwil)'
    },
    display_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nama yang ditampilkan di UI (e.g., Surat Rekomendasi Kanwil)'
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Apakah file ini wajib diupload'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Deskripsi detail file yang dibutuhkan'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Status aktif/nonaktif file configuration'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Create indexes for optimization
  await queryInterface.addIndex('admin_wilayah_file_configuration', ['jenis_jabatan_id'], {
    name: 'idx_admin_wilayah_file_config_jenis_jabatan',
    using: 'BTREE'
  });

  await queryInterface.addIndex('admin_wilayah_file_configuration', ['file_type'], {
    name: 'idx_admin_wilayah_file_config_file_type',
    using: 'BTREE'
  });

  await queryInterface.addIndex('admin_wilayah_file_configuration', ['is_active'], {
    name: 'idx_admin_wilayah_file_config_is_active',
    using: 'BTREE'
  });

  // Add unique constraint untuk kombinasi jenis_jabatan_id dan file_type
  await queryInterface.addIndex('admin_wilayah_file_configuration', ['jenis_jabatan_id', 'file_type'], {
    name: 'idx_admin_wilayah_file_config_unique',
    unique: true,
    using: 'BTREE'
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop table
  await queryInterface.dropTable('admin_wilayah_file_configuration');
}
