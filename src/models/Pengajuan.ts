import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface PengajuanAttributes {
  id: string;
  pegawai_nip: string;
  total_dokumen: number;
  jenis_jabatan: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'resubmitted';
  catatan?: string;
  rejection_reason?: string;
  rejected_by?: string;
  rejected_at?: Date;
  approved_by?: string;
  approved_at?: Date;
  resubmitted_by?: string;
  resubmitted_at?: Date;
  created_by: string;
  office_id: string;
  created_at?: Date;
  updated_at?: Date;
}

type PengajuanCreationAttributes = Optional<PengajuanAttributes, 'id' | 'status' | 'catatan' | 'rejection_reason' | 'rejected_by' | 'rejected_at' | 'approved_by' | 'approved_at' | 'resubmitted_by' | 'resubmitted_at' | 'created_at' | 'updated_at'>;

class Pengajuan extends Model<PengajuanAttributes, PengajuanCreationAttributes> implements PengajuanAttributes {
  public id!: string;
  public pegawai_nip!: string;
  public total_dokumen!: number;
  public jenis_jabatan!: string;
  public status!: 'draft' | 'submitted' | 'approved' | 'rejected' | 'resubmitted';
  public catatan?: string;
  public rejection_reason?: string;
  public rejected_by?: string;
  public rejected_at?: Date;
  public approved_by?: string;
  public approved_at?: Date;
  public resubmitted_by?: string;
  public resubmitted_at?: Date;
  public created_by!: string;
  public office_id!: string;
  public created_at?: Date;
  public updated_at?: Date;
}

Pengajuan.init({
  id: { 
    type: DataTypes.CHAR(36), 
    primaryKey: true, 
    defaultValue: DataTypes.UUIDV4 
  },
  pegawai_nip: { 
    type: DataTypes.STRING(20), 
    allowNull: false 
  },
  total_dokumen: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  jenis_jabatan: { 
    type: DataTypes.STRING(50), 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'resubmitted'), 
    defaultValue: 'draft' 
  },
  catatan: { 
    type: DataTypes.TEXT 
  },
  rejection_reason: { 
    type: DataTypes.TEXT 
  },
  rejected_by: { 
    type: DataTypes.STRING(20) 
  },
  rejected_at: { 
    type: DataTypes.DATE 
  },
  approved_by: { 
    type: DataTypes.STRING(255) 
  },
  approved_at: { 
    type: DataTypes.DATE 
  },
  resubmitted_by: { 
    type: DataTypes.STRING(255) 
  },
  resubmitted_at: { 
    type: DataTypes.DATE 
  },
  created_by: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  office_id: { 
    type: DataTypes.CHAR(36), 
    allowNull: false 
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize: db,
  tableName: 'pengajuan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Pengajuan; 