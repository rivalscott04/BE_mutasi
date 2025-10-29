import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface PengajuanTrackingAttributes {
  id: string;
  pengajuan_id: string;
  tracking_status_id: number;
  status_name: string;
  notes?: string;
  estimated_days?: number;
  actual_completion_date?: Date;
  tracked_by: string;
  tracked_by_name: string;
  created_at?: Date;
  updated_at?: Date;
}

type PengajuanTrackingCreationAttributes = Optional<PengajuanTrackingAttributes, 'id' | 'notes' | 'estimated_days' | 'actual_completion_date' | 'created_at' | 'updated_at'>;

class PengajuanTracking extends Model<PengajuanTrackingAttributes, PengajuanTrackingCreationAttributes> implements PengajuanTrackingAttributes {
  public id!: string;
  public pengajuan_id!: string;
  public tracking_status_id!: number;
  public status_name!: string;
  public notes?: string;
  public estimated_days?: number;
  public actual_completion_date?: Date;
  public tracked_by!: string;
  public tracked_by_name!: string;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
}

PengajuanTracking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pengajuan_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tracking_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimated_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actual_completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tracked_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tracked_by_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db,
    tableName: 'pengajuan_tracking',
    timestamps: false,
  }
);

export default PengajuanTracking;
