import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface UserAttributes {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'operator' | 'user';
  office_id?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'office_id' | 'is_active' | 'created_at' | 'updated_at'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password_hash!: string;
  public full_name!: string;
  public role!: 'admin' | 'operator' | 'user';
  public office_id?: string;
  public is_active!: boolean;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'operator', 'user'),
      allowNull: false,
    },
    office_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'users',
    timestamps: false,
  }
);

export default User; 