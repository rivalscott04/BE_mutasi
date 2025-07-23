import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface PegawaiAttributes {
  nip: string;
  nama: string;
  golongan?: string;
  tmt_pensiun?: Date;
  unit_kerja?: string;
  induk_unit?: string;
  jabatan?: string;
  id?: string;
  kantor_id?: string;
  jenis_pegawai?: 'pegawai' | 'pejabat';
  aktif?: boolean;
  dibuat_pada?: Date;
  diubah_pada?: Date;
}

type PegawaiCreationAttributes = Optional<PegawaiAttributes, 'golongan' | 'tmt_pensiun' | 'unit_kerja' | 'induk_unit' | 'jabatan' | 'id' | 'kantor_id' | 'jenis_pegawai' | 'aktif' | 'dibuat_pada' | 'diubah_pada'>;

class Pegawai extends Model<PegawaiAttributes, PegawaiCreationAttributes> implements PegawaiAttributes {
  public nip!: string;
  public nama!: string;
  public golongan?: string;
  public tmt_pensiun?: Date;
  public unit_kerja?: string;
  public induk_unit?: string;
  public jabatan?: string;
  public id?: string;
  public kantor_id?: string;
  public jenis_pegawai?: 'pegawai' | 'pejabat';
  public aktif?: boolean;
  public dibuat_pada?: Date;
  public diubah_pada?: Date;
}

Pegawai.init(
  {
    nip: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    nama: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    golongan: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    tmt_pensiun: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unit_kerja: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    induk_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    jabatan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },
    kantor_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    jenis_pegawai: {
      type: DataTypes.ENUM('pegawai', 'pejabat'),
      defaultValue: 'pegawai',
    },
    aktif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    dibuat_pada: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    diubah_pada: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db,
    tableName: 'pegawai',
    timestamps: false,
  }
);

export default Pegawai; 