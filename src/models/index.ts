import db from '../utils/db';
import User from './User';
import Office from './Office';
import Pegawai from './Pegawai';
import Letter from './Letter';
import LetterFile from './LetterFile';

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

export { db, User, Office, Pegawai, Letter, LetterFile }; 