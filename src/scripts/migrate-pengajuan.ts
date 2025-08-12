import { db } from '../models';

(async () => {
  try {
    await db.authenticate();
    console.log('Database connection established.');

    // MIGRATION: Add pengajuan tables safely
    console.log('🔄 Running pengajuan migration...');

    // Create pengajuan table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS pengajuan (
        id CHAR(36) PRIMARY KEY,
        pegawai_nip VARCHAR(20),
        total_dokumen INTEGER NOT NULL,
        jenis_jabatan VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'resubmitted')),
        catatan TEXT,
        rejection_reason TEXT,
        rejected_by VARCHAR(20),
        rejected_at TIMESTAMP,
        created_by VARCHAR(20) NOT NULL,
        office_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pegawai_nip) REFERENCES pegawai(nip)
      );
    `);

    // Create pengajuan_files table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS pengajuan_files (
        id CHAR(36) PRIMARY KEY,
        pengajuan_id CHAR(36),
        file_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER NOT NULL,
        upload_status VARCHAR(20) DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'verified', 'rejected')),
        verification_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(id) ON DELETE CASCADE
      );
    `);

    // Create job_type_configurations table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS job_type_configurations (
        id CHAR(36) PRIMARY KEY,
        jenis_jabatan VARCHAR(50) UNIQUE NOT NULL,
        total_dokumen INTEGER NOT NULL,
        required_files JSON NOT NULL,
        jabatan_patterns TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_pengajuan_pegawai_nip ON pengajuan(pegawai_nip);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan(status);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_pengajuan_files_pengajuan_id ON pengajuan_files(pengajuan_id);');
    await db.query('CREATE INDEX IF NOT EXISTS idx_job_type_config_active ON job_type_configurations(is_active);');

    // Insert default job type configurations if not exists
    await db.query(`
      INSERT IGNORE INTO job_type_configurations (id, jenis_jabatan, total_dokumen, required_files, jabatan_patterns) VALUES
      (UUID(), 'guru', 9, '["sk_cpns", "sk_pns", "sk_pangkat", "ijazah", "sertifikat", "sk_jabatan", "skp", "surat_pernyataan", "foto"]', '["guru", "pendidik"]'),
      (UUID(), 'eselon_iv', 7, '["sk_cpns", "sk_pns", "sk_pangkat", "ijazah", "sk_jabatan", "skp", "surat_pernyataan"]', '["eselon iv", "kepala", "kabid", "kasi"]'),
      (UUID(), 'fungsional', 7, '["sk_cpns", "sk_pns", "sk_pangkat", "ijazah", "sk_jabatan", "skp", "surat_pernyataan"]', '["fungsional", "analis", "penyuluh", "pengawas"]'),
      (UUID(), 'pelaksana', 6, '["sk_pns", "sk_pangkat", "ijazah", "sk_jabatan", "skp", "surat_pernyataan"]', '["pelaksana", "staff", "operator", "admin"]');
    `);

    console.log('✅ Pengajuan migration completed successfully!');
    console.log('📋 Tables created: pengajuan, pengajuan_files, job_type_configurations');
    console.log('🔗 Indexes created for performance');
    console.log('⚙️  Default job type configurations inserted');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})(); 