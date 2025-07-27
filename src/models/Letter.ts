import { DataTypes, Model, Optional } from 'sequelize';
import db from '../utils/db';
import Pegawai from './Pegawai';

interface LetterAttributes {
  id: string;
  office_id: string;
  created_by: string;
  template_id: number;
  template_name: string;
  letter_number: string;
  subject: string;
  recipient_employee_nip: string;
  signing_official_nip: string;
  form_data: object;
  status?: 'draft' | 'generated' | 'signed';
  created_at?: Date;
  updated_at?: Date;
  files?: any[];
}

type LetterCreationAttributes = Optional<LetterAttributes, 'id' | 'status' | 'created_at' | 'updated_at'>;

class Letter extends Model<LetterAttributes, LetterCreationAttributes> implements LetterAttributes {
  public id!: string;
  public office_id!: string;
  public created_by!: string;
  public template_id!: number;
  public template_name!: string;
  public letter_number!: string;
  public subject!: string;
  public recipient_employee_nip!: string;
  public signing_official_nip!: string;
  public form_data!: object;
  public status?: 'draft' | 'generated' | 'signed';
  public created_at?: Date;
  public updated_at?: Date;
  public files?: any[];
}

Letter.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    office_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    template_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    letter_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    subject: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    recipient_employee_nip: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    signing_official_nip: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    form_data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'signed'),
      defaultValue: 'draft',
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
    tableName: 'letters',
    timestamps: false,
  }
);

export default Letter; 