# Generator Surat Kementerian Agama

Aplikasi web untuk membuat surat-surat resmi Kementerian Agama dengan template yang telah disediakan.

## 🚀 Fitur Utama

- **Template Surat Beragam**: 9 jenis template surat resmi Kemenag
- **Auto-fill Data**: Pencarian otomatis data pegawai dan pejabat
- **Live Preview**: Preview surat real-time saat mengisi form
- **Export PDF**: Generate surat dalam format PDF
- **Multi-role User**: Support untuk admin, operator, dan user biasa
- **Responsive Design**: Interface yang responsif untuk semua perangkat

## 📋 Template Surat yang Tersedia

1. Surat Pernyataan Tidak Sedang Tugas Belajar
2. Surat Keterangan Analisis Jabatan
3. Surat Keterangan Pengalaman Mengajar
4. Surat Permohonan Bebas Temuan
5. Surat Pernyataan Tidak Sedang Hukuman Disiplin
6. Surat Pernyataan Tidak Sedang Proses Pidana
7. Surat Persetujuan Pelepasan
8. Surat Persetujuan Penerimaan
9. Surat Pernyataan Tanggung Jawab Mutlak

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component Library
- **React Router** - Navigation
- **Lucide React** - Icons
- **Recharts** - Charts & Graphs
- **TanStack Query** - Data Fetching

### Backend (Recommended)
- **Node.js** with Express atau **Python** with FastAPI
- **PostgreSQL** - Database
- **Supabase** - Backend-as-a-Service (optional)
- **JWT** - Authentication
- **Multer** - File Upload
- **PDF-lib** - PDF Generation

## 🏗️ Database Schema

### Table: users
Tabel untuk autentikasi dan otorisasi pengguna.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'user')),
    office_id UUID REFERENCES offices(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: offices
Tabel untuk informasi kantor/instansi.

```sql
CREATE TABLE offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    kabkota VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: pegawai
Tabel untuk data pegawai dan pejabat.

```sql
CREATE TABLE pegawai (
    -- Core fields (existing structure - DO NOT MODIFY)
    nip VARCHAR(20) PRIMARY KEY, -- NIP pegawai (existing PK)
    nama VARCHAR(100) NOT NULL, -- Nama pegawai
    golongan VARCHAR(20), -- Pangkat/golongan
    tmt_pensiun DATE, -- TMT Pensiun (opsional)
    unit_kerja VARCHAR(100), -- Unit kerja
    induk_unit VARCHAR(100), -- Induk unit kerja (opsional)
    jabatan VARCHAR(100), -- Jabatan pegawai
    
    -- Enhancement fields (added via migration)
    id UUID DEFAULT gen_random_uuid() UNIQUE, -- UUID for relational purposes
    kantor_id UUID REFERENCES kantor(id), -- Relasi ke tabel kantor
    jenis_pegawai VARCHAR(20) DEFAULT 'pegawai' CHECK (jenis_pegawai IN ('pegawai', 'pejabat')), -- Kategorisasi
    aktif BOOLEAN DEFAULT true, -- Status aktif
    dibuat_pada TIMESTAMP DEFAULT NOW(), -- Timestamp created
    diubah_pada TIMESTAMP DEFAULT NOW() -- Timestamp updated
);
```

**Migration Notes:**
- Existing data dengan 5000+ records dapat di-migrate safely menggunakan script migration
- Primary key tetap menggunakan `nip` untuk backward compatibility
- Kolom `id` UUID ditambahkan untuk relational purposes dengan tabel lain
- Field `jenis_pegawai` akan otomatis ter-populate berdasarkan logic jabatan

### Table: letters
Tabel untuk menyimpan data surat yang dibuat.

```sql
CREATE TABLE letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID REFERENCES offices(id),
    created_by UUID REFERENCES users(id),
    template_id INTEGER NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    letter_number VARCHAR(50) UNIQUE NOT NULL,
    subject TEXT NOT NULL, -- Perihal surat
    recipient_employee_nip VARCHAR(20) REFERENCES pegawai(nip), -- Menggunakan NIP sebagai FK
    signing_official_nip VARCHAR(20) REFERENCES pegawai(nip), -- Menggunakan NIP sebagai FK
    form_data JSONB NOT NULL, -- Data form dalam format JSON
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'signed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: letter_files
Tabel untuk menyimpan file PDF yang dihasilkan.

```sql
CREATE TABLE letter_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_id UUID REFERENCES letters(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL, -- Size dalam bytes
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash untuk integrity check
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes (untuk optimasi query)

```sql
-- Indexes untuk performa query
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_office_id ON users(office_id);

-- Pegawai indexes (supporting both old and new structure)
CREATE INDEX idx_pegawai_nip ON pegawai(nip); -- Primary searches
CREATE INDEX idx_pegawai_id ON pegawai(id); -- UUID searches
CREATE INDEX idx_pegawai_kantor_id ON pegawai(kantor_id);
CREATE INDEX idx_pegawai_jenis ON pegawai(jenis_pegawai);
CREATE INDEX idx_pegawai_aktif ON pegawai(aktif);
CREATE INDEX idx_pegawai_nama ON pegawai(nama); -- Name searches

-- Letters indexes
CREATE INDEX idx_letters_office_id ON letters(office_id);
CREATE INDEX idx_letters_created_by ON letters(created_by);
CREATE INDEX idx_letters_template_id ON letters(template_id);
CREATE INDEX idx_letters_recipient_nip ON letters(recipient_employee_nip);
CREATE INDEX idx_letters_signing_nip ON letters(signing_official_nip);
CREATE INDEX idx_letters_created_at ON letters(created_at);
CREATE INDEX idx_letter_files_letter_id ON letter_files(letter_id);
```

## 🔐 API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Users Management
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Offices Management
```
GET    /api/offices
POST   /api/offices
GET    /api/offices/:id
PUT    /api/offices/:id
DELETE /api/offices/:id
```

### Employees Management
```
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id
GET    /api/employees/search?q=nama
```

### Letters Management
```
GET    /api/letters
POST   /api/letters
GET    /api/letters/:id
PUT    /api/letters/:id
DELETE /api/letters/:id
POST   /api/letters/:id/generate-pdf
```

### File Management
```
GET    /api/files/:id
POST   /api/files/upload
DELETE /api/files/:id
```

## 📁 File Storage Structure

```
storage/
├── letters/
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── template-1/
│   │   │   ├── template-2/
│   │   │   └── ...
│   │   └── 02/
│   └── 2025/
├── temp/
└── backups/
```

### File Naming Convention
```
{template_id}_{letter_number}_{timestamp}.pdf
```

Contoh: `1_001_SKTTB_2024_1704067200.pdf`

## 🚦 Setup Development

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 13
- Git

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd generator-surat-kemenag
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/kemenag_letters

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h

# File Storage
STORAGE_PATH=./storage
MAX_FILE_SIZE=10485760  # 10MB

# App Config
APP_NAME=Generator Surat Kemenag
APP_URL=http://localhost:3000
```

4. **Setup database**
```bash
# Create database
createdb kemenag_letters

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

5. **Start development server**
```bash
npm run dev
```

## 🔧 Build & Deployment

### Build for production
```bash
npm run build
```

### Deploy to server
```bash
# Build
npm run build

# Copy dist folder to server
scp -r dist/ user@server:/var/www/kemenag-letters/

# Setup nginx configuration
# Setup SSL certificate
# Setup PM2 for process management
```

## 📊 Sample Data

### Sample Office Data
```sql
INSERT INTO offices (name, kabkota, address, phone, email) VALUES
('Kantor Kementerian Agama Lombok Barat', 'Lombok Barat', 'Jl. Raya Gerung No. 123, Lombok Barat', '(0370) 123456', 'lombokbarat@kemenag.go.id'),
('Kantor Kementerian Agama Lombok Timur', 'Lombok Timur', 'Jl. Raya Selong No. 456, Lombok Timur', '(0376) 654321', 'lomboktimur@kemenag.go.id');
```

### Sample Employee Data
```sql
INSERT INTO employees (office_id, nip, full_name, rank_grade, position, unit_work, workplace, employee_type) VALUES
((SELECT id FROM offices WHERE kabkota = 'Lombok Barat'), '197501012006041001', 'Dr. Ahmad Fauzi, M.Pd', 'Pembina Tk. I / IV/b', 'Kepala Kantor', 'Pimpinan', 'Kantor Kemenag Lombok Barat', 'pejabat'),
((SELECT id FROM offices WHERE kabkota = 'Lombok Barat'), '198203152010121002', 'Siti Aminah, S.Ag', 'Penata / III/c', 'Kepala Seksi Haji', 'Seksi Haji dan Umrah', 'Kantor Kemenag Lombok Barat', 'pegawai');
```

## 🔒 Security Considerations

1. **Authentication**: Implement JWT-based authentication
2. **Authorization**: Role-based access control (RBAC)
3. **File Security**: Validate file types and sizes
4. **Data Encryption**: Encrypt sensitive data at rest
5. **Input Validation**: Sanitize all user inputs
6. **Rate Limiting**: Implement API rate limiting
7. **CORS**: Configure proper CORS settings
8. **Audit Trail**: Log all user activities

## 📈 Performance Optimization

1. **Database Indexing**: Proper indexes on frequently queried columns
2. **Query Optimization**: Use efficient database queries
3. **Caching**: Redis for caching frequently accessed data
4. **File Compression**: Compress PDF files if needed
5. **CDN**: Use CDN for static assets
6. **Pagination**: Implement proper pagination for large datasets

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check database credentials in `.env`
   - Ensure PostgreSQL is running
   - Verify database exists

2. **File Upload Issues**
   - Check file permissions on storage directory
   - Verify `MAX_FILE_SIZE` setting
   - Check available disk space

3. **PDF Generation Problems**
   - Ensure PDF generation library is installed
   - Check font files are available
   - Verify template data is complete

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Developer**: Implementasi API dan database
- **Frontend Developer**: Maintenance UI/UX
- **DevOps**: Deployment dan monitoring
- **QA**: Testing dan quality assurance

## 📞 Support

Untuk pertanyaan atau dukungan teknis, silakan hubungi:
- Email: support@kemenag.go.id
- WhatsApp: +62 xxx xxxx xxxx
- Documentation: [Link ke dokumentasi lengkap]

---

**Catatan**: Pastikan untuk mengupdate dokumentasi ini seiring dengan perkembangan aplikasi.

## 🔄 Database Migration

### Migration untuk Existing Data (5000+ Records)

Untuk database yang sudah memiliki data pegawai existing, gunakan script migration yang telah disediakan:

```bash
# 1. Backup database
pg_dump -h localhost -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migration script
psql -h localhost -U username -d database_name -f database/migrations/001_pegawai_migration.sql

# 3. Validate migration
psql -h localhost -U username -d database_name -f database/migrations/validation_queries.sql
```

### Migration Features:
- **Zero Downtime**: Data existing tetap utuh selama migration
- **Rollback Ready**: Complete rollback strategy jika ada masalah
- **Performance Optimized**: Batch processing untuk dataset besar
- **Data Integrity**: Validation di setiap step migration
- **Backup Safety**: Automatic backup creation sebelum migration

### Expected Migration Time:
- **< 1000 records**: 1-2 menit
- **1000-5000 records**: 3-5 menit  
- **5000+ records**: 5-10 menit

Dokumentasi lengkap migration tersedia di `database/migrations/README_MIGRATION.md`
