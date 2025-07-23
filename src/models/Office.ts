import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface OfficeAttributes {
  id: string;
  name: string;
  kabkota: string;
  address: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  created_at?: Date;
  updated_at?: Date;
}

type OfficeCreationAttributes = Optional<OfficeAttributes, 'id' | 'phone' | 'fax' | 'email' | 'website' | 'created_at' | 'updated_at'>;

class Office extends Model<OfficeAttributes, OfficeCreationAttributes> implements OfficeAttributes {
  public id!: string;
  public name!: string;
  public kabkota!: string;
  public address!: string;
  public phone?: string;
  public fax?: string;
  public email?: string;
  public website?: string;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
}

Office.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    kabkota: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    fax: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
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
    tableName: 'offices',
    timestamps: false,
  }
);

export default Office; 