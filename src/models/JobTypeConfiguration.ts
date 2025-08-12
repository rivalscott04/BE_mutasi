import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface JobTypeConfigurationAttributes {
  id: number;
  jenis_jabatan: string;
  min_dokumen: number;
  max_dokumen: number;
  required_files: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface JobTypeConfigurationCreationAttributes extends Optional<JobTypeConfigurationAttributes, 'id' | 'created_at' | 'updated_at'> {}

class JobTypeConfiguration extends Model<JobTypeConfigurationAttributes, JobTypeConfigurationCreationAttributes> implements JobTypeConfigurationAttributes {
  public id!: number;
  public jenis_jabatan!: string;
  public min_dokumen!: number;
  public max_dokumen!: number;
  public required_files!: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

JobTypeConfiguration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jenis_jabatan: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    min_dokumen: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    max_dokumen: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    required_files: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
                    is_active: {
                  type: DataTypes.BOOLEAN,
                  allowNull: false,
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
    tableName: 'job_type_configuration',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default JobTypeConfiguration; 