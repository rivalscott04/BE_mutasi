import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';

interface LetterFileAttributes {
  id: string;
  letter_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  file_hash: string;
  created_at?: Date;
}

type LetterFileCreationAttributes = Optional<LetterFileAttributes, 'id' | 'mime_type' | 'created_at'>;

class LetterFile extends Model<LetterFileAttributes, LetterFileCreationAttributes> implements LetterFileAttributes {
  public id!: string;
  public letter_id!: string;
  public file_name!: string;
  public file_path!: string;
  public file_size!: number;
  public mime_type?: string;
  public file_hash!: string;
  public created_at?: Date;
}

LetterFile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    letter_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      defaultValue: 'application/pdf',
    },
    file_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db,
    tableName: 'letter_files',
    timestamps: false,
  }
);

export default LetterFile; 