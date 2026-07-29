# Product Requirements Document (PRD)
**Nama Produk:** BagiBill (MVP)
**Product Owner / Lead Engineer:** Abdullah Fathan
**Tanggal:** 22 Juni 2026
**Status Dokumen:** Approved for Development (Client-Side Architecture)
**Versi:** 4.0 (Pure Client-Side OCR + Local Storage)

---

## 1. Ringkasan Eksekutif
Aplikasi BagiBill adalah utilitas berbasis web yang mengotomatisasi pembagian tagihan restoran secara adil. Memanfaatkan teknologi *Client-Side Optical Character Recognition* (WebAssembly OCR), ekstraksi teks dari foto struk diproses langsung di *browser* pengguna secara instan dan aman. Data riwayat tagihan dan relasi pembagian disimpan langsung di dalam perangkat lokal menggunakan *Local Storage*, menjamin 100% privasi pengguna. Pengguna dapat menyalin hasil kalkulasi akhir langsung ke clipboard dalam bentuk teks yang terformat rapi.

## 2. Objektif & Metrik Keberhasilan
* **Objektif Pembelajaran:** 
    * Membangun aplikasi web client-side yang optimal menggunakan Next.js.
    * Mengimplementasikan *Client-Side Processing* untuk komputasi berat (OCR) guna menghemat sumber daya *server*.
    * Eksplorasi pengelolaan state client-side yang persisten menggunakan Zustand dan Local Storage.
* **Metrik Keberhasilan MVP:**
    * Proses OCR di *browser* selesai < 8 detik tanpa membuat halaman web *freeze*.
    * Penyimpanan draft dan penugasan bill ke Local Storage berjalan instan dan otomatis tanpa perlu koneksi database eksternal.

## 3. Profil Pengguna (User Persona)
Kelompok pertemanan atau profesional muda yang sering makan bersama di restoran. 
*Konteks Penggunaan:* Fathan dan teman-temannya selesai makan. Fathan memfoto struk melalui aplikasi web. *Browser* membaca teks secara lokal. Ia menugaskan pesanan masing-masing, membagi pajak secara otomatis, lalu menyalin ringkasan teks tagihan tersebut untuk ditempel ke aplikasi perpesanan kelompok mereka.

---

## 4. Alur Pengguna (User Flow)
1. **Local Upload:** Pengguna membuka aplikasi Next.js dan memilih foto struk. **Mengunggah struk baru secara otomatis menghapus data struk lama dari Local Storage.**
2. **Client-Side OCR:** `tesseract.js` mengekstrak teks secara lokal di perangkat pengguna. Tampil animasi *loading* yang menarik.
3. **Data Parsing:** Teks mentah diproses. Fungsi *Regex* memisahkan nama menu, harga, pajak, dan biaya layanan.
4. **Review & Assign:** 
    * Pengguna melihat antarmuka kartu list item struk.
    * Pengguna mengatur alokasi kuantitas menggunakan `+/-` dan *checkbox* untuk item yang dibagi rata.
5. **Auto-Calculate:** Logika aplikasi menghitung subtotal tiap individu dan membagi pajak/layanan secara proporsional.
6. **Save to Local Storage:** Draft status penugasan secara otomatis disimpan ke Local Storage agar progress tidak hilang jika halaman direfresh. **Data ini tersimpan maksimal selama 2 jam sebelum otomatis kedaluwarsa.**
7. **Copy Report:** Pengguna mengklik tombol untuk menyalin rekap teks yang diformat rapi ke clipboard. **Tidak diperlukan tombol hapus/reset manual di dalam antarmuka UI.**

---

## 5. Kebutuhan Fungsional (Functional Requirements)

### FR1: Pemrosesan Gambar Lokal & Ekstraksi
* Sistem tidak mengunggah gambar ke server eksternal (100% *Privacy Compliant*).
* Gambar dikompresi di *browser* (Canvas API) sebelum dimasukkan ke *engine* WebAssembly `tesseract.js`.

### FR2: Algoritma Data Parsing (Client or Server Action)
* System parsing menerima *raw text* OCR dan menggunakan pola *Regex* untuk menyusun data JSON.
* Sistem mendeteksi pemisah blok pesanan dengan blok total/pajak (misal mengenali teks "Subtotal", "PB1", "Service Charge").

### FR3: UI Penugasan Interaktif (Client-Side)
* Menggunakan Zustand untuk menyimpan status penugasan.
* Antarmuka mencegah pengguna menugaskan kuantitas melebihi batas jumlah asli di struk.
* UI tidak menyediakan tombol Reset/Hapus manual.

### FR4: Kalkulasi Pajak Proporsional
* **Formula:** `(Subtotal Individu / Subtotal Keseluruhan Makanan) * Pajak Struk`.
* Seluruh kalkulasi nilai nominal diakhiri dengan pembulatan ke rupiah terdekat.

### FR5: Penyimpanan Lokal & Ekspor Rekap
* Sistem menyinkronkan status Zustand ke `localStorage` secara real-time.
* **Masa Simpan (TTL):** Data di `localStorage` otomatis dihapus setelah 2 jam dari penyimpanan terakhir.
* **Auto-Clear:** Mengunggah gambar/struk baru menghapus seluruh state bill sebelumnya secara otomatis.
* Menyediakan fitur ekspor teks rekap bill yang diformat rapi (nama orang, rincian makanan, share pajak/layanan, total pembayaran).

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)
* **Performance Optimization:** Menggunakan fitur *Dynamic Import* di Next.js untuk memuat *library* `tesseract.js` hanya ketika pengguna berada di halaman unggah, menjaga performa *First Load* tetap cepat.
* **Offline-Ready capability:** Mengingat seluruh proses berjalan client-side, aplikasi dapat dirancang untuk dapat berfungsi secara penuh tanpa memerlukan koneksi internet aktif setelah inisiasi pertama.

---

## 7. Tumpukan Teknologi (Tech Stack)

| Komponen | Teknologi Pilihan | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Framework** | Next.js (TypeScript) | *Full-stack framework* yang efisien, mendukung UI interaktif. |
| **UI & Styling** | Tailwind CSS, Shadcn UI | Komponen UI bersih, responsif, dan mudah dimodifikasi. |
| **State Management** | Zustand | Sangat ringan, cocok untuk status interaktif di tingkat *client component*, didukung persistency middleware. |
| **OCR Engine** | Tesseract.js (WASM) | Pustaka OCR gratis yang bisa berjalan langsung di *browser*. |
| **Deployment** | Vercel | Optimasi *deployment Zero-config* untuk Next.js. |

---

## 8. Rencana Rilis & Milestone

* **Milestone 1 (Client OCR & Setup):** 
  Inisialisasi Next.js, pembuatan fungsi unggah gambar, integrasi `tesseract.js` lokal, dan setup framework Zustand.
* **Milestone 2 (Parser Engine & Core UI):** 
  Penulisan logika pembersih teks (Regex), pembuatan komponen kartu (Shadcn UI) dengan tombol *counter*, dan penyusunan state store.
* **Milestone 3 (Kalkulasi, Local Persist, & Share):** 
  Implementasi matematika pembagian proporsional, integrasi penyimpanan otomatis ke Local Storage dengan batas waktu simpan 2 jam dan reset otomatis pada unggahan baru, fitur *Copy to Clipboard*, dan peluncuran produk di Vercel.