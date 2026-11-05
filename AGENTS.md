# AGENTS.md — PT NPP Architecture Invariants

> **OUTPUT MUTLAK:** Saat diminta revisi/refactor/fitur, HANYA BERIKAN OUTPUT KODE. Tanpa penjelasan/basa-basi kecuali ditanya eksplisit.
> **DESAIN MUTLAK:** DILARANG KERAS mengubah desain/layout KECUALI diminta eksplisit. Pertahankan 100% kode yang ada.
> **KONSISTENSI HEADING & MANUAL USER:** SEMUA judul section WAJIB pakai `.section-heading`. DILARANG bikin class ad-hoc (spt `.contact-simple-title`). DILARANG menimpa/revert bagian yang sudah diubah manual oleh user.
> **MINIMALIS (NO CLUTTER):** DILARANG tambah dekorasi/teks pengisi yg tak diminta (spt badge berlebih, paragraf basa-basi di kontak). Fokus ke esensial.
> **ZERO HOVER LIFT:** DILARANG pakai `transform: translateY(-...)` pada hover elemen APAPUN (tombol/kartu). `.btn-contact-primary` wajib statis tanpa efek hover.
> **ISOLASI DESKTOP (NO REGRESSION):** DILARANG ubah/hapus styling base desktop (`> 1024px`). Penyesuaian responsif WAJIB diisolasi ketat di `@media` (Tablet: 769px-1024px, Mobile: <=768px).

## 1. Stack & Scope
- **Scope:** Company Profile Publik PT NPP (Industrial Power: Battery, UPS, Stabilizer, Inverter, Solar Panel).
- **Pure Web Stack:** Wajib HTML5, CSS3, & Vanilla JS. DILARANG pakai Vue, React, atau build tool.

## 2. Invarian Visual (Zero Border, Scrollbar, Box-Shadow)
- **Zero Border/Shadow:** Pemisah HANYA via kontras bg (`var(--bg-page)` vs `var(--bg-section-alt)`) atau padding 2px.
- **Zero Scrollbar:** `scrollbar-width: none`, `::-webkit-scrollbar { display: none }`. Overflow horizontal via `overflow-x: clip`.

## 3. Warna & Theme
- **Default (Corporate):** Base `#ffffff`, Surface `#f4f6fa`, Heading `#0a1b33`, Teks `#4b5d73`, Aksen Utama `#0c4a96` (Navy), Aksen Sekunder `#c99d51`/`#d4a249` (Gold).
- **Theme:** `light`, `ohlins`, `brembo`, `titanium`.

## 4. Inverted Border Radius (Cutout)
- **Zero Overflow-Hidden:** Container Hero Cutout wajib `position: relative` TANPA `overflow: hidden` (agar elemen tak terpotong). `border-radius: 30px` langsung ke gambar.
- **Zero Seam:** Cutout offset `-1px`. SVG konektor `26x26px`, overlap 2px (`viewBox="-2 -2 26 26"`, `geometricPrecision`). Warna SVG wajib `fill="currentColor"`.

## 5. Struktur Section (10 Wajib)
1. `navbar-section` 2. `hero-section` 3. `stats-section` 4. `about-section` 5. `catalog-section` 6. `solutions-section` 7. `portfolio-section`/`testimonial-section` 8. `inquiry-section` 9. `footer-section` 10. `theme-switcher`
- **Modal:** `product-modal` & `portal-login-modal`.

## 6. Semantic CSS & Global Stylesheet
- **Wajib Semantic:** Gunakan class semantik (`.navbar-section`, `.hero-section`, dst).
- **Single Source:** SEMUA CSS & variabel terpusat HANYA di `src/style.css`.
- **DILARANG:** Class utility panjang menumpuk di HTML, `<style>` block, atau `style="..."` inline.