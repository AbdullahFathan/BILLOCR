# 📋 End-to-End Test Cases — Aura Split (BILLOCR)

> **Aplikasi:** Split Bill OCR (Aura Split)  
> **Versi:** MVP 6.0 — Mistral OCR + Upstash Redis  
> **Tanggal Dibuat:** 23 Juli 2026  
> **Tipe Pengujian:** End-to-End (Manual & Functional)  
> **Environment:** Browser modern (Chrome/Safari) · Mobile & Desktop

---

## Konvensi Dokumen

| Simbol | Arti |
|--------|------|
| ✅ | Expected result untuk positive flow |
| ❌ | Expected result untuk negative flow |
| 🎯 | Komponen / file yang diuji |
| 🔗 | Prerequisite / dependensi test |

**Status kolom:**

| Label | Arti |
|-------|------|
| `PASS` | Test lulus |
| `FAIL` | Test gagal |
| `SKIP` | Dilewati (belum bisa dijalankan) |
| `BLOCK` | Terblokir oleh bug/issue lain |

---

## Modul 1 — Inisialisasi & Halaman Awal

### TC-001: Render Halaman Pertama Kali (Cold Start)

| Field | Detail |
|-------|--------|
| **ID** | TC-001 |
| **Modul** | Halaman Utama (`page.tsx`) |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `page.tsx`, `BottomNav`, `FileUploader`, `useReceiptStore` |

**Precondition:**
- Browser baru (tidak ada data di `localStorage` dengan key `split-bill-ocr-store`)
- User membuka URL aplikasi

**Langkah-langkah:**
1. Buka aplikasi di browser
2. Tunggu hingga halaman selesai dimuat

**Expected Result:**
- ✅ Tampil loading spinner (`Activity` icon berputar) sesaat
- ✅ Setelah hydration selesai, tampil tab **Scan** (home screen)
- ✅ Logo "Aura Split" + Receipt icon terlihat di tengah
- ✅ Tagline "Scan your receipt & split the bill fairly" tampil
- ✅ Komponen `FileUploader` tampil dengan border dashed orange
- ✅ `BottomNav` tampil di bawah dengan 3 tab: Scan / Assign / Settle
- ✅ Tab **Assign** dan **Settle** berstatus disabled (tidak dapat diklik)
- ✅ Counter upload badge menunjukkan `5 remaining`

**Status:** `____`  
**Catatan:**

---

### TC-002: Navigasi Bottom Nav — Tab Disabled Saat Tidak Ada Data

| Field | Detail |
|-------|--------|
| **ID** | TC-002 |
| **Modul** | `BottomNav` |
| **Tipe** | Negative |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `BottomNav.tsx`, `page.tsx` |

**Precondition:** Tidak ada struk yang di-scan (state kosong)

**Langkah-langkah:**
1. Klik tab "Assign" di bottom nav
2. Klik tab "Settle" di bottom nav

**Expected Result:**
- ❌ Tab Assign tidak dapat diklik / tidak ada respons
- ❌ Tab Settle tidak dapat diklik / tidak ada respons
- ✅ User tetap berada di tab Scan
- ✅ Tab Assign dan Settle tampil dalam kondisi visual muted/disabled

**Status:** `____`  
**Catatan:**

---

### TC-003: Restore State dari localStorage (Session Sebelumnya)

| Field | Detail |
|-------|--------|
| **ID** | TC-003 |
| **Modul** | Zustand Persist + Hydration |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `useReceiptStore.ts`, `useHasHydrated.ts`, `page.tsx` |

**Precondition:**
- User sebelumnya sudah melakukan scan dan meng-assign item
- Data tersimpan di `localStorage` key `split-bill-ocr-store`
- Data belum kedaluwarsa (< 2 jam)

**Langkah-langkah:**
1. Refresh halaman browser (F5 / Cmd+R)

**Expected Result:**
- ✅ Loading spinner tampil singkat saat hydration
- ✅ State terpulihkan: item, diner, assignment, tax, serviceCharge
- ✅ Tab Assign dan Settle langsung aktif (karena `rawText` dan `items` ada)
- ✅ `BillSummaryCard` menampilkan data yang sama seperti sebelum refresh

**Status:** `____`  
**Catatan:**

---

### TC-004: Auto-Expire localStorage Setelah 2 Jam

| Field | Detail |
|-------|--------|
| **ID** | TC-004 |
| **Modul** | Zustand TTL |
| **Tipe** | Negative |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `useReceiptStore.ts` — `checkExpiration()` |

**Precondition:**
- Modifikasi `savedAt` di `localStorage` secara manual menjadi timestamp 2+ jam yang lalu
- Cara: DevTools → Application → localStorage → edit `savedAt` ke `Date.now() - 7_200_001`

**Langkah-langkah:**
1. Buka DevTools → Application → localStorage
2. Edit nilai `savedAt` pada key `split-bill-ocr-store` menjadi nilai timestamp lama
3. Refresh halaman

**Expected Result:**
- ❌ Data lama **tidak** terpulihkan
- ✅ State direset ke kondisi awal (kosong)
- ✅ Halaman tampil dalam kondisi fresh seperti TC-001
- ✅ Tab Assign dan Settle kembali disabled

**Status:** `____`  
**Catatan:**

---

## Modul 2 — Upload & OCR (FileUploader + OCRScanner)

### TC-005: Upload Gambar Struk Valid (Happy Path)

| Field | Detail |
|-------|--------|
| **ID** | TC-005 |
| **Modul** | FileUploader → OCRScanner → Parser |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `FileUploader.tsx`, `OCRScanner.tsx`, `/api/ocr` |

**Precondition:**
- `MISTRAL_API_KEY` valid dan aktif di `.env.local`
- Upload counter > 0 (belum habis limit)
- File gambar struk: JPG/PNG beresolusi jelas, teks terbaca

**Langkah-langkah:**
1. Di tab Scan, klik area upload atau tombol "Upload Photo"
2. Pilih file gambar struk yang valid
3. Tunggu proses selesai

**Expected Result:**
- ✅ Komponen `OCRScanner` muncul menggantikan FileUploader
- ✅ Preview gambar struk ditampilkan
- ✅ Scan beam animasi berjalan (animasi CSS `scan`)
- ✅ Badge "OCR" dengan icon `Cpu` terlihat di corner
- ✅ Status berurutan: `compressing` → `scanning` → (selesai)
- ✅ Setelah selesai, redirect otomatis ke tab **Assign**
- ✅ Item-item struk muncul di section "Review Item Struk"
- ✅ Nilai Pajak & Service Charge terparsing (jika ada di struk)
- ✅ Counter upload badge berkurang (mis. dari 5 → 4)

**Status:** `____`  
**Catatan:**

---

### TC-006: Upload via Drag & Drop

| Field | Detail |
|-------|--------|
| **ID** | TC-006 |
| **Modul** | FileUploader — Drag & Drop |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `FileUploader.tsx` |

**Precondition:** Sama dengan TC-005

**Langkah-langkah:**
1. Seret (drag) file gambar struk dari file manager
2. Lepaskan (drop) di atas area upload

**Expected Result:**
- ✅ Saat file di-drag ke area, area berubah visual (highlight drag-over)
- ✅ Setelah di-drop, proses OCR berjalan sama seperti TC-005
- ✅ File non-gambar (PDF, DOCX) yang di-drop tidak memicu proses

**Status:** `____`  
**Catatan:**

---

### TC-007: Upload Gambar Ukuran Besar (> 500KB)

| Field | Detail |
|-------|--------|
| **ID** | TC-007 |
| **Modul** | Image Compression (Canvas API) |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `OCRScanner.tsx` — `compressImage()` |

**Precondition:** Siapkan file gambar berukuran > 500KB (mis. foto DSLR 2-5MB)

**Langkah-langkah:**
1. Upload file gambar > 500KB

**Expected Result:**
- ✅ File dikompresi dulu oleh Canvas API sebelum dikirim ke API
- ✅ Status `compressing` tampil sesaat
- ✅ Proses OCR tetap berhasil meskipun file original besar
- ✅ Tidak ada error network karena payload terlalu besar

**Status:** `____`  
**Catatan:**

---

### TC-008: Struk Buram / Kualitas Rendah — Parser Tidak Menemukan Item

| Field | Detail |
|-------|--------|
| **ID** | TC-008 |
| **Modul** | Parser Fallback + AlertModal |
| **Tipe** | Negative |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `OCRScanner.tsx`, `page.tsx` — `handleOCRCompleted`, `AlertModal.tsx` |

**Precondition:**
- Siapkan gambar struk yang sangat buram atau tidak terbaca
- Mistral OCR mengembalikan teks kosong atau noise saja (tanpa angka harga)

**Langkah-langkah:**
1. Upload gambar struk buram/tidak jelas
2. Tunggu proses OCR selesai

**Expected Result:**
- ✅ OCR selesai tanpa error (Mistral tetap return response)
- ✅ `parseReceipt()` mengembalikan `items: []`
- ✅ Modal **"Struk Tidak Terbaca"** muncul dengan pesan warning
- ✅ Tombol "Tambah Manual" tersedia di modal
- ✅ Setelah modal ditutup, user diarahkan ke tab Assign (untuk input manual)
- ✅ Section "Review Item Struk" kosong dengan teks placeholder

**Status:** `____`  
**Catatan:**

---

### TC-009: Upload Dibatalkan (Tombol Cancel)

| Field | Detail |
|-------|--------|
| **ID** | TC-009 |
| **Modul** | OCRScanner — Cancel |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `OCRScanner.tsx`, `page.tsx` — `handleCancel()` |

**Langkah-langkah:**
1. Upload gambar struk
2. Saat OCRScanner tampil, klik tombol Cancel (X) atau "Batalkan"

**Expected Result:**
- ✅ Proses OCR dihentikan
- ✅ `resetStore()` dipanggil — semua data dibersihkan
- ✅ User kembali ke tab Scan
- ✅ FileUploader tampil kembali dalam kondisi idle
- ✅ localStorage dibersihkan dari draft sebelumnya

**Status:** `____`  
**Catatan:**

---

### TC-010: Rate Limit Tercapai (Upload ke-6)

| Field | Detail |
|-------|--------|
| **ID** | TC-010 |
| **Modul** | Rate Limiting — Upstash Redis |
| **Tipe** | Negative |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `middleware.ts`, `OCRScanner.tsx` — status `rate_limited` |

**Precondition:** IP telah melakukan 5 upload dalam 24 jam terakhir (sliding window)

**Langkah-langkah:**
1. Upload file gambar ke-6 dalam hari yang sama
2. (atau simulasi dengan mock `429` response)

**Expected Result:**
- ✅ Middleware mengembalikan HTTP `429` dengan body `RATE_LIMIT_EXCEEDED`
- ✅ `OCRScanner` menampilkan UI "Batas Upload Harian Tercapai"
- ✅ Countdown timer tampil menghitung mundur waktu reset
- ✅ Tidak ada data yang berubah di store
- ✅ Tombol "Mengerti" tersedia untuk menutup state ini
- ✅ FileUploader menampilkan counter `0 remaining` dan kondisi disabled

**Status:** `____`  
**Catatan:**

---

### TC-011: FileUploader Disabled saat Limit Habis

| Field | Detail |
|-------|--------|
| **ID** | TC-011 |
| **Modul** | FileUploader — Limit Reached State |
| **Tipe** | Negative |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `FileUploader.tsx` — prop `remainingUploads={0}` |

**Precondition:** `remainingUploads` = 0 (diterima dari respons API sebelumnya)

**Langkah-langkah:**
1. Coba klik area upload
2. Coba klik tombol "Upload Photo" atau "Camera"

**Expected Result:**
- ❌ Tidak ada file dialog yang terbuka
- ✅ Area upload tampil dalam kondisi visual disabled
- ✅ Pesan "Kamu sudah melakukan 5 scan hari ini. Kembali lagi besok." tampil
- ✅ `aria-label` berubah menjadi "Batas scan harian tercapai"

**Status:** `____`  
**Catatan:**

---

### TC-012: API Error (Server 500)

| Field | Detail |
|-------|--------|
| **ID** | TC-012 |
| **Modul** | OCRScanner — API Error Handling |
| **Tipe** | Negative |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `OCRScanner.tsx` — status `api_error` |

**Precondition:** Simulasi dengan memutus koneksi internet atau mock `500` response dari `/api/ocr`

**Langkah-langkah:**
1. Upload gambar struk
2. Saat request dikirim, simulasikan network error / server error

**Expected Result:**
- ✅ Status berubah ke `api_error`
- ✅ Pesan error tampil (bukan crash putih)
- ✅ Tombol "Coba Lagi" tersedia
- ✅ Tombol "Batal" tersedia untuk kembali ke upload
- ✅ Store tidak berubah (data lama aman)

**Status:** `____`  
**Catatan:**

---

### TC-013: Upload Struk Baru Menghapus Data Lama (Auto-Clear)

| Field | Detail |
|-------|--------|
| **ID** | TC-013 |
| **Modul** | Upload Reset Rule |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `page.tsx` — `handleFileSelected()` + `handleOCRCompleted()` |

**Precondition:** State dari sesi sebelumnya ada (items, diners, assignments)

**Langkah-langkah:**
1. Pastikan ada data dari scan sebelumnya (tab Assign ada item dan diner)
2. Klik "Scan Baru" atau pergi ke tab Scan
3. Upload gambar struk baru

**Expected Result:**
- ✅ Saat upload dimulai, `resetStore()` dipanggil
- ✅ Semua item, diner, assignment, tax, serviceCharge dari sesi sebelumnya terhapus
- ✅ localStorage dibersihkan
- ✅ Data baru dari struk yang baru muncul menggantikannya
- ✅ Tidak ada data "bocor" dari sesi lama ke sesi baru

**Status:** `____`  
**Catatan:**

---

## Modul 3 — Review & Edit Item Struk (Tab Assign — Section 1)

### TC-014: Edit Nama Item Struk

| Field | Detail |
|-------|--------|
| **ID** | TC-014 |
| **Modul** | Review Item — Edit Name |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `page.tsx` → `updateItem()` |

**Precondition:** Sudah ada item hasil scan di tab Assign

**Langkah-langkah:**
1. Pergi ke tab Assign
2. Klik pada nama item di input field
3. Ubah nama item (mis. "NASI GORENG" → "Nasi Goreng Special")
4. Klik di luar field / tab ke field lain

**Expected Result:**
- ✅ Nama item berubah secara real-time
- ✅ Perubahan tersimpan ke Zustand store
- ✅ `BillSummaryCard` menampilkan nama yang sudah diupdate

**Status:** `____`  
**Catatan:**

---

### TC-015: Edit Qty Item — Naik & Turun

| Field | Detail |
|-------|--------|
| **ID** | TC-015 |
| **Modul** | Review Item — Edit Qty |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `page.tsx` → `updateItem()` |

**Langkah-langkah:**
1. Klik tombol `+` pada stepper qty suatu item → qty naik 1
2. Klik tombol `-` pada stepper qty suatu item → qty turun 1
3. Edit langsung field input qty dengan nilai tertentu

**Expected Result:**
- ✅ Qty berubah sesuai tombol yang diklik
- ✅ Subtotal di summary chips (header) terupdate
- ✅ Total price per item `(qty × price)` terupdate

**Status:** `____`  
**Catatan:**

---

### TC-016: Qty Item Tidak Bisa Di-bawah 1 (Batas Minimum)

| Field | Detail |
|-------|--------|
| **ID** | TC-016 |
| **Modul** | Review Item — Qty Boundary |
| **Tipe** | Negative |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `page.tsx` — `Math.max(1, item.qty - 1)` |

**Langkah-langkah:**
1. Klik tombol `-` pada item yang sudah memiliki qty = 1
2. Coba masukkan nilai `0` atau nilai negatif di input qty

**Expected Result:**
- ❌ Qty tidak bisa turun di bawah 1
- ✅ Nilai minimum tetap `1`
- ✅ Tidak ada error atau crash

**Status:** `____`  
**Catatan:**

---

### TC-017: Edit Harga Item

| Field | Detail |
|-------|--------|
| **ID** | TC-017 |
| **Modul** | Review Item — Edit Price |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `page.tsx` → `updateItem()` |

**Langkah-langkah:**
1. Klik field harga suatu item
2. Ubah nilainya (mis. dari `15000` → `25000`)

**Expected Result:**
- ✅ Harga diperbarui di store
- ✅ Subtotal pada summary chips terupdate
- ✅ Kalkulasi di `BillSummaryCard` ikut berubah proporsional

**Status:** `____`  
**Catatan:**

---

### TC-018: Tambah Item Manual

| Field | Detail |
|-------|--------|
| **ID** | TC-018 |
| **Modul** | Add Item Manual |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `page.tsx` — tombol "+ Add Item" → `addItem()` |

**Langkah-langkah:**
1. Scroll ke bawah section Review Item Struk
2. Klik tombol dashed "+ Add Item"
3. Isi nama, qty, dan harga untuk item baru

**Expected Result:**
- ✅ Item baru muncul di list dengan nama "New Item", qty 1, harga 0
- ✅ Item dapat langsung diedit
- ✅ Item baru tersimpan di Zustand store dengan ID unik (`crypto.randomUUID`)
- ✅ Subtotal terupdate setelah harga diisi

**Status:** `____`  
**Catatan:**

---

### TC-019: Hapus Item

| Field | Detail |
|-------|--------|
| **ID** | TC-019 |
| **Modul** | Delete Item |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `page.tsx` — `deleteItem()` |

**Langkah-langkah:**
1. Klik ikon Trash2 (🗑️) pada salah satu item

**Expected Result:**
- ✅ Item terhapus dari list
- ✅ Assignment untuk item tersebut juga terhapus dari store (orphaned state dibersihkan)
- ✅ Subtotal terupdate

**Status:** `____`  
**Catatan:**

---

### TC-020: Edit Tax dan Service Charge Manual

| Field | Detail |
|-------|--------|
| **ID** | TC-020 |
| **Modul** | Biaya Tambahan — Tax & Service Charge |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `page.tsx` — `setTax()`, `setServiceCharge()` |

**Langkah-langkah:**
1. Scroll ke section "Biaya Tambahan" di tab Assign
2. Edit field "Pajak / Tax" dengan nilai misal `15000`
3. Edit field "Service" dengan nilai misal `10000`

**Expected Result:**
- ✅ Nilai tersimpan di store
- ✅ Grand Total di `BillSummaryCard` langsung terupdate: `subtotal + tax + service`
- ✅ Kalkulasi proporsional per diner ikut berubah

**Status:** `____`  
**Catatan:**

---

## Modul 4 — Manajemen Peserta (DinerSelector)

### TC-021: Tambah Diner Baru

| Field | Detail |
|-------|--------|
| **ID** | TC-021 |
| **Modul** | DinerSelector — Add Diner |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `DinerSelector.tsx`, `useReceiptStore` — `addDiner()` |

**Langkah-langkah:**
1. Klik tombol "+ Tambah Orang" (dashed chip)
2. Ketik nama peserta (mis. "Budi")
3. Tekan Enter atau klik tombol centang (✓)

**Expected Result:**
- ✅ Diner "Budi" muncul sebagai pill di DinerSelector
- ✅ Avatar dengan inisial "B" tampil dalam pill
- ✅ Diner count badge di header section menampilkan "1 Orang"
- ✅ Tombol "Lihat Rekap" di footer menjadi aktif

**Status:** `____`  
**Catatan:**

---

### TC-022: Tambah Diner dengan Nama Duplikat

| Field | Detail |
|-------|--------|
| **ID** | TC-022 |
| **Modul** | DinerSelector — Duplicate Prevention |
| **Tipe** | Negative |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `useReceiptStore.ts` — `addDiner()` dengan guard duplikat |

**Langkah-langkah:**
1. Tambah diner "Budi"
2. Tambah diner "Budi" lagi dengan nama yang sama persis

**Expected Result:**
- ❌ Diner kedua dengan nama sama tidak ditambahkan
- ✅ List diner tetap hanya berisi satu "Budi"
- ✅ Store tidak berubah (guard `if (state.diners.includes(name)) return {}`)

**Status:** `____`  
**Catatan:**

---

### TC-023: Pilih Diner Aktif (Fast-Assign Mode)

| Field | Detail |
|-------|--------|
| **ID** | TC-023 |
| **Modul** | DinerSelector — Active Selection |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `DinerSelector.tsx`, `page.tsx` — `activeDinerName` |

**Precondition:** Minimal 2 diner sudah ditambahkan

**Langkah-langkah:**
1. Klik pill diner "Budi"
2. Perhatikan perubahan visual
3. Klik item di `ReceiptItemRow` dan lihat tombol fast-assign

**Expected Result:**
- ✅ Pill "Budi" mendapat glow border oranye (`border-primary` + shadow)
- ✅ `activeDinerName` = "Budi" di state
- ✅ Di setiap `ReceiptItemRow` yang terbuka, tombol "Assign to Budi" tampil
- ✅ Mengklik pill yang sama kedua kali → `activeDinerName` menjadi `null` (deselect)

**Status:** `____`  
**Catatan:**

---

### TC-024: Hapus Diner

| Field | Detail |
|-------|--------|
| **ID** | TC-024 |
| **Modul** | DinerSelector — Remove Diner |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `DinerSelector.tsx`, `useReceiptStore` — `removeDiner()` |

**Precondition:** Diner "Budi" sudah ada dan sudah di-assign ke beberapa item

**Langkah-langkah:**
1. Klik tombol `X` pada pill diner "Budi"

**Expected Result:**
- ✅ Pill "Budi" hilang dari list
- ✅ Semua assignment untuk "Budi" di semua item dihapus (orphaned state cleanup)
- ✅ `BillSummaryCard` tidak lagi menampilkan "Budi"
- ✅ Diner count badge berkurang

**Status:** `____`  
**Catatan:**

---

### TC-025: Tombol "Lihat Rekap" Disabled Tanpa Diner

| Field | Detail |
|-------|--------|
| **ID** | TC-025 |
| **Modul** | Footer CTA — Guard Diner |
| **Tipe** | Negative |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `page.tsx` — tombol "Lihat Rekap" dengan `disabled={diners.length === 0}` |

**Langkah-langkah:**
1. Pastikan tidak ada diner yang ditambahkan
2. Coba klik tombol "Lihat Rekap"

**Expected Result:**
- ❌ Tombol tidak dapat diklik
- ✅ Tombol tampil dengan warna `primary/30` (tidak full orange)
- ✅ Cursor `not-allowed`
- ✅ User tetap di tab Assign

**Status:** `____`  
**Catatan:**

---

## Modul 5 — Alokasi Item (ReceiptItemRow)

### TC-026: Expand / Collapse Item Row

| Field | Detail |
|-------|--------|
| **ID** | TC-026 |
| **Modul** | ReceiptItemRow — Toggle Expand |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `ReceiptItemRow.tsx` |

**Langkah-langkah:**
1. Klik header row suatu item
2. Klik lagi untuk menutup

**Expected Result:**
- ✅ Klik pertama: row expand, drawer controls muncul dengan animasi fade-in
- ✅ Border row berubah ke `border-primary` + glow shadow saat expanded
- ✅ Klik kedua: row collapse, drawer hilang
- ✅ Hanya satu row yang bisa expand secara bersamaan (diatur oleh `expandedItemId`)

**Status:** `____`  
**Catatan:**

---

### TC-027: Assign Item ke Diner — Increment (+0.5)

| Field | Detail |
|-------|--------|
| **ID** | TC-027 |
| **Modul** | ReceiptItemRow — Increment Assignment |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `ReceiptItemRow.tsx` — `handleIncrement()` |

**Precondition:** Item dengan qty = 2, Diner "Budi" sudah ada

**Langkah-langkah:**
1. Expand row item
2. Klik `+` untuk diner "Budi" sebanyak 2x
3. Lihat progress tracker

**Expected Result:**
- ✅ Setiap klik `+` menambah 0.5 share (klik 1 → 0.5, klik 2 → 1.0)
- ✅ Progress tracker menampilkan `1 / 2`
- ✅ Avatar chip diner tampil di collapsed strip
- ✅ Status pill: belum ada → "Unassigned" → partial warning → Done

**Status:** `____`  
**Catatan:**

---

### TC-028: Alokasi Tidak Melebihi Total Qty Item

| Field | Detail |
|-------|--------|
| **ID** | TC-028 |
| **Modul** | ReceiptItemRow — Qty Overflow Guard |
| **Tipe** | Negative |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `ReceiptItemRow.tsx` — `remainingQty`, tombol `+` disabled |

**Precondition:** Item qty = 1, sudah penuh dialokasikan ke "Budi" = 1.0

**Langkah-langkah:**
1. Expand row item yang sudah fully allocated
2. Coba klik `+` untuk diner manapun
3. Coba klik Quick Add untuk diner yang belum assigned

**Expected Result:**
- ❌ Tombol `+` berstatus `disabled` — tidak bisa diklik
- ❌ Quick Add chips berstatus `disabled`
- ✅ `remainingQty = 0` — tidak ada alokasi tambahan yang bisa dilakukan
- ✅ Status pill menunjukkan "Done" dengan warna success

**Status:** `____`  
**Catatan:**

---

### TC-029: Decrement Assignment (-)

| Field | Detail |
|-------|--------|
| **ID** | TC-029 |
| **Modul** | ReceiptItemRow — Decrement Assignment |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `ReceiptItemRow.tsx` — `handleDecrement()` |

**Precondition:** "Budi" sudah di-assign 1.5 share pada item qty=2

**Langkah-langkah:**
1. Expand row item
2. Klik `-` untuk "Budi" sebanyak 3x

**Expected Result:**
- ✅ Klik 1: dari 1.5 → 1.0
- ✅ Klik 2: dari 1.0 → 0.5
- ✅ Klik 3: dari 0.5 → 0 (assignment dihapus dari store, diner hilang dari diner row)
- ✅ Avatar chip "Budi" hilang dari collapsed strip setelah 0

**Status:** `____`  
**Catatan:**

---

### TC-030: Quick Add Diner ke Item

| Field | Detail |
|-------|--------|
| **ID** | TC-030 |
| **Modul** | ReceiptItemRow — Quick Add |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `ReceiptItemRow.tsx` — `handleQuickAssign()` |

**Precondition:** Item qty=2, ada 2 diner: "Budi" dan "Ani", keduanya belum assigned

**Langkah-langkah:**
1. Expand item row
2. Klik chip "+ Budi" di section "Quick Add"

**Expected Result:**
- ✅ "Budi" mendapat 1.0 share langsung (initial = min(remainingQty, 1))
- ✅ "Budi" muncul di Diner Splits section dengan nilai 1
- ✅ "Budi" hilang dari Quick Add section (sudah assigned)
- ✅ Progress tracker: `1 / 2`

**Status:** `____`  
**Catatan:**

---

### TC-031: Fast-Assign via Active Diner CTA

| Field | Detail |
|-------|--------|
| **ID** | TC-031 |
| **Modul** | ReceiptItemRow — Fast-Assign Active Diner |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `ReceiptItemRow.tsx` — tombol "Assign to [activeDiner]" |

**Precondition:** "Budi" dipilih sebagai active diner di DinerSelector

**Langkah-langkah:**
1. Expand item row
2. Klik tombol "Assign to Budi" di bagian bawah drawer

**Expected Result:**
- ✅ "Budi" langsung di-assign (quick assign atau increment jika sudah ada)
- ✅ Tombol "Assign to Budi" hanya tampil jika item belum fully allocated DAN ada active diner

**Status:** `____`  
**Catatan:**

---

## Modul 6 — Ringkasan Tagihan (BillSummaryCard)

### TC-032: Tampilan Awal BillSummaryCard tanpa Diner

| Field | Detail |
|-------|--------|
| **ID** | TC-032 |
| **Modul** | BillSummaryCard — No Diners State |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `BillSummaryCard.tsx` |

**Precondition:** Item ada, tapi belum ada diner

**Expected Result:**
- ✅ Menampilkan "Ringkasan Tagihan" sebagai header fallback
- ✅ Grand Total struk tampil dalam format `Rp X.XXX.XXX`
- ✅ Pesan "Tambah peserta untuk split otomatis" tampil

**Status:** `____`  
**Catatan:**

---

### TC-033: Featured Diner — Subtotal Aktif

| Field | Detail |
|-------|--------|
| **ID** | TC-033 |
| **Modul** | BillSummaryCard — Featured Diner |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `BillSummaryCard.tsx` |

**Precondition:** 3 diner ada (Budi, Ani, Caca), "Ani" adalah activeDinerName

**Expected Result:**
- ✅ Header besar menampilkan "SUBTOTAL ANI"
- ✅ Total Ani ditampilkan dalam font besar (`text-3xl`)
- ✅ Diner lain (Budi, Caca) ditampilkan sebagai mini chips di bawah
- ✅ Klik "Rincian" → dropdown detail item untuk Ani muncul

**Status:** `____`  
**Catatan:**

---

### TC-034: Warning Unassigned Amount

| Field | Detail |
|-------|--------|
| **ID** | TC-034 |
| **Modul** | BillSummaryCard — Unassigned Warning |
| **Tipe** | Negative |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `BillSummaryCard.tsx` — `unassignedSubtotal` |

**Precondition:** Ada item belum terisi penuh (partial allocation), diner sudah ada

**Expected Result:**
- ✅ Banner warning tampil di atas card: "Rp X.XXX belum dibagi ke siapapun"
- ✅ Banner berwarna warning (`bg-warning/8`, text warning)
- ✅ Pesan mengingatkan agar pajak terbagi akurat

**Status:** `____`  
**Catatan:**

---

### TC-035: Kalkulasi Pajak Proporsional

| Field | Detail |
|-------|--------|
| **ID** | TC-035 |
| **Modul** | Calculator — Proportional Tax |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `src/lib/calculator.ts` — `calcDinerBreakdowns()` |

**Precondition:**
- Item: A = Rp 50.000, B = Rp 50.000 (subtotal = Rp 100.000)
- Tax = Rp 10.000, Service = Rp 5.000
- Diner "Budi" dapat item A, "Ani" dapat item B (50/50)

**Expected Result:**
- ✅ Budi subtotal = 50.000, pajak = 5.000 (50%), service = 2.500 (50%), total = **57.500**
- ✅ Ani subtotal = 50.000, pajak = 5.000 (50%), service = 2.500 (50%), total = **57.500**
- ✅ Grand Total = **Rp 115.000** (semua dibulatkan dengan `Math.round`)

**Status:** `____`  
**Catatan:**

---

### TC-036: Kalkulasi Pajak — Diner dengan Porsi Tidak Sama

| Field | Detail |
|-------|--------|
| **ID** | TC-036 |
| **Modul** | Calculator — Unequal Split Tax |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `src/lib/calculator.ts` |

**Precondition:**
- Item: Nasi Goreng qty=1 @ Rp 30.000, Ayam Bakar qty=1 @ Rp 70.000 (subtotal = 100.000)
- Tax = Rp 10.000
- Budi: dapat Nasi Goreng (subtotal 30.000), Ani: dapat Ayam Bakar (subtotal 70.000)

**Expected Result:**
- ✅ Budi: pajak = 10.000 × (30.000/100.000) = **Rp 3.000**, total = **33.000**
- ✅ Ani: pajak = 10.000 × (70.000/100.000) = **Rp 7.000**, total = **77.000**
- ✅ Formula: `(subtotal diner / subtotal keseluruhan) × pajak`

**Status:** `____`  
**Catatan:**

---

## Modul 7 — Tab Settle & Share Report

### TC-037: Tampilan Tab Settle — Daftar Diner

| Field | Detail |
|-------|--------|
| **ID** | TC-037 |
| **Modul** | Tab Settle — Breakdown Display |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `page.tsx` — tab "settle", `calcDinerBreakdowns()` |

**Precondition:** Semua item terisi, minimal 2 diner dengan assignment

**Langkah-langkah:**
1. Klik tombol "Lihat Rekap" atau tab Settle di bottom nav

**Expected Result:**
- ✅ Section "Settle Up" tampil
- ✅ Setiap diner tampil dalam row: avatar initial + nama + total
- ✅ "Grand Total" tampil di bawah list diner
- ✅ Tombol "Back" dan "Salin Rekap" tersedia

**Status:** `____`  
**Catatan:**

---

### TC-038: Salin Rekap ke Clipboard (Happy Path)

| Field | Detail |
|-------|--------|
| **ID** | TC-038 |
| **Modul** | ShareReportButton — Copy to Clipboard |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `ShareReportButton.tsx` |

**Precondition:**
- Browser mendukung Clipboard API
- Minimal 1 diner dengan assignment > 0

**Langkah-langkah:**
1. Di tab Settle, klik tombol "Salin Rekap"
2. Buka aplikasi chat (mis. WhatsApp) dan paste teks

**Expected Result:**
- ✅ Tombol berubah menjadi ✓ "Tersalin!" dengan icon `Check` hijau
- ✅ Setelah 2 detik, tombol kembali ke state normal "Salin Rekap"
- ✅ Teks yang di-paste berformat:
  ```
  🧾 *Split Bill: Struk Belanja*
  -------------------------
  👤 *Budi*: Rp 57.500
  - Nasi Goreng (x1): Rp 30.000
  - Pajak & Layanan: Rp 3.000
  -------------------------
  Total Tagihan: Rp 115.000
  ```
- ✅ Diner dengan `subtotal = 0` tidak muncul di rekap

**Status:** `____`  
**Catatan:**

---

### TC-039: Salin Rekap — Clipboard API Tidak Tersedia

| Field | Detail |
|-------|--------|
| **ID** | TC-039 |
| **Modul** | ShareReportButton — Clipboard Fallback |
| **Tipe** | Negative |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `ShareReportButton.tsx` — `catch()` handler |

**Precondition:** Simulasi clipboard error (mis. browser tanpa `navigator.clipboard` atau permission ditolak)

**Langkah-langkah:**
1. Block clipboard permission di browser settings
2. Klik tombol "Salin Rekap"

**Expected Result:**
- ❌ Copy gagal
- ✅ AlertModal muncul: "Gagal Menyalin Rekap"
- ✅ Pesan: "Browser kamu tidak mengizinkan akses clipboard. Silakan salin teks secara manual"
- ✅ Tombol "Oke, Mengerti" menutup modal

**Status:** `____`  
**Catatan:**

---

### TC-040: Tombol "Salin Rekap" Disabled Tanpa Diner

| Field | Detail |
|-------|--------|
| **ID** | TC-040 |
| **Modul** | ShareReportButton — Disabled State |
| **Tipe** | Negative |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `ShareReportButton.tsx` — `isDisabled = diners.length === 0` |

**Precondition:** Di tab Settle tetapi tidak ada diner

**Expected Result:**
- ❌ Tombol tidak dapat diklik
- ✅ Tombol tampil dengan warna `primary/30`
- ✅ Cursor `not-allowed`

**Status:** `____`  
**Catatan:**

---

## Modul 8 — Parser & Regex Engine

### TC-041: Parse Struk Standard Indonesia

| Field | Detail |
|-------|--------|
| **ID** | TC-041 |
| **Modul** | Parser — Standard Format |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `src/lib/parser.ts` — `parseReceipt()` |

**Input (raw text):**
```
RESTORAN MAKAN ENAK
Jl. Sudirman No. 5
---
1 NASI GORENG SPESIAL    28.000
2 ES TEH MANIS            8.000
Subtotal                 44.000
PB1 10%                   4.400
Service 5%                2.200
Total                    50.600
```

**Expected Result:**
- ✅ Item 1: `name = "NASI GORENG SPESIAL"`, qty = 1, price = 28.000
- ✅ Item 2: `name = "ES TEH MANIS"`, qty = 2, price = 4.000 (totalPrice/qty = 8.000/2)
- ✅ `tax = 4.400`
- ✅ `serviceCharge = 2.200`
- ✅ Baris "Subtotal" dan "Total" tidak masuk ke items

**Status:** `____`  
**Catatan:**

---

### TC-042: Parse Qty di Akhir Nama Item

| Field | Detail |
|-------|--------|
| **ID** | TC-042 |
| **Modul** | Parser — Qty Pattern End |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `src/lib/parser.ts` — regex `qtyEndMatch` |

**Input:**
```
AYAM BAKAR 2         70.000
```

**Expected Result:**
- ✅ `name = "AYAM BAKAR"`, qty = 2, price = 35.000

**Status:** `____`  
**Catatan:**

---

### TC-043: OCR Noise — Huruf 'O' Dibaca sebagai '0'

| Field | Detail |
|-------|--------|
| **ID** | TC-043 |
| **Modul** | Parser — `cleanNumberString()` |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `src/lib/parser.ts` — `cleanNumberString()` |

**Input string harga:** `"2O.OOO"` (huruf O bukan angka 0)

**Expected Result:**
- ✅ Output: `20000`
- ✅ Huruf O/o diganti dengan 0 sebelum diparse

**Status:** `____`  
**Catatan:**

---

### TC-044: Parse Struk Kosong / Teks Kosong

| Field | Detail |
|-------|--------|
| **ID** | TC-044 |
| **Modul** | Parser — Empty Input |
| **Tipe** | Negative |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | `src/lib/parser.ts` — guard `if (!rawText)` |

**Input:** `""` (string kosong)

**Expected Result:**
- ✅ Return `{ items: [], tax: 0, serviceCharge: 0 }` tanpa error
- ✅ Tidak ada crash atau exception

**Status:** `____`  
**Catatan:**

---

## Modul 9 — Aksesibilitas & Responsivitas

### TC-045: Navigasi Keyboard — FileUploader

| Field | Detail |
|-------|--------|
| **ID** | TC-045 |
| **Modul** | Aksesibilitas — Keyboard |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `FileUploader.tsx` — `onKeyDown`, `tabIndex` |

**Langkah-langkah:**
1. Tab ke area upload menggunakan keyboard
2. Tekan Enter atau Space

**Expected Result:**
- ✅ File dialog terbuka saat Enter/Space ditekan
- ✅ `aria-label` "Upload foto struk" terbaca oleh screen reader

**Status:** `____`  
**Catatan:**

---

### TC-046: Aksesibilitas ReceiptItemRow — Keyboard Expand

| Field | Detail |
|-------|--------|
| **ID** | TC-046 |
| **Modul** | Aksesibilitas — ReceiptItemRow |
| **Tipe** | Positive |
| **Prioritas** | P2 — Normal |
| **🎯 Komponen** | `ReceiptItemRow.tsx` — `onKeyDown`, `role="button"`, `aria-expanded` |

**Langkah-langkah:**
1. Tab ke header row item
2. Tekan Enter atau Space

**Expected Result:**
- ✅ Row expand/collapse via keyboard
- ✅ `aria-expanded={true/false}` berubah sesuai state
- ✅ `aria-label` terbaca: "Buka detail [nama item]"

**Status:** `____`  
**Catatan:**

---

### TC-047: Tampilan Mobile — Layout Responsif

| Field | Detail |
|-------|--------|
| **ID** | TC-047 |
| **Modul** | Responsivitas Mobile |
| **Tipe** | Positive |
| **Prioritas** | P1 — Tinggi |
| **🎯 Komponen** | Semua komponen |

**Langkah-langkah:**
1. Buka DevTools → Toggle Device Toolbar (mobile 390×844)
2. Navigasi melalui semua tab

**Expected Result:**
- ✅ Semua konten dalam satu kolom (flex-col)
- ✅ Tidak ada horizontal overflow
- ✅ Touch target minimal 48×48px (tombol, stepper, tab)
- ✅ Bottom Nav tidak menutupi konten (padding-bottom via `pb-nav`)
- ✅ Max-width `max-w-md` berpusat di layar lebih lebar

**Status:** `____`  
**Catatan:**

---

## Modul 10 — Skenario End-to-End Penuh (Full User Journey)

### TC-048: Full Journey — 3 Orang, 5 Item, Split Tidak Rata

| Field | Detail |
|-------|--------|
| **ID** | TC-048 |
| **Modul** | Full E2E Journey |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | Semua komponen |

**Scenario:**
- Budi: Nasi Goreng (1) + setengah Ayam Bakar
- Ani: Mie Goreng (1) + setengah Ayam Bakar
- Caca: Soto Betawi (1)

**Langkah-langkah:**
1. Buka aplikasi → tab Scan
2. Upload foto struk dengan 5 item (Nasi Goreng 25rb, Mie Goreng 22rb, Ayam Bakar 35rb, Soto 30rb, Es Teh 10rb × 3)
3. OCR selesai → tab Assign terbuka
4. Tambah diner: Budi, Ani, Caca
5. Assign:
   - Nasi Goreng → Budi (1)
   - Mie Goreng → Ani (1)
   - Ayam Bakar → Budi (0.5), Ani (0.5)
   - Soto → Caca (1)
   - Es Teh × 3 → Budi (1), Ani (1), Caca (1)
6. Klik "Lihat Rekap"
7. Verifikasi breakdown di tab Settle
8. Klik "Salin Rekap"
9. Paste di chat

**Expected Result:**
- ✅ Semua item terisi penuh (status "Done" di setiap row)
- ✅ Tidak ada unassigned warning di BillSummaryCard
- ✅ Kalkulasi masing-masing diner akurat (subtotal + pajak proporsional)
- ✅ Teks rekap ter-copy dengan format WhatsApp yang benar
- ✅ Total semua diner = Grand Total struk

**Status:** `____`  
**Catatan:**

---

### TC-049: Full Journey — Scan Baru Menghapus Sesi Lama

| Field | Detail |
|-------|--------|
| **ID** | TC-049 |
| **Modul** | Full E2E — Reset Flow |
| **Tipe** | Positive |
| **Prioritas** | P0 — Kritis |
| **🎯 Komponen** | `page.tsx` — `handleReset()`, `handleFileSelected()` |

**Langkah-langkah:**
1. Selesaikan satu sesi split bill lengkap (TC-048)
2. Klik "Scan Baru" di footer tab Assign
3. Konfirmasi redirect ke tab Scan
4. Upload struk baru

**Expected Result:**
- ✅ Semua data sesi lama (item, diner, assignment) terhapus
- ✅ localStorage dibersihkan
- ✅ Data baru dari struk kedua dimuat tanpa kontaminasi
- ✅ Tab Assign menampilkan item baru saja

**Status:** `____`  
**Catatan:**

---

## Ringkasan Test Suite

| Modul | Total TC | Positive | Negative | P0 | P1 | P2 |
|-------|----------|----------|----------|----|----|-----|
| 1. Inisialisasi & Halaman Awal | 4 | 3 | 1 | 1 | 2 | 1 |
| 2. Upload & OCR | 9 | 5 | 4 | 4 | 3 | 2 |
| 3. Review & Edit Item | 7 | 6 | 1 | 0 | 2 | 5 |
| 4. Manajemen Peserta | 5 | 3 | 2 | 1 | 2 | 2 |
| 5. Alokasi Item | 6 | 5 | 1 | 2 | 2 | 2 |
| 6. BillSummaryCard | 4 | 3 | 1 | 2 | 1 | 1 |
| 7. Settle & Share | 4 | 2 | 2 | 2 | 1 | 1 |
| 8. Parser & Regex | 4 | 3 | 1 | 0 | 2 | 2 |
| 9. Aksesibilitas & Responsivitas | 3 | 3 | 0 | 0 | 1 | 2 |
| 10. Full E2E Journey | 2 | 2 | 0 | 2 | 0 | 0 |
| **TOTAL** | **49** | **35** | **13** | **14** | **16** | **18** |

> **Prioritas:**  
> **P0 (Kritis)** = Blocker jika gagal · **P1 (Tinggi)** = Major bug · **P2 (Normal)** = Minor/UX

---

*Dokumen ini dibuat berdasarkan analisis kode sumber versi: commit terkini per 23 Juli 2026.*
