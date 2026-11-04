# AGENTS.md — PT Nusantara Puncak Perkasa (NPP) Architecture Invariants

> **ATURAN OUTPUT MUTLAK:** Saat diminta revisi, refactor, atau fitur, HANYA BERIKAN OUTPUT KODE SAJA tanpa penjelasan, teori, atau basa-basi pengantar, kecuali ditanya secara eksplisit.
> **ATURAN MUTLAK DESAIN:** DILARANG KERAS mengubah desain, layout, komponen, atau styling yang sudah ada KECUALI atas instruksi eksplisit dan spesifik dari user. Pertahankan 100% desain yang sudah ada dan hanya lakukan perubahan tepat pada bagian yang diminta.
> **ATURAN MUTLAK PERUBAHAN MANUAL:** DILARANG KERAS menimpa, menghapus, atau mengembalikan (revert) bagian kode, teks, aset, atau styling yang sudah diubah secara manual oleh USER. Selalu periksa dan pertahankan perubahan manual user secara utuh.
> **ATURAN MUTLAK MINIMALIS & CLEAN (NO CLUTTER):** DILARANG menambahkan elemen dekoratif/teks pengisi yang tidak diminta seperti `.section-tag` berulang, badge kecil berlebih, atau `.contact-desc`/paragraf basa-basi pada section kontak. Pertahankan layout tetap clean, to-the-point, dan berfokus pada elemen esensial (heading, kontak langsung, dan maps).

## 1. Lingkup Proyek & Stack
- **Fokus Saat Ini:** Company Profile Publik PT Nusantara Puncak Perkasa (NPP) — Pengadaan & Solusi Industrial Power: **Battery, UPS, Stabilizer, Inverter, dan Solar Panel**, dengan integrasi pintu masuk ke Portal Internal.
- **Pure Web Stack (Zero Vue/Framework):** WAJIB menggunakan pure **HTML5**, **CSS3**, dan **Vanilla JavaScript** murni. Dilarang menggunakan Vue, React, atau build tool runtime framework.

## 2. Invarian Global (Zero Border & Scrollbar)
- **Zero Border & Box-Shadow:** Dilarang menggunakan `border-*`, `ring-*`, atau `shadow-*`. Pemisah HANYA via kontras background (`var(--bg-page)` vs `var(--bg-section-alt)`) atau padding tipis (`2px`).
- **Zero Scrollbar:** `scrollbar-width: none`, `::-webkit-scrollbar { display: none }`. Scroll overflow horizontal menggunakan `overflow-x: clip`.

## 3. Warna & Multi-Theme
- **Theme Default (`light` / Clean Corporate White/Charcoal):** Base `#ffffff` (`--bg-page`), Surface `#f4f4f5` (`--bg-section-alt`), Heading `#09090b` (`--text-primary`), Teks `#52525b` (`--text-secondary`).
- **Tema Tersedia:** `light` (Default), `ohlins` (Gold/Carbon), `brembo` (Power Red/Carbon), `titanium` (Electric Cyan/Carbon).

## 4. Inverted Border Radius (Cutout)
- **Zero Overflow-Hidden:** Container luar Hero Cutout wajib `position: relative` TANPA `overflow: hidden` agar elemen (badge, status pill) tidak terpotong radius. `border-radius: 30px` diaplikasikan langsung ke elemen media/gambar.
- **Zero Seam:** Cutout box wajib offset `-1px` (`top: -1px`, dll). SVG konektor cekung = `26x26px` dg overlap 2px (`viewBox="-2 -2 26 26"`, `shape-rendering="geometricPrecision"`). Warna SVG HANYA `fill="currentColor"` menyesuaikan background cutout (`var(--bg-page)` / `var(--bg-section-alt)`).

## 5. Struktur Section Company Profile Pure HTML (Wajib)
Urutan section terstandar:
1. `navbar-section` (Brand PT NPP, Link Navigasi, Action Btn: Catalog, Inquiry, Portal Login).
2. `hero-section` (Industrial Power Tagline, Bento Grid Solusi Daya dengan 2 cutout Inverted Radius).
3. `stats-section` (3-4 metrik: Proyek Selesai, Kapasitas Daya Terpasang, Klien B2B/BUMN, Uptime/Garansi).
4. `about-section` (Profil PT NPP, Engineering Excellence, 3 pilar layanan pengadaan & perawatan).
5. `catalog-section` (Katalog 5 Kategori: Industrial Battery, Enterprise UPS, Servo Stabilizer, Pure Sine Inverter, Commercial Solar Panel).
6. `solutions-section` (Bento 2x2 Showcase Proyek Kelistrikan & Solusi Backup Daya).
7. `portfolio-section` / `testimonial-section` (Portofolio pengadaan klien industri & testimoni mitra B2B dengan cutout avatar).
8. `inquiry-section` (Form permohonan spesifikasi & estimasi penawaran pengadaan).
9. `footer-section` (Informasi legal PT NPP, kantor operasional, kontak darurat 24/7, hak cipta).
10. `theme-switcher` (Floating pill tema warna).
- Modal / Panel tambahan: `product-modal` (Detail spesifikasi teknis, datasheet & alur inquiry per SKU) dan `portal-login-modal` (Akses portal internal operasional).

## 6. Semantic CSS Class Naming & Single Global Stylesheet (Wajib)
- **Wajib Semantic Class:** Setiap elemen di dalam HTML WAJIB menggunakan nama class semantik yang deskriptif per-section (contoh: `.navbar-section`, `.hero-section`, `.stats-section`, `.about-section`, `.catalog-section`, `.inquiry-section`, `.footer-section`).
- **DILARANG Utility Class Panjang di Template:** Dilarang menumpuk deretan panjang class utility di dalam elemen HTML.
- **Single Source of CSS:** SEMUA definisi class semantik dan CSS variables WAJIB terpusat di `src/style.css`.
- **Zero Inline Style:** DILARANG menulis atribut inline `style="..."` atau block `<style>` di dalam berkas HTML.
