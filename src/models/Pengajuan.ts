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
  jabatan_id?: number | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'resubmitted' | 'admin_wilayah_approved' | 'admin_wilayah_rejected' | 'admin_wilayah_submitted' | 'kanwil_submitted' | 'kanwil_approved' | 'final_approved' | 'final_rejected';
  catatan?: string | null;
  rejection_reason?: string | null;
  rejected_by?: string | null;
  rejected_at?: Date | null;
  approved_by?: string | null;
  approved_at?: Date | null;
  resubmitted_by?: string | null;
  resubmitted_at?: Date | null;
  final_approved_by?: string | null;
  final_approved_at?: Date | null;
  final_rejected_by?: string | null;
  final_rejected_at?: Date | null;
  final_rejection_reason?: string | null;
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
  public jabatan_id?: number | null;
  public status!: 'draft' | 'submitted' | 'approved' | 'rejected' | 'resubmitted' | 'admin_wilayah_approved' | 'admin_wilayah_rejected' | 'admin_wilayah_submitted' | 'final_approved' | 'final_rejected';
  public catatan?: string | null;
  public rejection_reason?: string | null;
  public rejected_by?: string | null;
  public rejected_at?: Date | null;
  public approved_by?: string | null;
  public approved_at?: Date | null;
  public resubmitted_by?: string | null;
  public resubmitted_at?: Date | null;
  public final_approved_by?: string | null;
  public final_approved_at?: Date | null;
  public final_rejected_by?: string | null;
  public final_rejected_at?: Date | null;
  public final_rejection_reason?: string | null;
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
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'resubmitted', 'admin_wilayah_approved', 'admin_wilayah_rejected', 'admin_wilayah_submitted', 'kanwil_submitted', 'kanwil_approved', 'final_approved', 'final_rejected'), 
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