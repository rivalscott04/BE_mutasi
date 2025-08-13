# Database Migration Guide

## Overview
This document explains how to set up and manage the database for the AMUT (Aplikasi Mutasi) system.

## Database Structure

### Tables
- **offices** - Kantor-kantor Kementerian Agama
- **users** - User sistem (admin, staff, dll)
- **pegawai** - Data pegawai
- **letters** - Surat-surat yang dibuat
- **pengajuan** - Pengajuan mutasi
- **pengajuan_files** - File-file pengajuan
- **job_type_configuration** - Konfigurasi jenis jabatan

### Foreign Key Relationships
- `users.office_id` → `offices.id`
- `pegawai.office_id` → `offices.id`
- `letters.created_by` → `users.id`
- `letters.office_id` → `offices.id`
- `letters.recipient_employee_nip` → `pegawai.nip`
- `pengajuan.pegawai_nip` → `pegawai.nip`
- `pengajuan.created_by` → `users.id`
- `pengajuan.office_id` → `offices.id`
- `pengajuan_files.pengajuan_id` → `pengajuan.id` (CASCADE DELETE)

## Available Scripts

### Complete Setup
```bash
npm run db:setup
```
Runs the complete database setup including:
- Create all tables and indexes
- Insert default data (10 offices, 1 admin user)
- Fix table structure
- Add all foreign key constraints

### Individual Operations

#### Migration (Tables & Indexes Only)
```bash
# This functionality is now included in the complete setup
npm run db:setup
```
Creates tables and indexes without foreign key constraints.

#### Insert Default Data
```bash
# This functionality is now included in the complete setup
npm run db:setup
```
Inserts default offices and admin user.

#### Add Foreign Keys
```bash
npm run db:add-fk
```
Adds all foreign key constraints to existing tables.

#### Check Database Status
```bash
# Check tables
npx ts-node src/scripts/check-tables.ts

# Check data
npx ts-node src/scripts/check-data.ts

# Check foreign keys
npm run db:check-fk
```

## Default Data

### Offices (10 Kantor Kemenag NTB)
- Kantor Kementerian Agama Kota Mataram
- Kantor Kementerian Agama Kabupaten Lombok Timur
- Kantor Kementerian Agama Kabupaten Lombok Tengah
- Kantor Kementerian Agama Kabupaten Sumbawa Barat
- Kantor Kementerian Agama Kabupaten Lombok Utara
- Kantor Kementerian Agama Kabupaten Dompu
- Kantor Kementerian Agama Kabupaten Bima
- Kantor Kementerian Agama Kota Bima
- Kantor Kementerian Agama Kabupaten Lombok Barat
- Kantor Kementerian Agama Kabupaten Sumbawa

### Admin User
- **Email**: admin@kemenag.go.id
- **Role**: admin
- **Access**: Full access to all offices

## Troubleshooting

### Common Issues

#### 1. Foreign Key Errors
If you get foreign key errors, run:
```bash
npm run db:add-fk
```

#### 2. Duplicate Column Errors
These are normal and will be skipped automatically.

#### 3. MariaDB Limitations
MariaDB doesn't support `IF NOT EXISTS` for foreign key constraints, so we check manually.

### Reset Database
To completely reset the database:
```bash
# Drop all tables (be careful!)
npx ts-node src/scripts/drop-all-tables.ts

# Then run complete setup
npm run db:setup
```

## Environment Variables
Make sure your `.env` file has the correct database configuration:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=newmutasi
```

## Notes
- All scripts are idempotent (safe to run multiple times)
- Foreign key constraints use `ON DELETE SET NULL` except for `pengajuan_files` which uses `CASCADE`
- The migration process is designed to work with MariaDB/MySQL
