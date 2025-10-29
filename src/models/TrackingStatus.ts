import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface TrackingStatusAttributes {
  id: number;
  status_name: string;
  status_code: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

type TrackingStatusCreationAttributes = Optional<TrackingStatusAttributes, 'id' | 'description' | 'is_active' | 'sort_order' | 'created_by' | 'created_at' | 'updated_at'>;

class TrackingStatus extends Model<TrackingStatusAttributes, TrackingStatusCreationAttributes> implements TrackingStatusAttributes {
  public id!: number;
  public status_name!: string;
  public status_code!: string;
  public description?: string;
  public is_active!: boolean;
  public sort_order!: number;
  public created_by?: string;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
}

TrackingStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
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
    tableName: 'tracking_status_master',
    timestamps: false,
  }
);

export default TrackingStatus;
