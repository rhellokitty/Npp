# LAPORAN AUDIT TEKNIS & CETAK BIRU SISTEM OPERASIONAL PENGADAAN
### PT NUSANTARA PUNCAK PERKASA (NPP)

> **Dokumen Status Proyek, Inventaris Teknis, dan Spesifikasi Arsitektur Sistem**  
> **Tanggal Audit:** 6 November 2026  
> **Penyusun:** Antigravity AI Engineering Pair Programmer  
> **Klasifikasi:** Dokumen Internal & Rujukan Implementasi Mitra / Tim Pengembang  

---

## DAFTAR ISI
1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Struktur Direktori & File Lengkap Workspace](#2-struktur-direktori--file-lengkap-workspace)
3. [Rincian Mendalam Pekerjaan yang Sudah Selesai](#3-rincian-mendalam-pekerjaan-yang-sudah-selesai)
   - [3.1. Rincian File HTML & Komponen UI](#31-rincian-file-html--komponen-ui)
   - [3.2. Design System, Styling & Invarian Desain](#32-design-system-styling--invarian-desain)
   - [3.3. Logika Interaktif & Controller Vanilla JS](#33-logika-interaktif--controller-vanilla-js)
   - [3.4. Inventaris Aset Multimedia](#34-inventaris-aset-multimedia)
4. [Cetak Biru Scope Selanjutnya: Sistem Operasional Pengadaan (NPP HLD 001)](#4-cetak-biru-scope-selanjutnya-sistem-operasional-pengadaan-npp-hld-001)
   - [4.1. Prinsip & Batasan Arsitektur](#41-prinsip--batasan-arsitektur)
   - [4.2. Matriks Peran Pengguna (RBAC) & Hak Otorisasi](#42-matriks-peran-pengguna-rbac--hak-otorisasi)
   - [4.3. Alur Bisnis Operasional (End-to-End Flow)](#43-alur-bisnis-operasional-end-to-end-flow)
   - [4.4. Definisi Matematis & Logika Saldo Stok Gudang](#44-definisi-matematis--logika-saldo-stok-gudang)
   - [4.5. Mesin Status Transaksi (5 Dimensi Independen)](#45-mesin-status-transaksi-5-dimensi-independen)
   - [4.6. Rincian Modul, Halaman, Form Field & Kolom Data](#46-rincian-modul-halaman-form-field--kolom-data)
   - [4.7. Format Dokumen Final & Snapshot PDF](#47-format-dokumen-final--snapshot-pdf)
   - [4.8. Usulan Struktur Direktori & Rencana Implementasi Bertahap](#48-usulan-struktur-direktori--rencana-implementasi-bertahap)

---

## 1. RINGKASAN EKSEKUTIF

Proyek pengembangan web PT Nusantara Puncak Perkasa terbagi menjadi dua fase besar:
1. **Fase 1 (Selesai 100%): Company Profile Publik & Gerbang Login Otentikasi**
   - Halaman profil korporat interaktif dengan standar industri modern.
   - Menggunakan teknologi murni: **HTML5 Semantik, CSS3 Terpusat, dan Vanilla JavaScript (Zero Framework / Zero Runtime Bundler)**.
   - Memiliki fitur unggulan *In-Page Zero-Reload Product Detail Overlay*, *Continuous Infinite Marquee Logo Klien*, *Customer Testimonial Carousel 6 Klien Resmi*, dan *Inverted Border Radius (Cutout S-Curve)* yang telah teruji presisi di seluruh resolusi layar (Desktop > 1024px, Tablet 769px–1024px, dan Mobile <= 768px).
   - Memiliki halaman login mandiri (`login.html`) yang menyajikan visualisasi sistem pengadaan dan simulasi peran operasional.

2. **Fase 2 (Siap Dikerjakan): Sistem Operasional Pengadaan Terintegrasi**
   - Merujuk pada dokumen resmi **NPP HLD 001 (High Level Design - 21 Halaman)**.
   - Mencakup pengelolaan PO Pelanggan, PO Supplier, Kontrol Stok Gudang (5 Saldo), Pengiriman (Surat Jalan PDF), Penagihan (Invoice PDF & Termin), dan Manajemen Berkas Privat/Arsip.

---

## 2. STRUKTUR DIREKTORI & FILE LENGKAP WORKSPACE

Berikut adalah susunan file nyata yang tersimpan di dalam repositori:

```text
c:\Users\Muhammad Raja Daffa\Documents\antigravity\Npp\
├── .gitignore                      # Mengabaikan node_modules, log, dan temporary file
├── AGENTS.md                       # Invarian desain mutlak, aturan CSS global, dan formula S-Curve
├── build.js                        # Script automasi rilis (sinkronisasi root ke dist/ untuk deploy Netlify)
├── index.html                      # Halaman utama Company Profile + In-Page Product Detail Overlay
├── login.html                      # Halaman mandiri otentikasi login Portal Internal (Visual Cutout Card)
├── netlify.toml                    # Konfigurasi publish directory dan redirect rules server Netlify
├── package.json                    # Konfigurasi paket npm & script ("build": "node build.js")
├── product-detail.html             # Standalone fallback & redirector URL query ke modal overlay
├── Projek-NPP.html                 # Duplikat mandiri/mirror dari index.html untuk redundansi kerja
│
├── assets/                         # Direktori aset gambar & vektor lokal
│   ├── favicon.png                 # Web favicon resmi (rounded-corner squircle, resolusi 512x512)
│   ├── hero-moge-pattern.webp      # Pattern grafis latar belakang bento hero
│   ├── logo-npp.webp               # Master logo resmi PT Nusantara Puncak Perkasa (resolusi tinggi)
│   ├── moge-lineart.webp           # Vektor lineart teknis industri
│   │
│   ├── client/                     # Direktori logo mitra industri resmi (WebP)
│   │   ├── bizzy.webp              # PT. Bizzy Commerce Indonesia
│   │   ├── Duta-perpus.webp        # PT. Daya Pustaka Indonesia
│   │   ├── indovinck.webp          # PT. Indovicker Furnitama
│   │   ├── jasnita-logo-new.webp   # PT. Jasnita Telekomindo
│   │   ├── Master-Steel.webp       # PT. The Master Steel
│   │   └── Sumber-abadi.webp       # PT. Sumber Abadi Indonesia
│   │
│   └── product/                    # Direktori foto katalog produk resolusi tinggi
│       ├── BSB.webp                # Baterai BSB Industrial Storage VRLA
│       ├── RITAR.webp              # Baterai RITAR VRLA AGM & Deep Cycle
│       ├── UPS Ablerex1.webp       # UPS Ablerex Enterprise Modular (Tampak Depan Penuh)
│       ├── UPS Ablerex2.webp       # UPS Ablerex Enterprise Modular (Tampak Power Module)
│       └── UPS Ablerex3.webp       # UPS Ablerex Enterprise Modular (Tampak Internal Kabinet)
│
├── src/                            # Direktori kode sumber utama
│   ├── products-data.js            # Master data produk resmi (Single Source of Truth spesifikasi)
│   └── style.css                   # Global stylesheet terpadu (~3.050 baris CSS terstruktur)
│
└── dist/                           # Direktori hasil build statis (siap saji untuk live hosting CDN)
```

---

## 3. RINCIAN MENDALAM PEKERJAAN YANG SUDAH SELESAI

### 3.1. Rincian File HTML & Komponen UI

#### A. `index.html` (Landing Page Utama)
Memuat arsitektur 10 section wajib:
1. **`navbar-section` (`.navbar-wrapper`):**
   - Brand logo NPP dengan navigasi: *Beranda, Tentang Kami, Produk, Testimoni, Kontak*.
   - Tombol aksi **"Masuk"** yang mengarah langsung ke `login.html`.
   - Scrollspy dinamis (menyorot menu aktif sesuai scroll).
   - Fitur cerdas *Scroll Reveal / Auto Hide* dengan buffer akumulatif $120$px.
2. **`hero-section` (`.hero-wrapper`):**
   - Typography bento: *"Powering Your Continuity — Solusi Kelistrikan Terpercaya"*.
   - **`hero-main-card` (Inverted Border Radius):** Foto industri utama berukuran besar dengan sudut lengkung inversi di Kiri-Atas (Top-Left) dan Kanan-Bawah (Bottom-Right).
   - Rating badge: *250+ Proyek Industri, 99.98% Proteksi Uptime*, dan avatar bertumpuk (*overlap*).
   - Tombol CTA *"Jelajahi Solusi"* dengan smooth scroll ke `#products`.
   - Kartu pendukung: *Side photo card* serta 2 *highlight card* interaktif (*Enterprise Modular UPS* & *Industrial Battery Rack*).
   - **`hero-clients-wrapper`:** Infinite marquee slider yang mengalirkan 6 logo mitra industri tanpa jeda kosong (*seamless dual-group 3D transform*).
3. **`stats-section`:**
   - Menampilkan 3 metrik keandalan: `10.000+ SKU`, `250+ Proyek Selesai`, dan `99.98% Uptime Proteksi`.
4. **`about-section`:**
   - Profil resmi: Berdiri pada 22 Oktober 2026 sebagai distributor daya industri nasional.
   - Grid 4 pilar layanan: *Solusi Produk Terintegrasi, Jaringan Distribusi Strategis, Kemitraan Jangka Panjang,* dan *Pelayanan Berorientasi Pelanggan*.
   - Bento foto ganda dengan sudut lengkung Inverted Border Radius.
5. **`catalog-section` (`#products`):**
   - Filter Tabs Kategori (*Semua, Battery, UPS, Stabilizer, Inverter, Solar Panel*).
   - Kartu katalog terisi otomatis dari `src/products-data.js` tanpa merombak DOM (mencegah kedipan layout), dilengkapi badge status stok, harga penawaran formal B2B, dan penanda wishlist interaktif.
6. **`solutions-section`:**
   - 4 pilar integrasi: Konsultasi Teknis, Instalasi & Komisioning, Pemeliharaan Berkala, dan Garansi Resmi Prinsipal.
7. **`testimonial-section` (`#review`):**
   - Carousel slider horizontal memuat **6 klien korporat nyata** dari dokumen legal perusahaan:
     1. Ir. Budi Prasetyo (Head of Infrastructure, PT. Daya Pustaka Indonesia)
     2. Dewi Lestari, S.T. (Procurement Manager, PT. Jasnita Telekomindo)
     3. Hendra Kusuma (Plant Operations Director, PT. The Master Steel)
     4. Arif Rahman, M.T. (Facility Engineering Lead, PT. Sumber Abadi Indonesia)
     5. Surya Darmawan (Operations Manager, PT. Indovicker Furnitama)
     6. Rina Wijaya, S.E. (Supply Chain & Facility Head, PT. Bizzy Commerce Indonesia)
   - Komponen: Cutout avatar foto, quote icon, rating bintang, teks ulasan spesifik, active dots indicator, dan tombol navigasi panah kiri/kanan.
8. **`newsletter-section` / Kontak (`#contact`):**
   - Split layout: Sisi kiri menampilkan kontak resmi (Telepon, WhatsApp 24/7, Email, dan Alamat fisik Bekasi). Sisi kanan memuat embed Google Maps interaktif yang responsif.
9. **`footer-section`:**
   - Legalitas nama perseroan, tautan cepat kategori produk, navigasi perusahaan, form buletin email teknis, serta copyright 2026.
10. **In-Page Overlay View (`#productDetailView`):**
    - Sistem modal layar penuh (*Zero-Reload Navigation*) yang terbuka instan tanpa memuat ulang halaman.
    - Sinkronisasi URL dua arah via hash history (`#detail-1`, `#detail-2`).
    - Breadcrumb baris-tunggal rapi, sticky photo gallery dengan Inverted Border Radius cutout dan multi-thumbnail switcher (khusus UPS Ablerex memiliki 3 galeri foto detail modul).
    - Tombol WhatsApp otomatis ke Sales Engineering dan Tim Teknis dengan pesan terformat.
    - Tab spesifikasi teknis dinamis: *Spesifikasi Elektrikal*, *Proteksi & Standar*, serta *Dimensi & Lingkungan*.

#### B. `login.html` (Standalone Portal Internal)
- Gerbang otentikasi mandiri yang bersih dan berwibawa:
  - **Header:** Topbar logo resmi dan tombol *"Kembali ke Beranda"*.
  - **Sisi Kiri (Visual Card Inverted Border Radius):** Foto fasilitas industri ber-cutout sudut Kiri-Atas (Status: *Portal Internal - Akses Terenkripsi*) dan Kanan-Bawah (Status: *PO • Stok • Surat Jalan • Invoice*), dengan panel caption kaca transparan (*glassmorphism*).
  - **Sisi Kanan (Form Login Pegawai):** Selector cepat simulasi peran (*Administrator, Sales & PO, Purchasing, Stok Gudang, Finance & Invoice, Approver*), field email pegawai, field password dengan toggle mata intip, checkbox batas idle 30 menit, dan submit button dengan status otentikasi.
  - **Footer:** Pernyataan kepatuhan keamanan dan alamat kantor.

---

### 3.2. Design System, Styling & Invarian Desain

Seluruh visual diatur di [src/style.css](file:///c:/Users/Muhammad%20Raja%20Daffa/Documents/antigravity/Npp/src/style.css):

#### A. Palet Warna (Color System)
- **Background Halaman (`--bg-page`):** `#ffffff` (Putih)
- **Background Sekunder (`--bg-section-alt`):** `#f4f6fa` (Abu-abu kebiruan lembut, pemisah section)
- **Permukaan Kartu (`--bg-card`):** `#ffffff`
- **Muted Element (`--bg-card-muted`):** `#e9eef6`
- **Aksen Utama (`--accent-color`):** `#0c4a96` (Deep Industrial Navy Blue)
- **Aksen Emas / Rating (`--accent-gold` / `--accent-star`):** `#c99d51` / `#d4a249`
- **Teks Judul (`--text-primary`):** `#0a1b33` (Navy Pekat Kontras Tinggi)
- **Teks Paragraf (`--text-secondary`):** `#4b5d73` (Abu-abu baja)
- **Teks Keterangan (`--text-muted`):** `#8292a4`
- **Teks Kontras (`--text-inverse`):** `#ffffff`

#### B. Tipografi (Typography)
- **Font Utama:** `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Bobot Huruf:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)
- **Standar Heading:** Wajib menggunakan class `.section-heading` (Desktop: `2.1rem`, Mobile: `1.65rem`, line-height: `1.25`, font-weight: `600`).

#### C. Invarian Desain Wajib (`AGENTS.md`)
1. **Zero Border & Zero Box-Shadow:** Dilarang menggunakan border garis dan bayangan `box-shadow`. Pemisahan hanya mengandalkan kontras warna latar belakang atau padding tipis.
2. **Zero Scrollbar:** Dilarang menampilkan bilah scrollbar peramban di semua elemen (`scrollbar-width: none; ::-webkit-scrollbar { display: none !important; }`).
3. **Zero Hover Lift:** Dilarang menggunakan efek tombol terangkat (`transform: translateY(-...)`) pada hover elemen apa pun.
4. **Isolasi Desktop (> 1024px):** Dilarang mengubah kode styling desktop dasar; penyesuaian responsif diisolasi penuh di dalam `@media`.
5. **Invarian Geometri S-Curve Inverted Border Radius:**
   - Sudut lengkung inversi wajib mematuhi formula matematika:
     $$H \ge R_{\text{box}} + R_{\text{svg}}$$
   - **Desktop:** $R_{\text{box}} = 24\text{px}$, SVG $26\times 26\text{px}$ ($R_{\text{svg}} = 24\text{px}$, overlap $-2\text{px}$, offset $-24\text{px}$), tinggi total kotak $H \ge 48\text{px}$.
   - **Mobile (Skala $k = 0.75$):** $R_{\text{box}} = 18\text{px}$, SVG $19.5\times 19.5\text{px}$ ($R_{\text{svg}} = 18\text{px}$, overlap $-1.5\text{px}$, offset $-18\text{px}$), tinggi total kotak dikunci $H \ge 38\text{px}$.

---

### 3.3. Logika Interaktif & Controller Vanilla JS

1. **In-Page Product Detail Engine:** Mengelola pembukaan overlay instan, sinkronisasi URL hash (`#detail-{id}`), penguncian scroll layar, pemuatan spesifikasi dari memory cache `window.NPP_PRODUCTS`, dan penutupan bersih saat kembali ke katalog.
2. **Gallery Switcher:** Mengatur pergantian gambar produk utama dengan transisi opasitas $120$ms saat thumbnail diklik.
3. **Testimonial Carousel Controller:** Menghitung langkah geser berbasis lebar kartu aktual dan scroll-snap, merender indikator titik secara dinamis, serta mengaitkan tombol panah geser kiri dan kanan.
4. **Hero Infinite Marquee:** Menjalankan pergerakan logo 6 mitra secara kontinu dengan akselerasi GPU 3D transform tanpa risiko macet pada browser ponsel.
5. **Scrollspy & Navbar Manager:** Memantau posisi scroll aktif halaman terhadap section dan menerapkan auto-hide navbar yang cerdas.

---

### 3.4. Inventaris Aset Multimedia

- **Logo Resmi:** `assets/logo-npp.webp` & `assets/favicon.png` (Squircle 512x512).
- **Logo Mitra Industri (6 Klien Resmi):**
  - `assets/client/Duta-perpus.webp` (PT. Daya Pustaka Indonesia)
  - `assets/client/Sumber-abadi.webp` (PT. Sumber Abadi Indonesia)
  - `assets/client/jasnita-logo-new.webp` (PT. Jasnita Telekomindo)
  - `assets/client/Master-Steel.webp` (PT. The Master Steel)
  - `assets/client/indovinck.webp` (PT. Indovicker Furnitama)
  - `assets/client/bizzy.webp` (PT. Bizzy Commerce Indonesia)
- **Foto Produk Unggulan:**
  - `assets/product/RITAR.webp`
  - `assets/product/UPS Ablerex1.webp`, `UPS Ablerex2.webp`, `UPS Ablerex3.webp`
  - `assets/product/BSB.webp`

---

## 4. CETAK BIRU SCOPE SELANJUTNYA: SISTEM OPERASIONAL PENGADAAN (NPP HLD 001)

Bagian ini memuat spesifikasi lengkap dari dokumen **NPP HLD 001 (Versi 1.0 - 21 Halaman)** untuk dijadikan acuan baku dalam perancangan dan pembuatan modul portal internal.

---

### 4.1. Prinsip & Batasan Arsitektur
- **Tujuan Sistem:** Menyatukan kanal publik (katalog produk) dengan portal operasional internal untuk mengelola rantai pasok (PO Pelanggan, PO Supplier, Gudang, Pengiriman, dan Penagihan).
- **Pemisahan Domain/Jalur:** Halaman publik berada pada root `/` sedangkan portal operasional berada pada jalur terproteksi `/internal` (atau subdomain).
- **Integritas Data:**
  - Pemisahan fisik antara PO Pelanggan dengan PO Pembelian Supplier.
  - Pemisahan tegas antara status pengiriman fisik dengan status penagihan/invoice.
  - Setiap mutasi persediaan barang wajib tercatat pada buku besar mutasi (*Stock Ledger terposting*).
  - Dokumen hukum komersial (Invoice & Surat Jalan) wajib bersifat *immutable snapshot* (tidak berubah walau data master pelanggan/produk diperbarui di kemudian hari).

---

### 4.2. Matriks Peran Pengguna (RBAC) & Hak Otorisasi

Sistem menerapkan model kewenangan minimum (*Least Privilege Principle*):

| Peran (Role) | Kewenangan Utama | Batasan & Larangan Akses |
| :--- | :--- | :--- |
| **1. Administrator** | Manajemen user pegawai, penetapan role, parameter sistem, audit trail, backup teknis. | **Dilarang** menyetujui transaksi komersial atau merilis pembayaran kas tanpa persetujuan bisnis. |
| **2. Sales / Operasional** | Input data pelanggan, pembuatan penawaran (*Quotation*), input PO Pelanggan, unggah berkas PO asli, monitoring pemenuhan. | **Dilarang** mencatat pembayaran kas dan **dilarang** mengubah saldo fisik stok gudang. |
| **3. Purchasing** | Pengelolaan master vendor/supplier, perumusan kebutuhan barang, penerbitan PO Supplier. | Konfirmasi fisik barang masuk **hanya boleh dilakukan oleh petugas Gudang**. |
| **4. Gudang (Warehouse)** | Penerimaan fisik barang (Goods Receipt & QC), alokasi reservasi stok, cetak Surat Jalan, opname kartu stok. | Harga beli modal (*HPP*), margin profit, dan piutang pelanggan **disembunyikan** dari layar Gudang. |
| **5. Finance** | Penerbitan Invoice komersial (penuh/termin/DP), pencatatan bukti pelunasan bank, alokasi pembayaran, rekonsiliasi piutang. | **Dilarang** mengubah data pengiriman barang yang sudah diposting oleh tim logistik/gudang. |
| **6. Pimpinan / Approver** | Persetujuan PO Pelanggan & PO Supplier, otorisasi penyesuaian stok luar biasa, monitoring dashboard KPI eksekutif. | Persetujuan melekat pada versi data transaksi tertentu (perubahan harga/qty membatalkan approval). |
| **7. Editor Konten** | Manajemen katalog publik di company profile, artikel buletin, dan dokumentasi portofolio. | **Tidak memiliki akses sama sekali** ke portal transaksi, stok, gudang, maupun finansial. |

---

### 4.3. Alur Bisnis Operasional (End-to-End Flow)

1. **Penerimaan & Validasi PO Pelanggan:**
   - Admin Sales mencatat pelanggan, nomor PO eksternal, rincian barang, harga, target pengiriman, syarat pembayaran, PIC, dan mengunggah pindaian PO asli.
   - Pimpinan melakukan review dan persetujuan (*Approval*).
2. **Pemeriksaan Stok & Alokasi Reservasi:**
   - Sistem memeriksa ketersediaan stok layak pakai di gudang.
   - Barang yang tersedia langsung dikunci ke status **Reservasi** (tidak mengurangi stok fisik).
   - Barang yang kurang secara otomatis masuk ke antrean **Kebutuhan Pembelian (Procurement Need)** untuk ditindaklanjuti tim Purchasing.
3. **Pengadaan ke Supplier (Bila Stok Kurang):**
   - Purchasing menerbitkan PO Supplier ke prinsipal/pabrik resmi.
   - Saat barang tiba, tim Gudang melakukan pemeriksaan fisik dan uji fungsi (QC).
   - Barang lolos QC diposting ke *Stock Ledger* (Stok Fisik bertambah) dan dialokasikan ke PO Pelanggan terkait.
4. **Penerbitan Surat Jalan & Pengiriman (Logistik):**
   - Tim Gudang menyiapkan pengiriman (mendukung pengiriman bertahap/parsial).
   - Sistem menerbitkan **Surat Jalan PDF** resmi bernomor unik.
   - Pada saat posting pengiriman: **Stok Fisik dan Reservasi berkurang secara bersamaan (atomik)**.
   - Sopir/ekspedisi mengunggah bukti tanda tangan penerimaan barang (BAST).
5. **Penagihan & Pembayaran (Finance):**
   - Finance menerbitkan **Invoice PDF** berdasarkan jadwal penagihan yang disepakati (misal: DP 30% di muka, 70% setelah barang sampai).
   - Penagihan tidak terikat mati dengan pengiriman fisik (mendukung penagihan uang muka sebelum barang dikirim).
   - Saat pelanggan mentransfer dana, Finance mencatat penerimaan dan mengalokasikan nilai pembayaran ke invoice terkait hingga berstatus **Lunas**.
6. **Penutupan Pesanan (Order Close):**
   - Pesanan ditutup otomatis saat seluruh barang telah diterima pelanggan dan seluruh tagihan telah lunas.

---

### 4.4. Definisi Matematis & Logika Saldo Stok Gudang

Untuk menjamin akurasi fisik dan menghindari penjualan ganda (*overselling*), saldo dihitung ke dalam **5 indikator**:

$$\text{Stok Fisik} = \text{Total kuantitas barang aktual di dalam rak gudang}$$
$$\text{Stok Tertahan} = \text{Kuantitas barang rusak / karantina / belum lolos QC}$$
$$\text{Stok Layak Pakai} = \text{Stok Fisik} - \text{Stok Tertahan}$$
$$\text{Reservasi} = \text{Barang layak pakai yang dikunci untuk pesanan pelanggan disetujui}$$
$$\text{Stok Tersedia} = \text{Stok Layak Pakai} - \text{Reservasi Aktif}$$

*Contoh Perhitungan:*
- Stok fisik = 20 unit, Tertahan = 0, Reservasi = 12 unit $\rightarrow$ **Stok Tersedia = 8 unit**.
- Jika dikirim 5 unit: Stok fisik menjadi **15 unit**, Reservasi menjadi **7 unit**, Stok Tersedia tetap stabil di angka **8 unit**.

---

### 4.5. Mesin Status Transaksi (5 Dimensi Independen)

Status transaksi tidak dicampuradukkan menjadi satu string, melainkan diatur per dimensi:
1. **Dimensi Persetujuan:** `Draft` $\rightarrow$ `Diajukan` $\rightarrow$ `Disetujui` / `Ditolak` / `Dibatalkan`
2. **Dimensi Pemenuhan:** `Belum Tersedia` $\rightarrow$ `Tersedia Sebagian` $\rightarrow$ `Tersedia Seluruhnya`
3. **Dimensi Pengiriman:** `Belum Dikirim` $\rightarrow$ `Parsial` $\rightarrow$ `Penuh` $\rightarrow$ `Penerimaan Dikonfirmasi`
4. **Dimensi Penagihan:** `Belum Ditagih` $\rightarrow$ `Parsial (DP/Termin)` $\rightarrow$ `Ditagih Penuh`
5. **Dimensi Pembayaran:** `Belum Dibayar` $\rightarrow$ `Parsial` $\rightarrow$ `Lunas`

---

### 4.6. Rincian Modul, Halaman, Form Field & Kolom Data

#### Modul 1: Dashboard Eksekutif & KPI
- Ringkasan pesanan aktif, total omset bulan berjalan, antrean persetujuan pimpinan, alert stok kritis di bawah batas minimum (*reorder point*), antrean pengiriman hari ini, dan total piutang jatuh tempo.

#### Modul 2: Master Data
- **Master Pelanggan:** Nama PT/Instansi, PIC, Telepon, Email, Alamat Kirim, NPWP, Terms of Payment (TOP).
- **Master Supplier:** Nama Prinsipal, Negara/Kota Asal, Kontak PIC, Rekening Bank, Estimasi Lead Time.
- **Master Produk & SKU:** Kode SKU, Nama Produk, Kategori (UPS/Battery/Stabilizer/Inverter/Solar), Satuan, Minimum Stok, Status Publikasi Web.
- **Master Gudang:** Nama Gudang, Lokasi Bin/Rak.

#### Modul 3: Manajemen Pesanan Penjualan (Sales Order / PO Pelanggan)
- **Tabel Daftar Order:** No. SO Internal (`SO-YYYYMM-XXXX`), No. PO Pelanggan, Nama Customer, Tanggal PO, Nilai Transaksi, Status Approval, Status Kirim, Status Invoice, Status Pembayaran, Action.
- **Form Input Pesanan:** Input data pelanggan, upload file PO asli, tanggal target kirim, tabel barang dinamis (SKU, Qty, Satuan, Harga Satuan, Diskon, PPN 11%, Subtotal), perhitungan otomatis DPP & Total.

#### Modul 4: Pengadaan & Pembelian (PO Supplier)
- Form pembuatan PO ke vendor dengan penomoran `PO-YYYYMM-XXXX`, keterkaitan dengan nomor SO pemesan, estimasi kedatangan.
- Form Penerimaan Barang & QC: Pencatatan nomor Goods Receipt (`GR-YYYYMM-XXXX`), jumlah barang diterima dalam kondisi baik, jumlah rusak/reject, dan lokasi simpan rak.

#### Modul 5: Pengiriman & Surat Jalan (Delivery)
- Pembuatan pengiriman parsial/penuh dengan nomor Surat Jalan (`SJ-YYYYMM-XXXX`), ekspedisi/sopir, nopol kendaraan.
- Checklist item yang dimuat berdasarkan kuantitas reservasi yang masih tersisa.
- Ekspor **Surat Jalan PDF** resmi 4 rangkap.
- Form unggah bukti serah terima (foto Surat Jalan bertanda tangan stempel basah / BAST).

#### Modul 6: Penagihan & Keuangan (Invoicing)
- Pembuatan Invoice dengan nomor `INV-YYYYMM-XXXX`, pilihan tipe penagihan (Uang Muka/DP, Termin, atau Pelunasan Penuh).
- Ekspor **Invoice PDF** resmi dengan rincian rekening bank perusahaan (Mandiri / BCA) dan klausul jatuh tempo.
- Form pencatatan bukti pelunasan transfer bank dan alokasi pembayaran ke nomor invoice terkait.

#### Modul 7: Arsip Dokumen Digital & Audit Trail
- Pencarian instan berkas arsip terklasifikasi (*Dokumen Pelanggan, Pembelian, Transaksi, Produk, Umum*) dengan perlindungan hak unduh.
- Buku audit trail yang mencatat waktu, user, aksi, dan identitas objek transaksi tanpa opsi manipulasi riwayat.

---

### 4.7. Format Dokumen Final & Snapshot PDF

- **Invoice PDF:** Berisi logo resmi NPP, nomor invoice unik, referensi nomor PO Pelanggan, rincian item, DPP, tarif PPN 11%, total tagihan, rekening tujuan, dan cap stempel digital resmi.
- **Surat Jalan PDF:** Berisi rincian alamat proyek, tanggal kirim, nomor polisi kendaraan, rincian barang fisik tanpa mencantumkan harga komersial, dan 4 kolom tanda tangan (Pengirim, Gudang, Sopir, Penerima).

---

### 4.8. Usulan Struktur Direktori & Rencana Implementasi Bertahap

Untuk menjamin **keamanan total dan zero regression** pada Company Profile publik yang sudah selesai, modul sistem pengadaan baru disarankan diletakkan pada folder mandiri:

```text
c:\Users\Muhammad Raja Daffa\Documents\antigravity\Npp\
├── (File Company Profile & Assets yang sudah ada tetap utuh di root)
│
├── internal/                           # Folder Terisolasi Portal Operasional
│   ├── index.html                      # Dashboard Utama (KPI, Ringkasan Operasional & Notifikasi)
│   ├── orders.html                     # Modul PO Pelanggan & Penawaran (Sales & Operasional)
│   ├── procurement.html                # Modul PO Supplier & Pembelian (Purchasing)
│   ├── inventory.html                  # Modul Stok Gudang, QC & Kartu Mutasi (Warehouse)
│   ├── delivery.html                   # Modul Pengiriman & Surat Jalan PDF (Logistik)
│   ├── billing.html                    # Modul Penagihan, Invoice PDF & Pelunasan (Finance)
│   ├── archive.html                    # Modul Arsip Dokumen Digital Terenkripsi
│   └── master-data.html                # Modul Data Pelanggan, Vendor, SKU & Gudang
│
└── src/
    ├── style.css                       # Stylesheet Company Profile (Root)
    ├── products-data.js                # Master data katalog publik
    │
    └── internal/                       # Asset & Script Khusus Internal
        ├── internal.css                # Stylesheet antarmuka sistem pengadaan (Data Table, Form, Badge status)
        └── app.js                      # Core Controller Vanilla JS (State Manager, Mock Data, PDF Mock Generator)
```

**Tahapan Eksekusi Bertahap yang Disarankan:**
- **Tahap 1:** Bangun Layout Shell Portal Internal (Sidebar navigasi, topbar profil pegawai login, dan Dashboard KPI di `internal/index.html`).
- **Tahap 2:** Bangun Modul PO Pelanggan (`internal/orders.html`) & Master Data (`internal/master-data.html`).
- **Tahap 3:** Bangun Modul Gudang & Kartu Stok (`internal/inventory.html`) beserta Pengadaan Supplier (`internal/procurement.html`).
- **Tahap 4:** Bangun Modul Surat Jalan Pengiriman (`internal/delivery.html`) beserta Penagihan Invoice (`internal/billing.html`).
- **Tahap 5:** Bangun Modul Arsip Dokumen (`internal/archive.html`) dan Generator Cetak Dokumen PDF.

---
*Laporan ini disimpan secara permanen di repositori lokal proyek untuk dapat dibagikan dan ditinjau bersama partner bisnis Anda.*
