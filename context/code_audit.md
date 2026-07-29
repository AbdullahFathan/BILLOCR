# Code Audit — BILLOCR (Aura Split)
**Tanggal Audit:** 21 Juli 2026  
**Auditor:** Antigravity AI  
**Versi Kode:** Post-Milestone 6 (Mistral OCR Migration)  
**Status Proyek:** Production-ready (MVP)

---

## 📊 Skor Keseluruhan

| Kategori | Skor | Status |
|----------|------|--------|
| Keamanan (Security) | 9/10 | ✅ Sangat Baik |
| Arsitektur | 8.5/10 | ✅ Sangat Baik |
| Kualitas Kode | 7.5/10 | ✅ Baik |
| Desain System Compliance | 9/10 | ✅ Sangat Baik |
| Performa | 7/10 | ⚠️ Perlu Perhatian |
| Error Handling | 7/10 | ⚠️ Perlu Perhatian |
| Aksesibilitas | 5/10 | ⚠️ Kurang |
| Kelengkapan Fitur | 8/10 | ✅ Baik |

---

## 1. ✅ Keamanan (Security)

### Temuan Baik

- **API Key aman** — `MISTRAL_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` hanya dibaca via `process.env` di server-side. Tidak ada kebocoran ke client bundle.
- **OCR server-side** — Invariant terpenuhi: Mistral SDK hanya dipanggil dari `src/lib/mistralOCR.ts` yang diakses via Route Handler. Tidak ada direct call dari Client Component.
- **Rate limiting di Edge** — `Ratelimit` instance hanya di `middleware.ts`, sesuai aturan arsitektur.
- **Input validation** — Route Handler `/api/ocr` memvalidasi `imageBase64` dan `mimeType` sebelum memanggil Mistral.
- **IP detection** — Middleware membaca `x-forwarded-for` dengan benar, fallback ke `"anonymous"` jika tidak ada.

### Temuan Perlu Perhatian

> [!WARNING]
> **File upload validation lemah** — `FileUploader.tsx` hanya memeriksa `type.startsWith("image/")` pada drop handler, namun tidak melakukan validasi ukuran file maksimum sebelum dikirim ke server. File sangat besar (misal >10MB) bisa menyebabkan timeout atau error yang tidak ter-handle dengan baik.

> [!NOTE]
> **MIME type bisa dipalsukan** — Tidak ada validasi MIME type di sisi server (`route.ts`). Meski Mistral akan gagal memproses file non-gambar, sebaiknya ada whitelist validasi: `["image/jpeg", "image/png", "image/webp", "image/gif"]`.

---

## 2. 🏗️ Arsitektur

### Temuan Baik

- **Separation of concerns** sangat baik: OCR logic (server) → parser logic (shared utility) → state (Zustand client) → UI (React components).
- **App Router** digunakan dengan benar. `page.tsx` memakai `"use client"` karena memang butuh interaktivitas penuh. Komponen-komponen lain juga tepat menggunakan `"use client"`.
- **Folder structure** rapi dan sesuai `architecture.md`.
- **Zustand persist middleware** dengan TTL 2 jam terimplementasi dengan benar di `useReceiptStore.ts`. TTL-check berjalan di `onRehydrateStorage`.
- **Upload reset rule** terpenuhi — `resetStore()` dipanggil di `FileUploader.tsx` sebelum `onFileSelected`.

### Temuan Perlu Perhatian

> [!WARNING]
> **`page.tsx` terlalu besar (577 baris)** — Halaman utama memuat logika `handleCopyRecap` (yang seharusnya jadi `ShareReportButton` terpisah sesuai `ui-registry.md`), logika kalkulasi total, dan seluruh render 3 tab dalam satu file. Ini melanggar prinsip *single responsibility* dan membuat file sulit di-maintain.

> [!NOTE]
> **`useHasHydrated` pattern berulang** — Hook ini sudah benar mencegah SSR hydration mismatch dari Zustand, namun pola `if (!hasHydrated) return <LoadingSpinner />` bisa digantikan dengan pattern `zustand/react` yang lebih modern menggunakan `useStore` selector dengan `shallow`.

```typescript
// Saat ini (di page.tsx line 143)
if (!hasHydrated) { return <Loader /> }

// Alternatif yang lebih bersih:
// Menggunakan Suspense boundary atau skeleton component
```

> [!CAUTION]
> **`runtime = "nodejs"` di Route Handler** — `src/app/api/ocr/route.ts` menetapkan `export const runtime = "nodejs"`. Ini benar karena Mistral SDK tidak kompatibel dengan Edge runtime. Namun perlu dipastikan di Vercel deployment bahwa fungsi ini tidak melebihi batas timeout Node.js serverless (default 10 detik). Mistral OCR bisa lambat pada gambar besar.

---

## 3. 🧹 Kualitas Kode

### Temuan Baik

- **TypeScript strict** digunakan dengan baik. Tidak ada `any` implisit yang ditemukan.
- **Shared types** terpusat di `src/types/index.ts` — `ReceiptItem`, `ReceiptState`, `OCRResponse`, `UploadStatus` semua terdefinisi.
- **`useReceiptStore.ts`** sangat bersih — semua aksi ter-enkapsulasi, tidak ada mutation langsung dari komponen.
- **`parser.ts`** modular — fungsi helper terpisah (`cleanNumberString`, `isSubtotalOrTotalLine`, `isHeaderOrMetadataLine`).
- **Error handling `OCRScanner`** komprehensif — menangani 429, API error, dan network error dengan UI yang berbeda per state.

### Temuan Perlu Perhatian

> [!WARNING]
> **`UploadStatus` type tidak digunakan** — `src/types/index.ts` mendefinisikan type `UploadStatus` (`"idle" | "compressing" | "scanning" | "done" | "rate_limited" | "api_error"`) namun `OCRScanner.tsx` menggunakan state boolean terpisah (`isRateLimited`, `error`) alih-alih state machine yang terdefinisi. Ini menyebabkan inkonsistensi antara type yang ada dan implementasi aktual.

> [!NOTE]
> **`processingRef` bisa race condition** — Di `OCRScanner.tsx`, `processingRef.current = false` di-set di blok `finally`. Namun `handleRetry` mereset `processingRef.current = false` secara manual sebelum me-trigger ulang `useEffect`. Pattern ini rentan jika user klik retry sangat cepat sebelum `finally` selesai berjalan.

> [!NOTE]
> **Magic number di `imageCompressor.ts`** — Nilai `maxWidth = 1600`, `maxHeight = 1600`, `quality = 0.75` adalah magic numbers. Sebaiknya diekstrak sebagai konstanta bernama.

```typescript
// Saat ini
export function compressImage(file: File, maxWidth = 1600, ...)

// Lebih baik
const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;
export function compressImage(file: File, maxWidth = MAX_IMAGE_DIMENSION, ...)
```

> [!NOTE]
> **Duplikasi logika kalkulasi diner** — Logika hitung `dinerSubtotal`, `dinerTax`, `dinerServiceCharge`, `dinerTotal` ditulis di **3 tempat berbeda**: `BillSummaryCard.tsx` (L46-86), `page.tsx` tab Settle (L492-500), dan `page.tsx` fungsi `handleCopyRecap` (L104-119). Ini harus di-refactor menjadi satu utility function di `src/lib/calculator.ts`.

> [!WARNING]
> **`eslint-disable-next-line`** di `OCRScanner.tsx` (baris 187) — Penggunaan `<img>` native di-suppress menggunakan `// eslint-disable-next-line @next/next/no-img-element`. Lebih baik gunakan `<Image>` dari `next/image` dengan `unoptimized` prop untuk gambar blob URL, atau justifikasi yang jelas dalam komentar.

---

## 4. 🎨 Design System Compliance

### Temuan Baik

- **Tidak ada raw hex** — Seluruh file komponen konsisten menggunakan token CSS (`text-primary`, `bg-surface`, `border-border`, dst). Tidak ditemukan hardcoded hex seperti `#fff` atau `text-[#1e293b]`.
- **Token tonal layering konsisten** — `surface-lowest` → `surface-low` → `surface` → `surface-high` → `surface-highest` digunakan sesuai hierarki elevasinya.
- **Animasi** `fade-in`, `slide-up`, `indeterminate`, `scan` semuanya terdefinisi di `globals.css` dan dipakai dengan benar.
- **Touch targets** ≥ 44px — Tombol-tombol utama konsisten menggunakan `h-12` (48px).
- **Typography** — `font-heading` (Outfit) digunakan untuk judul dan angka harga, `font-sans` (Inter) untuk body text.

### Temuan Perlu Perhatian

> [!NOTE]
> **Satu shadow hardcoded** — Di `FileUploader.tsx` (baris 68), terdapat: `shadow-[0_0_28px_rgba(255,199,122,0.18)]`. Warna `rgba(255,199,122,0.18)` adalah hex dari `--color-primary`. Seharusnya menggunakan `shadow-[0_0_28px_theme(colors.primary/18)]` atau token `--shadow-md` yang sudah ada.

> [!NOTE]
> **`bg-primary/8` bukan token resmi** — Di beberapa tempat (`OCRScanner.tsx`, `FileUploader.tsx`) digunakan `bg-primary/8` (opacity 8%). Ini valid di Tailwind v4 tapi tidak terdokumentasi di `ui-tokens.md`. Konsistensi opacity yang digunakan: ada `/5`, `/8`, `/10`, `/15`. Sebaiknya standarkan hanya ke `/5`, `/10`, `/15`, `/20`.

---

## 5. ⚡ Performa

### Temuan Baik

- **Canvas compression** sebelum upload ke API sudah ada (`imageCompressor.ts` → maksimal 1600px JPEG 75%).
- **Double-compression guard** di `OCRScanner.tsx` (baris 90-92): hanya compress ulang jika blob > 500KB.
- **`URL.createObjectURL` cleanup** dilakukan dengan benar menggunakan `return () => URL.revokeObjectURL(url)` di `useEffect`.

### Temuan Perlu Perhatian

> [!WARNING]
> **Tidak ada `loading="lazy"` pada image preview** — `<img>` di `OCRScanner.tsx` (baris 188) tidak menggunakan `loading="lazy"`. Meski untuk preview ini tidak kritikal, tambahkan `loading="eager"` eksplisit untuk kejelasan intent.

> [!WARNING]
> **`max-h-[300px]` dengan `overflow-y-auto` pada item list** — Di `page.tsx` (baris 257), daftar item di-scroll dalam container fixed height. Jika ada 50+ item hasil parse yang salah, UX menjadi buruk. Sebaiknya ada batas maksimum item yang ditampilkan dengan pagination atau virtual scrolling.

> [!NOTE]
> **`BillSummaryCard` recalculate setiap render** — Fungsi `dinerBreakdowns` (baris 46-86 di `BillSummaryCard.tsx`) menghitung ulang semua breakdown setiap render tanpa `useMemo`. Jika `items` atau `assignments` besar, ini bisa mempengaruhi performa rendering.

```typescript
// Tambahkan useMemo
const dinerBreakdowns = useMemo(() => 
  diners.map((dinerName) => { ... }),
  [diners, items, assignments, tax, serviceCharge, overallSubtotal]
);
```

---

## 6. 🛡️ Error Handling

### Temuan Baik

- **Rate limit UI** lengkap — countdown timer, pesan bahasa Indonesia, tombol kembali.
- **OCR error UI** — `AlertCircle` dengan pesan error + tombol retry + tombol cancel.
- **FileReader error** ditangkap di `imageCompressor.ts` (`reader.onerror`, `img.onerror`).

### Temuan Perlu Perhatian

> [!CAUTION]
> **Tidak ada `try-catch` di `navigator.clipboard.writeText`** — `handleCopyRecap` di `page.tsx` (baris 132) memanggil `navigator.clipboard.writeText(text).then(...)` tanpa `.catch()`. Di browser yang tidak mendukung Clipboard API (HTTP non-HTTPS, browser lama, atau user menolak permission), ini akan throw unhandled rejection.

```typescript
// Saat ini (rentan)
navigator.clipboard.writeText(text).then(() => {
  setCopySuccess(true);
  ...
});

// Seharusnya
navigator.clipboard.writeText(text)
  .then(() => { setCopySuccess(true); ... })
  .catch(() => {
    // Fallback: tampilkan toast error atau manual select
    alert("Gagal menyalin. Coba salin manual.");
  });
```

> [!WARNING]
> **Parser tidak memberi sinyal error ke UI** — `parseReceipt()` di `parser.ts` mengembalikan `{ items: [], tax: 0, serviceCharge: 0 }` jika gagal parse, tanpa indikasi apakah gagal karena data kosong atau karena format tidak dikenali. Pengguna akan melihat halaman Assign kosong tanpa penjelasan. Sesuai `code-standards.md` §4, seharusnya ada "helpful error toast".

> [!NOTE]
> **Tidak ada validasi di `addDiner`** — `DinerSelector.tsx` hanya trim input, tapi tidak memvalidasi panjang minimum (misalnya nama 1 karakter). `useReceiptStore` memang mencegah duplikat nama, tapi bukan nama kosong setelah trim (sudah ada `if (!trimmed) return`). Ini sudah aman, namun tidak ada feedback visual jika user memasukkan nama yang sudah ada.

---

## 7. ♿ Aksesibilitas (Accessibility)

> [!CAUTION]
> Kategori ini memiliki skor paling rendah dan perlu perhatian segera sebelum production launch.

### Temuan

| Komponen | Masalah | Rekomendasi |
|----------|---------|-------------|
| `BottomNav.tsx` | ✅ `aria-label`, `aria-current`, `role="progressbar"` sudah ada | - |
| `FileUploader.tsx` | ❌ Drop zone (`<div>`) tidak punya `role`, `tabIndex`, atau `aria-label` | Tambah `role="button" tabIndex={0} aria-label="Upload receipt image"` |
| `ReceiptItemRow.tsx` | ❌ Stepper `+/-` tidak punya `aria-label` kontekstual | Tambah `aria-label={Tambah porsi ${dinerName}}` |
| `DinerSelector.tsx` | ❌ Input nama tidak punya `<label>` eksplisit | Gunakan `aria-label` atau `<label htmlFor>` |
| `OCRScanner.tsx` | ⚠️ Scan beam (`<div>`) tidak punya `aria-hidden` | Tambah `aria-hidden="true"` pada elemen dekoratif |
| `BillSummaryCard.tsx` | ❌ Tombol "Rincian" tidak menjelaskan untuk siapa | Tambah `aria-label={Lihat rincian ${featuredDiner.name}}` |
| `page.tsx` | ❌ Tidak ada `<h1>` yang proper — "Aura Split" ada tapi di dalam conditional render | Pastikan `<h1>` ada di setiap kondisi render |

---

## 8. 🚧 Kelengkapan Fitur

### Fitur Pending (sesuai `ui-registry.md`)

| Fitur | Status | Catatan |
|-------|--------|---------|
| `ShareReportButton` | ⏳ Pending (komponen belum dibuat) | Logikanya sudah ada inline di `page.tsx`, perlu di-extract |
| WhatsApp share | ❌ Belum ada | `ui-registry.md` menyebut "share directly to WhatsApp" — tidak terimplementasi |

### Fitur yang Bekerja Baik
- ✅ Upload + kompresi + OCR
- ✅ Rate limiting + countdown UI
- ✅ Parser regex (item, pajak, service)
- ✅ Edit manual item (nama, qty, harga)
- ✅ Tambah/hapus peserta
- ✅ Assign porsi per item (stepper 0.5, quick-assign)
- ✅ Kalkulasi pajak proporsional
- ✅ Copy recap ke clipboard (format WhatsApp)
- ✅ LocalStorage TTL 2 jam
- ✅ Resume session (jika ada data sebelumnya)
- ✅ Bottom navigation 3 tab

---

## 9. 🔧 Rekomendasi Prioritas

### 🔴 Prioritas Tinggi (Bug / Security Risk)

1. **Tambahkan `.catch()` pada `navigator.clipboard.writeText`** — Risk: unhandled rejection di HTTPS yang ketat atau browser yang menolak clipboard permission.
2. **Validasi MIME type di Route Handler** — Whitelist `["image/jpeg", "image/png", "image/webp"]` untuk mencegah request dengan mimeType sembarang.
3. **Tambahkan ukuran file maksimum** di `FileUploader` sebelum trigger scanning (rekomendasi: max 15MB).

### 🟡 Prioritas Sedang (Maintainability / UX)

4. **Refactor logika kalkulasi diner** ke `src/lib/calculator.ts` — Hapus duplikasi di 3 tempat.
5. **Extract `ShareReportButton` komponen** sesuai `ui-registry.md`.
6. **Gunakan `UploadStatus` type** di `OCRScanner` alih-alih state boolean terpisah.
7. **Tambahkan error toast** saat parser menghasilkan 0 items.
8. **Wrap `BillSummaryCard` calculations** dengan `useMemo`.

### 🟢 Prioritas Rendah (Polish)

9. **Perbaiki shadow hardcoded** `rgba(255,199,122,0.18)` di `FileUploader`.
10. **Standarisasi opacity tokens** (`/5`, `/10`, `/15`, `/20`) di semua komponen.
11. **Tambahkan `aria-label`** pada elemen interaktif yang belum punya label.
12. **Tambahkan `aria-hidden="true"`** pada scan beam dan elemen dekoratif.
13. **Ekstrak magic numbers** di `imageCompressor.ts` ke konstanta.

---

## 10. 📈 Kesimpulan

Codebase BILLOCR dalam kondisi **sangat baik untuk ukuran MVP**. Arsitektur server/client boundary dijaga dengan ketat, design system konsisten, dan state management bersih. 

Risiko terbesar saat ini adalah:
1. **Duplikasi logika kalkulasi** yang akan menyulitkan perubahan formula pajak di masa depan.
2. **Aksesibilitas** yang perlu perbaikan sebelum aplikasi digunakan oleh pengguna yang lebih luas.
3. **`clipboard.writeText` tanpa `.catch()`** yang bisa menyebabkan silent failure di lingkungan tertentu.

Setelah 3 item prioritas tinggi diperbaiki, aplikasi ini **siap untuk production deployment**.

---

*Audit ini dihasilkan berdasarkan pembacaan source code secara statis. Disarankan untuk melakukan uji fungsional langsung di device mobile (terutama iOS Safari) untuk memverifikasi clipboard API, kamera capture, dan touch target behaviour.*
