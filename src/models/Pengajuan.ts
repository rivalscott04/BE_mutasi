import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface WorkflowStatus {
  status: 'pending' | 'uploading' | 'reviewing' | 'completed' | 'rejected';
  version: string;
  started_at: Date;
  completed_at?: Date;
  assigned_to?: string;
  notes?: string;
}

interface WorkflowMetadata {
  current_stage: string;
  total_stages: number;
  completed_stages: number;
  estimated_completion?: Date;
  last_updated: Date;
}

interface Workflows {
  admin_wilayah?: WorkflowStatus;
  [key: string]: WorkflowStatus | undefined;
}

interface PengajuanAttributes {
  id: string;
  pegawai_nip: string;
  total_dokumen: number;
  jenis_jabatan: string;
  jabatan_id?: number;
   status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'resubmitted' | 'admin_wilayah_approved' | 'admin_wilayah_rejected' | 'final_approved' | 'final_rejected';
  catatan?: string;
  rejection_reason?: string;
  rejected_by?: string;
  rejected_at?: Date;
  approved_by?: string;
  approved_at?: Date;
  resubmitted_by?: string;
  resubmitted_at?: Date;
  final_approved_by?: string;
  final_approved_at?: Date;
  final_rejected_by?: string;
  final_rejected_at?: Date;
  final_rejection_reason?: string;
  created_by: string;
  office_id: string;
  created_at?: Date;
  updated_at?: Date;
  
  // New workflow fields
  workflows?: Workflows;
  workflow_metadata?: WorkflowMetadata;
}

type PengajuanCreationAttributes = Optional<PengajuanAttributes, 'id' | 'status' | 'catatan' | 'rejection_reason' | 'rejected_by' | 'rejected_at' | 'approved_by' | 'approved_at' | 'resubmitted_by' | 'resubmitted_at' | 'created_at' | 'updated_at' | 'workflows' | 'workflow_metadata'>;

class Pengajuan extends Model<PengajuanAttributes, PengajuanCreationAttributes> implements PengajuanAttributes {
  public id!: string;
  public pegawai_nip!: string;
  public total_dokumen!: number;
  public jenis_jabatan!: string;
  public jabatan_id?: number;
  public status!: 'draft' | 'submitted' | 'approved' | 'rejected' | 'resubmitted' | 'admin_wilayah_approved' | 'admin_wilayah_rejected' | 'final_approved' | 'final_rejected';
  public catatan?: string;
  public rejection_reason?: string;
  public rejected_by?: string;
  public rejected_at?: Date;
  public approved_by?: string;
  public approved_at?: Date;
  public resubmitted_by?: string;
  public resubmitted_at?: Date;
  public final_approved_by?: string;
  public final_approved_at?: Date;
  public final_rejected_by?: string;
  public final_rejected_at?: Date;
  public final_rejection_reason?: string;
  public created_by!: string;
  public office_id!: string;
  public created_at?: Date;
  public updated_at?: Date;
  
  // New workflow fields
  public workflows?: Workflows;
  public workflow_metadata?: WorkflowMetadata;
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
  jabatan_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  status: { 
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'resubmitted', 'admin_wilayah_approved', 'admin_wilayah_rejected', 'final_approved', 'final_rejected'), 
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
  },
  // New workflow fields
  workflows: {
    type: DataTypes.JSON,
    allowNull: true
  },
  workflow_metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  sequelize: db,
  tableName: 'pengajuan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Pengajuan;
export type { WorkflowStatus, WorkflowMetadata, Workflows }; 