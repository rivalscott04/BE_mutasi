import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface AdminWilayahFileConfigAttributes {
  id: number;
  jenis_jabatan_id: number;
  file_type: string;
  display_name: string;
  is_required: boolean;
  description?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type AdminWilayahFileConfigCreationAttributes = Optional<AdminWilayahFileConfigAttributes, 'id' | 'is_required' | 'is_active' | 'created_at' | 'updated_at'>;

class AdminWilayahFileConfig extends Model<AdminWilayahFileConfigAttributes, AdminWilayahFileConfigCreationAttributes> implements AdminWilayahFileConfigAttributes {
  public id!: number;
  public jenis_jabatan_id!: number;
  public file_type!: string;
  public display_name!: string;
  public is_required!: boolean;
  public description?: string;
  public is_active!: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}

AdminWilayahFileConfig.init({
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
    onDelete: 'CASCADE'
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
}, {
  sequelize: db,
  tableName: 'admin_wilayah_file_configuration',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default AdminWilayahFileConfig;
