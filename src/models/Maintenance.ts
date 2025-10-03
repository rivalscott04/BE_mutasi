import { DataTypes, Model } from 'sequelize';
import db from '../utils/db';

class Maintenance extends Model {
  public id!: string;
  public isActive!: boolean;
  public message!: string | null;
  public startTime!: Date | null;
  public endTime!: Date | null;
  public createdBy!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Maintenance.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  sequelize: db,
  modelName: 'Maintenance',
  tableName: 'maintenance',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default Maintenance;
