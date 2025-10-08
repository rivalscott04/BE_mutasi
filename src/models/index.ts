import db from '../utils/db';
import User from './User';
import Office from './Office';
import Pegawai from './Pegawai';
import Letter from './Letter';
import LetterFile from './LetterFile';
import Pengajuan from './Pengajuan';
import PengajuanFile from './PengajuanFile';
import JobTypeConfiguration from './JobTypeConfiguration';
import AdminWilayahFileConfig from './AdminWilayahFileConfig';
import Maintenance from './Maintenance';
import PengajuanAuditLog, { initPengajuanAuditLog } from './PengajuanAuditLog';

// Relasi User - Office
User.belongsTo(Office, { foreignKey: 'office_id', as: 'office' });
Office.hasMany(User, { foreignKey: 'office_id', as: 'users' });

// Relasi Pegawai - Office
Pegawai.belongsTo(Office, { foreignKey: 'kantor_id', as: 'office' });
Office.hasMany(Pegawai, { foreignKey: 'kantor_id', as: 'pegawai' });

// Relasi Letter - Office
Letter.belongsTo(Office, { foreignKey: 'office_id', as: 'office' });
Office.hasMany(Letter, { foreignKey: 'office_id', as: 'letters' });

// Relasi Letter - User (created_by)
Letter.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Letter, { foreignKey: 'created_by', as: 'letters' });

// Relasi Letter - Pegawai (recipient & signing)
Letter.belongsTo(Pegawai, { foreignKey: 'recipient_employee_nip', as: 'recipient', targetKey: 'nip' });
Letter.belongsTo(Pegawai, { foreignKey: 'signing_official_nip', as: 'signing_official', targetKey: 'nip' });
Pegawai.hasMany(Letter, { foreignKey: 'recipient_employee_nip', as: 'received_letters', sourceKey: 'nip' });
Pegawai.hasMany(Letter, { foreignKey: 'signing_official_nip', as: 'signed_letters', sourceKey: 'nip' });

// Relasi LetterFile - Letter
LetterFile.belongsTo(Letter, { foreignKey: 'letter_id', as: 'letter' });
Letter.hasMany(LetterFile, { foreignKey: 'letter_id', as: 'files', onDelete: 'CASCADE' });

// Relasi Pengajuan - Pegawai
Pengajuan.belongsTo(Pegawai, { foreignKey: 'pegawai_nip', as: 'pegawai', targetKey: 'nip' });
Pegawai.hasMany(Pengajuan, { foreignKey: 'pegawai_nip', as: 'pengajuan', sourceKey: 'nip' });

// Relasi Pengajuan - Office
Pengajuan.belongsTo(Office, { foreignKey: 'office_id', as: 'office' });
Office.hasMany(Pengajuan, { foreignKey: 'office_id', as: 'pengajuan' });

// Relasi PengajuanFile - Pengajuan
PengajuanFile.belongsTo(Pengajuan, { foreignKey: 'pengajuan_id', as: 'pengajuan' });
Pengajuan.hasMany(PengajuanFile, { foreignKey: 'pengajuan_id', as: 'files', onDelete: 'CASCADE' });

// Relasi AdminWilayahFileConfig - JobTypeConfiguration
AdminWilayahFileConfig.belongsTo(JobTypeConfiguration, { foreignKey: 'jenis_jabatan_id', as: 'jenis_jabatan' });
JobTypeConfiguration.hasMany(AdminWilayahFileConfig, { foreignKey: 'jenis_jabatan_id', as: 'admin_wilayah_files' });

// Relasi PengajuanFile - User (uploaded_by)
PengajuanFile.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
User.hasMany(PengajuanFile, { foreignKey: 'uploaded_by', as: 'uploaded_files' });

// Initialize models after all relations are set up
initPengajuanAuditLog(db);

// Relasi PengajuanAuditLog - Pengajuan (setelah model diinisialisasi)
PengajuanAuditLog.belongsTo(Pengajuan, { foreignKey: 'pengajuan_id', as: 'pengajuan' });
Pengajuan.hasMany(PengajuanAuditLog, { foreignKey: 'pengajuan_id', as: 'audit_logs', onDelete: 'CASCADE' });

// Relasi PengajuanAuditLog - User (changed_by)
PengajuanAuditLog.belongsTo(User, { foreignKey: 'changed_by', as: 'changer' });
User.hasMany(PengajuanAuditLog, { foreignKey: 'changed_by', as: 'audit_changes' });

// Note: Maintenance model tidak menggunakan foreign key constraint
// Referential integrity dihandle di application level

export { 
  db, 
  User, 
  Office, 
  Pegawai, 
  Letter, 
  LetterFile, 
  Pengajuan, 
  PengajuanFile, 
  JobTypeConfiguration,
  AdminWilayahFileConfig,
  Maintenance,
  PengajuanAuditLog
}; 