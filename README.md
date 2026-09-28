# PRESENSI PRO — Sistem Absensi Karyawan Berbasis Face Recognition

Sistem absensi karyawan biometrik modern, responsif, dan aman berbasis **Face Recognition AI** yang mengintegrasikan pengenalan wajah secara realtime, validasi jadwal multi-shift, pencegahan manipulasi (backend-driven), riwayat kehadiran dengan ekspor CSV, serta dashboard admin interaktif.

---

## 🚀 Fitur Unggulan

### 1. Kios Presensi Wajah Cerdas (Halaman Utama `/`)
- **HUD Scanner Futuristik**: Tampilan kamera besar dengan frame laser scanline, sudut HUD sci-fi, deteksi kontur wajah, dan face landmark.
- **Indikator Tahapan Pengenalan**:
  - *Mencari wajah...*
  - *Wajah terdeteksi ✓*
  - *Memverifikasi identitas...*
  - *Identitas berhasil dikenali ✓*
- **Sistem Suara & Voice Assistant (Web Audio & Speech API)**: Umpan balik suara otomatis menyapa karyawan: *"Absensi masuk berhasil. Selamat bekerja, [Nama Karyawan]"*.
- **Mode Fleksibel**:
  - ⚡ **Otomatis (Auto)**: Menentukan otomatis apakah karyawan perlu Check-In atau Check-Out berdasarkan riwayat hari ini.
  - 🟢 **Absen Masuk (Check-In)**
  - 🔵 **Absen Pulang (Check-Out)**
- **Panel Simulator Pengujian Cepat**: Memungkinkan pengujian absensi dan shift secara instan dengan 1-klik bahkan tanpa webcam fisik.

---

### 2. Aturan Bisnis Multi-Shift & Jam Server (Asia/Jakarta WIB)
Validasi jam absensi dilakukan **100% di backend** agar tidak dapat dimanipulasi dari jam browser client.

| Shift | Window Tepat Waktu | Jam Pulang (Shift End) | Status Tepat Waktu | Status Terlambat |
| :--- | :--- | :--- | :--- | :--- |
| **Shift 1 (Pagi)** | **08:00 – 09:00 WIB** | **16:00 WIB** | `TEPAT_WAKTU` | `TERLAMBAT` (&gt; 09:00 WIB) |
| **Shift 2 (Siang)** | **12:00 – 13:00 WIB** | **20:00 WIB** | `TEPAT_WAKTU` | `TERLAMBAT` (&gt; 13:00 WIB) |

### 🔒 Attendance Decision Engine & Check-Out Lock (Prinsip Mutlak)
**FACE RECOGNITION ≠ ATTENDANCE ACTION**
1. Face Recognition hanya mengidentifikasi: **WHO IS THIS?**
2. Attendance Decision Engine menentukan: **WHAT ACTION IS ALLOWED?**
   - State `NO_ATTENDANCE` $\rightarrow$ `allowedAction: CHECK_IN`
   - State `WAITING_FOR_CHECKOUT` (Sebelum jam pulang) $\rightarrow$ `allowedAction: NONE` (**CHECK-OUT DILARANG & DIKUNCI!**)
   - State `CHECKOUT_ALLOWED` (Setelah jam pulang, misal $\ge$ 16:00 WIB) $\rightarrow$ `allowedAction: CHECK_OUT`
   - State `COMPLETED` (Sudah check-in & check-out) $\rightarrow$ `allowedAction: NONE` (Terkunci permanen)
3. Backend secara independen menolak keras request check-out jika `currentServerTime < shift.endTime` (`CHECKOUT_NOT_ALLOWED_YET`), sehingga manipulasi frontend mustahil mencatat check-out lebih awal.

---

### 3. Dashboard Admin (`/admin`)
- **Ringkasan 6 Kartu Metrik Hari Ini**:
  1. Total Karyawan Aktif
  2. Total Sudah Absen (Hadir)
  3. Tingkat Kehadiran (%)
  4. Tepat Waktu
  5. Terlambat
  6. Sudah Absen Pulang
- **Tabel Aktivitas Presensi Realtime**: Menampilkan aktivitas presensi terbaru secara live dengan auto-refresh setiap 5 detik.

---

### 4. Manajemen Karyawan & Registrasi Biometrik Wajah (`/admin/employees`)
- **CRUD Karyawan Lengkap**: Tambah, ubah, nonaktifkan, dan hapus karyawan.
- **Modal Pendaftaran Wajah Berbasis Kamera**:
  - Menampilkan panduan: posisi wajah, pencahayaan cukup, lepas masker/kacamata, tatap kamera.
  - Memvalidasi deteksi wajah sebelum data disimpan.
  - Mengekstraksi vektor embedding 128-dimensi (*Euclidean distance*) dan foto snapshot.

---

### 5. Riwayat Absensi & Laporan (`/admin/attendance`)
- Tabel presensi komprehensif: Tanggal, Nama, NIP/ID, Shift, Jam Masuk, Jam Keluar, Status.
- Filter tanggal, filter shift, dan filter status (Tepat Waktu / Terlambat / Absen Lengkap).
- Pencarian cerdas nama/NIP/departemen.
- Sorting dan Pagination.
- Modal detail foto presensi.
- **Ekspor Riwayat ke format CSV/Excel**.

---

### 6. Pengaturan Sistem & Simulator Waktu (`/admin/settings`)
- Pengaturan jam awal, batas window tepat waktu, dan jam pulang untuk Shift 1 & Shift 2.
- Pengaturan Threshold Kemiripan Wajah (*Euclidean Distance* default `0.55`).
- Pengaturan proteksi Liveness Detection & Anti-spoofing.
- **Time Testing Sandbox**: Fitur simulasi jam server (08:24, 09:15, 12:15, 13:30, 17:05, atau Waktu Nyata) untuk mempermudah reviewer menguji seluruh skenario tanpa menunggu jam sebenarnya!
- Tombol Reset Database ke data default bawaan.

---

## 🛠️ Menjalankan Proyek

Aplikasi saat ini telah aktif dan dapat dibuka langsung di browser:
👉 **[http://localhost:3000](http://localhost:3000)**

### Perintah CLI:
```bash
# Menjalankan server dalam mode development
npm run dev

# Membangun build produksi
npm run build

# Menjalankan server build produksi
npm start
```
