# API Pegawai Documentation

## Base URL
```
http://localhost:3000/api/employees
```

## Authentication
Semua endpoint memerlukan autentikasi. Gunakan header `Authorization` dengan format:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Get All Pegawai
**GET** `/api/employees`

Mengambil semua data pegawai.

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "pegawai": [
    {
      "nip": "198501012010011001",
      "nama": "Ahmad Rival",
      "golongan": "III/a",
      "tmt_pensiun": "2025-01-01T00:00:00.000Z",
      "unit_kerja": "Bidang Mutasi",
      "induk_unit": "Kantor Wilayah",
      "jabatan": "Kepala Seksi",
      "kantor_id": "550e8400-e29b-41d4-a716-446655440000",
      "jenis_pegawai": "pegawai",
      "aktif": true,
      "dibuat_pada": "2024-01-01T00:00:00.000Z",
      "diubah_pada": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response Error (401):**
```json
{
  "message": "Unauthorized"
}
```

---

### 2. Get Pegawai by ID
**GET** `/api/employees/:id`

Mengambil data pegawai berdasarkan NIP.

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `id` (string, required): NIP pegawai

**Response Success (200):**
```json
{
  "pegawai": {
    "nip": "198501012010011001",
    "nama": "Ahmad Rival",
    "golongan": "III/a",
    "tmt_pensiun": "2025-01-01T00:00:00.000Z",
    "unit_kerja": "Bidang Mutasi",
    "induk_unit": "Kantor Wilayah",
    "jabatan": "Kepala Seksi",
    "kantor_id": "550e8400-e29b-41d4-a716-446655440000",
    "jenis_pegawai": "pegawai",
    "aktif": true,
    "dibuat_pada": "2024-01-01T00:00:00.000Z",
    "diubah_pada": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "message": "Pegawai not found"
}
```

---

### 3. Search Pegawai
**GET** `/api/employees/search?q=<query>`

Mencari pegawai berdasarkan nama.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (string, required): Query pencarian nama pegawai

**Response Success (200):**
```json
{
  "pegawai": [
    {
      "nip": "198501012010011001",
      "nama": "Ahmad Rival",
      "golongan": "III/a",
      "tmt_pensiun": "2025-01-01T00:00:00.000Z",
      "unit_kerja": "Bidang Mutasi",
      "induk_unit": "Kantor Wilayah",
      "jabatan": "Kepala Seksi",
      "kantor_id": "550e8400-e29b-41d4-a716-446655440000",
      "jenis_pegawai": "pegawai",
      "aktif": true,
      "dibuat_pada": "2024-01-01T00:00:00.000Z",
      "diubah_pada": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response Error (400):**
```json
{
  "message": "Query parameter q is required"
}
```

---

### 4. Get Pegawai by Induk Unit
**GET** `/api/employees/by-induk-unit?induk_unit=<unit>`

Mengambil pegawai berdasarkan induk unit.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `induk_unit` (string, required): Nama induk unit

**Response Success (200):**
```json
{
  "pegawai": [
    {
      "nip": "198501012010011001",
      "nama": "Ahmad Rival",
      "golongan": "III/a",
      "tmt_pensiun": "2025-01-01T00:00:00.000Z",
      "unit_kerja": "Bidang Mutasi",
      "induk_unit": "Kantor Wilayah",
      "jabatan": "Kepala Seksi",
      "kantor_id": "550e8400-e29b-41d4-a716-446655440000",
      "jenis_pegawai": "pegawai",
      "aktif": true,
      "dibuat_pada": "2024-01-01T00:00:00.000Z",
      "diubah_pada": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response Error (400):**
```json
{
  "message": "Query parameter induk_unit is required"
}
```

---

### 5. Create Pegawai
**POST** `/api/employees`

Membuat data pegawai baru. Hanya untuk role `admin` dan `operator`.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "nip": "198501012010011001",
  "nama": "Ahmad Rival",
  "golongan": "III/a",
  "tmt_pensiun": "2025-01-01",
  "unit_kerja": "Bidang Mutasi",
  "induk_unit": "Kantor Wilayah",
  "jabatan": "Kepala Seksi",
  "kantor_id": "550e8400-e29b-41d4-a716-446655440000",
  "jenis_pegawai": "pegawai",
  "aktif": true
}
```

**Required Fields:**
- `nip` (string): Nomor Induk Pegawai
- `nama` (string): Nama lengkap pegawai

**Optional Fields:**
- `golongan` (string): Golongan pegawai
- `tmt_pensiun` (string): Tanggal TMT Pensiun (format: YYYY-MM-DD)
- `unit_kerja` (string): Unit kerja
- `induk_unit` (string): Induk unit
- `jabatan` (string): Jabatan
- `kantor_id` (string): ID kantor
- `jenis_pegawai` (string): Jenis pegawai ("pegawai" atau "pejabat")
- `aktif` (boolean): Status aktif pegawai

**Response Success (201):**
```json
{
  "pegawai": {
    "nip": "198501012010011001",
    "nama": "Ahmad Rival",
    "golongan": "III/a",
    "tmt_pensiun": "2025-01-01T00:00:00.000Z",
    "unit_kerja": "Bidang Mutasi",
    "induk_unit": "Kantor Wilayah",
    "jabatan": "Kepala Seksi",
    "kantor_id": "550e8400-e29b-41d4-a716-446655440000",
    "jenis_pegawai": "pegawai",
    "aktif": true,
    "dibuat_pada": "2024-01-01T00:00:00.000Z",
    "diubah_pada": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "message": "Missing required fields"
}
```

**Response Error (403):**
```json
{
  "message": "Insufficient permissions"
}
```

---

### 6. Update Pegawai
**PUT** `/api/employees/:id`

Mengupdate data pegawai. Hanya untuk role `admin` dan `operator`.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parameters:**
- `id` (string, required): NIP pegawai

**Request Body:**
```json
{
  "nama": "Ahmad Rival Updated",
  "golongan": "III/b",
  "tmt_pensiun": "2025-01-01",
  "unit_kerja": "Bidang Mutasi Updated",
  "induk_unit": "Kantor Wilayah Updated",
  "jabatan": "Kepala Seksi Updated",
  "kantor_id": "550e8400-e29b-41d4-a716-446655440000",
  "jenis_pegawai": "pejabat",
  "aktif": false
}
```

**All fields are optional for update.**

**Response Success (200):**
```json
{
  "pegawai": {
    "nip": "198501012010011001",
    "nama": "Ahmad Rival Updated",
    "golongan": "III/b",
    "tmt_pensiun": "2025-01-01T00:00:00.000Z",
    "unit_kerja": "Bidang Mutasi Updated",
    "induk_unit": "Kantor Wilayah Updated",
    "jabatan": "Kepala Seksi Updated",
    "kantor_id": "550e8400-e29b-41d4-a716-446655440000",
    "jenis_pegawai": "pejabat",
    "aktif": false,
    "dibuat_pada": "2024-01-01T00:00:00.000Z",
    "diubah_pada": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "message": "Pegawai not found"
}
```

**Response Error (403):**
```json
{
  "message": "Insufficient permissions"
}
```

---

### 7. Delete Pegawai
**DELETE** `/api/employees/:id`

Menghapus data pegawai. Hanya untuk role `admin` dan `operator`.

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `id` (string, required): NIP pegawai

**Response Success (200):**
```json
{
  "message": "Pegawai deleted"
}
```

**Response Error (404):**
```json
{
  "message": "Pegawai not found"
}
```

**Response Error (403):**
```json
{
  "message": "Insufficient permissions"
}
```

---

## Data Model

### Pegawai Object
```typescript
interface Pegawai {
  nip: string;                    // Primary key, max 20 chars
  nama: string;                   // Required, max 100 chars
  golongan?: string;              // Optional, max 20 chars
  tmt_pensiun?: Date;             // Optional, date format
  unit_kerja?: string;            // Optional, max 100 chars
  induk_unit?: string;            // Optional, max 100 chars
  jabatan?: string;               // Optional, max 255 chars
  id?: string;                    // UUID, auto-generated
  kantor_id?: string;             // Optional, UUID
  jenis_pegawai?: 'pegawai' | 'pejabat';  // Optional, enum
  aktif?: boolean;                // Optional, default true
  dibuat_pada?: Date;             // Auto-generated timestamp
  diubah_pada?: Date;             // Auto-generated timestamp
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Missing required fields or invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Notes

1. **Authentication**: Semua endpoint memerlukan token JWT yang valid
2. **Authorization**: Endpoint POST, PUT, DELETE hanya untuk role `admin` dan `operator`
3. **NIP**: Digunakan sebagai primary key untuk identifikasi pegawai
4. **Search**: Pencarian menggunakan LIKE operator untuk nama pegawai
5. **Date Format**: Gunakan format ISO 8601 (YYYY-MM-DD) untuk tanggal
6. **UUID**: kantor_id menggunakan format UUID
7. **Boolean**: Field `aktif` menggunakan boolean (true/false)

## Contoh Penggunaan Frontend

### React/TypeScript Example
```typescript
// Get all employees
const getAllEmployees = async () => {
  const response = await fetch('/api/employees', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.pegawai;
};

// Search employees
const searchEmployees = async (query: string) => {
  const response = await fetch(`/api/employees/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.pegawai;
};

// Create employee
const createEmployee = async (employeeData: Partial<Pegawai>) => {
  const response = await fetch('/api/employees', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(employeeData)
  });
  const data = await response.json();
  return data.pegawai;
};
``` 