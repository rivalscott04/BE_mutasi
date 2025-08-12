import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface PengajuanFileAttributes {
  id: string;
  pengajuan_id: string;
  file_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  upload_status: 'uploaded' | 'verified' | 'rejected';
  verification_notes?: string;
  created_at?: Date;
}

type PengajuanFileCreationAttributes = Optional<PengajuanFileAttributes, 'id' | 'upload_status' | 'verification_notes' | 'created_at'>;

class PengajuanFile extends Model<PengajuanFileAttributes, PengajuanFileCreationAttributes> implements PengajuanFileAttributes {
  public id!: string;
  public pengajuan_id!: string;
  public file_type!: string;
  public file_name!: string;
  public file_path!: string;
  public file_size!: number;
  public upload_status!: 'uploaded' | 'verified' | 'rejected';
  public verification_notes?: string;
  public created_at?: Date;
}

PengajuanFile.init({
  id: { 
    type: DataTypes.CHAR(36), 
    primaryKey: true, 
    defaultValue: DataTypes.UUIDV4 
  },
  pengajuan_id: { 
    type: DataTypes.CHAR(36), 
    allowNull: false 
  },
  file_type: { 
    type: DataTypes.STRING(100), 
    allowNull: false 
  },
  file_name: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  file_path: { 
    type: DataTypes.STRING(500), 
    allowNull: false 
  },
  file_size: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  upload_status: { 
    type: DataTypes.ENUM('uploaded', 'verified', 'rejected'), 
    defaultValue: 'uploaded' 
  },
  verification_notes: { 
    type: DataTypes.TEXT 
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize: db,
  tableName: 'pengajuan_files',
  timestamps: false
});

export default PengajuanFile; 