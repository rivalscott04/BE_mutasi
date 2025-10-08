import { Model, DataTypes, Sequelize } from 'sequelize';

interface PengajuanAuditLogAttributes {
  id: string;
  pengajuan_id: string;
  action: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  changed_by: string;
  changed_by_name: string;
  changed_at: Date;
}

interface PengajuanAuditLogCreationAttributes extends Omit<PengajuanAuditLogAttributes, 'changed_at'> {
  id: string;
}

class PengajuanAuditLog extends Model<PengajuanAuditLogAttributes, PengajuanAuditLogCreationAttributes> implements PengajuanAuditLogAttributes {
  public id!: string;
  public pengajuan_id!: string;
  public action!: string;
  public field_name!: string;
  public old_value?: string;
  public new_value?: string;
  public reason?: string;
  public changed_by!: string;
  public changed_by_name!: string;
  public changed_at!: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initPengajuanAuditLog = (sequelize: Sequelize) => {
  PengajuanAuditLog.init({
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false
    },
    pengajuan_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'pengajuan',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    field_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    old_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    new_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    changed_by: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    changed_by_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'pengajuan_audit_log',
    timestamps: false,
    indexes: [
      {
        fields: ['pengajuan_id']
      },
      {
        fields: ['changed_by']
      },
      {
        fields: ['changed_at']
      },
      {
        fields: ['action']
      },
      {
        fields: ['pengajuan_id', 'changed_at']
      }
    ]
  });
};

export default PengajuanAuditLog;
