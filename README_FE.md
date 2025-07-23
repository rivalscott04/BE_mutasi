# 📖 Frontend Integration Guideline — Generator Surat Kemenag

Panduan ini berisi cara mengintegrasikan frontend dengan backend yang sudah dibuat, termasuk daftar endpoint, payload, autentikasi, dan contoh penggunaan.

---

## 🔐 Autentikasi (JWT)
- **Login:**
  - Endpoint: `POST /api/auth/login`
  - Request:
    ```json
    { "email": "user@email.com", "password": "yourpassword" }
    ```
  - Response:
    ```json
    { "token": "<JWT>", "user": { "id": "...", "email": "...", "full_name": "...", "role": "admin|operator|user" } }
    ```
  - **Gunakan token JWT di header Authorization untuk semua request selanjutnya:**
    ```
    Authorization: Bearer <JWT>
    ```
- **Get Current User:**
  - Endpoint: `GET /api/auth/me`
  - Response:
    ```json
    { "user": { "id": "...", "email": "...", "full_name": "...", "role": "admin|operator|user" } }
    ```

---

## 👤 Users
- **List Users:** `GET /api/users`
- **Create User:** `POST /api/users` *(admin only)*
  - Request:
    ```json
    { "email": "...", "password": "...", "full_name": "...", "role": "admin|operator|user", "office_id": "..." }
    ```
- **Update User:** `PUT /api/users/:id` *(admin only)*
- **Delete User:** `DELETE /api/users/:id` *(admin only)*
- **Get User:** `GET /api/users/:id`
- **Response (list/detail):**
  ```json
  { "users": [ { "id": "...", "email": "...", "full_name": "...", "role": "...", "office_id": "..." } ] }
  ```

---

## 🏢 Offices
- **List Offices:** `GET /api/offices`
- **Create Office:** `POST /api/offices` *(admin/operator only)*
  - Request:
    ```json
    { "name": "...", "kabkota": "...", "address": "...", "phone": "...", "fax": "...", "email": "...", "website": "..." }
    ```
- **Update Office:** `PUT /api/offices/:id` *(admin/operator only)*
- **Delete Office:** `DELETE /api/offices/:id` *(admin/operator only)*
- **Get Office:** `GET /api/offices/:id`

---

## 👥 Pegawai (Employees)
- **List Pegawai:** `GET /api/employees`
- **Create Pegawai:** `POST /api/employees` *(admin/operator only)*
  - Request:
    ```json
    { "nip": "...", "nama": "...", "golongan": "...", "tmt_pensiun": "YYYY-MM-DD", "unit_kerja": "...", "induk_unit": "...", "jabatan": "...", "kantor_id": "...", "jenis_pegawai": "pegawai|pejabat", "aktif": true }
    ```
- **Update Pegawai:** `PUT /api/employees/:id` *(admin/operator only)*
- **Delete Pegawai:** `DELETE /api/employees/:id` *(admin/operator only)*
- **Get Pegawai:** `GET /api/employees/:id`
- **Search Pegawai:** `GET /api/employees/search?q=nama`

---

## 📨 Letters (Surat)
- **List Letters:** `GET /api/letters`
- **Create Letter:** `POST /api/letters` *(admin/operator only)*
  - Request:
    ```json
    { "office_id": "...", "created_by": "...", "template_id": 1, "template_name": "...", "letter_number": "...", "subject": "...", "recipient_employee_nip": "...", "signing_official_nip": "...", "form_data": { /* bebas sesuai template */ }, "status": "draft|generated|signed" }
    ```
- **Update Letter:** `PUT /api/letters/:id` *(admin/operator only)*
- **Delete Letter:** `DELETE /api/letters/:id` *(admin/operator only)*
- **Get Letter:** `GET /api/letters/:id`
- **Generate PDF:** `POST /api/letters/:id/generate-pdf` *(admin/operator only)*
  - Response:
    ```json
    { "message": "PDF generated", "file": { "id": "...", "file_name": "...", "file_path": "...", "file_size": 12345, "mime_type": "application/pdf", ... } }
    ```

---

## 📎 Files (PDF)
- **Upload File:** `POST /api/files/upload` *(admin/operator only)*
  - FormData:
    - `file`: (PDF file)
    - `letter_id`: (UUID surat)
- **Get File:** `GET /api/files/:id`
  - Response: PDF file (Content-Type: application/pdf)
- **Delete File:** `DELETE /api/files/:id` *(admin/operator only)*

---

## ⚠️ Catatan Penting
- **Semua request (kecuali login) wajib pakai header Authorization: Bearer <JWT>.**
- **Role user (`admin`, `operator`, `user`) menentukan hak akses endpoint.**
- **Format tanggal:** gunakan ISO (`YYYY-MM-DD` atau `YYYY-MM-DDTHH:mm:ssZ`).
- **Error response:**
  ```json
  { "message": "Error message here" }
  ```

---

## 🚀 Contoh Penggunaan di Frontend (fetch/Axios)

```js
// Login
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
const token = data.token;

// Request protected endpoint
const res2 = await fetch('/api/letters', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const letters = await res2.json();
```

---

**Silakan sesuaikan payload dan endpoint sesuai kebutuhan UI/UX frontend Anda.** 