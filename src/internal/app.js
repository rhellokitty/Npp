/**
 * ============================================================================
 * PT NUSANTARA PUNCAK PERKASA — CORE ERP ENGINE (NPP HLD 001)
 * File: src/internal/app.js
 * Stack: Pure Vanilla JavaScript (ES6+), Zero External Framework
 * Cakupan:
 *   1. Database Mockup Terpusat (window.NPP_ERP_DATA) + Persistence localStorage
 *   2. RoleManager (RBAC 6 Peran, Proteksi Harga/HPP untuk Gudang, Otorisasi Approver)
 *   3. TableEngine (Live Search, Multi-Filter, Page Size, Clean Pagination)
 *   4. Dashboard Controller (KPI, 5 Dimensi Status PO, 5 Saldo Stok, Quick Approval)
 * ============================================================================
 */

(function () {
  'use strict';

  var STORAGE_KEY_SESSION = 'npp_portal_session';
  var STORAGE_KEY_DB = 'npp_erp_db_v1';
  var STORAGE_KEY_THEME = 'npp_erp_theme';

  // Terapkan tema tersimpan secara sinkron sebelum render untuk mencegah flash terang
  try {
    var initialTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (initialTheme === 'dark' || initialTheme === 'light') {
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  } catch (e) {}

  /* ==========================================================================
     1. DEFINISI 3 PERAN PENGGUNA (RBAC TERSTRUKTUR & CLEAN)
     ========================================================================== */
  var ROLE_CONFIG = {
    'Super Admin': {
      code: 'Super Admin',
      display: 'Super Admin',
      shortLabel: 'Super Admin',
      email: 'admin@nusantarapuncakperkasa.co.id',
      userName: 'Raja Daffa',
      canViewPrice: true,
      canViewHPP: true,
      canApprove: true,
      canAccessBilling: true,
      canManageRoles: true,
      bannerTitle: 'Akses Penuh Sistem Operasional (Super Admin)',
      bannerDesc: 'Otoritas tertinggi: Otorisasi approval transaksi besar, konfigurasi master data, akses finansial & HPP, serta pengawasan audit trail.',
      restrictionText: 'Otoritas Tertinggi • Full Access'
    },
    'Operasional': {
      code: 'Operasional',
      display: 'Operasional & Gudang',
      shortLabel: 'Operasional',
      email: 'operasional@nusantarapuncakperkasa.co.id',
      userName: 'Tim Operasional & Logistik',
      canViewPrice: true,
      canViewHPP: true,
      canApprove: false,
      canAccessBilling: false,
      canManageRoles: false,
      bannerTitle: 'Peran Aktif: Operasional, Pengadaan & Logistik',
      bannerDesc: 'Fokus alur barang: Pencatatan PO pelanggan, penerbitan PO pengadaan supplier, kontrol 5 saldo stok gudang, uji QC, dan pengiriman armada logistik.',
      restrictionText: 'Alur Barang & Pengadaan • Otorisasi Transaksi oleh Super Admin'
    },
    'Finance': {
      code: 'Finance',
      display: 'Finance & Invoice',
      shortLabel: 'Finance',
      email: 'finance@nusantarapuncakperkasa.co.id',
      userName: 'Siti Rahmawati',
      canViewPrice: true,
      canViewHPP: true,
      canApprove: false,
      canAccessBilling: true,
      canManageRoles: false,
      bannerTitle: 'Peran Aktif: Keuangan, Penagihan & Arus Kas',
      bannerDesc: 'Fokus alur kas: Penerbitan faktur penjualan resmi (DP, Termin, Pelunasan + PPN 11%), rekonsiliasi transfer bank BCA/Mandiri, dan monitoring piutang.',
      restrictionText: 'Akses Finansial & Penagihan • Alur Kas Perusahaan'
    }
  };

  // Alias kompatibilitas mundur untuk sesi lama
  ROLE_CONFIG['Administrator'] = ROLE_CONFIG['Super Admin'];
  ROLE_CONFIG['Pimpinan / Approver'] = ROLE_CONFIG['Super Admin'];
  ROLE_CONFIG['Sales / Operasional'] = ROLE_CONFIG['Operasional'];
  ROLE_CONFIG['Purchasing'] = ROLE_CONFIG['Operasional'];
  ROLE_CONFIG['Gudang'] = ROLE_CONFIG['Operasional'];

  /* ==========================================================================
     2. DATABASE DUMMY B2B AWAL (REALISTIS & KONSISTEN DENGAN PDF HLD 001)
     ========================================================================== */
  function createInitialDatabase() {
    return {
      meta: {
        version: '1.0.0-HLD001',
        company: 'PT Nusantara Puncak Perkasa',
        npwp: '02.918.445.7-432.000',
        address: 'Jl. Flamboyan Raya, Pondok Timur Indah, Bekasi 17115',
        bankAccounts: [
          { bank: 'Bank Central Asia (BCA)', accountNo: '521-098-7741', accountName: 'PT Nusantara Puncak Perkasa', branch: 'KCU Bekasi' },
          { bank: 'Bank Mandiri', accountNo: '156-00-0988234-5', accountName: 'PT Nusantara Puncak Perkasa', branch: 'KCP Bekasi Juanda' }
        ]
      },

      /* --- MASTER PELANGGAN (6 KLIEN B2B RESMI) --- */
      customers: [
        {
          id: 'CUST-001',
          name: 'PT. Daya Pustaka Indonesia',
          npwp: '01.345.678.9-012.000',
          sector: 'Data Center & Penerbitan Digital',
          pic: 'Bpk. Hendra Wijaya',
          rolePic: 'Infrastructure Manager',
          phone: '021-4608821',
          email: 'procurement@dayapustaka.co.id',
          paymentTerm: 'NET 30',
          creditLimit: 750000000,
          address: 'Kawasan Industri Pulogadung Blok J-14, Jakarta Timur',
          status: 'Aktif'
        },
        {
          id: 'CUST-002',
          name: 'PT. Jasnita Telekomindo Tbk',
          npwp: '01.882.441.2-054.000',
          sector: 'Telekomunikasi & Jaringan Fiber',
          pic: 'Bpk. Reza Pratama',
          rolePic: 'VP Network Core & Power',
          phone: '021-3914450',
          email: 'supplychain@jasnita.co.id',
          paymentTerm: 'NET 45',
          creditLimit: 1500000000,
          address: 'Gedung E-Trade Lt. 12, Jl. KH Wahid Hasyim No. 55, Jakarta Pusat',
          status: 'Aktif'
        },
        {
          id: 'CUST-003',
          name: 'PT. The Master Steel Mfc',
          npwp: '01.112.908.4-007.000',
          sector: 'Industri Peleburan Baja Berat',
          pic: 'Ir. Bambang Suryono',
          rolePic: 'Chief Electrical Engineer',
          phone: '021-4602755',
          email: 'purchasing.plant@mastersteel.co.id',
          paymentTerm: 'DP 30% + Pelunasan',
          creditLimit: 2000000000,
          address: 'Jl. Raya Bekasi KM 21, Pulogadung, Jakarta Timur',
          status: 'Aktif'
        },
        {
          id: 'CUST-004',
          name: 'PT. Sumber Abadi Indonesia',
          npwp: '02.419.553.1-403.000',
          sector: 'Manufaktur Otomotif & Komponen',
          pic: 'Ibu Ratna Kusuma',
          rolePic: 'Procurement Lead',
          phone: '021-8935512',
          email: 'ratna.procurement@sumberabadi.co.id',
          paymentTerm: 'NET 14',
          creditLimit: 500000000,
          address: 'Kawasan Industri Jababeka II Blok C-8, Cikarang, Bekasi',
          status: 'Aktif'
        },
        {
          id: 'CUST-005',
          name: 'PT. Indovicker Furnitama',
          npwp: '01.674.332.8-412.000',
          sector: 'Manufaktur Ekspor & Fasilitas Pabrik',
          pic: 'Bpk. Antonius Halim',
          rolePic: 'Facility & Utility Head',
          phone: '021-5901188',
          email: 'utility.buyer@indovicker.co.id',
          paymentTerm: 'NET 30',
          creditLimit: 600000000,
          address: 'Kawasan Industri Jatake Jl. Industri Raya III, Tangerang',
          status: 'Aktif'
        },
        {
          id: 'CUST-006',
          name: 'PT. Bizzy Commerce Indonesia',
          npwp: '03.298.771.5-021.000',
          sector: 'B2B Supply Chain & Fulfillment Hub',
          pic: 'Bpk. Dimas Anggara',
          rolePic: 'Enterprise Supply Chain Lead',
          phone: '021-29407700',
          email: 'vendor.management@bizzy.co.id',
          paymentTerm: 'NET 30',
          creditLimit: 1200000000,
          address: 'Sovereign Plaza Lt. 16, Jl. TB Simatupang Kav. 36, Jakarta Selatan',
          status: 'Aktif'
        }
      ],

      /* --- MASTER SUPPLIER / PRINSIPAL --- */
      suppliers: [
        {
          id: 'SUP-001',
          name: 'Ritar Power International Ltd',
          category: 'Baterai RITAR (VRLA & Deep Cycle)',
          pic: 'Mr. Kevin Zhang / PT Ritar Indo Distribusi',
          phone: '021-65831100',
          email: 'order.id@ritarpower.com',
          leadTimeDays: 14,
          paymentTerm: 'T/T 30 Days',
          origin: 'Shenzhen / Gudang Bonded Tanjung Priok',
          status: 'Prinsipal Resmi'
        },
        {
          id: 'SUP-002',
          name: 'BSB Power Co., Ltd',
          category: 'Baterai BSB (Telecom Front Terminal & OPzV)',
          pic: 'Ms. Linda Chen / Divisi B2B Asia Tenggara',
          phone: '021-65409988',
          email: 'sea.sales@bsbpower.com',
          leadTimeDays: 21,
          paymentTerm: 'L/C 45 Days',
          origin: 'Shenzhen / Hub Logistik Marunda',
          status: 'Prinsipal Resmi'
        },
        {
          id: 'SUP-003',
          name: 'Ablerex Electronics Co., Ltd',
          category: 'UPS Ablerex (Online 1-Phase & 3-Phase)',
          pic: 'Ir. Hendro Wibowo (Country Channel Manager)',
          phone: '021-56982210',
          email: 'id.partner@ablerex.com.tw',
          leadTimeDays: 10,
          paymentTerm: 'NET 30',
          origin: 'Taipei / Hub Pergudangan Sunter',
          status: 'Prinsipal Resmi'
        },
        {
          id: 'SUP-004',
          name: 'PT. Matsuyama Power Stabilizer Nusantara',
          category: 'Stabilizer AVR & Trafo Isolasi Industri',
          pic: 'Bpk. Wahyu Hidayat',
          phone: '021-88904411',
          email: 'sales.project@matsuyamapower.co.id',
          leadTimeDays: 7,
          paymentTerm: 'NET 14',
          origin: 'Kawasan Industri Bekasi Fajar',
          status: 'Mitra Pabrikan'
        },
        {
          id: 'SUP-005',
          name: 'PT. Surya Energi Inverterindo',
          category: 'Inverter Hybrid & Solar Panel Tier-1',
          pic: 'Bpk. Fajar Nugroho',
          phone: '021-22548890',
          email: 'b2b@suryaenergi-inv.co.id',
          leadTimeDays: 7,
          paymentTerm: 'DP 50% + Pelunasan',
          origin: 'Pergudangan Bandara Mas, Tangerang',
          status: 'Mitra Pabrikan'
        }
      ],

      /* --- MASTER LOKASI RAK GUDang --- */
      racks: [
        { code: 'RAK-A01', zone: 'Zona A (Lantai 1 Heavy Duty)', category: 'Baterai RITAR VRLA 12V', capacity: '200 Unit', tempSpec: '20°C - 25°C Dry', pic: 'Budi Santoso' },
        { code: 'RAK-A02', zone: 'Zona A (Lantai 1 Telecom Bay)', category: 'Baterai BSB Front Terminal & OPzV', capacity: '180 Unit/Cell', tempSpec: '18°C - 24°C AC', pic: 'Budi Santoso' },
        { code: 'RAK-B01', zone: 'Zona B (Ruang Presisi Elektron)', category: 'UPS Ablerex 1-10 kVA Rack/Tower', capacity: '50 Unit', tempSpec: '22°C Controlled Humidity', pic: 'Rudi Hermawan' },
        { code: 'RAK-B02', zone: 'Zona B (Heavy Power Bay)', category: 'UPS Ablerex 3-Phase 20-100 kVA', capacity: '20 Unit', tempSpec: '22°C Dust-Free', pic: 'Rudi Hermawan' },
        { code: 'RAK-C01', zone: 'Zona C (Bay Mekanikal & Trafo)', category: 'Servo Stabilizer & Isolation Transformer', capacity: '35 Unit', tempSpec: 'Ambient Terlindung', pic: 'Agus Setiawan' },
        { code: 'RAK-D01', zone: 'Zona D (Mezzanine Energi Surya)', category: 'Inverter Hybrid & Panel Surya 550Wp', capacity: '150 Panel / 30 Inv', tempSpec: 'Dry Ventilated', pic: 'Agus Setiawan' },
        { code: 'RAK-QC', zone: 'Area Karantina & Inspeksi QC', category: 'Stok Tertahan / Menunggu Uji Beban', capacity: '40 Unit', tempSpec: 'Isolated Test Bench', pic: 'Tim QC Teknik' }
      ],

      /* --- MASTER SKU & 5 SALDO STOK GUDANG ---
         Rumus Invarian:
         layak = fisik - tertahan
         tersedia = layak - reservasi
      */
      inventory: [
        {
          sku: 'SKU-RTR-12100',
          name: 'Baterai RITAR RA12-100 (12V 100Ah VRLA AGM)',
          category: 'Baterai RITAR',
          brand: 'RITAR',
          unit: 'Unit',
          rack: 'RAK-A01',
          hpp: 2450000,
          sellPrice: 3150000,
          fisik: 64,
          tertahan: 2,
          layak: 62,
          reservasi: 24,
          tersedia: 38,
          minStok: 20,
          supplierId: 'SUP-001',
          lastAudit: '2026-11-05'
        },
        {
          sku: 'SKU-RTR-12200',
          name: 'Baterai RITAR RA12-200 (12V 200Ah Deep Cycle)',
          category: 'Baterai RITAR',
          brand: 'RITAR',
          unit: 'Unit',
          rack: 'RAK-A01',
          hpp: 4650000,
          sellPrice: 5850000,
          fisik: 22,
          tertahan: 2,
          layak: 20,
          reservasi: 16,
          tersedia: 4,
          minStok: 12,
          supplierId: 'SUP-001',
          lastAudit: '2026-11-05'
        },
        {
          sku: 'SKU-BSB-FT150',
          name: 'Baterai BSB FT12-150 (12V 150Ah Front Terminal Telecom)',
          category: 'Baterai BSB',
          brand: 'BSB',
          unit: 'Unit',
          rack: 'RAK-A02',
          hpp: 3900000,
          sellPrice: 4950000,
          fisik: 40,
          tertahan: 0,
          layak: 40,
          reservasi: 32,
          tersedia: 8,
          minStok: 16,
          supplierId: 'SUP-002',
          lastAudit: '2026-11-04'
        },
        {
          sku: 'SKU-BSB-OPZV500',
          name: 'Baterai BSB OPzV 2V 500Ah Tubular Gel Industrial',
          category: 'Baterai BSB',
          brand: 'BSB',
          unit: 'Cell',
          rack: 'RAK-A02',
          hpp: 4200000,
          sellPrice: 5400000,
          fisik: 28,
          tertahan: 4,
          layak: 24,
          reservasi: 24,
          tersedia: 0,
          minStok: 24,
          supplierId: 'SUP-002',
          lastAudit: '2026-11-04'
        },
        {
          sku: 'SKU-ABL-MS3K',
          name: 'UPS Ablerex Mars II MS3000RT (3 kVA / 2.7 kW Online)',
          category: 'UPS Ablerex',
          brand: 'Ablerex',
          unit: 'Unit',
          rack: 'RAK-B01',
          hpp: 11200000,
          sellPrice: 14500000,
          fisik: 15,
          tertahan: 1,
          layak: 14,
          reservasi: 6,
          tersedia: 8,
          minStok: 5,
          supplierId: 'SUP-003',
          lastAudit: '2026-11-05'
        },
        {
          sku: 'SKU-ABL-MS10K',
          name: 'UPS Ablerex Mars II MS10000RT (10 kVA Online Rack/Tower)',
          category: 'UPS Ablerex',
          brand: 'Ablerex',
          unit: 'Unit',
          rack: 'RAK-B01',
          hpp: 28500000,
          sellPrice: 36800000,
          fisik: 7,
          tertahan: 0,
          layak: 7,
          reservasi: 5,
          tersedia: 2,
          minStok: 4,
          supplierId: 'SUP-003',
          lastAudit: '2026-11-05'
        },
        {
          sku: 'SKU-ABL-ARS30K',
          name: 'UPS Ablerex Ares 30 kVA 3-Phase Online Transformerless',
          category: 'UPS Ablerex',
          brand: 'Ablerex',
          unit: 'Unit',
          rack: 'RAK-B02',
          hpp: 86000000,
          sellPrice: 112000000,
          fisik: 3,
          tertahan: 0,
          layak: 3,
          reservasi: 2,
          tersedia: 1,
          minStok: 2,
          supplierId: 'SUP-003',
          lastAudit: '2026-11-03'
        },
        {
          sku: 'SKU-AVR-30KVA',
          name: 'Servo Voltage Stabilizer 3-Phase 30 kVA Heavy Industrial',
          category: 'Stabilizer',
          brand: 'Matsuyama-NPP',
          unit: 'Unit',
          rack: 'RAK-C01',
          hpp: 24000000,
          sellPrice: 31500000,
          fisik: 9,
          tertahan: 1,
          layak: 8,
          reservasi: 3,
          tersedia: 5,
          minStok: 3,
          supplierId: 'SUP-004',
          lastAudit: '2026-11-02'
        },
        {
          sku: 'SKU-INV-10KW',
          name: 'Hybrid Solar Inverter 10 kW 48V Pure Sine Wave Industrial',
          category: 'Inverter & Solar',
          brand: 'NPP SolarCore',
          unit: 'Unit',
          rack: 'RAK-D01',
          hpp: 21500000,
          sellPrice: 28000000,
          fisik: 11,
          tertahan: 0,
          layak: 11,
          reservasi: 4,
          tersedia: 7,
          minStok: 4,
          supplierId: 'SUP-005',
          lastAudit: '2026-11-01'
        },
        {
          sku: 'SKU-SLR-550W',
          name: 'Solar Panel Monocrystalline 550Wp Half-Cut Tier-1',
          category: 'Inverter & Solar',
          brand: 'NPP SolarCore',
          unit: 'Panel',
          rack: 'RAK-D01',
          hpp: 1950000,
          sellPrice: 2650000,
          fisik: 85,
          tertahan: 3,
          layak: 82,
          reservasi: 30,
          tersedia: 52,
          minStok: 30,
          supplierId: 'SUP-005',
          lastAudit: '2026-11-01'
        }
      ],

      /* --- DAFTAR PO PELANGGAN (SO-YYYYMM-XXXX) DENGAN 5 DIMENSI STATUS INDEPENDEN --- */
      orders: [
        {
          id: 'SO-202611-0012',
          clientPoNumber: 'PO/JASTEL/XI/2026/089',
          customerId: 'CUST-002',
          customerName: 'PT. Jasnita Telekomindo Tbk',
          orderDate: '2026-11-06',
          deliveryTarget: '2026-11-14',
          paymentTerm: 'NET 45',
          poFileName: 'PO-Jasnita-089-Signed.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-BSB-FT150', name: 'Baterai BSB FT12-150 (12V 150Ah Front Terminal Telecom)', qty: 16, unit: 'Unit', price: 4950000 },
            { sku: 'SKU-ABL-MS10K', name: 'UPS Ablerex Mars II MS10000RT (10 kVA Online Rack/Tower)', qty: 2, unit: 'Unit', price: 36800000 }
          ],
          dpp: 152800000,
          ppn: 16808000,
          total: 169608000,
          statusOrder: 'Dikonfirmasi',
          statusApproval: 'Menunggu Persetujuan',
          statusPemenuhan: 'Stok Direservasi',
          statusPengiriman: 'Belum Dikirim',
          statusPenagihan: 'Belum Ditagih',
          notes: 'Backup power POP Core Fiber Jakarta Pusat. Menunggu otorisasi Direktur karena nilai > Rp 150 Juta.'
        },
        {
          id: 'SO-202611-0011',
          clientPoNumber: 'PO-MSTEEL/ELC/2026/412',
          customerId: 'CUST-003',
          customerName: 'PT. The Master Steel Mfc',
          orderDate: '2026-11-05',
          deliveryTarget: '2026-11-18',
          paymentTerm: 'DP 30% + Pelunasan',
          poFileName: 'PO-MasterSteel-412-Stempel.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-ABL-ARS30K', name: 'UPS Ablerex Ares 30 kVA 3-Phase Online Transformerless', qty: 2, unit: 'Unit', price: 112000000 },
            { sku: 'SKU-BSB-OPZV500', name: 'Baterai BSB OPzV 2V 500Ah Tubular Gel Industrial', qty: 24, unit: 'Cell', price: 5400000 }
          ],
          dpp: 353600000,
          ppn: 38896000,
          total: 392496000,
          statusOrder: 'Diproses',
          statusApproval: 'Menunggu Persetujuan',
          statusPemenuhan: 'Menunggu Pengadaan',
          statusPengiriman: 'Belum Dikirim',
          statusPenagihan: 'Tagihan DP Terbit',
          notes: 'Proyek ruang kontrol tanur induksi Pulogadung. Perlu persetujuan Pimpinan & pengadaan tambahan OPzV.'
        },
        {
          id: 'SO-202611-0010',
          clientPoNumber: 'PO/DPI-DC/2026/1104',
          customerId: 'CUST-001',
          customerName: 'PT. Daya Pustaka Indonesia',
          orderDate: '2026-11-04',
          deliveryTarget: '2026-11-10',
          paymentTerm: 'NET 30',
          poFileName: 'PO-DayaPustaka-1104.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-RTR-12100', name: 'Baterai RITAR RA12-100 (12V 100Ah VRLA AGM)', qty: 24, unit: 'Unit', price: 3150000 },
            { sku: 'SKU-ABL-MS3K', name: 'UPS Ablerex Mars II MS3000RT (3 kVA / 2.7 kW Online)', qty: 4, unit: 'Unit', price: 14500000 }
          ],
          dpp: 133600000,
          ppn: 14696000,
          total: 148296000,
          statusOrder: 'Diproses',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Stok Direservasi',
          statusPengiriman: 'Terkirim Sebagian',
          statusPenagihan: 'Ditagih Sebagian',
          notes: 'Pengiriman Tahap 1 (16 baterai + 2 UPS) sudah dikirim via SJ-202611-0008. Sisa dikirim minggu depan.'
        },
        {
          id: 'SO-202611-0009',
          clientPoNumber: 'SAI/PROC/PO/2026/773',
          customerId: 'CUST-004',
          customerName: 'PT. Sumber Abadi Indonesia',
          orderDate: '2026-11-03',
          deliveryTarget: '2026-11-09',
          paymentTerm: 'NET 14',
          poFileName: 'PO-SumberAbadi-773.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-AVR-30KVA', name: 'Servo Voltage Stabilizer 3-Phase 30 kVA Heavy Industrial', qty: 3, unit: 'Unit', price: 31500000 },
            { sku: 'SKU-RTR-12200', name: 'Baterai RITAR RA12-200 (12V 200Ah Deep Cycle)', qty: 8, unit: 'Unit', price: 5850000 }
          ],
          dpp: 141300000,
          ppn: 15543000,
          total: 156843000,
          statusOrder: 'Diproses',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Siap Kirim',
          statusPengiriman: 'Siap Kirim Gudang',
          statusPenagihan: 'Belum Ditagih',
          notes: 'Lini robotik stamping Cikarang. Seluruh unit telah lolos QC beban penuh, siap terbit Surat Jalan.'
        },
        {
          id: 'SO-202611-0008',
          clientPoNumber: 'PO-IVF/UTL/XI/029',
          customerId: 'CUST-005',
          customerName: 'PT. Indovicker Furnitama',
          orderDate: '2026-11-02',
          deliveryTarget: '2026-11-12',
          paymentTerm: 'NET 30',
          poFileName: 'PO-Indovicker-029.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-INV-10KW', name: 'Hybrid Solar Inverter 10 kW 48V Pure Sine Wave Industrial', qty: 2, unit: 'Unit', price: 28000000 },
            { sku: 'SKU-SLR-550W', name: 'Solar Panel Monocrystalline 550Wp Half-Cut Tier-1', qty: 30, unit: 'Panel', price: 2650000 }
          ],
          dpp: 135500000,
          ppn: 14905000,
          total: 150405000,
          statusOrder: 'Dikonfirmasi',
          statusApproval: 'Menunggu Persetujuan',
          statusPemenuhan: 'Stok Direservasi',
          statusPengiriman: 'Belum Dikirim',
          statusPenagihan: 'Belum Ditagih',
          notes: 'Rooftop solar backup gedung administrasi pabrik Jatake. Menunggu approval Direktur.'
        },
        {
          id: 'SO-202611-0007',
          clientPoNumber: 'BIZZY-ENT-PO-99201',
          customerId: 'CUST-006',
          customerName: 'PT. Bizzy Commerce Indonesia',
          orderDate: '2026-11-01',
          deliveryTarget: '2026-11-06',
          paymentTerm: 'NET 30',
          poFileName: 'PO-BizzyCommerce-99201.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-ABL-MS10K', name: 'UPS Ablerex Mars II MS10000RT (10 kVA Online Rack/Tower)', qty: 3, unit: 'Unit', price: 36800000 },
            { sku: 'SKU-BSB-FT150', name: 'Baterai BSB FT12-150 (12V 150Ah Front Terminal Telecom)', qty: 16, unit: 'Unit', price: 4950000 }
          ],
          dpp: 189600000,
          ppn: 20856000,
          total: 210456000,
          statusOrder: 'Diproses',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Terpenuhi Penuh',
          statusPengiriman: 'Terkirim Penuh',
          statusPenagihan: 'Invoice Terbit',
          notes: 'Fulfillment Hub Sunter & Cikarang. Barang sudah diterima (BAST lengkap), menunggu jatuh tempo invoice.'
        },
        {
          id: 'SO-202610-0006',
          clientPoNumber: 'PO/JASTEL/X/2026/071',
          customerId: 'CUST-002',
          customerName: 'PT. Jasnita Telekomindo Tbk',
          orderDate: '2026-10-24',
          deliveryTarget: '2026-10-30',
          paymentTerm: 'NET 45',
          poFileName: 'PO-Jasnita-071.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-BSB-FT150', name: 'Baterai BSB FT12-150 (12V 150Ah Front Terminal Telecom)', qty: 24, unit: 'Unit', price: 4950000 }
          ],
          dpp: 118800000,
          ppn: 13068000,
          total: 131868000,
          statusOrder: 'Selesai',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Terpenuhi Penuh',
          statusPengiriman: 'Terkirim Penuh',
          statusPenagihan: 'Lunas',
          notes: 'Penggantian baterai shelter BTS Jabodetabek. Pembayaran lunas via Mandiri.'
        },
        {
          id: 'SO-202610-0005',
          clientPoNumber: 'PO/DPI-DC/2026/1019',
          customerId: 'CUST-001',
          customerName: 'PT. Daya Pustaka Indonesia',
          orderDate: '2026-10-18',
          deliveryTarget: '2026-10-25',
          paymentTerm: 'NET 30',
          poFileName: 'PO-DayaPustaka-1019.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-ABL-MS3K', name: 'UPS Ablerex Mars II MS3000RT (3 kVA / 2.7 kW Online)', qty: 6, unit: 'Unit', price: 14500000 }
          ],
          dpp: 87000000,
          ppn: 9570000,
          total: 96570000,
          statusOrder: 'Diproses',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Terpenuhi Penuh',
          statusPengiriman: 'Terkirim Penuh',
          statusPenagihan: 'Jatuh Tempo',
          notes: 'Pengiriman selesai 24 Okt 2026. Invoice INV-202610-0004 melewati batas termin, perlu follow-up Finance.'
        },
        {
          id: 'SO-202610-0004',
          clientPoNumber: 'PO-MSTEEL/ELC/2026/380',
          customerId: 'CUST-003',
          customerName: 'PT. The Master Steel Mfc',
          orderDate: '2026-10-14',
          deliveryTarget: '2026-10-22',
          paymentTerm: 'DP 30% + Pelunasan',
          poFileName: 'PO-MasterSteel-380.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-AVR-30KVA', name: 'Servo Voltage Stabilizer 3-Phase 30 kVA Heavy Industrial', qty: 4, unit: 'Unit', price: 31500000 }
          ],
          dpp: 126000000,
          ppn: 13860000,
          total: 139860000,
          statusOrder: 'Selesai',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Terpenuhi Penuh',
          statusPengiriman: 'Terkirim Penuh',
          statusPenagihan: 'Lunas',
          notes: 'Instalasi & komisioning selesai di pabrik Pulogadung. Pelunasan diterima via BCA.'
        },
        {
          id: 'SO-202610-0003',
          clientPoNumber: 'SAI/PROC/PO/2026/710',
          customerId: 'CUST-004',
          customerName: 'PT. Sumber Abadi Indonesia',
          orderDate: '2026-10-10',
          deliveryTarget: '2026-10-16',
          paymentTerm: 'NET 14',
          poFileName: 'PO-SumberAbadi-710.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-RTR-12100', name: 'Baterai RITAR RA12-100 (12V 100Ah VRLA AGM)', qty: 30, unit: 'Unit', price: 3150000 }
          ],
          dpp: 94500000,
          ppn: 10395000,
          total: 104895000,
          statusOrder: 'Diproses',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Terpenuhi Penuh',
          statusPengiriman: 'Terkirim Penuh',
          statusPenagihan: 'Jatuh Tempo',
          notes: 'BAST sudah ditandatangani. Tagihan INV-202610-0002 jatuh tempo 4 hari lalu.'
        },
        {
          id: 'SO-202610-0002',
          clientPoNumber: 'PO-IVF/UTL/X/011',
          customerId: 'CUST-005',
          customerName: 'PT. Indovicker Furnitama',
          orderDate: '2026-10-05',
          deliveryTarget: '2026-10-12',
          paymentTerm: 'NET 30',
          poFileName: 'PO-Indovicker-011.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-RTR-12200', name: 'Baterai RITAR RA12-200 (12V 200Ah Deep Cycle)', qty: 12, unit: 'Unit', price: 5850000 }
          ],
          dpp: 70200000,
          ppn: 7722000,
          total: 77922000,
          statusOrder: 'Selesai',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Terpenuhi Penuh',
          statusPengiriman: 'Terkirim Penuh',
          statusPenagihan: 'Lunas',
          notes: 'Penggantian bank baterai forklift elektrik & UPS ruang server Jatake. Lunas.'
        },
        {
          id: 'SO-202610-0001',
          clientPoNumber: 'BIZZY-ENT-PO-98810',
          customerId: 'CUST-006',
          customerName: 'PT. Bizzy Commerce Indonesia',
          orderDate: '2026-10-02',
          deliveryTarget: '2026-10-09',
          paymentTerm: 'NET 30',
          poFileName: 'PO-BizzyCommerce-98810.pdf',
          salesPic: 'Nadia Pramesti',
          items: [
            { sku: 'SKU-INV-10KW', name: 'Hybrid Solar Inverter 10 kW 48V Pure Sine Wave Industrial', qty: 2, unit: 'Unit', price: 28000000 },
            { sku: 'SKU-RTR-12200', name: 'Baterai RITAR RA12-200 (12V 200Ah Deep Cycle)', qty: 8, unit: 'Unit', price: 5850000 }
          ],
          dpp: 102800000,
          ppn: 11308000,
          total: 114108000,
          statusOrder: 'Selesai',
          statusApproval: 'Disetujui',
          statusPemenuhan: 'Terpenuhi Penuh',
          statusPengiriman: 'Terkirim Penuh',
          statusPenagihan: 'Lunas',
          notes: 'Proyek backup power hub logistik Bizzy BSD. Lunas tepat waktu.'
        }
      ],

      /* --- PENGADAAN & PO SUPPLIER (PO-YYYYMM-XXXX) --- */
      procurements: [
        {
          id: 'PO-202611-0005',
          supplierId: 'SUP-002',
          supplierName: 'BSB Power Co., Ltd',
          refOrderId: 'SO-202611-0011',
          orderDate: '2026-11-05',
          etaDate: '2026-11-16',
          statusApproval: 'Menunggu Persetujuan',
          statusReceiving: 'Belum Diterima',
          items: [
            { sku: 'SKU-BSB-OPZV500', name: 'Baterai BSB OPzV 2V 500Ah Tubular Gel Industrial', qty: 36, unit: 'Cell', hpp: 4200000 },
            { sku: 'SKU-BSB-FT150', name: 'Baterai BSB FT12-150 (12V 150Ah Front Terminal Telecom)', qty: 24, unit: 'Unit', hpp: 3900000 }
          ],
          totalHpp: 244800000,
          notes: 'Restock proyek PT. The Master Steel Mfc & safety stock gudang Bekasi.'
        },
        {
          id: 'PO-202611-0004',
          supplierId: 'SUP-001',
          supplierName: 'Ritar Power International Ltd',
          refOrderId: 'SO-202611-0009',
          orderDate: '2026-11-03',
          etaDate: '2026-11-12',
          statusApproval: 'Disetujui',
          statusReceiving: 'Dalam Perjalanan',
          items: [
            { sku: 'SKU-RTR-12200', name: 'Baterai RITAR RA12-200 (12V 200Ah Deep Cycle)', qty: 24, unit: 'Unit', hpp: 4650000 }
          ],
          totalHpp: 111600000,
          notes: 'Pengisian ulang stok kritis RITAR 200Ah Deep Cycle.'
        },
        {
          id: 'PO-202610-0003',
          supplierId: 'SUP-003',
          supplierName: 'Ablerex Electronics Co., Ltd',
          refOrderId: 'SO-202611-0007',
          orderDate: '2026-10-25',
          etaDate: '2026-11-02',
          statusApproval: 'Disetujui',
          statusReceiving: 'Diterima Penuh',
          items: [
            { sku: 'SKU-ABL-MS10K', name: 'UPS Ablerex Mars II MS10000RT (10 kVA Online Rack/Tower)', qty: 6, unit: 'Unit', hpp: 28500000 },
            { sku: 'SKU-ABL-ARS30K', name: 'UPS Ablerex Ares 30 kVA 3-Phase Online Transformerless', qty: 2, unit: 'Unit', hpp: 86000000 }
          ],
          totalHpp: 343000000,
          notes: 'Telah diterima di Gudang Bekasi via GR-202611-0004.'
        }
      ],

      /* --- RIWAYAT PENERIMAAN BARANG & QC (GR-YYYYMM-XXXX) --- */
      goodsReceipts: [
        {
          id: 'GR-202611-0004',
          poSupplierId: 'PO-202610-0003',
          supplierName: 'Ablerex Electronics Co., Ltd',
          date: '2026-11-02',
          inspector: 'Budi Santoso (Gudang & QC)',
          sku: 'SKU-ABL-MS10K',
          skuName: 'UPS Ablerex Mars II MS10000RT (10 kVA Online Rack/Tower)',
          qtyReceived: 6,
          qtyPassed: 6,
          qtyHold: 0,
          rackTarget: 'RAK-B01',
          notes: 'Tegangan output stabil 230V ±1%, lolos burn-in test 4 jam.'
        },
        {
          id: 'GR-202611-0003',
          poSupplierId: 'PO-202610-0002',
          supplierName: 'Ritar Power International Ltd',
          date: '2026-11-01',
          inspector: 'Budi Santoso (Gudang & QC)',
          sku: 'SKU-RTR-12100',
          skuName: 'Baterai RITAR RA12-100 (12V 100Ah VRLA AGM)',
          qtyReceived: 40,
          qtyPassed: 38,
          qtyHold: 2,
          rackTarget: 'RAK-A01',
          notes: '38 unit tegangan float 13.6V normal. 2 unit casing lecet diisolasi ke RAK-QC (Stok Tertahan).'
        }
      ],

      /* --- BUKU BESAR MUTASI STOK (STOCK LEDGER) --- */
      stockLedger: [
        { id: 'MUT-009', date: '2026-11-06 09:40', sku: 'SKU-BSB-FT150', skuName: 'Baterai BSB FT12-150', type: 'RESERVASI', qty: 16, refDoc: 'SO-202611-0012', pic: 'Nadia Pramesti', note: 'Reservasi otomatis PO PT. Jasnita Telekomindo Tbk' },
        { id: 'MUT-008', date: '2026-11-05 15:20', sku: 'SKU-ABL-ARS30K', skuName: 'UPS Ablerex Ares 30 kVA 3-Phase', type: 'RESERVASI', qty: 2, refDoc: 'SO-202611-0011', pic: 'Nadia Pramesti', note: 'Reservasi proyek PT. The Master Steel Mfc' },
        { id: 'MUT-007', date: '2026-11-05 11:10', sku: 'SKU-RTR-12100', skuName: 'Baterai RITAR RA12-100', type: 'KELUAR', qty: -16, refDoc: 'SJ-202611-0008', pic: 'Budi Santoso', note: 'Pengiriman parsial Tahap 1 ke PT. Daya Pustaka Indonesia' },
        { id: 'MUT-006', date: '2026-11-03 14:05', sku: 'SKU-AVR-30KVA', skuName: 'Servo Stabilizer 3-Phase 30 kVA', type: 'RESERVASI', qty: 3, refDoc: 'SO-202611-0009', pic: 'Nadia Pramesti', note: 'Reservasi PO PT. Sumber Abadi Indonesia' },
        { id: 'MUT-005', date: '2026-11-02 16:30', sku: 'SKU-ABL-MS10K', skuName: 'UPS Ablerex Mars II MS10000RT', type: 'MASUK', qty: 6, refDoc: 'GR-202611-0004', pic: 'Budi Santoso', note: 'Penerimaan prinsipal Ablerex lolos QC 100%' },
        { id: 'MUT-004', date: '2026-11-01 10:15', sku: 'SKU-RTR-12100', skuName: 'Baterai RITAR RA12-100', type: 'MASUK', qty: 38, refDoc: 'GR-202611-0003', pic: 'Budi Santoso', note: 'Penerimaan layak pakai ke RAK-A01' },
        { id: 'MUT-003', date: '2026-11-01 10:18', sku: 'SKU-RTR-12100', skuName: 'Baterai RITAR RA12-100', type: 'TERTAHAN', qty: 2, refDoc: 'GR-202611-0003', pic: 'Budi Santoso', note: 'Karantina 2 unit ke RAK-QC untuk klaim prinsipal' }
      ],

      /* --- PENGIRIMAN & SURAT JALAN (SJ-YYYYMM-XXXX) --- */
      deliveries: [
        {
          id: 'SJ-202611-0008',
          orderId: 'SO-202611-0010',
          clientPoNumber: 'PO/DPI-DC/2026/1104',
          customerName: 'PT. Daya Pustaka Indonesia',
          deliveryDate: '2026-11-05',
          driverName: 'Pak Slamet Riyadi',
          vehiclePlate: 'B 9482 KXT (Blindvan Box NPP-02)',
          deliveryType: 'Parsial (Tahap 1)',
          status: 'Terkirim & BAST',
          bastFileName: 'BAST-SJ-202611-0008-Signed.pdf',
          address: 'Kawasan Industri Pulogadung Blok J-14, Jakarta Timur',
          recipientPic: 'Bpk. Hendra Wijaya',
          items: [
            { sku: 'SKU-RTR-12100', name: 'Baterai RITAR RA12-100 (12V 100Ah VRLA AGM)', qty: 16, unit: 'Unit', serialRange: 'RTR100-2611-001 s/d 016' },
            { sku: 'SKU-ABL-MS3K', name: 'UPS Ablerex Mars II MS3000RT (3 kVA Online)', qty: 2, unit: 'Unit', serialRange: 'ABL3K-99201, ABL3K-99202' }
          ]
        },
        {
          id: 'SJ-202611-0007',
          orderId: 'SO-202611-0007',
          clientPoNumber: 'BIZZY-ENT-PO-99201',
          customerName: 'PT. Bizzy Commerce Indonesia',
          deliveryDate: '2026-11-04',
          driverName: 'Pak Dedi Kurniawan',
          vehiclePlate: 'B 9104 KXA (Engkel Box NPP-01)',
          deliveryType: 'Pengiriman Penuh',
          status: 'Terkirim & BAST',
          bastFileName: 'BAST-SJ-202611-0007-Signed.pdf',
          address: 'Sovereign Plaza / Hub Fulfillment Bizzy Sunter',
          recipientPic: 'Bpk. Dimas Anggara',
          items: [
            { sku: 'SKU-ABL-MS10K', name: 'UPS Ablerex Mars II MS10000RT (10 kVA Online)', qty: 3, unit: 'Unit', serialRange: 'ABL10K-88101 s/d 88103' },
            { sku: 'SKU-BSB-FT150', name: 'Baterai BSB FT12-150 (12V 150Ah Front Terminal)', qty: 16, unit: 'Unit', serialRange: 'BSB150-4401 s/d 4416' }
          ]
        }
      ],

      /* --- PENAGIHAN & INVOICE RESMI (INV-YYYYMM-XXXX) --- */
      invoices: [
        {
          id: 'INV-202611-0006',
          orderId: 'SO-202611-0011',
          clientPoNumber: 'PO-MSTEEL/ELC/2026/412',
          customerName: 'PT. The Master Steel Mfc',
          invoiceDate: '2026-11-05',
          dueDate: '2026-11-12',
          billingType: 'Tagihan DP 30%',
          dpp: 106080000,
          ppn: 11668800,
          total: 117748800,
          paidAmount: 0,
          status: 'Belum Lunas',
          bankRef: 'BCA 521-098-7741'
        },
        {
          id: 'INV-202611-0005',
          orderId: 'SO-202611-0007',
          clientPoNumber: 'BIZZY-ENT-PO-99201',
          customerName: 'PT. Bizzy Commerce Indonesia',
          invoiceDate: '2026-11-04',
          dueDate: '2026-12-04',
          billingType: 'Pelunasan Penuh (100%)',
          dpp: 189600000,
          ppn: 20856000,
          total: 210456000,
          paidAmount: 0,
          status: 'Belum Lunas',
          bankRef: 'Mandiri 156-00-0988234-5'
        },
        {
          id: 'INV-202610-0004',
          orderId: 'SO-202610-0005',
          clientPoNumber: 'PO/DPI-DC/2026/1019',
          customerName: 'PT. Daya Pustaka Indonesia',
          invoiceDate: '2026-10-05',
          dueDate: '2026-11-04',
          billingType: 'Pelunasan Penuh (100%)',
          dpp: 87000000,
          ppn: 9570000,
          total: 96570000,
          paidAmount: 0,
          status: 'Jatuh Tempo',
          bankRef: 'BCA 521-098-7741'
        },
        {
          id: 'INV-202610-0003',
          orderId: 'SO-202610-0006',
          clientPoNumber: 'PO/JASTEL/X/2026/071',
          customerName: 'PT. Jasnita Telekomindo Tbk',
          invoiceDate: '2026-10-25',
          dueDate: '2026-12-09',
          billingType: 'Pelunasan Penuh (100%)',
          dpp: 118800000,
          ppn: 13068000,
          total: 131868000,
          paidAmount: 131868000,
          status: 'Lunas',
          bankRef: 'Mandiri 156-00-0988234-5'
        },
        {
          id: 'INV-202610-0002',
          orderId: 'SO-202610-0003',
          clientPoNumber: 'SAI/PROC/PO/2026/710',
          customerName: 'PT. Sumber Abadi Indonesia',
          invoiceDate: '2026-10-16',
          dueDate: '2026-10-30',
          billingType: 'Pelunasan Penuh (100%)',
          dpp: 94500000,
          ppn: 10395000,
          total: 104895000,
          paidAmount: 0,
          status: 'Jatuh Tempo',
          bankRef: 'BCA 521-098-7741'
        }
      ],

      /* --- ARSIP DOKUMEN DIGITAL --- */
      archives: [
        { id: 'ARC-2026-011', docType: 'PO Asli Pelanggan', docNumber: 'PO/JASTEL/XI/2026/089', refId: 'SO-202611-0012', partner: 'PT. Jasnita Telekomindo Tbk', date: '2026-11-06', fileName: 'PO-Jasnita-089-Signed.pdf', uploadedBy: 'Nadia Pramesti' },
        { id: 'ARC-2026-010', docType: 'PO Asli Pelanggan', docNumber: 'PO-MSTEEL/ELC/2026/412', refId: 'SO-202611-0011', partner: 'PT. The Master Steel Mfc', date: '2026-11-05', fileName: 'PO-MasterSteel-412-Stempel.pdf', uploadedBy: 'Nadia Pramesti' },
        { id: 'ARC-2026-009', docType: 'Surat Jalan & BAST', docNumber: 'SJ-202611-0008', refId: 'SO-202611-0010', partner: 'PT. Daya Pustaka Indonesia', date: '2026-11-05', fileName: 'BAST-SJ-202611-0008-Signed.pdf', uploadedBy: 'Budi Santoso' },
        { id: 'ARC-2026-008', docType: 'Invoice & Faktur Pajak', docNumber: 'INV-202611-0005', refId: 'SO-202611-0007', partner: 'PT. Bizzy Commerce Indonesia', date: '2026-11-04', fileName: 'INV-202611-0005-eFaktur.pdf', uploadedBy: 'Siti Rahmawati' },
        { id: 'ARC-2026-007', docType: 'Surat Jalan & BAST', docNumber: 'SJ-202611-0007', refId: 'SO-202611-0007', partner: 'PT. Bizzy Commerce Indonesia', date: '2026-11-04', fileName: 'BAST-SJ-202611-0007-Signed.pdf', uploadedBy: 'Budi Santoso' }
      ],

      /* --- LOG AUDIT TRAIL SISTEM --- */
      auditLogs: [
        { id: 'LOG-1008', timestamp: '2026-11-06 10:15:22', user: 'Tim Operasional & Logistik', role: 'Operasional', action: 'INPUT_PO_PELANGGAN', target: 'SO-202611-0012', detail: 'Membuat pesanan baru PT. Jasnita Telekomindo Tbk senilai Rp 169.608.000 (Menunggu Approval)' },
        { id: 'LOG-1007', timestamp: '2026-11-05 16:40:10', user: 'Siti Rahmawati', role: 'Finance', action: 'TERBIT_INVOICE_DP', target: 'INV-202611-0006', detail: 'Menerbitkan Tagihan DP 30% untuk PT. The Master Steel Mfc (SO-202611-0011)' },
        { id: 'LOG-1006', timestamp: '2026-11-05 14:12:05', user: 'Tim Operasional & Logistik', role: 'Operasional', action: 'CETAK_SURAT_JALAN', target: 'SJ-202611-0008', detail: 'Menerbitkan Surat Jalan pengiriman parsial Tahap 1 ke PT. Daya Pustaka Indonesia' },
        { id: 'LOG-1005', timestamp: '2026-11-04 11:30:49', user: 'Raja Daffa', role: 'Super Admin', action: 'APPROVE_SO', target: 'SO-202611-0010', detail: 'Menyetujui PO Pelanggan PT. Daya Pustaka Indonesia & mengaktifkan kuota pengiriman' },
        { id: 'LOG-1004', timestamp: '2026-11-02 16:28:00', user: 'Tim Operasional & Logistik', role: 'Operasional', action: 'QC_GOODS_RECEIPT', target: 'GR-202611-0004', detail: 'Menerima 6 unit UPS Ablerex 10 kVA dari PO-202610-0003 (100% Lolos QC -> RAK-B01)' }
      ]
    };
  }

  /* ==========================================================================
     3. INISIALISASI & PERSISTENSI DATABASE DI LOCALSTORAGE
     ========================================================================== */
  function isPageReload() {
    try {
      var navEntries = performance.getEntriesByType && performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        return navEntries[0].type === 'reload';
      }
      if (window.performance && window.performance.navigation) {
        return window.performance.navigation.type === 1; // 1 = TYPE_RELOAD
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function loadDatabase() {
    if (isPageReload()) {
      return resetDatabase();
    }
    try {
      var raw = localStorage.getItem(STORAGE_KEY_DB);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.meta && parsed.meta.version === '1.0.0-HLD001' && Array.isArray(parsed.orders)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gagal membaca localStorage DB, menggunakan data default:', err);
    }
    var fresh = createInitialDatabase();
    saveDatabase(fresh);
    return fresh;
  }

  function saveDatabase(dbObj) {
    try {
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(dbObj || window.NPP_ERP_DATA));
    } catch (err) {
      console.warn('Gagal menyimpan DB ke localStorage:', err);
    }
  }

  function resetDatabase() {
    var fresh = createInitialDatabase();
    window.NPP_ERP_DATA = fresh;
    saveDatabase(fresh);
    return fresh;
  }

  window.NPP_ERP_DATA = loadDatabase();

  /* ==========================================================================
     4. UTILITAS FORMATTING & BADGE MAPPER
     ========================================================================== */
  function formatRupiah(amount) {
    var num = Number(amount) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  function formatMoneyRBAC(amount, isHpp) {
    var role = RoleManager.getCurrentRoleConfig();
    if (!role.canViewPrice) {
      return '<span class="badge-status badge-neutral" title="Disembunyikan oleh proteksi peran">Terproteksi</span>';
    }
    if (isHpp && !role.canViewHPP) {
      return '<span class="badge-status badge-neutral" title="HPP Terproteksi">HPP Terproteksi</span>';
    }
    return formatRupiah(amount);
  }

  function terbilang(nominal) {
    var angka = Math.floor(Math.abs(Number(nominal) || 0));
    var huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    function convert(n) {
      if (n < 12) return huruf[n];
      if (n < 20) return convert(n - 10) + ' Belas';
      if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + convert(n % 10) : '');
      if (n < 200) return 'Seratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
      if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
      if (n < 2000) return 'Seribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
      if (n < 1000000000000) return convert(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
      return convert(Math.floor(n / 1000000000000)) + ' Triliun' + (n % 1000000000000 !== 0 ? ' ' + convert(n % 1000000000000) : '');
    }
    if (angka === 0) return 'Nol Rupiah';
    return (convert(angka).trim() + ' Rupiah').replace(/\s+/g, ' ');
  }

  function getStatusBadgeClass(statusText) {
    var s = String(statusText || '').toLowerCase();
    if (
      s.indexOf('disetujui') !== -1 ||
      s.indexOf('lunas') !== -1 ||
      s.indexOf('selesai') !== -1 ||
      s.indexOf('terpenuhi') !== -1 ||
      s.indexOf('terkirim penuh') !== -1 ||
      s.indexOf('siap kirim') !== -1 ||
      s.indexOf('diterima penuh') !== -1 ||
      s.indexOf('aktif') !== -1 ||
      s.indexOf('normal') !== -1 ||
      s.indexOf('aman') !== -1 ||
      s.indexOf('tayang') !== -1 ||
      s.indexOf('masuk') !== -1
    ) {
      return 'badge-success';
    }
    if (
      s.indexOf('menunggu') !== -1 ||
      s.indexOf('diajukan') !== -1 ||
      s.indexOf('sebagian') !== -1 ||
      s.indexOf('perjalanan') !== -1 ||
      s.indexOf('tagihan dp') !== -1 ||
      s.indexOf('invoice terbit') !== -1 ||
      s.indexOf('belum lunas') !== -1 ||
      s.indexOf('kritis') !== -1
    ) {
      return 'badge-warning';
    }
    if (
      s.indexOf('jatuh tempo') !== -1 ||
      s.indexOf('ditolak') !== -1 ||
      s.indexOf('tertahan') !== -1 ||
      s.indexOf('habis') !== -1 ||
      s.indexOf('keluar') !== -1
    ) {
      return 'badge-danger';
    }
    if (
      s.indexOf('diproses') !== -1 ||
      s.indexOf('dikonfirmasi') !== -1 ||
      s.indexOf('direservasi') !== -1 ||
      s.indexOf('reservasi') !== -1
    ) {
      return 'badge-info';
    }
    return 'badge-neutral';
  }

  function renderStatusBadge(label) {
    var cls = getStatusBadgeClass(label);
    return '<span class="badge-status ' + cls + '">' + escapeHtml(label) + '</span>';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function addAuditLog(action, target, detail) {
    var roleCfg = RoleManager.getCurrentRoleConfig();
    var now = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var ts = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' +
      pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

    var entry = {
      id: 'LOG-' + (1000 + window.NPP_ERP_DATA.auditLogs.length + 1),
      timestamp: ts,
      user: roleCfg.userName,
      role: roleCfg.code,
      action: action,
      target: target,
      detail: detail
    };
    window.NPP_ERP_DATA.auditLogs.unshift(entry);
    saveDatabase(window.NPP_ERP_DATA);
  }

  function showToast(message) {
    var toast = document.getElementById('erpGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'erpGlobalToast';
      toast.className = 'erp-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML =
      '<div class="erp-toast-icon">' +
      '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
      '    <path d="M20 6 9 17l-5-5"/>' +
      '  </svg>' +
      '</div>' +
      '<span>' + escapeHtml(message) + '</span>';
    toast.classList.add('erp-toast-visible');
    if (toast._timer) clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('erp-toast-visible');
    }, 3400);
  }

  function showConfirmAlert(options) {
    var modal = document.getElementById('erpGlobalConfirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'erpGlobalConfirmModal';
      modal.className = 'erp-modal-overlay';
      modal.setAttribute('aria-hidden', 'true');
      document.body.appendChild(modal);
    }

    var type = options.type || 'warning';
    var title = options.title || 'Konfirmasi Tindakan';
    var message = options.message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?';
    var confirmText = options.confirmText || 'Konfirmasi';
    var cancelText = options.cancelText || 'Batal';
    var confirmBtnClass = options.confirmClass || (type === 'success' ? 'btn-erp-success' : (type === 'danger' ? 'btn-erp-danger' : 'btn-erp-primary'));

    var iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    } else if (type === 'danger') {
      iconSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else {
      iconSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    }

    modal.innerHTML =
      '<div class="erp-confirm-card" role="dialog" aria-modal="true">' +
      '  <div class="erp-confirm-icon erp-confirm-icon-' + type + '">' + iconSvg + '</div>' +
      '  <div class="erp-confirm-text">' +
      '    <h3 class="erp-confirm-title">' + escapeHtml(title) + '</h3>' +
      '    <p class="erp-confirm-desc">' + escapeHtml(message) + '</p>' +
      '  </div>' +
      '  <div class="erp-confirm-actions">' +
      '    <button type="button" class="btn-erp btn-confirm-cancel">' + escapeHtml(cancelText) + '</button>' +
      '    <button type="button" class="btn-erp ' + confirmBtnClass + ' btn-confirm-ok">' + escapeHtml(confirmText) + '</button>' +
      '  </div>' +
      '</div>';

    modal.classList.add('modal-open');

    var onKeydown = function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeModal();
      }
    };

    var closeModal = function () {
      modal.classList.remove('modal-open');
      document.removeEventListener('keydown', onKeydown);
    };

    document.addEventListener('keydown', onKeydown);

    var cancelBtn = modal.querySelector('.btn-confirm-cancel');
    var okBtn = modal.querySelector('.btn-confirm-ok');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }

    if (okBtn) {
      okBtn.addEventListener('click', function () {
        closeModal();
        if (typeof options.onConfirm === 'function') {
          options.onConfirm();
        }
      });
      setTimeout(function () {
        try { okBtn.focus(); } catch (e) {}
      }, 50);
    }

    modal.onclick = function (e) {
      if (e.target === modal) closeModal();
    };
  }

  /* ==========================================================================
     4B. THEME MANAGER (DARK / LIGHT MODE DENGAN PERSISTENCE & SOFT EYE-CARE)
     ========================================================================== */
  var ThemeManager = {
    STORAGE_KEY: STORAGE_KEY_THEME,

    getSavedTheme: function () {
      try {
        var saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
      } catch (e) {}
      return 'light';
    },

    setTheme: function (theme) {
      if (theme !== 'dark' && theme !== 'light') theme = 'light';
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(this.STORAGE_KEY, theme);
      } catch (e) {}
      this.updateToggles(theme);
    },

    toggle: function () {
      var current = document.documentElement.getAttribute('data-theme') || this.getSavedTheme();
      var next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      return next;
    },

    updateToggles: function (theme) {
      var toggles = document.querySelectorAll('.erp-theme-toggle');
      toggles.forEach(function (btn) {
        var isDark = theme === 'dark';
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        btn.setAttribute('title', isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap');
        btn.setAttribute('aria-label', isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap');
      });
    },

    init: function () {
      var theme = this.getSavedTheme();
      this.setTheme(theme);

      var topbarRights = document.querySelectorAll('.erp-topbar-right');
      var self = this;

      topbarRights.forEach(function (wrap) {
        var existingBtn = wrap.querySelector('.erp-theme-toggle');
        if (!existingBtn) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'erp-theme-toggle';
          btn.id = 'erpThemeToggle';
          btn.setAttribute('aria-label', theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap');
          btn.setAttribute('title', theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap');
          btn.innerHTML =
            '<svg class="erp-theme-icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="12" cy="12" r="5" />' +
            '<line x1="12" y1="1" x2="12" y2="3" />' +
            '<line x1="12" y1="21" x2="12" y2="23" />' +
            '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />' +
            '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />' +
            '<line x1="1" y1="12" x2="3" y2="12" />' +
            '<line x1="21" y1="12" x2="23" y2="12" />' +
            '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />' +
            '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />' +
            '</svg>' +
            '<svg class="erp-theme-icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />' +
            '</svg>';

          btn.addEventListener('click', function () {
            self.toggle();
          });

          wrap.appendChild(btn);
        } else {
          existingBtn.addEventListener('click', function () {
            self.toggle();
          });
        }
      });

      this.updateToggles(theme);
    }
  };

  /* ==========================================================================
     5. ROLE MANAGER (RBAC 3 PERAN & SINKRONISASI UI REAL-TIME)
     ========================================================================== */
  var RoleManager = {
    listeners: [],

    getCurrentSession: function () {
      if (isPageReload()) {
        var def = ROLE_CONFIG['Super Admin'];
        var resetSession = {
          role: def.code,
          email: def.email,
          userName: def.userName,
          loginAt: new Date().toISOString()
        };
        try {
          localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(resetSession));
        } catch (e) {
          /* ignore */
        }
        return resetSession;
      }
      try {
        var raw = localStorage.getItem(STORAGE_KEY_SESSION);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.role && ROLE_CONFIG[parsed.role]) {
            return parsed;
          }
        }
      } catch (e) {
        /* ignore */
      }
      var def = ROLE_CONFIG['Super Admin'];
      return {
        role: def.code,
        email: def.email,
        userName: def.userName,
        loginAt: new Date().toISOString()
      };
    },

    getCurrentRoleConfig: function () {
      var session = this.getCurrentSession();
      return ROLE_CONFIG[session.role] || ROLE_CONFIG['Super Admin'];
    },

    setRole: function (roleCode) {
      var cfg = ROLE_CONFIG[roleCode] || ROLE_CONFIG['Super Admin'];
      var session = {
        role: cfg.code,
        email: cfg.email,
        userName: cfg.userName,
        loginAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      } catch (e) {
        /* ignore */
      }
      this.applyRoleToDOM();
      this.listeners.forEach(function (fn) {
        try { fn(cfg); } catch (err) { console.error(err); }
      });
      showToast('Peran aktif diubah ke: ' + cfg.display + ' (' + cfg.userName + ')');
    },

    onChange: function (callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    },

    applyRoleToDOM: function () {
      var cfg = this.getCurrentRoleConfig();

      // 1. Toggle class proteksi harga pada body jika role tidak berhak melihat harga
      if (!cfg.canViewPrice) {
        document.body.classList.add('role-gudang-active');
      } else {
        document.body.classList.remove('role-gudang-active');
      }

      // 2. Sinkronisasi Dropdown Role Switcher di Topbar
      var switcher = document.getElementById('erpRoleSwitcher');
      if (switcher && switcher.value !== cfg.code) {
        switcher.value = cfg.code;
      }

      // 3. Sinkronisasi Nama & Email Pegawai di Sidebar / Topbar
      var userNameEl = document.getElementById('erpActiveUserName');
      if (userNameEl) userNameEl.textContent = cfg.userName;

      var userEmailEl = document.getElementById('erpActiveUserEmail');
      if (userEmailEl) userEmailEl.textContent = cfg.email;

      var roleBadgeEl = document.getElementById('erpActiveRoleTag');
      if (roleBadgeEl) roleBadgeEl.textContent = cfg.display;

      // 4. Sinkronisasi Banner Status Peran Aktif
      var bannerTitle = document.getElementById('erpRoleBannerTitle');
      var bannerDesc = document.getElementById('erpRoleBannerDesc');
      var bannerChip = document.getElementById('erpRoleRestrictionChip');
      if (bannerTitle) bannerTitle.textContent = cfg.bannerTitle;
      if (bannerDesc) bannerDesc.textContent = cfg.bannerDesc;
      if (bannerChip) bannerChip.textContent = cfg.restrictionText;

      // 5. Sembunyikan menu Penagihan & Invoice pada Sidebar jika role tidak memiliki hak akses keuangan
      var billingNavItems = document.querySelectorAll('[data-nav-module="billing"]');
      billingNavItems.forEach(function (el) {
        el.classList.toggle('erp-hidden', !cfg.canAccessBilling);
      });

      // 6. Toggle elemen dengan atribut data-rbac-approver-only
      var approveOnlyEls = document.querySelectorAll('[data-rbac-approver-only="true"]');
      approveOnlyEls.forEach(function (el) {
        el.classList.toggle('erp-hidden', !cfg.canApprove);
      });
    },

    initTopbarSwitcher: function () {
      var self = this;
      var switcher = document.getElementById('erpRoleSwitcher');
      if (switcher) {
        var current = this.getCurrentRoleConfig();
        switcher.value = current.code;
        switcher.addEventListener('change', function () {
          self.setRole(switcher.value);
        });
      }

      // Mobile sidebar toggle
      var mobileToggle = document.getElementById('erpMobileMenuBtn');
      var sidebar = document.getElementById('erpSidebar');
      var backdrop = document.getElementById('erpSidebarBackdrop');

      if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function () {
          sidebar.classList.toggle('sidebar-open');
          if (backdrop) backdrop.classList.toggle('backdrop-active');
        });
      }
      if (backdrop && sidebar) {
        backdrop.addEventListener('click', function () {
          sidebar.classList.remove('sidebar-open');
          backdrop.classList.remove('backdrop-active');
        });
      }

      // Update badge jumlah antrean approval di sidebar
      this.updateSidebarCounters();
      this.applyRoleToDOM();
    },

    updateSidebarCounters: function () {
      var db = window.NPP_ERP_DATA;
      var pendingOrders = db.orders.filter(function (o) {
        return o.statusApproval === 'Menunggu Persetujuan';
      }).length;
      var criticalSkus = db.inventory.filter(function (item) {
        return item.tersedia <= item.minStok;
      }).length;
      var overdueInvoices = db.invoices.filter(function (inv) {
        return inv.status === 'Jatuh Tempo';
      }).length;

      var badgeOrders = document.getElementById('navBadgeOrders');
      if (badgeOrders) badgeOrders.textContent = pendingOrders > 0 ? pendingOrders + ' Pending' : db.orders.length;

      var badgeInv = document.getElementById('navBadgeInventory');
      if (badgeInv) badgeInv.textContent = criticalSkus > 0 ? criticalSkus + ' Kritis' : db.inventory.length + ' SKU';

      var badgeBilling = document.getElementById('navBadgeBilling');
      if (badgeBilling) badgeBilling.textContent = overdueInvoices > 0 ? overdueInvoices + ' Overdue' : db.invoices.length;
    }
  };

  /* ==========================================================================
     6. TABLE ENGINE (REUSABLE SEARCH, MULTI-FILTER & CLEAN PAGINATION)
     ========================================================================== */
  function TableEngine(options) {
    this.getData = options.getData || function () { return []; };
    this.renderRow = options.renderRow;
    this.tbodyId = options.tbodyId;
    this.paginationId = options.paginationId;
    this.searchInputId = options.searchInputId;
    this.pageSizeSelectId = options.pageSizeSelectId;
    this.filters = options.filters || []; // [{ selectId: '...', match: function(item, val) }]
    this.searchFn = options.searchFn || function () { return true; };
    this.emptyMessage = options.emptyMessage || 'Tidak ada data yang sesuai dengan kriteria pencarian.';
    this.colSpan = options.colSpan || 8;
    this.currentPage = 1;
    this.pageSize = options.defaultPageSize || 5;
    this.onAfterRender = options.onAfterRender || null;

    this.bindControls();
  }

  TableEngine.prototype.bindControls = function () {
    var self = this;

    if (this.searchInputId) {
      var searchEl = document.getElementById(this.searchInputId);
      if (searchEl) {
        searchEl.addEventListener('input', function () {
          self.currentPage = 1;
          self.render();
        });
      }
    }

    if (this.pageSizeSelectId) {
      var sizeEl = document.getElementById(this.pageSizeSelectId);
      if (sizeEl) {
        sizeEl.value = String(this.pageSize);
        sizeEl.addEventListener('change', function () {
          self.pageSize = parseInt(sizeEl.value, 10) || 5;
          self.currentPage = 1;
          self.render();
        });
      }
    }

    this.filters.forEach(function (f) {
      var sel = document.getElementById(f.selectId);
      if (sel) {
        sel.addEventListener('change', function () {
          self.currentPage = 1;
          self.render();
        });
      }
    });
  };

  TableEngine.prototype.getFilteredData = function () {
    var raw = this.getData() || [];
    var query = '';
    if (this.searchInputId) {
      var sEl = document.getElementById(this.searchInputId);
      if (sEl) query = sEl.value.trim().toLowerCase();
    }

    var activeFilters = this.filters.map(function (f) {
      var el = document.getElementById(f.selectId);
      return {
        val: el ? el.value : 'ALL',
        match: f.match
      };
    });

    var self = this;
    return raw.filter(function (item) {
      if (query && !self.searchFn(item, query)) {
        return false;
      }
      for (var i = 0; i < activeFilters.length; i++) {
        var af = activeFilters[i];
        if (af.val && af.val !== 'ALL') {
          if (!af.match(item, af.val)) return false;
        }
      }
      return true;
    });
  };

  TableEngine.prototype.render = function () {
    var tbody = document.getElementById(this.tbodyId);
    if (!tbody) return;

    var filtered = this.getFilteredData();
    var totalItems = filtered.length;
    var totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    var startIdx = (this.currentPage - 1) * this.pageSize;
    var endIdx = Math.min(startIdx + this.pageSize, totalItems);
    var pageItems = filtered.slice(startIdx, endIdx);

    if (pageItems.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="' + this.colSpan + '" class="erp-empty-state">' +
        escapeHtml(this.emptyMessage) +
        '</td></tr>';
    } else {
      var htmlRows = [];
      for (var i = 0; i < pageItems.length; i++) {
        htmlRows.push(this.renderRow(pageItems[i], startIdx + i));
      }
      tbody.innerHTML = htmlRows.join('');
    }

    this.renderPagination(totalItems, startIdx, endIdx, totalPages);

    if (typeof this.onAfterRender === 'function') {
      this.onAfterRender(pageItems, totalItems);
    }
  };

  TableEngine.prototype.renderPagination = function (totalItems, startIdx, endIdx, totalPages) {
    var container = document.getElementById(this.paginationId);
    if (!container) return;

    if (totalItems === 0) {
      container.innerHTML = '';
      return;
    }

    var pageButtons = [];
    var prevDisabled = this.currentPage <= 1 ? ' disabled' : '';
    pageButtons.push(
      '<button type="button" class="erp-page-btn erp-page-btn-nav" data-page="' + (this.currentPage - 1) + '"' + prevDisabled + ' aria-label="Halaman Sebelumnya">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
      '<span>Sebelumnya</span>' +
      '</button>'
    );

    for (var p = 1; p <= totalPages; p++) {
      var activeCls = p === this.currentPage ? ' erp-page-btn-active' : '';
      pageButtons.push(
        '<button type="button" class="erp-page-btn' + activeCls + '" data-page="' + p + '">' + p + '</button>'
      );
    }

    var nextDisabled = this.currentPage >= totalPages ? ' disabled' : '';
    pageButtons.push(
      '<button type="button" class="erp-page-btn erp-page-btn-nav" data-page="' + (this.currentPage + 1) + '"' + nextDisabled + ' aria-label="Halaman Berikutnya">' +
      '<span>Berikutnya</span>' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
      '</button>'
    );

    container.innerHTML = '<div class="erp-pagination-controls">' + pageButtons.join('') + '</div>';

    var self = this;
    var btns = container.querySelectorAll('.erp-page-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var targetPage = parseInt(btn.getAttribute('data-page'), 10);
        if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
          self.currentPage = targetPage;
          self.render();
        }
      });
    });
  };

  /* ==========================================================================
     7. DASHBOARD CONTROLLER (KHUSUS HALAMAN internal/index.html)
     ========================================================================== */
  var DashboardController = {
    ordersTable: null,
    stockTable: null,

    init: function () {
      if (!document.getElementById('erpDashboardPage')) return;

      var self = this;
      this.renderKPIs();
      this.renderQuickApprovalPanel();
      this.renderStockSummaryStrip();
      this.initOrdersTable();
      this.initStockTable();
      this.bindOrderDetailModal();

      // Re-render semua bagian saat Role diubah lewat Role Switcher
      RoleManager.onChange(function () {
        self.renderKPIs();
        self.renderQuickApprovalPanel();
        self.renderStockSummaryStrip();
        if (self.ordersTable) self.ordersTable.render();
        if (self.stockTable) self.stockTable.render();
      });
    },

    renderKPIs: function () {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();

      // 1. Pesanan Aktif
      var activeOrders = db.orders.filter(function (o) {
        return o.statusOrder !== 'Selesai' && o.statusOrder !== 'Dibatalkan';
      });
      var kpiActiveOrdersVal = document.getElementById('kpiActiveOrdersVal');
      var kpiActiveOrdersSub = document.getElementById('kpiActiveOrdersSub');
      if (kpiActiveOrdersVal) kpiActiveOrdersVal.textContent = activeOrders.length + ' PO Aktif';
      if (kpiActiveOrdersSub) kpiActiveOrdersSub.textContent = 'Dari total ' + db.orders.length + ' PO Pelanggan B2B';

      // 2. Omset Bulan Berjalan (Disembunyikan otomatis bila role = Gudang)
      var novOrders = db.orders.filter(function (o) {
        return o.orderDate.indexOf('2026-11') === 0;
      });
      var totalOmsetNov = novOrders.reduce(function (acc, o) { return acc + (o.total || 0); }, 0);
      var totalDeliveredReady = db.deliveries.length;

      var kpiOmsetLabel = document.getElementById('kpiOmsetLabel');
      var kpiOmsetVal = document.getElementById('kpiOmsetVal');
      var kpiOmsetSub = document.getElementById('kpiOmsetSub');

      if (!roleCfg.canViewPrice) {
        if (kpiOmsetLabel) kpiOmsetLabel.textContent = 'Realisasi Surat Jalan';
        if (kpiOmsetVal) kpiOmsetVal.textContent = totalDeliveredReady + ' Pengiriman';
        if (kpiOmsetSub) kpiOmsetSub.textContent = 'Mode Operasional: Nilai Rupiah disembunyikan';
      } else {
        if (kpiOmsetLabel) kpiOmsetLabel.textContent = 'Omset Bulan Berjalan';
        if (kpiOmsetVal) kpiOmsetVal.textContent = formatRupiah(totalOmsetNov);
        if (kpiOmsetSub) kpiOmsetSub.textContent = novOrders.length + ' PO masuk periode November 2026';
      }

      // 3. Antrean Approval
      var pendingSO = db.orders.filter(function (o) { return o.statusApproval === 'Menunggu Persetujuan'; }).length;
      var pendingPO = db.procurements.filter(function (p) {
        return p.statusApproval === 'Menunggu Persetujuan' || p.statusApproval === 'Diajukan';
      }).length;
      var totalPendingApproval = pendingSO + pendingPO;

      var kpiApprovalVal = document.getElementById('kpiApprovalVal');
      var kpiApprovalSub = document.getElementById('kpiApprovalSub');
      if (kpiApprovalVal) kpiApprovalVal.textContent = totalPendingApproval + ' Dokumen';
      if (kpiApprovalSub) kpiApprovalSub.textContent = pendingSO + ' PO Klien • ' + pendingPO + ' PO Prinsipal';

      // 4. Alert Stok Kritis
      var criticalSkus = db.inventory.filter(function (item) {
        return item.tersedia <= item.minStok;
      });
      var kpiCriticalVal = document.getElementById('kpiCriticalVal');
      var kpiCriticalSub = document.getElementById('kpiCriticalSub');
      if (kpiCriticalVal) kpiCriticalVal.textContent = criticalSkus.length + ' SKU Kritis';
      if (kpiCriticalSub) kpiCriticalSub.textContent = 'Stok Tersedia di bawah batas minimum';

      // 5. Piutang Jatuh Tempo (Atau Total Kuota Reservasi bila role tidak berhak melihat finansial)
      var overdueInvs = db.invoices.filter(function (inv) { return inv.status === 'Jatuh Tempo'; });
      var overdueSum = overdueInvs.reduce(function (acc, inv) { return acc + (inv.total - inv.paidAmount); }, 0);
      var totalReservedUnits = db.inventory.reduce(function (acc, i) { return acc + i.reservasi; }, 0);

      var kpiReceivableLabel = document.getElementById('kpiReceivableLabel');
      var kpiReceivableVal = document.getElementById('kpiReceivableVal');
      var kpiReceivableSub = document.getElementById('kpiReceivableSub');

      if (!roleCfg.canViewPrice) {
        if (kpiReceivableLabel) kpiReceivableLabel.textContent = 'Total Unit Direservasi';
        if (kpiReceivableVal) kpiReceivableVal.textContent = totalReservedUnits + ' Unit/Cell';
        if (kpiReceivableSub) kpiReceivableSub.textContent = 'Terkunci untuk pesanan aktif pelanggan';
      } else {
        if (kpiReceivableLabel) kpiReceivableLabel.textContent = 'Piutang Jatuh Tempo';
        if (kpiReceivableVal) kpiReceivableVal.textContent = formatRupiah(overdueSum);
        if (kpiReceivableSub) kpiReceivableSub.textContent = overdueInvs.length + ' Invoice melewati batas termin';
      }
    },

    renderQuickApprovalPanel: function () {
      var container = document.getElementById('quickApprovalList');
      if (!container) return;

      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();

      var pendingOrders = db.orders.filter(function (o) {
        return o.statusApproval === 'Menunggu Persetujuan';
      });

      if (pendingOrders.length === 0) {
        container.innerHTML =
          '<div class="approval-item">' +
          '<div class="approval-item-top">' +
          '<span class="approval-item-id">Semua Dokumen Terotorisasi</span>' +
          '</div>' +
          '<div class="approval-item-meta">Tidak ada antrean PO Pelanggan yang menunggu persetujuan saat ini.</div>' +
          '</div>';
        return;
      }

      var self = this;
      var html = pendingOrders.map(function (o) {
        var priceText = roleCfg.canViewPrice ? formatRupiah(o.total) : 'Nominal Terproteksi';
        var actionButtons = roleCfg.canApprove
          ? '<div class="approval-item-actions">' +
            '<button type="button" class="btn-erp btn-erp-success btn-erp-sm" data-approve-so="' + o.id + '">Setujui PO</button>' +
            '<button type="button" class="btn-erp btn-erp-danger btn-erp-sm" data-reject-so="' + o.id + '">Tolak</button>' +
            '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" data-detail-so="' + o.id + '">Detail</button>' +
            '</div>'
          : '<div class="approval-item-actions">' +
            '<span class="badge-status badge-warning">Menunggu Otorisasi Super Admin</span>' +
            '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" data-detail-so="' + o.id + '">Lihat Rincian</button>' +
            '</div>';

        return (
          '<div class="approval-item">' +
          '<div class="approval-item-top">' +
          '<span class="approval-item-id">' + escapeHtml(o.id) + ' • ' + escapeHtml(o.clientPoNumber) + '</span>' +
          '<span class="approval-item-value">' + priceText + '</span>' +
          '</div>' +
          '<div class="approval-item-client">' + escapeHtml(o.customerName) + '</div>' +
          '<div class="approval-item-meta">Termin: ' + escapeHtml(o.paymentTerm) + ' • Target Kirim: ' + escapeHtml(o.deliveryTarget) + '</div>' +
          actionButtons +
          '</div>'
        );
      }).join('');

      container.innerHTML = html;

      // Bind tombol Setujui / Tolak / Detail
      container.querySelectorAll('[data-approve-so]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var soId = btn.getAttribute('data-approve-so');
          self.handleOrderApproval(soId, 'Disetujui');
        });
      });

      container.querySelectorAll('[data-reject-so]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var soId = btn.getAttribute('data-reject-so');
          self.handleOrderApproval(soId, 'Ditolak');
        });
      });

      container.querySelectorAll('[data-detail-so]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var soId = btn.getAttribute('data-detail-so');
          self.openOrderDetailModal(soId);
        });
      });
    },

    handleOrderApproval: function (soId, newStatus) {
      var roleCfg = RoleManager.getCurrentRoleConfig();
      if (!roleCfg.canApprove) {
        showToast('Akses ditolak: Hanya Super Admin yang dapat mengotorisasi PO.');
        return;
      }

      var db = window.NPP_ERP_DATA;
      var order = db.orders.find(function (o) { return o.id === soId; });
      if (!order) return;

      var self = this;
      var isApprove = newStatus === 'Disetujui';
      showConfirmAlert({
        type: isApprove ? 'success' : 'danger',
        title: isApprove ? 'Setujui Pesanan ' + order.id : 'Tolak Pesanan ' + order.id,
        message: isApprove
          ? 'Otorisasi pesanan ' + order.customerName + ' dengan nilai ' + formatMoneyRBAC(order.total, false) + '? Pesanan akan dilanjutkan ke pemrosesan gudang.'
          : 'Tolak pengajuan pesanan ' + order.customerName + '? Status pesanan akan ditangguhkan dan memerlukan evaluasi ulang.',
        confirmText: isApprove ? 'Setujui' : 'Tolak',
        confirmClass: isApprove ? 'btn-erp-success' : 'btn-erp-danger',
        onConfirm: function () {
          order.statusApproval = newStatus;
          if (newStatus === 'Disetujui') {
            order.statusOrder = 'Diproses';
            if (order.statusPemenuhan === 'Stok Direservasi') {
              order.statusPengiriman = 'Siap Kirim Gudang';
            }
          } else if (newStatus === 'Ditolak') {
            order.statusOrder = 'Ditangguhkan';
          }

          saveDatabase(db);
          addAuditLog(
            newStatus === 'Disetujui' ? 'APPROVE_SO' : 'REJECT_SO',
            order.id,
            'Mengubah status persetujuan ' + order.id + ' (' + order.customerName + ') menjadi: ' + newStatus
          );

          RoleManager.updateSidebarCounters();
          self.renderKPIs();
          self.renderQuickApprovalPanel();
          if (self.ordersTable) self.ordersTable.render();
          showToast('Dokumen ' + order.id + ' berhasil ' + (isApprove ? 'disetujui.' : 'ditolak.'), isApprove ? 'success' : 'info');
        }
      });
    },

    renderStockSummaryStrip: function () {
      if (!document.getElementById('sumStokFisik')) return;
      var db = window.NPP_ERP_DATA;
      var totals = db.inventory.reduce(function (acc, item) {
        acc.fisik += item.fisik;
        acc.tertahan += item.tertahan;
        acc.layak += item.layak;
        acc.reservasi += item.reservasi;
        acc.tersedia += item.tersedia;
        return acc;
      }, { fisik: 0, tertahan: 0, layak: 0, reservasi: 0, tersedia: 0 });

      var elFisik = document.getElementById('sumStokFisik');
      var elTertahan = document.getElementById('sumStokTertahan');
      var elLayak = document.getElementById('sumStokLayak');
      var elReservasi = document.getElementById('sumStokReservasi');
      var elTersedia = document.getElementById('sumStokTersedia');

      if (elFisik) elFisik.textContent = totals.fisik + ' Unit';
      if (elTertahan) elTertahan.textContent = totals.tertahan + ' Unit';
      if (elLayak) elLayak.textContent = totals.layak + ' Unit';
      if (elReservasi) elReservasi.textContent = totals.reservasi + ' Unit';
      if (elTersedia) elTersedia.textContent = totals.tersedia + ' Unit';
    },

    initOrdersTable: function () {
      var self = this;
      this.ordersTable = new TableEngine({
        tbodyId: 'dashboardOrdersTbody',
        paginationId: 'dashboardOrdersPagination',
        searchInputId: 'dashboardOrdersSearch',
        pageSizeSelectId: 'dashboardOrdersPageSize',
        defaultPageSize: 5,
        colSpan: 9,
        getData: function () {
          return window.NPP_ERP_DATA.orders;
        },
        searchFn: function (order, q) {
          return (
            order.id.toLowerCase().indexOf(q) !== -1 ||
            order.clientPoNumber.toLowerCase().indexOf(q) !== -1 ||
            order.customerName.toLowerCase().indexOf(q) !== -1 ||
            order.statusOrder.toLowerCase().indexOf(q) !== -1 ||
            order.statusApproval.toLowerCase().indexOf(q) !== -1
          );
        },
        filters: [
          {
            selectId: 'filterOrderApproval',
            match: function (order, val) {
              return order.statusApproval === val;
            }
          },
          {
            selectId: 'filterOrderDelivery',
            match: function (order, val) {
              return order.statusPengiriman === val;
            }
          },
          {
            selectId: 'filterOrderBilling',
            match: function (order, val) {
              return order.statusPenagihan === val;
            }
          }
        ],
        renderRow: function (order) {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          var canApproveNow = roleCfg.canApprove && order.statusApproval === 'Menunggu Persetujuan';

          var actionBtns =
            '<div class="erp-action-btns">' +
            '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" data-view-order="' + order.id + '">Rincian</button>' +
            (canApproveNow
              ? '<button type="button" class="btn-erp btn-erp-success btn-erp-sm" data-quick-approve="' + order.id + '">Setujui</button>'
              : '') +
            '</div>';

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(order.id) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(order.customerName) + '</span></td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(order.total, false) + '</span></td>' +
            '<td>' + renderStatusBadge(order.statusOrder) + '</td>' +
            '<td>' + renderStatusBadge(order.statusApproval) + '</td>' +
            '<td>' + renderStatusBadge(order.statusPemenuhan) + '</td>' +
            '<td>' + renderStatusBadge(order.statusPengiriman) + '</td>' +
            '<td class="col-financial">' + renderStatusBadge(order.statusPenagihan) + '</td>' +
            '<td>' + actionBtns + '</td>' +
            '</tr>'
          );
        },
        onAfterRender: function () {
          var tbody = document.getElementById('dashboardOrdersTbody');
          if (!tbody) return;

          tbody.querySelectorAll('[data-view-order]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              self.openOrderDetailModal(btn.getAttribute('data-view-order'));
            });
          });

          tbody.querySelectorAll('[data-quick-approve]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              self.handleOrderApproval(btn.getAttribute('data-quick-approve'), 'Disetujui');
            });
          });
        }
      });

      this.ordersTable.render();
    },

    initStockTable: function () {
      if (!document.getElementById('dashboardStockTbody')) return;
      this.stockTable = new TableEngine({
        tbodyId: 'dashboardStockTbody',
        paginationId: 'dashboardStockPagination',
        searchInputId: 'dashboardStockSearch',
        pageSizeSelectId: 'dashboardStockPageSize',
        defaultPageSize: 5,
        colSpan: 9,
        getData: function () {
          return window.NPP_ERP_DATA.inventory;
        },
        searchFn: function (item, q) {
          return (
            item.sku.toLowerCase().indexOf(q) !== -1 ||
            item.name.toLowerCase().indexOf(q) !== -1 ||
            item.category.toLowerCase().indexOf(q) !== -1 ||
            item.rack.toLowerCase().indexOf(q) !== -1
          );
        },
        filters: [
          {
            selectId: 'filterStockCategory',
            match: function (item, val) {
              return item.category === val;
            }
          },
          {
            selectId: 'filterStockHealth',
            match: function (item, val) {
              if (val === 'KRITIS') return item.tersedia <= item.minStok;
              if (val === 'AMAN') return item.tersedia > item.minStok;
              return true;
            }
          }
        ],
        renderRow: function (item) {
          var isCritical = item.tersedia <= item.minStok;
          var statusBadge = isCritical
            ? '<span class="badge-status badge-danger">Stok Kritis (Min ' + item.minStok + ')</span>'
            : '<span class="badge-status badge-success">Stok Aman</span>';

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(item.sku) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(item.name) + '</span></td>' +
            '<td><strong>' + item.fisik + '</strong> ' + escapeHtml(item.unit) + '</td>' +
            '<td>' +
            (item.tertahan > 0
              ? '<span class="badge-status badge-danger">' + item.tertahan + ' Hold</span>'
              : '0') +
            '</td>' +
            '<td><strong>' + item.layak + '</strong> ' + escapeHtml(item.unit) + '</td>' +
            '<td><span class="badge-status badge-info">' + item.reservasi + ' Unit</span></td>' +
            '<td><strong class="cell-stock-available">' + item.tersedia + ' ' + escapeHtml(item.unit) + '</strong></td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(item.sellPrice, false) + '</span></td>' +
            '<td>' + statusBadge + '</td>' +
            '</tr>'
          );
        }
      });

      this.stockTable.render();
    },

    bindOrderDetailModal: function () {
      var modal = document.getElementById('orderDetailModal');
      var closeBtn = document.getElementById('closeOrderDetailModal');
      var closeFooterBtn = document.getElementById('closeOrderDetailFooterBtn');

      var closeModal = function () {
        if (modal) modal.classList.remove('modal-open');
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
      if (modal) {
        modal.addEventListener('click', function (e) {
          if (e.target === modal) closeModal();
        });
      }
    },

    openOrderDetailModal: function (soId) {
      var modal = document.getElementById('orderDetailModal');
      if (!modal) {
        window.location.href = 'orders-detail.html?id=' + encodeURIComponent(soId);
        return;
      }
      var body = document.getElementById('orderDetailModalBody');
      var title = document.getElementById('orderDetailModalTitle');
      var approveBtn = document.getElementById('modalApproveOrderBtn');
      if (!modal || !body) return;

      var db = window.NPP_ERP_DATA;
      var order = db.orders.find(function (o) { return o.id === soId; });
      if (!order) return;

      var roleCfg = RoleManager.getCurrentRoleConfig();
      if (title) title.textContent = 'Rincian Pesanan Pelanggan — ' + order.id;

      var rowsHtml = order.items.map(function (item, idx) {
        var subtotal = item.qty * item.price;
        return (
          '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td><span class="cell-code">' + escapeHtml(item.sku) + '</span></td>' +
          '<td><strong>' + escapeHtml(item.name) + '</strong></td>' +
          '<td>' + item.qty + ' ' + escapeHtml(item.unit) + '</td>' +
          '<td>' + formatMoneyRBAC(item.price, false) + '</td>' +
          '<td><strong>' + formatMoneyRBAC(subtotal, false) + '</strong></td>' +
          '</tr>'
        );
      }).join('');

      body.innerHTML =
        '<div class="erp-form-grid modal-grid-spaced">' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Pelanggan B2B</span>' +
        '<div class="modal-card-title-strong">' + escapeHtml(order.customerName) + '</div>' +
        '<span class="cell-subtext">Nomor PO Klien: ' + escapeHtml(order.clientPoNumber) + '</span>' +
        '<span class="cell-subtext">Berkas PO Asli: ' + escapeHtml(order.poFileName) + '</span>' +
        '</div>' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Jadwal & Termin Pembayaran</span>' +
        '<div class="modal-card-title-strong">Target Kirim: ' + escapeHtml(order.deliveryTarget) + '</div>' +
        '<span class="cell-subtext">Tanggal Order: ' + escapeHtml(order.orderDate) + ' • Termin: ' + escapeHtml(order.paymentTerm) + '</span>' +
        '<span class="cell-subtext">PIC Sales: ' + escapeHtml(order.salesPic) + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="stock-formula-strip modal-five-dim-strip">' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Status Order</div>' + renderStatusBadge(order.statusOrder) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Status Approval</div>' + renderStatusBadge(order.statusApproval) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Pemenuhan Stok</div>' + renderStatusBadge(order.statusPemenuhan) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Pengiriman</div>' + renderStatusBadge(order.statusPengiriman) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Penagihan</div>' + renderStatusBadge(order.statusPenagihan) + '</div>' +
        '</div>' +
        '<div class="erp-table-wrap modal-table-spaced">' +
        '<table class="erp-table">' +
        '<thead><tr><th>No</th><th>SKU</th><th>Deskripsi Unit Industri</th><th>Qty</th><th>Harga Satuan</th><th>Subtotal</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="erp-form-grid">' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Catatan Operasional & Proyek</span>' +
        '<p class="modal-notes-text">' + escapeHtml(order.notes || '-') + '</p>' +
        '</div>' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Ringkasan Nilai Transaksi</span>' +
        '<div class="modal-summary-row"><span>DPP:</span><strong>' + formatMoneyRBAC(order.dpp, false) + '</strong></div>' +
        '<div class="modal-summary-row"><span>PPN 11%:</span><strong>' + formatMoneyRBAC(order.ppn, false) + '</strong></div>' +
        '<div class="modal-summary-total"><span>Total Tagihan:</span><strong>' + formatMoneyRBAC(order.total, false) + '</strong></div>' +
        '</div>' +
        '</div>';

      var self = this;
      if (approveBtn) {
        if (roleCfg.canApprove && order.statusApproval === 'Menunggu Persetujuan') {
          approveBtn.classList.remove('erp-hidden');
          approveBtn.onclick = function () {
            self.handleOrderApproval(order.id, 'Disetujui');
            modal.classList.remove('modal-open');
          };
        } else {
          approveBtn.classList.add('erp-hidden');
        }
      }

      modal.classList.add('modal-open');
    }
  };

  /* ==========================================================================
     8. NORMALISASI DATA TAHAP 2 (5 DIMENSI PO & FIELD MASTER DATA)
     ========================================================================== */
  function derivePaymentStatus(order) {
    if (order.statusPembayaran) return order.statusPembayaran;
    var bill = String(order.statusPenagihan || '');
    if (bill === 'Lunas') return 'Lunas';
    if (bill === 'Jatuh Tempo') return 'Jatuh Tempo';
    if (bill === 'Tagihan DP Terbit') return 'DP 30% Diterima';
    if (bill === 'Ditagih Sebagian') return 'Dibayar Sebagian';
    if (bill === 'Invoice Terbit') return 'Menunggu Pembayaran';
    return 'Belum Dibayar';
  }

  function ensureDataSchema(db) {
    if (!db) return;

    // 1. Pastikan setiap PO Pelanggan memiliki 5 dimensi eksplisit termasuk statusPembayaran
    if (Array.isArray(db.orders)) {
      db.orders.forEach(function (o) {
        o.statusPembayaran = derivePaymentStatus(o);
      });
    }

    // 2. Pastikan setiap Supplier memiliki info Rekening Bank
    var defaultSupplierBanks = {
      'SUP-001': 'HSBC Hong Kong • 801-449201-838 (USD / IDR Escrow)',
      'SUP-002': 'Bank of China Shenzhen • 7559-2018-9921 (L/C Trade)',
      'SUP-003': 'Bank Mandiri KCP Sunter • 120-00-8839102-4',
      'SUP-004': 'BCA KCU Bekasi • 521-009-8812',
      'SUP-005': 'Bank Permata Tangerang • 412-889-0021'
    };
    if (Array.isArray(db.suppliers)) {
      db.suppliers.forEach(function (s) {
        if (!s.bankAccount) {
          s.bankAccount = defaultSupplierBanks[s.id] || 'BCA Corporate • 521-880-1192';
        }
      });
    }

    // 3. Pastikan setiap SKU memiliki status Publikasi Web
    if (Array.isArray(db.inventory)) {
      db.inventory.forEach(function (item) {
        if (!item.webPublished) {
          item.webPublished = 'Tayang di Katalog';
        }
      });
    }

    // 4. Pastikan setiap Rak memiliki keterangan lengkap
    if (Array.isArray(db.racks)) {
      db.racks.forEach(function (r) {
        if (!r.description) {
          r.description = r.category + ' • Standar Suhu: ' + (r.tempSpec || '22°C Terkendali');
        }
      });
    }

    // 5. Pastikan setiap baris Stock Ledger memiliki Saldo Akhir Fisik (finalPhysical)
    if (Array.isArray(db.stockLedger)) {
      db.stockLedger.forEach(function (entry) {
        if (entry.finalPhysical == null) {
          var skuMatch = (db.inventory || []).find(function (i) { return i.sku === entry.sku; });
          entry.finalPhysical = skuMatch ? skuMatch.fisik : 25;
        }
      });
    }

    // 6. Normalisasi & Pengayaan Data Pengadaan Supplier (PO-YYYYMM-XXXX)
    if (Array.isArray(db.procurements)) {
      var hasPo0002 = db.procurements.some(function (p) { return p.id === 'PO-202610-0002'; });
      if (!hasPo0002) {
        db.procurements.push({
          id: 'PO-202610-0002',
          supplierId: 'SUP-001',
          supplierName: 'Ritar Power International Ltd',
          refOrderId: 'SO-202611-0010',
          orderDate: '2026-10-20',
          etaDate: '2026-11-01',
          statusApproval: 'Disetujui',
          statusReceiving: 'Diterima Sebagian',
          items: [
            { sku: 'SKU-RTR-12100', name: 'Baterai RITAR RA12-100 (12V 100Ah VRLA AGM)', qty: 50, unit: 'Unit', hpp: 2450000 }
          ],
          totalHpp: 122500000,
          notes: '40 unit telah diterima via GR-202611-0003 (38 lolos QC, 2 karantina). Sisa 10 unit menyusul.'
        });
      }

      var hasPo0006 = db.procurements.some(function (p) { return p.id === 'PO-202611-0006'; });
      if (!hasPo0006) {
        db.procurements.unshift({
          id: 'PO-202611-0006',
          supplierId: 'SUP-003',
          supplierName: 'Ablerex Electronics Co., Ltd',
          refOrderId: 'SO-202611-0011',
          orderDate: '2026-11-06',
          etaDate: '2026-11-16',
          statusApproval: 'Draft',
          statusReceiving: 'Menunggu',
          items: [
            { sku: 'SKU-ABL-ARS30K', name: 'UPS Ablerex Ares 30 kVA 3-Phase Online Transformerless', qty: 3, unit: 'Unit', hpp: 86000000 }
          ],
          totalHpp: 258000000,
          notes: 'Draft pengadaan stok proyek baja berat & buffer gudang.'
        });
      }

      db.procurements.forEach(function (po) {
        if (po.statusApproval === 'Menunggu Persetujuan') {
          po.statusApproval = 'Diajukan';
        }
        if (po.statusReceiving === 'Belum Diterima' || po.statusReceiving === 'Dalam Perjalanan') {
          po.statusReceiving = 'Menunggu';
        } else if (po.statusReceiving === 'Diterima Penuh (GR)') {
          po.statusReceiving = 'Diterima Penuh';
        }
        var dpp = Number(po.dpp || po.totalHpp) || 0;
        var ppn = po.ppn != null ? Number(po.ppn) : Math.round(dpp * 0.11);
        po.dpp = dpp;
        po.ppn = ppn;
        po.total = po.total != null ? Number(po.total) : (dpp + ppn);
      });
    }

    // 7. Normalisasi & Pengayaan Data Pengiriman (SJ-YYYYMM-XXXX)
    if (!Array.isArray(db.deliveries)) {
      db.deliveries = [];
    }
    var hasSj0009 = db.deliveries.some(function (d) { return d.id === 'SJ-202611-0009'; });
    if (!hasSj0009) {
      db.deliveries.unshift({
        id: 'SJ-202611-0009',
        orderId: 'SO-202611-0009',
        clientPoNumber: 'SAI/PROC/PO/2026/773',
        customerName: 'PT. Sumber Abadi Indonesia',
        deliveryDate: '2026-11-06',
        driverName: 'Pak Slamet Riyadi',
        vehiclePlate: 'B 9482 KXT (Blindvan Box NPP-02)',
        deliveryType: 'Pengiriman Penuh',
        status: 'Sedang Dikirim',
        bastFileName: null,
        address: 'Kawasan Industri Jababeka II Blok C-8, Cikarang, Bekasi',
        recipientPic: 'Ibu Ratna Kusuma',
        items: [
          { sku: 'SKU-AVR-30KVA', name: 'Servo Voltage Stabilizer 3-Phase 30 kVA Heavy Industrial', qty: 3, unit: 'Unit', serialRange: 'AVR30-2611-001 s/d 003' },
          { sku: 'SKU-RTR-12200', name: 'Baterai RITAR RA12-200 (12V 200Ah Deep Cycle)', qty: 8, unit: 'Unit', serialRange: 'RTR200-2611-041 s/d 048' }
        ]
      });
    }

    // 8. Normalisasi & Pengayaan Data Invoice (INV-YYYYMM-XXXX)
    if (!Array.isArray(db.invoices)) {
      db.invoices = [];
    }
    db.invoices.forEach(function (inv) {
      if (!inv.items || inv.items.length === 0) {
        var matchOrder = (db.orders || []).find(function (o) { return o.id === inv.orderId; });
        if (matchOrder && matchOrder.items) {
          inv.items = JSON.parse(JSON.stringify(matchOrder.items));
        }
      }
      if (!inv.customerName) {
        var matchO = (db.orders || []).find(function (o) { return o.id === inv.orderId; });
        if (matchO) {
          inv.customerName = matchO.customerName;
          inv.clientPoNumber = matchO.clientPoNumber;
        }
      }
      if (inv.paidAmount == null) {
        inv.paidAmount = inv.status === 'Lunas' ? inv.total : 0;
      }
    });
  }

  ensureDataSchema(window.NPP_ERP_DATA);

  /* ==========================================================================
     9. ORDERS CONTROLLER (KHUSUS HALAMAN internal/orders.html — TUGAS 2.1)
     ========================================================================== */
  var OrdersController = {
    table: null,
    lineItemCounter: 0,

    init: function () {
      if (!document.getElementById('erpOrdersPage')) return;

      var self = this;
      ensureDataSchema(window.NPP_ERP_DATA);
      this.renderOrdersKPIs();
      this.syncCreateButtonRBAC();
      this.initOrdersMainTable();
      this.bindCreateOrderModal();
      this.bindOrderDetailModal();

      RoleManager.onChange(function () {
        self.renderOrdersKPIs();
        self.syncCreateButtonRBAC();
        if (self.table) self.table.render();
      });
    },

    syncCreateButtonRBAC: function () {
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var btnCreate = document.getElementById('btnOpenCreateOrderModal');
      var canCreateSO = roleCfg.code === 'Operasional' || roleCfg.code === 'Super Admin' || roleCfg.code === 'Sales / Operasional' || roleCfg.code === 'Administrator';

      if (btnCreate) {
        btnCreate.disabled = !canCreateSO;
        btnCreate.title = canCreateSO
          ? 'Buat PO Pelanggan B2B Baru'
          : 'Hanya peran Operasional atau Super Admin yang dapat menginput PO Pelanggan baru';
      }
    },

    renderOrdersKPIs: function () {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();

      var totalOrders = db.orders.length;
      var totalValue = db.orders.reduce(function (acc, o) { return acc + (o.total || 0); }, 0);
      var totalUnitsOrdered = db.orders.reduce(function (acc, o) {
        var sumQty = (o.items || []).reduce(function (s, i) { return s + (Number(i.qty) || 0); }, 0);
        return acc + sumQty;
      }, 0);

      var pendingApprovalCount = db.orders.filter(function (o) {
        return o.statusApproval === 'Menunggu Persetujuan';
      }).length;

      var reservedCount = db.orders.filter(function (o) {
        return o.statusPemenuhan === 'Stok Direservasi' || o.statusPemenuhan === 'Siap Kirim';
      }).length;
      var shortageCount = db.orders.filter(function (o) {
        return o.statusPemenuhan === 'Menunggu Pengadaan';
      }).length;

      var paidCount = db.orders.filter(function (o) {
        return o.statusPembayaran === 'Lunas';
      }).length;
      var overdueCount = db.orders.filter(function (o) {
        return o.statusPembayaran === 'Jatuh Tempo' || o.statusPenagihan === 'Jatuh Tempo';
      }).length;

      var elTotalLabel = document.getElementById('ordersKpiTotalLabel');
      var elTotalVal = document.getElementById('ordersKpiTotalVal');
      var elTotalSub = document.getElementById('ordersKpiTotalSub');

      if (!roleCfg.canViewPrice) {
        if (elTotalLabel) elTotalLabel.textContent = 'Total Volume Pesanan';
        if (elTotalVal) elTotalVal.textContent = totalUnitsOrdered + ' Unit / Cell';
        if (elTotalSub) elTotalSub.textContent = 'Dari ' + totalOrders + ' dokumen PO Pelanggan (Harga Terproteksi)';
      } else {
        if (elTotalLabel) elTotalLabel.textContent = 'Total Nilai PO Pelanggan';
        if (elTotalVal) elTotalVal.textContent = formatRupiah(totalValue);
        if (elTotalSub) elTotalSub.textContent = 'Akumulasi ' + totalOrders + ' PO Pelanggan B2B (+PPN 11%)';
      }

      var elAppVal = document.getElementById('ordersKpiApprovalVal');
      var elAppSub = document.getElementById('ordersKpiApprovalSub');
      if (elAppVal) elAppVal.textContent = pendingApprovalCount + ' PO Pending';
      if (elAppSub) elAppSub.textContent = 'Menunggu otorisasi Super Admin';

      var elFulVal = document.getElementById('ordersKpiFulfillmentVal');
      if (elFulVal) {
        var fulHtml = '<div class="erp-kpi-dual-row">' +
          '<span class="erp-kpi-dual-item"><strong class="erp-kpi-dual-num">' + reservedCount + '</strong><span class="erp-kpi-dual-label">Direservasi</span></span>';
        if (shortageCount > 0) {
          fulHtml += '<span class="erp-kpi-dual-item"><strong class="erp-kpi-dual-num text-warning">' + shortageCount + '</strong><span class="erp-kpi-dual-label">Backorder</span></span>';
        }
        fulHtml += '</div>';
        elFulVal.innerHTML = fulHtml;
      }

      var elPayVal = document.getElementById('ordersKpiPaymentVal');
      if (elPayVal) {
        var payHtml = '<div class="erp-kpi-dual-row">' +
          '<span class="erp-kpi-dual-item"><strong class="erp-kpi-dual-num">' + paidCount + '</strong><span class="erp-kpi-dual-label">Lunas</span></span>';
        if (overdueCount > 0) {
          payHtml += '<span class="erp-kpi-dual-item"><strong class="erp-kpi-dual-num text-danger">' + overdueCount + '</strong><span class="erp-kpi-dual-label">Overdue</span></span>';
        }
        payHtml += '</div>';
        elPayVal.innerHTML = payHtml;
      }
    },

    initOrdersMainTable: function () {
      var self = this;
      this.table = new TableEngine({
        tbodyId: 'ordersMainTbody',
        paginationId: 'ordersPaginationBar',
        searchInputId: 'ordersSearchInput',
        pageSizeSelectId: 'ordersPageSizeSelect',
        defaultPageSize: 5,
        colSpan: 9,
        getData: function () {
          return window.NPP_ERP_DATA.orders;
        },
        searchFn: function (order, q) {
          var skuMatch = (order.items || []).some(function (it) {
            return it.sku.toLowerCase().indexOf(q) !== -1 || it.name.toLowerCase().indexOf(q) !== -1;
          });
          return (
            order.id.toLowerCase().indexOf(q) !== -1 ||
            order.clientPoNumber.toLowerCase().indexOf(q) !== -1 ||
            order.customerName.toLowerCase().indexOf(q) !== -1 ||
            order.salesPic.toLowerCase().indexOf(q) !== -1 ||
            skuMatch
          );
        },
        filters: [
          {
            selectId: 'filterDimApproval',
            match: function (order, val) { return order.statusApproval === val; }
          },
          {
            selectId: 'filterDimFulfillment',
            match: function (order, val) { return order.statusPemenuhan === val; }
          },
          {
            selectId: 'filterDimDelivery',
            match: function (order, val) { return order.statusPengiriman === val; }
          },
          {
            selectId: 'filterDimBilling',
            match: function (order, val) { return order.statusPenagihan === val; }
          },
          {
            selectId: 'filterDimPayment',
            match: function (order, val) { return derivePaymentStatus(order) === val; }
          }
        ],
        renderRow: function (order) {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          var paymentStat = derivePaymentStatus(order);
          var canApproveNow = roleCfg.canApprove && order.statusApproval === 'Menunggu Persetujuan';
          var totalQty = (order.items || []).reduce(function (s, i) { return s + (Number(i.qty) || 0); }, 0);

          var actionsHtml =
            '<div class="erp-action-btns">' +
            '<a href="orders-detail.html?id=' + encodeURIComponent(order.id) + '" class="btn-erp btn-erp-secondary btn-erp-sm">Detail PO</a>' +
            (canApproveNow
              ? '<button type="button" class="btn-erp btn-erp-success btn-erp-sm" data-approve-so-row="' + order.id + '">Setujui</button>' +
                '<button type="button" class="btn-erp btn-erp-danger btn-erp-sm" data-reject-so-row="' + order.id + '">Tolak</button>'
              : '') +
            '</div>';

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(order.id) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(order.customerName) + '</span></td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(order.total, false) + '</span></td>' +
            '<td>' + renderStatusBadge(order.statusApproval) + '</td>' +
            '<td>' + renderStatusBadge(order.statusPemenuhan) + '</td>' +
            '<td>' + renderStatusBadge(order.statusPengiriman) + '</td>' +
            '<td class="col-financial">' + renderStatusBadge(order.statusPenagihan) + '</td>' +
            '<td class="col-financial">' + renderStatusBadge(paymentStat) + '</td>' +
            '<td>' + actionsHtml + '</td>' +
            '</tr>'
          );
        },
        onAfterRender: function () {
          var tbody = document.getElementById('ordersMainTbody');
          if (!tbody) return;

          tbody.querySelectorAll('[data-open-so-detail]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              self.openOrderDetailModal(btn.getAttribute('data-open-so-detail'));
            });
          });

          tbody.querySelectorAll('[data-approve-so-row]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              self.updateOrderApproval(btn.getAttribute('data-approve-so-row'), 'Disetujui');
            });
          });

          tbody.querySelectorAll('[data-reject-so-row]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              self.updateOrderApproval(btn.getAttribute('data-reject-so-row'), 'Ditolak');
            });
          });
        }
      });

      this.table.render();
    },

    updateOrderApproval: function (soId, decision) {
      var roleCfg = RoleManager.getCurrentRoleConfig();
      if (!roleCfg.canApprove) {
        showToast('Akses ditolak: Otorisasi PO hanya untuk peran Super Admin.');
        return;
      }

      var db = window.NPP_ERP_DATA;
      var order = db.orders.find(function (o) { return o.id === soId; });
      if (!order) return;

      var self = this;
      var isApprove = decision === 'Disetujui';
      showConfirmAlert({
        type: isApprove ? 'success' : 'danger',
        title: isApprove ? 'Setujui PO ' + order.id : 'Tolak PO ' + order.id,
        message: isApprove
          ? 'Otorisasi pesanan ' + order.customerName + ' senilai ' + formatMoneyRBAC(order.total, false) + '? Status pesanan akan dilanjutkan ke pemrosesan gudang.'
          : 'Tolak pengajuan pesanan ' + order.customerName + '? Status pesanan akan ditangguhkan.',
        confirmText: isApprove ? 'Setujui PO' : 'Tolak PO',
        confirmClass: isApprove ? 'btn-erp-success' : 'btn-erp-danger',
        onConfirm: function () {
          order.statusApproval = decision;
          if (decision === 'Disetujui') {
            order.statusOrder = 'Diproses';
            if (order.statusPemenuhan === 'Stok Direservasi') {
              order.statusPengiriman = 'Siap Kirim Gudang';
            }
          } else if (decision === 'Ditolak') {
            order.statusOrder = 'Ditangguhkan';
          }

          saveDatabase(db);
          addAuditLog(
            decision === 'Disetujui' ? 'APPROVE_SO' : 'REJECT_SO',
            order.id,
            'Mengubah status persetujuan ' + order.id + ' (' + order.customerName + ') menjadi: ' + decision
          );

          RoleManager.updateSidebarCounters();
          self.renderOrdersKPIs();
          if (self.table) self.table.render();
          showToast('Status persetujuan ' + order.id + ' diperbarui menjadi: ' + decision, isApprove ? 'success' : 'info');
        }
      });
    },

    bindCreateOrderModal: function () {
      var self = this;
      var modal = document.getElementById('createOrderModal');
      var openBtn = document.getElementById('btnOpenCreateOrderModal');
      var closeBtn = document.getElementById('closeCreateOrderModal');
      var cancelBtn = document.getElementById('cancelCreateOrderBtn');
      var customerSelect = document.getElementById('soCustomerSelect');
      var topSelect = document.getElementById('soPaymentTerm');
      var clientPoInput = document.getElementById('soClientPoNumber');
      var fileInput = document.getElementById('soPoFileInput');
      var fileLabel = document.getElementById('soPoFileLabel');
      var addRowBtn = document.getElementById('btnAddSoLineItem');
      var form = document.getElementById('createOrderForm');

      if (!modal) return;

      var closeModal = function () {
        modal.classList.remove('modal-open');
      };

      if (openBtn) {
        openBtn.addEventListener('click', function () {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          if (roleCfg.code !== 'Operasional' && roleCfg.code !== 'Super Admin' && roleCfg.code !== 'Sales / Operasional' && roleCfg.code !== 'Administrator') {
            showToast('Hanya peran Operasional atau Super Admin yang diizinkan menginput PO Pelanggan baru.');
            return;
          }
          self.prepareCreateOrderForm();
          modal.classList.add('modal-open');
        });
      }

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });

      if (customerSelect) {
        customerSelect.addEventListener('change', function () {
          var custId = customerSelect.value;
          var cust = window.NPP_ERP_DATA.customers.find(function (c) { return c.id === custId; });
          if (cust && topSelect) {
            topSelect.value = cust.paymentTerm || 'NET 30';
          }
          var custHint = document.getElementById('soCustomerInfoHint');
          if (custHint && cust) {
            custHint.textContent = 'NPWP: ' + cust.npwp + ' • PIC: ' + cust.pic + ' • Alamat Kirim: ' + cust.address;
          }
        });
      }

      if (fileInput && fileLabel) {
        fileInput.addEventListener('change', function () {
          if (fileInput.files && fileInput.files.length > 0) {
            fileLabel.textContent = 'Berkas dipilih: ' + fileInput.files[0].name;
          }
        });
      }

      if (clientPoInput && fileLabel) {
        clientPoInput.addEventListener('input', function () {
          if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            var cleanNo = clientPoInput.value.trim().replace(/[^a-zA-Z0-9-_]/g, '-') || 'Baru';
            fileLabel.textContent = 'Simulasi Arsip PDF: PO-Klien-' + cleanNo + '.pdf';
          }
        });
      }

      if (addRowBtn) {
        addRowBtn.addEventListener('click', function () {
          self.addLineItemRow();
        });
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          self.submitCreateOrderForm();
        });
      }
    },

    prepareCreateOrderForm: function () {
      var db = window.NPP_ERP_DATA;
      var customerSelect = document.getElementById('soCustomerSelect');
      if (customerSelect) {
        customerSelect.innerHTML = db.customers.map(function (c) {
          return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + ' (' + escapeHtml(c.paymentTerm) + ')</option>';
        }).join('');
      }

      var firstCust = db.customers[0];
      var topSelect = document.getElementById('soPaymentTerm');
      if (firstCust && topSelect) {
        topSelect.value = firstCust.paymentTerm || 'NET 30';
      }
      var custHint = document.getElementById('soCustomerInfoHint');
      if (custHint && firstCust) {
        custHint.textContent = 'NPWP: ' + firstCust.npwp + ' • PIC: ' + firstCust.pic + ' • Alamat Kirim: ' + firstCust.address;
      }

      var clientPoInput = document.getElementById('soClientPoNumber');
      if (clientPoInput) clientPoInput.value = '';

      var targetInput = document.getElementById('soDeliveryTarget');
      if (targetInput) targetInput.value = '2026-11-20';

      var notesInput = document.getElementById('soProjectNotes');
      if (notesInput) notesInput.value = '';

      var fileInput = document.getElementById('soPoFileInput');
      if (fileInput) fileInput.value = '';
      var fileLabel = document.getElementById('soPoFileLabel');
      if (fileLabel) fileLabel.textContent = 'Simulasi Arsip PDF: PO-Klien-Signed.pdf';

      var container = document.getElementById('soLineItemsContainer');
      if (container) {
        container.innerHTML = '';
        this.lineItemCounter = 0;
        this.addLineItemRow();
      }
    },

    addLineItemRow: function () {
      var self = this;
      var container = document.getElementById('soLineItemsContainer');
      if (!container) return;

      var db = window.NPP_ERP_DATA;
      this.lineItemCounter += 1;
      var rowId = 'soLineRow_' + this.lineItemCounter;
      var defaultSku = db.inventory[0];

      var skuOptionsHtml = db.inventory.map(function (item) {
        return (
          '<option value="' + escapeHtml(item.sku) + '">' +
          escapeHtml(item.sku) + ' — ' + escapeHtml(item.name) + ' (Tersedia: ' + item.tersedia + ' ' + escapeHtml(item.unit) + ')' +
          '</option>'
        );
      }).join('');

      var rowEl = document.createElement('div');
      rowEl.className = 'erp-line-item-row';
      rowEl.id = rowId;
      rowEl.innerHTML =
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Produk / SKU Industri</span>' +
        '<select class="erp-select so-row-sku" aria-label="Pilih SKU">' + skuOptionsHtml + '</select>' +
        '<span class="erp-line-item-stock-hint so-row-stock-hint"></span>' +
        '</div>' +
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Kuantitas</span>' +
        '<input type="number" class="erp-input so-row-qty" min="1" value="2" required />' +
        '</div>' +
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Harga Satuan (Rp)</span>' +
        '<input type="number" class="erp-input so-row-price" min="0" step="1000" value="' + (defaultSku ? defaultSku.sellPrice : 0) + '" required />' +
        '</div>' +
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Subtotal Baris</span>' +
        '<div class="erp-line-item-subtotal so-row-subtotal">Rp 0</div>' +
        '</div>' +
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Hapus</span>' +
        '<button type="button" class="btn-erp btn-erp-danger btn-erp-sm so-row-remove" aria-label="Hapus Baris">Hapus</button>' +
        '</div>';

      container.appendChild(rowEl);

      var skuSel = rowEl.querySelector('.so-row-sku');
      var qtyInp = rowEl.querySelector('.so-row-qty');
      var priceInp = rowEl.querySelector('.so-row-price');
      var removeBtn = rowEl.querySelector('.so-row-remove');

      skuSel.addEventListener('change', function () {
        var found = db.inventory.find(function (i) { return i.sku === skuSel.value; });
        if (found) {
          priceInp.value = found.sellPrice;
        }
        self.recalculateOrderFormTotals();
      });

      qtyInp.addEventListener('input', function () {
        self.recalculateOrderFormTotals();
      });

      priceInp.addEventListener('input', function () {
        self.recalculateOrderFormTotals();
      });

      removeBtn.addEventListener('click', function () {
        var allRows = container.querySelectorAll('.erp-line-item-row');
        if (allRows.length <= 1) {
          showToast('Minimal harus terdapat 1 baris barang dalam PO Pelanggan.');
          return;
        }
        showConfirmAlert({
          type: 'warning',
          title: 'Hapus Baris Barang',
          message: 'Apakah Anda yakin ingin menghapus baris barang ini dari formulir PO?',
          confirmText: 'Hapus Baris',
          confirmClass: 'btn-erp-danger',
          onConfirm: function () {
            rowEl.remove();
            self.recalculateOrderFormTotals();
            showToast('Baris barang telah dihapus.');
          }
        });
      });

      this.recalculateOrderFormTotals();
    },

    recalculateOrderFormTotals: function () {
      var container = document.getElementById('soLineItemsContainer');
      if (!container) return;

      var db = window.NPP_ERP_DATA;
      var dpp = 0;
      var rows = container.querySelectorAll('.erp-line-item-row');

      rows.forEach(function (row) {
        var skuVal = row.querySelector('.so-row-sku').value;
        var qty = Math.max(1, parseInt(row.querySelector('.so-row-qty').value, 10) || 0);
        var price = Math.max(0, parseFloat(row.querySelector('.so-row-price').value) || 0);
        var sub = qty * price;
        dpp += sub;

        var subEl = row.querySelector('.so-row-subtotal');
        if (subEl) subEl.textContent = formatRupiah(sub);

        var hintEl = row.querySelector('.so-row-stock-hint');
        var skuObj = db.inventory.find(function (i) { return i.sku === skuVal; });
        if (hintEl && skuObj) {
          if (qty <= skuObj.tersedia) {
            hintEl.className = 'erp-line-item-stock-hint so-row-stock-hint';
            hintEl.textContent = 'Stok Tersedia (ATP): ' + skuObj.tersedia + ' ' + skuObj.unit + ' — Siap Direservasi Otomatis';
          } else {
            var kurang = qty - skuObj.tersedia;
            hintEl.className = 'erp-line-item-stock-hint erp-line-item-stock-warn so-row-stock-hint';
            hintEl.textContent = 'Stok Tersedia: ' + skuObj.tersedia + ' ' + skuObj.unit + ' (Kurang ' + kurang + ' ' + skuObj.unit + ' -> Masuk Antrean Pengadaan)';
          }
        }
      });

      var ppn = Math.round(dpp * 0.11);
      var grand = dpp + ppn;

      var elDpp = document.getElementById('soCalcDpp');
      var elPpn = document.getElementById('soCalcPpn');
      var elGrand = document.getElementById('soCalcGrandTotal');

      if (elDpp) elDpp.textContent = formatRupiah(dpp);
      if (elPpn) elPpn.textContent = formatRupiah(ppn);
      if (elGrand) elGrand.textContent = formatRupiah(grand);
    },

    submitCreateOrderForm: function () {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();

      var custId = document.getElementById('soCustomerSelect').value;
      var cust = db.customers.find(function (c) { return c.id === custId; }) || db.customers[0];
      var clientPoNo = document.getElementById('soClientPoNumber').value.trim();
      var deliveryTarget = document.getElementById('soDeliveryTarget').value || '2026-11-20';
      var paymentTerm = document.getElementById('soPaymentTerm').value || 'NET 30';
      var notes = document.getElementById('soProjectNotes').value.trim();
      var fileInput = document.getElementById('soPoFileInput');

      if (!clientPoNo) {
        showToast('Mohon isi Nomor PO Eksternal dari Pelanggan.');
        return;
      }

      var container = document.getElementById('soLineItemsContainer');
      var rows = container ? container.querySelectorAll('.erp-line-item-row') : [];
      if (!rows || rows.length === 0) return;

      var lineItems = [];
      var dpp = 0;
      var hasShortage = false;

      var nextNum = db.orders.length + 1;
      var pad4 = function (n) {
        var s = String(n);
        while (s.length < 4) s = '0' + s;
        return s;
      };
      var newSoId = 'SO-202611-' + pad4(nextNum);

      rows.forEach(function (row) {
        var skuCode = row.querySelector('.so-row-sku').value;
        var qty = Math.max(1, parseInt(row.querySelector('.so-row-qty').value, 10) || 1);
        var price = Math.max(0, parseFloat(row.querySelector('.so-row-price').value) || 0);
        var skuObj = db.inventory.find(function (i) { return i.sku === skuCode; });

        if (skuObj) {
          lineItems.push({
            sku: skuObj.sku,
            name: skuObj.name,
            qty: qty,
            unit: skuObj.unit,
            price: price
          });
          dpp += qty * price;

          // Cek & Kunci Reservasi Stok Otomatis
          if (skuObj.tersedia >= qty) {
            skuObj.reservasi += qty;
            skuObj.tersedia = skuObj.layak - skuObj.reservasi;
          } else {
            hasShortage = true;
            var lockQty = Math.max(0, skuObj.tersedia);
            if (lockQty > 0) {
              skuObj.reservasi += lockQty;
              skuObj.tersedia = skuObj.layak - skuObj.reservasi;
            }
          }

          db.stockLedger.unshift({
            id: 'MUT-' + (100 + db.stockLedger.length + 1),
            date: '2026-11-06 15:00',
            sku: skuObj.sku,
            skuName: skuObj.name,
            type: 'RESERVASI',
            qty: qty,
            refDoc: newSoId,
            pic: roleCfg.userName,
            note: 'Reservasi otomatis PO baru ' + cust.name + ' (' + clientPoNo + ')'
          });
        }
      });

      var ppn = Math.round(dpp * 0.11);
      var total = dpp + ppn;

      var poFileName = 'PO-' + clientPoNo.replace(/[^a-zA-Z0-9-_]/g, '-') + '.pdf';
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        poFileName = fileInput.files[0].name;
      }

      var newOrder = {
        id: newSoId,
        clientPoNumber: clientPoNo,
        customerId: cust.id,
        customerName: cust.name,
        orderDate: '2026-11-06',
        deliveryTarget: deliveryTarget,
        paymentTerm: paymentTerm,
        poFileName: poFileName,
        salesPic: roleCfg.userName,
        items: lineItems,
        dpp: dpp,
        ppn: ppn,
        total: total,
        statusOrder: 'Dikonfirmasi',
        statusApproval: 'Menunggu Persetujuan',
        statusPemenuhan: hasShortage ? 'Menunggu Pengadaan' : 'Stok Direservasi',
        statusPengiriman: 'Belum Dikirim',
        statusPenagihan: 'Belum Ditagih',
        statusPembayaran: 'Belum Dibayar',
        notes: notes || ('Pesanan B2B ' + cust.name + ' (' + clientPoNo + ').')
      };

      db.orders.unshift(newOrder);

      // Tambahkan berkas PO ke repositori Arsip Digital
      db.archives.unshift({
        id: 'ARC-2026-' + pad4(db.archives.length + 1),
        docType: 'PO Asli Pelanggan',
        docNumber: clientPoNo,
        refId: newSoId,
        partner: cust.name,
        date: '2026-11-06',
        fileName: poFileName,
        uploadedBy: roleCfg.userName
      });

      saveDatabase(db);
      addAuditLog(
        'INPUT_PO_PELANGGAN',
        newSoId,
        'Mencatat PO baru ' + cust.name + ' (' + clientPoNo + ') senilai ' + formatRupiah(total) +
          ' | Status Pemenuhan: ' + newOrder.statusPemenuhan
      );

      RoleManager.updateSidebarCounters();
      this.renderOrdersKPIs();
      if (this.table) {
        this.table.currentPage = 1;
        this.table.render();
      }

      var modal = document.getElementById('createOrderModal');
      if (modal) modal.classList.remove('modal-open');

      showToast(
        'PO ' + newSoId + ' berhasil disimpan! Status Pemenuhan: ' + newOrder.statusPemenuhan
      );
    },

    bindOrderDetailModal: function () {
      var modal = document.getElementById('orderDetailModal');
      var closeBtn = document.getElementById('closeOrderDetailModal');
      var closeFooterBtn = document.getElementById('closeOrderDetailFooterBtn');

      var closeModal = function () {
        if (modal) modal.classList.remove('modal-open');
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
      if (modal) {
        modal.addEventListener('click', function (e) {
          if (e.target === modal) closeModal();
        });
      }
    },

    openOrderDetailModal: function (soId) {
      var modal = document.getElementById('orderDetailModal');
      if (!modal) {
        window.location.href = 'orders-detail.html?id=' + encodeURIComponent(soId);
        return;
      }
      var body = document.getElementById('orderDetailModalBody');
      var title = document.getElementById('orderDetailModalTitle');
      var approveBtn = document.getElementById('modalApproveOrderBtn');
      var rejectBtn = document.getElementById('modalRejectOrderBtn');
      if (!modal || !body) return;

      var db = window.NPP_ERP_DATA;
      var order = db.orders.find(function (o) { return o.id === soId; });
      if (!order) return;

      var roleCfg = RoleManager.getCurrentRoleConfig();
      var paymentStat = derivePaymentStatus(order);
      if (title) title.textContent = 'Detail PO Pelanggan — ' + order.id + ' • ' + order.clientPoNumber;

      var rowsHtml = order.items.map(function (item, idx) {
        var subtotal = item.qty * item.price;
        var skuInfo = db.inventory.find(function (s) { return s.sku === item.sku; });
        var stockTag = skuInfo
          ? 'Tersedia: ' + skuInfo.tersedia + ' ' + skuInfo.unit + ' | Reservasi: ' + skuInfo.reservasi + ' ' + skuInfo.unit
          : '-';
        return (
          '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td><span class="cell-code">' + escapeHtml(item.sku) + '</span><span class="cell-subtext">' + escapeHtml(stockTag) + '</span></td>' +
          '<td><strong>' + escapeHtml(item.name) + '</strong></td>' +
          '<td><strong>' + item.qty + '</strong> ' + escapeHtml(item.unit) + '</td>' +
          '<td class="col-financial">' + formatMoneyRBAC(item.price, false) + '</td>' +
          '<td class="col-financial"><strong>' + formatMoneyRBAC(subtotal, false) + '</strong></td>' +
          '</tr>'
        );
      }).join('');

      body.innerHTML =
        '<div class="erp-form-grid modal-grid-spaced">' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Informasi Pelanggan & Dokumen PO</span>' +
        '<div class="modal-card-title-strong">' + escapeHtml(order.customerName) + '</div>' +
        '<span class="cell-subtext">No. PO Eksternal: ' + escapeHtml(order.clientPoNumber) + '</span>' +
        '<span class="cell-subtext">Berkas PDF PO Asli: ' + escapeHtml(order.poFileName) + '</span>' +
        '</div>' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Jadwal Pengiriman & Syarat Pembayaran</span>' +
        '<div class="modal-card-title-strong">Target Kirim: ' + escapeHtml(order.deliveryTarget) + '</div>' +
        '<span class="cell-subtext">Tgl Input SO: ' + escapeHtml(order.orderDate) + ' • TOP: ' + escapeHtml(order.paymentTerm) + '</span>' +
        '<span class="cell-subtext">Sales PIC: ' + escapeHtml(order.salesPic) + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="stock-formula-strip modal-five-dim-strip">' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Persetujuan</div>' + renderStatusBadge(order.statusApproval) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Pemenuhan Stok</div>' + renderStatusBadge(order.statusPemenuhan) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Pengiriman</div>' + renderStatusBadge(order.statusPengiriman) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Penagihan</div>' + renderStatusBadge(order.statusPenagihan) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">Pembayaran</div>' + renderStatusBadge(paymentStat) + '</div>' +
        '</div>' +
        '<div class="erp-table-wrap modal-table-spaced">' +
        '<table class="erp-table">' +
        '<thead><tr><th>No</th><th>Kode SKU & Info Stok</th><th>Spesifikasi Unit Industri</th><th>Qty Pesanan</th><th class="col-financial">Harga Satuan</th><th class="col-financial">Subtotal</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="erp-form-grid">' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Catatan Teknis & Instruksi Proyek</span>' +
        '<p class="modal-notes-text">' + escapeHtml(order.notes || '-') + '</p>' +
        '</div>' +
        '<div class="erp-kpi-card col-financial">' +
        '<span class="erp-kpi-label">Kalkulasi Nilai Transaksi B2B</span>' +
        '<div class="modal-summary-row"><span>DPP:</span><strong>' + formatMoneyRBAC(order.dpp, false) + '</strong></div>' +
        '<div class="modal-summary-row"><span>PPN 11%:</span><strong>' + formatMoneyRBAC(order.ppn, false) + '</strong></div>' +
        '<div class="modal-summary-total"><span>Grand Total PO:</span><strong>' + formatMoneyRBAC(order.total, false) + '</strong></div>' +
        '</div>' +
        '</div>';

      var self = this;
      var canDecide = roleCfg.canApprove && order.statusApproval === 'Menunggu Persetujuan';

      if (approveBtn) {
        approveBtn.classList.toggle('erp-hidden', !canDecide);
        approveBtn.onclick = function () {
          self.updateOrderApproval(order.id, 'Disetujui');
          modal.classList.remove('modal-open');
        };
      }
      if (rejectBtn) {
        rejectBtn.classList.toggle('erp-hidden', !canDecide);
        rejectBtn.onclick = function () {
          self.updateOrderApproval(order.id, 'Ditolak');
          modal.classList.remove('modal-open');
        };
      }

      modal.classList.add('modal-open');
    }
  };

  /* ==========================================================================
     10. MASTER DATA CONTROLLER (KHUSUS HALAMAN internal/master-data.html — TUGAS 2.2)
     ========================================================================== */
  var MasterDataController = {
    activeTab: 'customers',
    customersTable: null,
    suppliersTable: null,
    productsTable: null,
    racksTable: null,

    init: function () {
      if (!document.getElementById('erpMasterDataPage')) return;

      var self = this;
      ensureDataSchema(window.NPP_ERP_DATA);
      this.updateTabCounts();
      this.bindTabSwitching();
      this.initCustomersTable();
      this.initSuppliersTable();
      this.initProductsTable();
      this.initRacksTable();
      this.bindMasterModals();

      RoleManager.onChange(function () {
        if (self.customersTable) self.customersTable.render();
        if (self.suppliersTable) self.suppliersTable.render();
        if (self.productsTable) self.productsTable.render();
        if (self.racksTable) self.racksTable.render();
      });
    },

    updateTabCounts: function () {
      var db = window.NPP_ERP_DATA;
      var elC = document.getElementById('countTabCustomers');
      var elS = document.getElementById('countTabSuppliers');
      var elP = document.getElementById('countTabProducts');
      var elR = document.getElementById('countTabRacks');

      if (elC) elC.textContent = db.customers.length;
      if (elS) elS.textContent = db.suppliers.length;
      if (elP) elP.textContent = db.inventory.length;
      if (elR) elR.textContent = db.racks.length;
    },

    bindTabSwitching: function () {
      var self = this;
      var tabBtns = document.querySelectorAll('[data-master-tab]');
      var tabPanes = document.querySelectorAll('[data-master-pane]');

      tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-master-tab');
          self.activeTab = target;

          tabBtns.forEach(function (b) {
            b.classList.toggle('erp-tab-btn-active', b.getAttribute('data-master-tab') === target);
          });

          tabPanes.forEach(function (pane) {
            pane.classList.toggle('tab-pane-active', pane.getAttribute('data-master-pane') === target);
          });
        });
      });
    },

    initCustomersTable: function () {
      this.customersTable = new TableEngine({
        tbodyId: 'masterCustomersTbody',
        paginationId: 'masterCustomersPagination',
        searchInputId: 'masterCustomersSearch',
        pageSizeSelectId: 'masterCustomersPageSize',
        defaultPageSize: 5,
        colSpan: 7,
        getData: function () {
          return window.NPP_ERP_DATA.customers;
        },
        searchFn: function (c, q) {
          return (
            c.id.toLowerCase().indexOf(q) !== -1 ||
            c.name.toLowerCase().indexOf(q) !== -1 ||
            c.pic.toLowerCase().indexOf(q) !== -1 ||
            c.npwp.toLowerCase().indexOf(q) !== -1 ||
            c.address.toLowerCase().indexOf(q) !== -1
          );
        },
        filters: [
          {
            selectId: 'filterCustomerTop',
            match: function (c, val) { return c.paymentTerm === val; }
          }
        ],
        renderRow: function (c) {
          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(c.id) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(c.name) + '</span></td>' +
            '<td><strong>' + escapeHtml(c.pic) + '</strong></td>' +
            '<td><span>' + escapeHtml(c.phone) + '</span></td>' +
            '<td>' + escapeHtml(c.address) + '</td>' +
            '<td><span class="cell-code">' + escapeHtml(c.npwp) + '</span></td>' +
            '<td><span class="badge-status badge-info">' + escapeHtml(c.paymentTerm) + '</span></td>' +
            '</tr>'
          );
        }
      });
      this.customersTable.render();
    },

    initSuppliersTable: function () {
      this.suppliersTable = new TableEngine({
        tbodyId: 'masterSuppliersTbody',
        paginationId: 'masterSuppliersPagination',
        searchInputId: 'masterSuppliersSearch',
        pageSizeSelectId: 'masterSuppliersPageSize',
        defaultPageSize: 5,
        colSpan: 6,
        getData: function () {
          return window.NPP_ERP_DATA.suppliers;
        },
        searchFn: function (s, q) {
          return (
            s.id.toLowerCase().indexOf(q) !== -1 ||
            s.name.toLowerCase().indexOf(q) !== -1 ||
            s.origin.toLowerCase().indexOf(q) !== -1 ||
            s.pic.toLowerCase().indexOf(q) !== -1 ||
            (s.bankAccount || '').toLowerCase().indexOf(q) !== -1
          );
        },
        renderRow: function (s) {
          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(s.id) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(s.name) + '</span></td>' +
            '<td>' + escapeHtml(s.origin) + '</td>' +
            '<td><strong>' + escapeHtml(s.pic) + '</strong></td>' +
            '<td><span class="cell-code">' + escapeHtml(s.bankAccount || '-') + '</span></td>' +
            '<td><span class="badge-status badge-warning">' + s.leadTimeDays + ' Hari Kalender</span></td>' +
            '</tr>'
          );
        }
      });
      this.suppliersTable.render();
    },

    initProductsTable: function () {
      this.productsTable = new TableEngine({
        tbodyId: 'masterProductsTbody',
        paginationId: 'masterProductsPagination',
        searchInputId: 'masterProductsSearch',
        pageSizeSelectId: 'masterProductsPageSize',
        defaultPageSize: 5,
        colSpan: 7,
        getData: function () {
          return window.NPP_ERP_DATA.inventory;
        },
        searchFn: function (p, q) {
          return (
            p.sku.toLowerCase().indexOf(q) !== -1 ||
            p.name.toLowerCase().indexOf(q) !== -1 ||
            p.category.toLowerCase().indexOf(q) !== -1 ||
            p.rack.toLowerCase().indexOf(q) !== -1
          );
        },
        filters: [
          {
            selectId: 'filterMasterProdCategory',
            match: function (p, val) { return p.category === val; }
          }
        ],
        renderRow: function (p) {
          var pubStat = p.webPublished || 'Tayang di Katalog';
          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(p.sku) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(p.name) + '</span></td>' +
            '<td>' + escapeHtml(p.category) + '</td>' +
            '<td><strong>' + escapeHtml(p.unit) + '</strong></td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(p.sellPrice, false) + '</span></td>' +
            '<td><strong>' + p.minStok + ' ' + escapeHtml(p.unit) + '</strong></td>' +
            '<td>' + renderStatusBadge(pubStat) + '</td>' +
            '</tr>'
          );
        }
      });
      this.productsTable.render();
    },

    initRacksTable: function () {
      this.racksTable = new TableEngine({
        tbodyId: 'masterRacksTbody',
        paginationId: 'masterRacksPagination',
        searchInputId: 'masterRacksSearch',
        pageSizeSelectId: 'masterRacksPageSize',
        defaultPageSize: 5,
        colSpan: 4,
        getData: function () {
          return window.NPP_ERP_DATA.racks;
        },
        searchFn: function (r, q) {
          return (
            r.code.toLowerCase().indexOf(q) !== -1 ||
            r.zone.toLowerCase().indexOf(q) !== -1 ||
            r.category.toLowerCase().indexOf(q) !== -1 ||
            (r.description || '').toLowerCase().indexOf(q) !== -1
          );
        },
        renderRow: function (r) {
          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(r.code) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(r.zone) + '</span></td>' +
            '<td><span class="badge-status badge-info">' + escapeHtml(r.capacity) + '</span></td>' +
            '<td>' + escapeHtml(r.description || (r.category + ' • ' + (r.tempSpec || '22°C'))) + '</td>' +
            '</tr>'
          );
        }
      });
      this.racksTable.render();
    },

    bindMasterModals: function () {
      var self = this;

      var setupModal = function (openBtnId, modalId, closeBtnId, cancelBtnId, formId, onSubmitFn) {
        var openBtn = document.getElementById(openBtnId);
        var modal = document.getElementById(modalId);
        var closeBtn = document.getElementById(closeBtnId);
        var cancelBtn = document.getElementById(cancelBtnId);
        var form = document.getElementById(formId);

        if (!modal) return;
        var closeModal = function () { modal.classList.remove('modal-open'); };

        if (openBtn) {
          openBtn.addEventListener('click', function () {
            modal.classList.add('modal-open');
          });
        }
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', function (e) {
          if (e.target === modal) closeModal();
        });
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            onSubmitFn(form, closeModal);
          });
        }
      };

      // 1. Modal Tambah Pelanggan
      setupModal(
        'btnOpenAddCustomerModal',
        'modalAddCustomer',
        'closeAddCustomerModal',
        'cancelAddCustomerBtn',
        'formAddCustomer',
        function (form, closeModal) {
          var db = window.NPP_ERP_DATA;
          var newId = 'CUST-00' + (db.customers.length + 1);
          var newCust = {
            id: newId,
            name: document.getElementById('custNameInput').value.trim(),
            pic: document.getElementById('custPicInput').value.trim(),
            rolePic: 'Procurement Manager',
            phone: document.getElementById('custPhoneInput').value.trim(),
            email: document.getElementById('custEmailInput').value.trim(),
            address: document.getElementById('custAddressInput').value.trim(),
            npwp: document.getElementById('custNpwpInput').value.trim(),
            paymentTerm: document.getElementById('custTopInput').value,
            sector: 'Industri & Korporasi B2B',
            creditLimit: 500000000,
            status: 'Aktif'
          };
          db.customers.unshift(newCust);
          saveDatabase(db);
          addAuditLog('ADD_MASTER_CUSTOMER', newId, 'Menambahkan pelanggan B2B baru: ' + newCust.name);
          self.updateTabCounts();
          self.customersTable.currentPage = 1;
          self.customersTable.render();
          form.reset();
          closeModal();
          showToast('Pelanggan baru ' + newCust.name + ' (' + newId + ') berhasil ditambahkan!');
        }
      );

      // 2. Modal Tambah Supplier
      setupModal(
        'btnOpenAddSupplierModal',
        'modalAddSupplier',
        'closeAddSupplierModal',
        'cancelAddSupplierBtn',
        'formAddSupplier',
        function (form, closeModal) {
          var db = window.NPP_ERP_DATA;
          var newId = 'SUP-00' + (db.suppliers.length + 1);
          var newSup = {
            id: newId,
            name: document.getElementById('supNameInput').value.trim(),
            origin: document.getElementById('supOriginInput').value.trim(),
            pic: document.getElementById('supPicInput').value.trim(),
            phone: document.getElementById('supPhoneInput').value.trim(),
            email: document.getElementById('supEmailInput').value.trim(),
            bankAccount: document.getElementById('supBankInput').value.trim(),
            leadTimeDays: parseInt(document.getElementById('supLeadTimeInput').value, 10) || 14,
            category: document.getElementById('supCategoryInput').value.trim() || 'Industrial Power Equipment',
            paymentTerm: 'NET 30',
            status: 'Prinsipal Resmi'
          };
          db.suppliers.unshift(newSup);
          saveDatabase(db);
          addAuditLog('ADD_MASTER_SUPPLIER', newId, 'Menambahkan prinsipal/supplier baru: ' + newSup.name);
          self.updateTabCounts();
          self.suppliersTable.currentPage = 1;
          self.suppliersTable.render();
          form.reset();
          closeModal();
          showToast('Supplier baru ' + newSup.name + ' (' + newId + ') berhasil disimpan!');
        }
      );

      // 3. Modal Tambah Produk & SKU
      setupModal(
        'btnOpenAddProductModal',
        'modalAddProduct',
        'closeAddProductModal',
        'cancelAddProductBtn',
        'formAddProduct',
        function (form, closeModal) {
          var db = window.NPP_ERP_DATA;
          var skuCode = document.getElementById('prodSkuInput').value.trim().toUpperCase();
          var sellPrice = parseFloat(document.getElementById('prodPriceInput').value) || 0;
          var newProd = {
            sku: skuCode,
            name: document.getElementById('prodNameInput').value.trim(),
            category: document.getElementById('prodCategoryInput').value,
            brand: document.getElementById('prodCategoryInput').value.split(' ')[1] || 'NPP',
            unit: document.getElementById('prodUnitInput').value,
            rack: document.getElementById('prodRackInput').value || 'RAK-A01',
            hpp: Math.round(sellPrice * 0.78),
            sellPrice: sellPrice,
            fisik: 0,
            tertahan: 0,
            layak: 0,
            reservasi: 0,
            tersedia: 0,
            minStok: parseInt(document.getElementById('prodMinStokInput').value, 10) || 10,
            webPublished: document.getElementById('prodWebStatusInput').value,
            supplierId: 'SUP-001',
            lastAudit: '2026-11-06'
          };
          db.inventory.unshift(newProd);
          saveDatabase(db);
          addAuditLog('ADD_MASTER_SKU', skuCode, 'Menambahkan Master SKU baru: ' + newProd.name);
          RoleManager.updateSidebarCounters();
          self.updateTabCounts();
          self.productsTable.currentPage = 1;
          self.productsTable.render();
          form.reset();
          closeModal();
          showToast('Master Produk ' + skuCode + ' berhasil ditambahkan ke database!');
        }
      );

      // 4. Modal Tambah Lokasi Rak Gudang
      setupModal(
        'btnOpenAddRackModal',
        'modalAddRack',
        'closeAddRackModal',
        'cancelAddRackBtn',
        'formAddRack',
        function (form, closeModal) {
          var db = window.NPP_ERP_DATA;
          var rackCode = document.getElementById('rackCodeInput').value.trim().toUpperCase();
          var newRack = {
            code: rackCode,
            zone: document.getElementById('rackZoneInput').value.trim(),
            capacity: document.getElementById('rackCapacityInput').value.trim(),
            description: document.getElementById('rackDescInput').value.trim(),
            category: document.getElementById('rackDescInput').value.trim(),
            tempSpec: '22°C Terkendali',
            pic: 'Budi Santoso'
          };
          db.racks.unshift(newRack);
          saveDatabase(db);
          addAuditLog('ADD_MASTER_RACK', rackCode, 'Menambahkan lokasi rak gudang baru: ' + rackCode + ' (' + newRack.zone + ')');
          self.updateTabCounts();
          self.racksTable.currentPage = 1;
          self.racksTable.render();
          form.reset();
          closeModal();
          showToast('Lokasi Rak Gudang ' + rackCode + ' berhasil ditambahkan!');
        }
      );
    }
  };

  /* ==========================================================================
     11. INVENTORY CONTROLLER (KHUSUS HALAMAN internal/inventory.html — TUGAS 3.1)
     ========================================================================== */
  var InventoryController = {
    balancesTable: null,
    ledgerTable: null,
    receiptsTable: null,

    init: function () {
      if (!document.getElementById('erpInventoryPage')) return;

      var self = this;
      ensureDataSchema(window.NPP_ERP_DATA);
      this.renderFormulaAggregates();
      this.syncGrButtonRBAC();
      this.bindTabSwitching();
      this.initBalancesTable();
      this.initLedgerTable();
      this.initReceiptsTable();
      this.bindCreateGrModal();

      RoleManager.onChange(function () {
        self.syncGrButtonRBAC();
        self.renderFormulaAggregates();
        if (self.balancesTable) self.balancesTable.render();
        if (self.ledgerTable) self.ledgerTable.render();
        if (self.receiptsTable) self.receiptsTable.render();
      });
    },

    getSkuStockStatus: function (item) {
      if (item.tersedia <= 0) return 'Habis';
      if (item.tersedia <= item.minStok) return 'Kritis';
      return 'Normal';
    },

    renderFormulaAggregates: function () {
      var db = window.NPP_ERP_DATA;
      var totals = db.inventory.reduce(function (acc, item) {
        acc.fisik += Number(item.fisik) || 0;
        acc.tertahan += Number(item.tertahan) || 0;
        acc.layak += Number(item.layak) || 0;
        acc.reservasi += Number(item.reservasi) || 0;
        acc.tersedia += Number(item.tersedia) || 0;
        return acc;
      }, { fisik: 0, tertahan: 0, layak: 0, reservasi: 0, tersedia: 0 });

      var elFisik = document.getElementById('invSumFisik');
      var elTertahan = document.getElementById('invSumTertahan');
      var elLayak = document.getElementById('invSumLayak');
      var elReservasi = document.getElementById('invSumReservasi');
      var elTersedia = document.getElementById('invSumTersedia');

      if (elFisik) elFisik.textContent = totals.fisik + ' Unit';
      if (elTertahan) elTertahan.textContent = totals.tertahan + ' Unit';
      if (elLayak) elLayak.textContent = totals.layak + ' Unit';
      if (elReservasi) elReservasi.textContent = totals.reservasi + ' Unit';
      if (elTersedia) elTersedia.textContent = totals.tersedia + ' Unit';

      var cSku = document.getElementById('countTabStockSku');
      var cLedger = document.getElementById('countTabStockLedger');
      var cGr = document.getElementById('countTabGoodsReceipt');
      if (cSku) cSku.textContent = db.inventory.length;
      if (cLedger) cLedger.textContent = db.stockLedger.length;
      if (cGr) cGr.textContent = db.goodsReceipts.length;
    },

    syncGrButtonRBAC: function () {
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var canReceiveGr = roleCfg.code === 'Operasional' || roleCfg.code === 'Super Admin' || roleCfg.code === 'Gudang' || roleCfg.code === 'Administrator';
      var btnGr = document.getElementById('btnOpenCreateGrModal');

      if (btnGr) {
        btnGr.disabled = !canReceiveGr;
        btnGr.title = canReceiveGr
          ? 'Catat Penerimaan Barang Fisik & Inspeksi QC'
          : 'Hanya peran Operasional atau Super Admin yang dapat mencatat Penerimaan Barang & QC';
      }
    },

    bindTabSwitching: function () {
      var tabBtns = document.querySelectorAll('[data-inv-tab]');
      var tabPanes = document.querySelectorAll('[data-inv-pane]');

      tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-inv-tab');
          tabBtns.forEach(function (b) {
            b.classList.toggle('erp-tab-btn-active', b.getAttribute('data-inv-tab') === target);
          });
          tabPanes.forEach(function (p) {
            p.classList.toggle('tab-pane-active', p.getAttribute('data-inv-pane') === target);
          });
        });
      });
    },

    initBalancesTable: function () {
      var self = this;
      this.balancesTable = new TableEngine({
        tbodyId: 'invBalancesTbody',
        paginationId: 'invBalancesPagination',
        searchInputId: 'invStockSearch',
        pageSizeSelectId: 'invStockPageSize',
        defaultPageSize: 5,
        colSpan: 10,
        getData: function () {
          return window.NPP_ERP_DATA.inventory;
        },
        searchFn: function (item, q) {
          return (
            item.sku.toLowerCase().indexOf(q) !== -1 ||
            item.name.toLowerCase().indexOf(q) !== -1 ||
            item.category.toLowerCase().indexOf(q) !== -1 ||
            item.rack.toLowerCase().indexOf(q) !== -1
          );
        },
        filters: [
          {
            selectId: 'invFilterCategory',
            match: function (item, val) { return item.category === val; }
          },
          {
            selectId: 'invFilterStatus',
            match: function (item, val) { return self.getSkuStockStatus(item) === val; }
          }
        ],
        renderRow: function (item) {
          var stockStat = self.getSkuStockStatus(item);
          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(item.sku) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(item.name) + '</span></td>' +
            '<td><span class="badge-status badge-neutral">' + escapeHtml(item.rack) + '</span></td>' +
            '<td><strong>' + item.fisik + '</strong> ' + escapeHtml(item.unit) + '</td>' +
            '<td>' +
            (item.tertahan > 0
              ? '<span class="badge-status badge-danger">' + item.tertahan + ' Karantina</span>'
              : '0 ' + escapeHtml(item.unit)) +
            '</td>' +
            '<td><strong>' + item.layak + '</strong> ' + escapeHtml(item.unit) + '</td>' +
            '<td><span class="badge-status badge-info">' + item.reservasi + ' ' + escapeHtml(item.unit) + '</span></td>' +
            '<td><span class="cell-stock-available">' + item.tersedia + ' ' + escapeHtml(item.unit) + '</span></td>' +
            '<td><strong>' + item.minStok + '</strong> ' + escapeHtml(item.unit) + '</td>' +
            '<td>' + renderStatusBadge(stockStat) + '</td>' +
            '</tr>'
          );
        }
      });
      this.balancesTable.render();
    },

    initLedgerTable: function () {
      this.ledgerTable = new TableEngine({
        tbodyId: 'invLedgerTbody',
        paginationId: 'invLedgerPagination',
        searchInputId: 'invLedgerSearch',
        pageSizeSelectId: 'invLedgerPageSize',
        defaultPageSize: 5,
        colSpan: 7,
        getData: function () {
          return window.NPP_ERP_DATA.stockLedger;
        },
        searchFn: function (row, q) {
          return (
            row.id.toLowerCase().indexOf(q) !== -1 ||
            row.refDoc.toLowerCase().indexOf(q) !== -1 ||
            row.sku.toLowerCase().indexOf(q) !== -1 ||
            row.skuName.toLowerCase().indexOf(q) !== -1 ||
            row.type.toLowerCase().indexOf(q) !== -1 ||
            row.pic.toLowerCase().indexOf(q) !== -1 ||
            (row.note || '').toLowerCase().indexOf(q) !== -1
          );
        },
        filters: [
          {
            selectId: 'invFilterLedgerType',
            match: function (row, val) { return row.type.indexOf(val) !== -1; }
          }
        ],
        renderRow: function (row) {
          var qtyNum = Number(row.qty) || 0;
          var qtyFormatted = qtyNum > 0 ? '+' + qtyNum : '' + qtyNum;
          var qtyCls = 'qty-change-lock';
          if (row.type.indexOf('MASUK') !== -1) qtyCls = 'qty-change-plus';
          if (row.type.indexOf('KELUAR') !== -1 || row.type.indexOf('TERTAHAN') !== -1) qtyCls = 'qty-change-minus';

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(row.date) + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(row.refDoc) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(row.sku) + '</span></td>' +
            '<td>' + renderStatusBadge(row.type) + '</td>' +
            '<td><span class="' + qtyCls + '">' + escapeHtml(qtyFormatted) + ' Unit</span></td>' +
            '<td><strong>' + (row.finalPhysical != null ? row.finalPhysical : '-') + ' Unit</strong></td>' +
            '<td><strong>' + escapeHtml(row.pic) + '</strong></td>' +
            '</tr>'
          );
        }
      });
      this.ledgerTable.render();
    },

    initReceiptsTable: function () {
      this.receiptsTable = new TableEngine({
        tbodyId: 'invGrTbody',
        paginationId: 'invGrPagination',
        searchInputId: 'invGrSearch',
        pageSizeSelectId: 'invGrPageSize',
        defaultPageSize: 5,
        colSpan: 8,
        getData: function () {
          return window.NPP_ERP_DATA.goodsReceipts;
        },
        searchFn: function (gr, q) {
          return (
            gr.id.toLowerCase().indexOf(q) !== -1 ||
            gr.poSupplierId.toLowerCase().indexOf(q) !== -1 ||
            gr.supplierName.toLowerCase().indexOf(q) !== -1 ||
            gr.sku.toLowerCase().indexOf(q) !== -1 ||
            gr.skuName.toLowerCase().indexOf(q) !== -1 ||
            gr.rackTarget.toLowerCase().indexOf(q) !== -1
          );
        },
        renderRow: function (gr) {
          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(gr.id) + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(gr.poSupplierId) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(gr.sku) + '</span></td>' +
            '<td><strong>' + gr.qtyReceived + ' Unit</strong></td>' +
            '<td><span class="badge-status badge-success">' + gr.qtyPassed + ' Lolos QC</span></td>' +
            '<td>' +
            (gr.qtyHold > 0
              ? '<span class="badge-status badge-danger">' + gr.qtyHold + ' Karantina</span>'
              : '0 Hold') +
            '</td>' +
            '<td><span class="badge-status badge-neutral">' + escapeHtml(gr.rackTarget) + '</span></td>' +
            '<td><strong>' + escapeHtml(gr.inspector) + '</strong></td>' +
            '</tr>'
          );
        }
      });
      this.receiptsTable.render();
    },

    bindCreateGrModal: function () {
      var self = this;
      var modal = document.getElementById('createGrModal');
      var openBtn = document.getElementById('btnOpenCreateGrModal');
      var closeBtn = document.getElementById('closeCreateGrModal');
      var cancelBtn = document.getElementById('cancelCreateGrBtn');
      var poSelect = document.getElementById('grPoSelect');
      var skuSelect = document.getElementById('grSkuSelect');
      var passedInput = document.getElementById('grQtyPassed');
      var holdInput = document.getElementById('grQtyHold');
      var form = document.getElementById('createGrForm');

      if (!modal) return;
      var closeModal = function () { modal.classList.remove('modal-open'); };

      if (openBtn) {
        openBtn.addEventListener('click', function () {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          if (roleCfg.code !== 'Operasional' && roleCfg.code !== 'Super Admin' && roleCfg.code !== 'Gudang' && roleCfg.code !== 'Administrator') {
            showToast('Akses ditolak: Hanya peran Operasional atau Super Admin yang dapat mencatat Penerimaan Barang & QC.');
            return;
          }
          self.prepareCreateGrForm();
          modal.classList.add('modal-open');
        });
      }

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });

      if (poSelect) {
        poSelect.addEventListener('change', function () {
          self.populateGrSkuOptions(poSelect.value);
        });
      }
      if (skuSelect) {
        skuSelect.addEventListener('change', function () {
          self.updateGrLivePreview();
        });
      }
      if (passedInput) {
        passedInput.addEventListener('input', function () {
          self.updateGrLivePreview();
        });
      }
      if (holdInput) {
        holdInput.addEventListener('input', function () {
          self.updateGrLivePreview();
        });
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          self.submitCreateGrForm();
        });
      }
    },

    prepareCreateGrForm: function () {
      var db = window.NPP_ERP_DATA;
      var poSelect = document.getElementById('grPoSelect');
      var rackSelect = document.getElementById('grRackSelect');

      // Ambil daftar PO Supplier yang relevan untuk diterima
      var activePos = db.procurements.filter(function (p) {
        return p.statusReceiving !== 'Diterima Penuh';
      });
      if (activePos.length === 0) {
        activePos = db.procurements;
      }

      if (poSelect) {
        poSelect.innerHTML = activePos.map(function (p) {
          return (
            '<option value="' + escapeHtml(p.id) + '">' +
            escapeHtml(p.id) + ' — ' + escapeHtml(p.supplierName) + ' (' + escapeHtml(p.statusReceiving) + ')' +
            '</option>'
          );
        }).join('');
      }

      if (rackSelect) {
        rackSelect.innerHTML = db.racks.map(function (r) {
          return '<option value="' + escapeHtml(r.code) + '">' + escapeHtml(r.code) + ' — ' + escapeHtml(r.zone) + '</option>';
        }).join('');
      }

      var firstPoId = activePos[0] ? activePos[0].id : '';
      this.populateGrSkuOptions(firstPoId);
    },

    populateGrSkuOptions: function (poId) {
      var db = window.NPP_ERP_DATA;
      var po = db.procurements.find(function (p) { return p.id === poId; });
      var skuSelect = document.getElementById('grSkuSelect');
      var passedInput = document.getElementById('grQtyPassed');
      var holdInput = document.getElementById('grQtyHold');
      var rackSelect = document.getElementById('grRackSelect');

      if (!skuSelect) return;

      var skuList = [];
      if (po && Array.isArray(po.items) && po.items.length > 0) {
        skuList = po.items.map(function (it) {
          var invObj = db.inventory.find(function (s) { return s.sku === it.sku; });
          return {
            sku: it.sku,
            name: it.name,
            orderedQty: it.qty,
            rack: invObj ? invObj.rack : 'RAK-A01'
          };
        });
      } else {
        skuList = db.inventory.map(function (inv) {
          return { sku: inv.sku, name: inv.name, orderedQty: 10, rack: inv.rack };
        });
      }

      skuSelect.innerHTML = skuList.map(function (s) {
        return (
          '<option value="' + escapeHtml(s.sku) + '" data-ordered-qty="' + s.orderedQty + '" data-default-rack="' + escapeHtml(s.rack) + '">' +
          escapeHtml(s.sku) + ' — ' + escapeHtml(s.name) + ' (Order PO: ' + s.orderedQty + ' Unit)' +
          '</option>'
        );
      }).join('');

      var firstItem = skuList[0];
      if (firstItem) {
        if (passedInput) passedInput.value = firstItem.orderedQty;
        if (holdInput) holdInput.value = 0;
        if (rackSelect) rackSelect.value = firstItem.rack;
      }

      this.updateGrLivePreview();
    },

    updateGrLivePreview: function () {
      var db = window.NPP_ERP_DATA;
      var skuSelect = document.getElementById('grSkuSelect');
      var passedInput = document.getElementById('grQtyPassed');
      var holdInput = document.getElementById('grQtyHold');
      var previewEl = document.getElementById('grLiveBalancePreview');

      if (!skuSelect || !previewEl) return;
      var skuCode = skuSelect.value;
      var skuObj = db.inventory.find(function (i) { return i.sku === skuCode; });
      if (!skuObj) return;

      var qtyPass = Math.max(0, parseInt(passedInput ? passedInput.value : 0, 10) || 0);
      var qtyHold = Math.max(0, parseInt(holdInput ? holdInput.value : 0, 10) || 0);

      var newFisik = skuObj.fisik + qtyPass + qtyHold;
      var newTertahan = skuObj.tertahan + qtyHold;
      var newLayak = newFisik - newTertahan;
      var newTersedia = newLayak - skuObj.reservasi;

      previewEl.textContent =
        'Simulasi Saldo Baru ' + skuObj.sku + ' -> Fisik: ' + newFisik +
        ' | Tertahan: ' + newTertahan +
        ' | Layak Pakai: ' + newLayak +
        ' | Reservasi: ' + skuObj.reservasi +
        ' | Stok Tersedia (ATP): ' + newTersedia + ' ' + skuObj.unit;
    },

    submitCreateGrForm: function () {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();

      var poId = document.getElementById('grPoSelect').value;
      var skuCode = document.getElementById('grSkuSelect').value;
      var qtyPass = Math.max(0, parseInt(document.getElementById('grQtyPassed').value, 10) || 0);
      var qtyHold = Math.max(0, parseInt(document.getElementById('grQtyHold').value, 10) || 0);
      var totalReceived = qtyPass + qtyHold;
      var rackTarget = document.getElementById('grRackSelect').value || 'RAK-A01';
      var receivingType = document.getElementById('grReceivingStatusSelect').value || 'Diterima Penuh';
      var notes = document.getElementById('grNotesInput').value.trim();

      if (totalReceived <= 0) {
        showToast('Jumlah total fisik diterima (Lolos QC + Karantina) harus lebih dari 0.');
        return;
      }

      var po = db.procurements.find(function (p) { return p.id === poId; });
      var skuObj = db.inventory.find(function (i) { return i.sku === skuCode; });
      if (!skuObj) return;

      // 1. Update 5 Saldo Stok di Master Inventory sesuai rumus matematis HLD
      skuObj.fisik += totalReceived;
      skuObj.tertahan += qtyHold;
      skuObj.layak = skuObj.fisik - skuObj.tertahan;
      skuObj.tersedia = skuObj.layak - skuObj.reservasi;
      skuObj.rack = rackTarget;
      skuObj.lastAudit = '2026-11-06';

      var pad4 = function (n) {
        var s = String(n);
        while (s.length < 4) s = '0' + s;
        return s;
      };
      var newGrId = 'GR-202611-' + pad4(db.goodsReceipts.length + 1);

      // 2. Simpan dokumen Goods Receipt (GR-YYYYMM-XXXX)
      db.goodsReceipts.unshift({
        id: newGrId,
        poSupplierId: po ? po.id : poId,
        supplierName: po ? po.supplierName : 'Prinsipal Resmi NPP',
        date: '2026-11-06',
        inspector: roleCfg.userName,
        sku: skuObj.sku,
        skuName: skuObj.name,
        qtyReceived: totalReceived,
        qtyPassed: qtyPass,
        qtyHold: qtyHold,
        rackTarget: rackTarget,
        notes: notes || ('Lolos QC: ' + qtyPass + ' ' + skuObj.unit + ', Karantina: ' + qtyHold + ' ' + skuObj.unit)
      });

      // 3. Catat ke Buku Besar Mutasi (Stock Ledger)
      if (qtyPass > 0) {
        db.stockLedger.unshift({
          id: 'MUT-' + (100 + db.stockLedger.length + 1),
          date: '2026-11-06 15:20',
          sku: skuObj.sku,
          skuName: skuObj.name,
          type: 'MASUK',
          qty: qtyPass,
          finalPhysical: skuObj.fisik,
          refDoc: newGrId,
          pic: roleCfg.userName,
          note: 'Penerimaan layak pakai dari ' + (po ? po.id : poId) + ' ke ' + rackTarget
        });
      }
      if (qtyHold > 0) {
        db.stockLedger.unshift({
          id: 'MUT-' + (100 + db.stockLedger.length + 1),
          date: '2026-11-06 15:21',
          sku: skuObj.sku,
          skuName: skuObj.name,
          type: 'TERTAHAN',
          qty: qtyHold,
          finalPhysical: skuObj.fisik,
          refDoc: newGrId,
          pic: roleCfg.userName,
          note: 'Unit karantina/belum lolos QC diisolasi ke RAK-QC (' + (notes || 'Klaim Prinsipal') + ')'
        });
      }

      // 4. Perbarui status penerimaan pada PO Supplier terkait
      if (po) {
        po.statusReceiving = receivingType;
      }

      // 5. Cek otomatis apakah ada PO Pelanggan berstatus 'Menunggu Pengadaan' yang kini bisa dipenuhi
      db.orders.forEach(function (order) {
        if (order.statusPemenuhan === 'Menunggu Pengadaan') {
          var needsThisSku = (order.items || []).find(function (it) { return it.sku === skuObj.sku; });
          if (needsThisSku && skuObj.tersedia >= needsThisSku.qty) {
            skuObj.reservasi += needsThisSku.qty;
            skuObj.tersedia = skuObj.layak - skuObj.reservasi;
            order.statusPemenuhan = 'Stok Direservasi';
            if (order.statusApproval === 'Disetujui') {
              order.statusPengiriman = 'Siap Kirim Gudang';
            }
          }
        }
      });

      saveDatabase(db);
      addAuditLog(
        'QC_GOODS_RECEIPT',
        newGrId,
        'Mencatat GR & QC ' + skuObj.sku + ' sebanyak ' + totalReceived + ' ' + skuObj.unit +
          ' (Lolos: ' + qtyPass + ', Karantina: ' + qtyHold + ') dari ' + (po ? po.id : poId)
      );

      RoleManager.updateSidebarCounters();
      this.renderFormulaAggregates();
      if (this.balancesTable) this.balancesTable.render();
      if (this.ledgerTable) this.ledgerTable.render();
      if (this.receiptsTable) this.receiptsTable.render();

      var modal = document.getElementById('createGrModal');
      if (modal) modal.classList.remove('modal-open');

      showToast('Penerimaan Barang ' + newGrId + ' berhasil disimpan & 5 Saldo Stok diperbarui!');
    }
  };

  /* ==========================================================================
     12. PROCUREMENT CONTROLLER (KHUSUS HALAMAN internal/procurement.html — TUGAS 3.2)
     ========================================================================== */
  var ProcurementController = {
    shortageTable: null,
    poTable: null,
    poLineCounter: 0,

    init: function () {
      if (!document.getElementById('erpProcurementPage')) return;

      var self = this;
      ensureDataSchema(window.NPP_ERP_DATA);
      this.renderProcurementKPIs();
      this.syncProcurementRBAC();
      this.bindTabSwitching();
      this.initShortageTable();
      this.initPoSupplierTable();
      this.bindCreatePoModal();
      this.bindPoDetailModal();

      RoleManager.onChange(function () {
        self.renderProcurementKPIs();
        self.syncProcurementRBAC();
        if (self.shortageTable) self.shortageTable.render();
        if (self.poTable) self.poTable.render();
      });
    },

    computeShortageItems: function () {
      var db = window.NPP_ERP_DATA;
      var results = [];

      db.inventory.forEach(function (skuObj) {
        // Hitung total kebutuhan dari PO Pelanggan yang masih Menunggu Pengadaan
        var backorderOrders = db.orders.filter(function (o) {
          return o.statusPemenuhan === 'Menunggu Pengadaan' &&
            (o.items || []).some(function (it) { return it.sku === skuObj.sku; });
        });

        var backorderQty = 0;
        var refOrderIds = [];
        backorderOrders.forEach(function (o) {
          refOrderIds.push(o.id);
          (o.items || []).forEach(function (it) {
            if (it.sku === skuObj.sku) backorderQty += Number(it.qty) || 0;
          });
        });

        var isBelowRop = skuObj.tersedia <= skuObj.minStok;
        if (isBelowRop || backorderQty > 0) {
          var deficitRop = Math.max(0, (skuObj.minStok * 2) - skuObj.tersedia);
          var recommendedQty = Math.max(deficitRop, backorderQty + skuObj.minStok - skuObj.tersedia, 10);
          var sup = db.suppliers.find(function (s) { return s.id === skuObj.supplierId; }) || db.suppliers[0];

          results.push({
            sku: skuObj.sku,
            name: skuObj.name,
            category: skuObj.category,
            unit: skuObj.unit,
            rack: skuObj.rack,
            tersedia: skuObj.tersedia,
            minStok: skuObj.minStok,
            backorderQty: backorderQty,
            refOrderId: refOrderIds[0] || 'SO-202611-0011',
            recommendedQty: recommendedQty,
            hpp: skuObj.hpp,
            supplierId: sup ? sup.id : 'SUP-001',
            supplierName: sup ? sup.name : 'Ritar Power International Ltd',
            leadTimeDays: sup ? sup.leadTimeDays : 14,
            priority: skuObj.tersedia <= 0 || backorderQty > 0 ? 'Kritis (Backorder SO)' : 'Segera Restock (ROP)'
          });
        }
      });

      return results;
    },

    renderProcurementKPIs: function () {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var shortages = this.computeShortageItems();

      var activePos = db.procurements.filter(function (p) {
        return p.statusReceiving !== 'Diterima Penuh' && p.statusApproval !== 'Ditolak';
      }).length;

      var pendingApprovePos = db.procurements.filter(function (p) {
        return p.statusApproval === 'Diajukan' || p.statusApproval === 'Menunggu Persetujuan';
      }).length;

      var totalPoValue = db.procurements.reduce(function (acc, p) { return acc + (p.total || p.totalHpp || 0); }, 0);
      var totalPoUnits = db.procurements.reduce(function (acc, p) {
        var q = (p.items || []).reduce(function (s, i) { return s + (Number(i.qty) || 0); }, 0);
        return acc + q;
      }, 0);

      var elShortVal = document.getElementById('procKpiShortageVal');
      var elShortSub = document.getElementById('procKpiShortageSub');
      if (elShortVal) elShortVal.textContent = shortages.length + ' SKU Perlu Beli';
      if (elShortSub) elShortSub.textContent = 'Stok di bawah ROP / Backorder PO Klien';

      var elActVal = document.getElementById('procKpiActiveVal');
      var elActSub = document.getElementById('procKpiActiveSub');
      if (elActVal) elActVal.textContent = activePos + ' PO Berjalan';
      if (elActSub) elActSub.textContent = 'Dari total ' + db.procurements.length + ' dokumen PO Prinsipal';

      var elAppVal = document.getElementById('procKpiPendingVal');
      var elAppSub = document.getElementById('procKpiPendingSub');
      if (elAppVal) elAppVal.textContent = pendingApprovePos + ' Menunggu Otorisasi';
      if (elAppSub) elAppSub.textContent = 'Perlu persetujuan Super Admin';

      var elValLabel = document.getElementById('procKpiValueLabel');
      var elValAmount = document.getElementById('procKpiValueAmount');
      var elValSub = document.getElementById('procKpiValueSub');

      if (!roleCfg.canViewHPP) {
        if (elValLabel) elValLabel.textContent = 'Total Kuantitas Pengadaan';
        if (elValAmount) elValAmount.textContent = totalPoUnits + ' Unit / Cell';
        if (elValSub) elValSub.textContent = 'Mode RBAC: Nilai HPP Pembelian disembunyikan';
      } else {
        if (elValLabel) elValLabel.textContent = 'Total Nilai PO Supplier';
        if (elValAmount) elValAmount.textContent = formatRupiah(totalPoValue);
        if (elValSub) elValSub.textContent = 'Akumulasi pengadaan ke prinsipal (+PPN 11%)';
      }

      var cShort = document.getElementById('countTabShortage');
      var cPo = document.getElementById('countTabPoList');
      if (cShort) cShort.textContent = shortages.length;
      if (cPo) cPo.textContent = db.procurements.length;
    },

    syncProcurementRBAC: function () {
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var canCreatePo = roleCfg.code === 'Operasional' || roleCfg.code === 'Super Admin' || roleCfg.code === 'Purchasing' || roleCfg.code === 'Administrator';
      var btnCreate = document.getElementById('btnOpenCreatePoModal');

      if (btnCreate) {
        btnCreate.disabled = !canCreatePo;
        btnCreate.title = canCreatePo
          ? 'Terbitkan PO Baru ke Prinsipal / Pabrikan'
          : 'Hanya peran Operasional atau Super Admin yang dapat menerbitkan PO Supplier baru';
      }
    },

    bindTabSwitching: function () {
      var tabBtns = document.querySelectorAll('[data-proc-tab]');
      var tabPanes = document.querySelectorAll('[data-proc-pane]');

      tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-proc-tab');
          tabBtns.forEach(function (b) {
            b.classList.toggle('erp-tab-btn-active', b.getAttribute('data-proc-tab') === target);
          });
          tabPanes.forEach(function (p) {
            p.classList.toggle('tab-pane-active', p.getAttribute('data-proc-pane') === target);
          });
        });
      });
    },

    initShortageTable: function () {
      var self = this;
      this.shortageTable = new TableEngine({
        tbodyId: 'procShortageTbody',
        paginationId: 'procShortagePagination',
        searchInputId: 'procShortageSearch',
        pageSizeSelectId: 'procShortagePageSize',
        defaultPageSize: 5,
        colSpan: 9,
        getData: function () {
          return self.computeShortageItems();
        },
        searchFn: function (item, q) {
          return (
            item.sku.toLowerCase().indexOf(q) !== -1 ||
            item.name.toLowerCase().indexOf(q) !== -1 ||
            item.supplierName.toLowerCase().indexOf(q) !== -1 ||
            item.refOrderId.toLowerCase().indexOf(q) !== -1
          );
        },
        filters: [
          {
            selectId: 'procShortageCategory',
            match: function (item, val) { return item.category === val; }
          }
        ],
        renderRow: function (item) {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          var canCreatePo = roleCfg.code === 'Operasional' || roleCfg.code === 'Super Admin' || roleCfg.code === 'Purchasing' || roleCfg.code === 'Administrator';

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(item.sku) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(item.name) + '</span></td>' +
            '<td><span class="cell-stock-available">' + item.tersedia + ' ' + escapeHtml(item.unit) + '</span></td>' +
            '<td><strong>' + item.minStok + ' ' + escapeHtml(item.unit) + '</strong></td>' +
            '<td>' +
            (item.backorderQty > 0
              ? '<span class="badge-status badge-danger">' + item.backorderQty + ' ' + escapeHtml(item.unit) + '</span>'
              : '0 (Buffer)') +
            '</td>' +
            '<td><strong class="qty-change-plus">+' + item.recommendedQty + ' ' + escapeHtml(item.unit) + '</strong></td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(item.hpp, true) + '</span></td>' +
            '<td>' + renderStatusBadge(item.priority) + '</td>' +
            '<td>' +
            '<button type="button" class="btn-erp btn-erp-primary btn-erp-sm" data-quick-po-sku="' + escapeHtml(item.sku) + '" ' +
            (canCreatePo ? '' : 'disabled title="Khusus Operasional & Super Admin"') + '>' +
            'Buat PO Supplier' +
            '</button>' +
            '</td>' +
            '</tr>'
          );
        },
        onAfterRender: function () {
          var tbody = document.getElementById('procShortageTbody');
          if (!tbody) return;

          tbody.querySelectorAll('[data-quick-po-sku]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              if (btn.disabled) return;
              var skuCode = btn.getAttribute('data-quick-po-sku');
              self.openCreatePoModalWithPreselect(skuCode);
            });
          });
        }
      });
      this.shortageTable.render();
    },

    initPoSupplierTable: function () {
      var self = this;
      this.poTable = new TableEngine({
        tbodyId: 'procPoTbody',
        paginationId: 'procPoPagination',
        searchInputId: 'procPoSearch',
        pageSizeSelectId: 'procPoPageSize',
        defaultPageSize: 5,
        colSpan: 8,
        getData: function () {
          return window.NPP_ERP_DATA.procurements;
        },
        searchFn: function (po, q) {
          var itemMatch = (po.items || []).some(function (it) {
            return it.sku.toLowerCase().indexOf(q) !== -1 || it.name.toLowerCase().indexOf(q) !== -1;
          });
          return (
            po.id.toLowerCase().indexOf(q) !== -1 ||
            po.supplierName.toLowerCase().indexOf(q) !== -1 ||
            (po.refOrderId || '').toLowerCase().indexOf(q) !== -1 ||
            itemMatch
          );
        },
        filters: [
          {
            selectId: 'procFilterApproval',
            match: function (po, val) { return po.statusApproval === val; }
          },
          {
            selectId: 'procFilterReceiving',
            match: function (po, val) { return po.statusReceiving === val; }
          }
        ],
        renderRow: function (po) {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          var canApprove = roleCfg.canApprove && (po.statusApproval === 'Diajukan' || po.statusApproval === 'Draft');
          var totalUnits = (po.items || []).reduce(function (s, i) { return s + (Number(i.qty) || 0); }, 0);

          var actionBtns =
            '<div class="erp-action-btns">' +
            '<a href="procurement-detail.html?id=' + encodeURIComponent(po.id) + '" class="btn-erp btn-erp-secondary btn-erp-sm">Detail PO</a>' +
            (canApprove
              ? '<button type="button" class="btn-erp btn-erp-success btn-erp-sm" data-approve-po="' + po.id + '">Setujui</button>' +
                '<button type="button" class="btn-erp btn-erp-danger btn-erp-sm" data-reject-po="' + po.id + '">Tolak</button>'
              : '') +
            '</div>';

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(po.id) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(po.supplierName) + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(po.refOrderId || 'Restock Gudang') + '</span></td>' +
            '<td>' + escapeHtml(po.orderDate) + '</td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(po.total || po.totalHpp, true) + '</span></td>' +
            '<td>' + renderStatusBadge(po.statusApproval) + '</td>' +
            '<td>' + renderStatusBadge(po.statusReceiving) + '</td>' +
            '<td>' + actionBtns + '</td>' +
            '</tr>'
          );
        },
        onAfterRender: function () {
          var tbody = document.getElementById('procPoTbody');
          if (!tbody) return;

          tbody.querySelectorAll('[data-view-po]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              self.openPoDetailModal(btn.getAttribute('data-view-po'));
            });
          });

          tbody.querySelectorAll('[data-approve-po]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              self.handlePoApproval(btn.getAttribute('data-approve-po'), 'Disetujui');
            });
          });

          tbody.querySelectorAll('[data-reject-po]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              self.handlePoApproval(btn.getAttribute('data-reject-po'), 'Ditolak');
            });
          });
        }
      });
      this.poTable.render();
    },

    handlePoApproval: function (poId, decision) {
      var roleCfg = RoleManager.getCurrentRoleConfig();
      if (!roleCfg.canApprove) {
        showToast('Akses ditolak: Hanya Super Admin yang dapat mengotorisasi PO Supplier.');
        return;
      }

      var db = window.NPP_ERP_DATA;
      var po = db.procurements.find(function (p) { return p.id === poId; });
      if (!po) return;

      var self = this;
      var isApprove = decision === 'Disetujui';
      showConfirmAlert({
        type: isApprove ? 'success' : 'danger',
        title: isApprove ? 'Setujui PO Supplier ' + po.id : 'Tolak PO Supplier ' + po.id,
        message: isApprove
          ? 'Otorisasi PO Supplier ' + po.supplierName + ' senilai ' + formatMoneyRBAC(po.total || po.totalHpp, true) + '? Pesanan pembelian akan diteruskan ke pemasok.'
          : 'Tolak pengajuan PO Supplier ' + po.supplierName + '? Status pengadaan akan ditangguhkan.',
        confirmText: isApprove ? 'Setujui PO' : 'Tolak PO',
        confirmClass: isApprove ? 'btn-erp-success' : 'btn-erp-danger',
        onConfirm: function () {
          po.statusApproval = decision;
          saveDatabase(db);
          addAuditLog(
            decision === 'Disetujui' ? 'APPROVE_PO_SUPPLIER' : 'REJECT_PO_SUPPLIER',
            po.id,
            'Mengubah status otorisasi PO Supplier ' + po.id + ' (' + po.supplierName + ') menjadi: ' + decision
          );

          self.renderProcurementKPIs();
          if (self.poTable) self.poTable.render();
          showToast('Status PO Supplier ' + po.id + ' berhasil diperbarui menjadi: ' + decision, isApprove ? 'success' : 'info');
        }
      });
    },

    bindCreatePoModal: function () {
      var self = this;
      var modal = document.getElementById('createPoSupplierModal');
      var openBtn = document.getElementById('btnOpenCreatePoModal');
      var closeBtn = document.getElementById('closeCreatePoModal');
      var cancelBtn = document.getElementById('cancelCreatePoBtn');
      var supSelect = document.getElementById('poSupplierSelect');
      var addRowBtn = document.getElementById('btnAddPoLineItem');
      var form = document.getElementById('createPoSupplierForm');

      if (!modal) return;
      var closeModal = function () { modal.classList.remove('modal-open'); };

      if (openBtn) {
        openBtn.addEventListener('click', function () {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          if (roleCfg.code !== 'Operasional' && roleCfg.code !== 'Super Admin' && roleCfg.code !== 'Purchasing' && roleCfg.code !== 'Administrator') {
            showToast('Akses ditolak: Hanya peran Operasional atau Super Admin yang dapat menerbitkan PO Supplier.');
            return;
          }
          self.openCreatePoModalWithPreselect(null);
        });
      }

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });

      if (supSelect) {
        supSelect.addEventListener('change', function () {
          self.syncSupplierEtaHint();
        });
      }

      if (addRowBtn) {
        addRowBtn.addEventListener('click', function () {
          self.addPoLineItemRow(null);
        });
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          self.submitCreatePoForm();
        });
      }
    },

    syncSupplierEtaHint: function () {
      var db = window.NPP_ERP_DATA;
      var supSelect = document.getElementById('poSupplierSelect');
      var etaInput = document.getElementById('poEtaDateInput');
      var hintEl = document.getElementById('poSupplierLeadTimeHint');
      if (!supSelect) return;

      var sup = db.suppliers.find(function (s) { return s.id === supSelect.value; });
      if (sup) {
        if (hintEl) {
          hintEl.textContent = 'Asal: ' + sup.origin + ' • Lead Time: ' + sup.leadTimeDays + ' Hari • Rekening: ' + (sup.bankAccount || sup.paymentTerm);
        }
        if (etaInput) {
          var d = new Date('2026-11-06T12:00:00');
          d.setDate(d.getDate() + (Number(sup.leadTimeDays) || 14));
          var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
          etaInput.value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        }
      }
    },

    openCreatePoModalWithPreselect: function (skuCode) {
      var db = window.NPP_ERP_DATA;
      var modal = document.getElementById('createPoSupplierModal');
      var supSelect = document.getElementById('poSupplierSelect');
      var refSelect = document.getElementById('poRefOrderSelect');
      var container = document.getElementById('poLineItemsContainer');
      var notesInput = document.getElementById('poNotesInput');

      if (!modal) return;

      if (supSelect) {
        supSelect.innerHTML = db.suppliers.map(function (s) {
          return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + ' (Lead Time ' + s.leadTimeDays + ' Hari)</option>';
        }).join('');
      }

      if (refSelect) {
        var soOpts = ['<option value="Restock Safety Stock">Tanpa Ref SO (Restock Safety Stock Gudang)</option>'];
        db.orders.forEach(function (o) {
          soOpts.push('<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.id) + ' — ' + escapeHtml(o.customerName) + ' (' + escapeHtml(o.statusPemenuhan) + ')</option>');
        });
        refSelect.innerHTML = soOpts.join('');
      }

      var shortageItem = null;
      if (skuCode) {
        var shortages = this.computeShortageItems();
        shortageItem = shortages.find(function (sh) { return sh.sku === skuCode; });
      }

      if (shortageItem && supSelect) {
        supSelect.value = shortageItem.supplierId;
      }
      if (shortageItem && refSelect && shortageItem.refOrderId) {
        refSelect.value = shortageItem.refOrderId;
      }
      if (notesInput) {
        notesInput.value = shortageItem
          ? 'Pemenuhan cepat antrean shortage ' + shortageItem.sku + ' (' + shortageItem.priority + ').'
          : '';
      }

      this.syncSupplierEtaHint();

      if (container) {
        container.innerHTML = '';
        this.poLineCounter = 0;
        this.addPoLineItemRow(shortageItem);
      }

      modal.classList.add('modal-open');
    },

    addPoLineItemRow: function (presetItem) {
      var self = this;
      var db = window.NPP_ERP_DATA;
      var container = document.getElementById('poLineItemsContainer');
      if (!container) return;

      this.poLineCounter += 1;
      var defaultSku = presetItem
        ? db.inventory.find(function (i) { return i.sku === presetItem.sku; })
        : db.inventory[0];

      var skuOpts = db.inventory.map(function (item) {
        var selectedAttr = (defaultSku && item.sku === defaultSku.sku) ? ' selected' : '';
        return (
          '<option value="' + escapeHtml(item.sku) + '"' + selectedAttr + '>' +
          escapeHtml(item.sku) + ' — ' + escapeHtml(item.name) + ' (Stok ATP: ' + item.tersedia + ' ' + escapeHtml(item.unit) + ')' +
          '</option>'
        );
      }).join('');

      var initQty = presetItem ? presetItem.recommendedQty : 12;
      var initHpp = defaultSku ? defaultSku.hpp : 2500000;

      var rowEl = document.createElement('div');
      rowEl.className = 'erp-line-item-row';
      rowEl.innerHTML =
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Pilih SKU Produk Industri</span>' +
        '<select class="erp-select po-row-sku" aria-label="Pilih SKU PO Supplier">' + skuOpts + '</select>' +
        '</div>' +
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Qty Beli</span>' +
        '<input type="number" class="erp-input po-row-qty" min="1" value="' + initQty + '" required />' +
        '</div>' +
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Harga Beli / HPP (Rp)</span>' +
        '<input type="number" class="erp-input po-row-hpp" min="0" step="1000" value="' + initHpp + '" required />' +
        '</div>' +
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Subtotal HPP</span>' +
        '<div class="erp-line-item-subtotal po-row-subtotal">Rp 0</div>' +
        '</div>' +
        '<div class="erp-line-item-col">' +
        '<span class="erp-line-item-sublabel">Hapus</span>' +
        '<button type="button" class="btn-erp btn-erp-danger btn-erp-sm po-row-remove">Hapus</button>' +
        '</div>';

      container.appendChild(rowEl);

      var skuSel = rowEl.querySelector('.po-row-sku');
      var qtyInp = rowEl.querySelector('.po-row-qty');
      var hppInp = rowEl.querySelector('.po-row-hpp');
      var remBtn = rowEl.querySelector('.po-row-remove');

      skuSel.addEventListener('change', function () {
        var found = db.inventory.find(function (i) { return i.sku === skuSel.value; });
        if (found) hppInp.value = found.hpp;
        self.recalculatePoTotals();
      });

      qtyInp.addEventListener('input', function () { self.recalculatePoTotals(); });
      hppInp.addEventListener('input', function () { self.recalculatePoTotals(); });

      remBtn.addEventListener('click', function () {
        var all = container.querySelectorAll('.erp-line-item-row');
        if (all.length <= 1) {
          showToast('Minimal harus terdapat 1 baris SKU dalam PO Supplier.');
          return;
        }
        showConfirmAlert({
          type: 'warning',
          title: 'Hapus Baris SKU',
          message: 'Apakah Anda yakin ingin menghapus baris SKU ini dari PO Supplier?',
          confirmText: 'Hapus Baris',
          confirmClass: 'btn-erp-danger',
          onConfirm: function () {
            rowEl.remove();
            self.recalculatePoTotals();
            showToast('Baris SKU telah dihapus.');
          }
        });
      });

      this.recalculatePoTotals();
    },

    recalculatePoTotals: function () {
      var container = document.getElementById('poLineItemsContainer');
      if (!container) return;

      var dpp = 0;
      var rows = container.querySelectorAll('.erp-line-item-row');
      rows.forEach(function (row) {
        var qty = Math.max(1, parseInt(row.querySelector('.po-row-qty').value, 10) || 0);
        var hpp = Math.max(0, parseFloat(row.querySelector('.po-row-hpp').value) || 0);
        var sub = qty * hpp;
        dpp += sub;

        var subEl = row.querySelector('.po-row-subtotal');
        if (subEl) subEl.textContent = formatRupiah(sub);
      });

      var ppn = Math.round(dpp * 0.11);
      var total = dpp + ppn;

      var elDpp = document.getElementById('poCalcDpp');
      var elPpn = document.getElementById('poCalcPpn');
      var elGrand = document.getElementById('poCalcGrandTotal');

      if (elDpp) elDpp.textContent = formatRupiah(dpp);
      if (elPpn) elPpn.textContent = formatRupiah(ppn);
      if (elGrand) elGrand.textContent = formatRupiah(total);
    },

    submitCreatePoForm: function () {
      var db = window.NPP_ERP_DATA;
      var supId = document.getElementById('poSupplierSelect').value;
      var sup = db.suppliers.find(function (s) { return s.id === supId; }) || db.suppliers[0];
      var refOrderId = document.getElementById('poRefOrderSelect').value || 'Restock Safety Stock';
      var etaDate = document.getElementById('poEtaDateInput').value || '2026-11-20';
      var approvalMode = document.getElementById('poInitialStatusSelect').value || 'Diajukan';
      var notes = document.getElementById('poNotesInput').value.trim();

      var container = document.getElementById('poLineItemsContainer');
      var rows = container ? container.querySelectorAll('.erp-line-item-row') : [];
      if (!rows || rows.length === 0) return;

      var items = [];
      var dpp = 0;

      rows.forEach(function (row) {
        var skuCode = row.querySelector('.po-row-sku').value;
        var qty = Math.max(1, parseInt(row.querySelector('.po-row-qty').value, 10) || 1);
        var hpp = Math.max(0, parseFloat(row.querySelector('.po-row-hpp').value) || 0);
        var skuObj = db.inventory.find(function (i) { return i.sku === skuCode; });

        if (skuObj) {
          items.push({
            sku: skuObj.sku,
            name: skuObj.name,
            qty: qty,
            unit: skuObj.unit,
            hpp: hpp
          });
          dpp += qty * hpp;
        }
      });

      var ppn = Math.round(dpp * 0.11);
      var total = dpp + ppn;

      var pad4 = function (n) {
        var s = String(n);
        while (s.length < 4) s = '0' + s;
        return s;
      };
      var newPoId = 'PO-202611-' + pad4(db.procurements.length + 2);

      var newPo = {
        id: newPoId,
        supplierId: sup.id,
        supplierName: sup.name,
        refOrderId: refOrderId,
        orderDate: '2026-11-06',
        etaDate: etaDate,
        statusApproval: approvalMode,
        statusReceiving: 'Menunggu',
        items: items,
        totalHpp: dpp,
        dpp: dpp,
        ppn: ppn,
        total: total,
        notes: notes || ('Pengadaan resmi ke ' + sup.name + ' (' + refOrderId + ').')
      };

      db.procurements.unshift(newPo);
      saveDatabase(db);
      addAuditLog(
        'CREATE_PO_SUPPLIER',
        newPoId,
        'Menerbitkan PO Supplier ' + newPoId + ' ke ' + sup.name + ' senilai ' + formatRupiah(total) + ' (' + approvalMode + ')'
      );

      this.renderProcurementKPIs();
      if (this.shortageTable) this.shortageTable.render();
      if (this.poTable) {
        this.poTable.currentPage = 1;
        this.poTable.render();
      }

      var modal = document.getElementById('createPoSupplierModal');
      if (modal) modal.classList.remove('modal-open');

      // Pindah otomatis ke Tab Daftar PO Supplier agar user langsung melihat PO yang baru dibuat
      var poTabBtn = document.querySelector('[data-proc-tab="po-list"]');
      if (poTabBtn) poTabBtn.click();

      showToast('PO Supplier ' + newPoId + ' (' + sup.name + ') berhasil diterbitkan!');
    },

    bindPoDetailModal: function () {
      var modal = document.getElementById('poSupplierDetailModal');
      var closeBtn = document.getElementById('closePoDetailModal');
      var closeFooterBtn = document.getElementById('closePoDetailFooterBtn');

      var closeModal = function () {
        if (modal) modal.classList.remove('modal-open');
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
      if (modal) {
        modal.addEventListener('click', function (e) {
          if (e.target === modal) closeModal();
        });
      }
    },

    openPoDetailModal: function (poId) {
      var modal = document.getElementById('poSupplierDetailModal');
      if (!modal) {
        window.location.href = 'procurement-detail.html?id=' + encodeURIComponent(poId);
        return;
      }
      var body = document.getElementById('poSupplierDetailBody');
      var title = document.getElementById('poSupplierDetailTitle');
      var approveBtn = document.getElementById('modalApprovePoBtn');
      var rejectBtn = document.getElementById('modalRejectPoBtn');
      if (!modal || !body) return;

      var db = window.NPP_ERP_DATA;
      var po = db.procurements.find(function (p) { return p.id === poId; });
      if (!po) return;

      var roleCfg = RoleManager.getCurrentRoleConfig();
      if (title) title.textContent = 'Detail PO Supplier — ' + po.id;

      var rowsHtml = (po.items || []).map(function (it, idx) {
        var sub = (Number(it.qty) || 0) * (Number(it.hpp) || 0);
        return (
          '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td><span class="cell-code">' + escapeHtml(it.sku) + '</span></td>' +
          '<td><strong>' + escapeHtml(it.name) + '</strong></td>' +
          '<td><strong>' + it.qty + '</strong> ' + escapeHtml(it.unit) + '</td>' +
          '<td class="col-financial">' + formatMoneyRBAC(it.hpp, true) + '</td>' +
          '<td class="col-financial"><strong>' + formatMoneyRBAC(sub, true) + '</strong></td>' +
          '</tr>'
        );
      }).join('');

      body.innerHTML =
        '<div class="erp-form-grid modal-grid-spaced">' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Prinsipal / Vendor Pabrikan</span>' +
        '<div class="modal-card-title-strong">' + escapeHtml(po.supplierName) + '</div>' +
        '<span class="cell-subtext">ID Supplier: ' + escapeHtml(po.supplierId) + ' • Ref SO: ' + escapeHtml(po.refOrderId || '-') + '</span>' +
        '</div>' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Jadwal Pengadaan & Status Dokumen</span>' +
        '<div class="modal-card-title-strong">Estimasi Tiba: ' + escapeHtml(po.etaDate) + '</div>' +
        '<span class="cell-subtext">Tanggal Terbit PO: ' + escapeHtml(po.orderDate) + '</span>' +
        '<div class="erp-Filter-group">' + renderStatusBadge(po.statusApproval) + renderStatusBadge(po.statusReceiving) + '</div>' +
        '</div>' +
        '</div>' +
        '<div class="erp-table-wrap modal-table-spaced">' +
        '<table class="erp-table">' +
        '<thead><tr><th>No</th><th>Kode SKU</th><th>Spesifikasi Unit Industri</th><th>Qty Pembelian</th><th class="col-financial">HPP Satuan</th><th class="col-financial">Subtotal HPP</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="erp-form-grid">' +
        '<div class="erp-kpi-card">' +
        '<span class="erp-kpi-label">Catatan Pengadaan & Alokasi Gudang</span>' +
        '<p class="modal-notes-text">' + escapeHtml(po.notes || '-') + '</p>' +
        '</div>' +
        '<div class="erp-kpi-card col-financial">' +
        '<span class="erp-kpi-label">Ringkasan Nilai Pembelian Prinsipal (PPN 11%)</span>' +
        '<div class="modal-summary-row"><span>DPP Pembelian:</span><strong>' + formatMoneyRBAC(po.dpp || po.totalHpp, true) + '</strong></div>' +
        '<div class="modal-summary-row"><span>PPN 11%:</span><strong>' + formatMoneyRBAC(po.ppn || 0, true) + '</strong></div>' +
        '<div class="modal-summary-total"><span>Total PO Supplier:</span><strong>' + formatMoneyRBAC(po.total || po.totalHpp, true) + '</strong></div>' +
        '</div>' +
        '</div>';

      var self = this;
      var canDecide = roleCfg.canApprove && (po.statusApproval === 'Diajukan' || po.statusApproval === 'Draft');

      if (approveBtn) {
        approveBtn.classList.toggle('erp-hidden', !canDecide);
        approveBtn.onclick = function () {
          self.handlePoApproval(po.id, 'Disetujui');
          modal.classList.remove('modal-open');
        };
      }
      if (rejectBtn) {
        rejectBtn.classList.toggle('erp-hidden', !canDecide);
        rejectBtn.onclick = function () {
          self.handlePoApproval(po.id, 'Ditolak');
          modal.classList.remove('modal-open');
        };
      }

      modal.classList.add('modal-open');
    }
  };

  /* ==========================================================================
     13. DELIVERY CONTROLLER (KHUSUS HALAMAN internal/delivery.html — TUGAS 4.1)
     ========================================================================== */
  var DeliveryController = {
    table: null,

    init: function () {
      if (!document.getElementById('erpDeliveryPage')) return;

      var self = this;
      ensureDataSchema(window.NPP_ERP_DATA);
      this.renderDeliveryKPIs();
      this.syncDeliveryRBAC();
      this.initDeliveryTable();
      this.bindCreateDeliveryModal();
      this.bindUploadBastModal();

      RoleManager.onChange(function () {
        self.renderDeliveryKPIs();
        self.syncDeliveryRBAC();
        if (self.table) self.table.render();
      });
    },

    renderDeliveryKPIs: function () {
      var db = window.NPP_ERP_DATA;
      var totalSj = db.deliveries.length;
      var inTransit = db.deliveries.filter(function (d) { return d.status === 'Sedang Dikirim'; }).length;
      var completedBast = db.deliveries.filter(function (d) { return d.status === 'Terkirim & BAST'; }).length;
      var totalUnits = db.deliveries.reduce(function (acc, d) {
        var q = (d.items || []).reduce(function (s, it) { return s + (Number(it.qty) || 0); }, 0);
        return acc + q;
      }, 0);

      var elTotal = document.getElementById('kpiTotalDeliveries');
      if (elTotal) elTotal.textContent = totalSj + ' Dokumen';

      var elTransit = document.getElementById('kpiInTransitDeliveries');
      if (elTransit) elTransit.textContent = inTransit + ' Pengiriman';

      var elBast = document.getElementById('kpiCompletedBast');
      if (elBast) elBast.textContent = completedBast + ' Selesai';

      var elUnits = document.getElementById('kpiTotalDeliveredUnits');
      if (elUnits) elUnits.textContent = totalUnits.toLocaleString('id-ID') + ' Unit';
    },

    syncDeliveryRBAC: function () {
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var createBtn = document.getElementById('btnOpenCreateDelivery');
      var rbacNotice = document.getElementById('deliveryRbacNotice');

      var canCreate = roleCfg.code === 'Operasional' || roleCfg.code === 'Super Admin' || roleCfg.code === 'Gudang' || roleCfg.code === 'Administrator';
      if (createBtn) {
        createBtn.disabled = !canCreate;
        createBtn.title = canCreate
          ? 'Terbitkan Surat Jalan Pengiriman Baru'
          : 'Hanya dapat dilakukan oleh divisi Operasional atau Super Admin';
        if (!canCreate) {
          createBtn.classList.add('btn-disabled');
        } else {
          createBtn.classList.remove('btn-disabled');
        }
      }

      if (rbacNotice) {
        if (!canCreate) {
          rbacNotice.classList.remove('erp-hidden');
          rbacNotice.innerHTML =
            '<div class="erp-notice-box">' +
            '<strong>Mode Peninjauan (RBAC):</strong> Akun aktif (' + escapeHtml(roleCfg.display) +
            ') hanya berhak memantau status pengiriman & mencetak dokumen BAST. Penerbitan Surat Jalan baru dan pengurangan stok fisik dibatasi untuk Operasional & Super Admin.' +
            '</div>';
        } else {
          rbacNotice.classList.add('erp-hidden');
        }
      }
    },

    initDeliveryTable: function () {
      var self = this;
      this.table = new TableEngine({
        getData: function () {
          return window.NPP_ERP_DATA.deliveries || [];
        },
        tbodyId: 'deliveryTableBody',
        paginationId: 'deliveryPagination',
        searchInputId: 'deliverySearchInput',
        pageSizeSelectId: 'deliveryPageSizeSelect',
        colSpan: 7,
        emptyMessage: 'Tidak ada data pengiriman yang sesuai.',
        filters: [
          {
            selectId: 'deliveryFilterStatus',
            match: function (item, val) {
              return !val || item.status === val;
            }
          }
        ],
        searchFn: function (d, q) {
          var text = [
            d.id,
            d.orderId,
            d.clientPoNumber,
            d.customerName,
            d.driverName,
            d.vehiclePlate,
            d.address,
            (d.items || []).map(function (it) { return it.sku + ' ' + it.name; }).join(' ')
          ].join(' ').toLowerCase();
          return text.indexOf(q.toLowerCase()) !== -1;
        },
        renderRow: function (d) {
          var totalItemsQty = (d.items || []).reduce(function (s, it) { return s + (Number(it.qty) || 0); }, 0);
          var itemsSummary = (d.items || []).map(function (it) {
            return escapeHtml(it.name) + ' (' + it.qty + ' ' + (it.unit || 'Unit') + ')';
          }).join('<br>');

          var bastAction = '';
          if (d.status === 'Sedang Dikirim') {
            bastAction =
              '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" onclick="NPP_ERP.DeliveryController.openUploadBastModal(\'' + d.id + '\')">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
              '<span>Upload BAST</span>' +
              '</button>';
          } else {
            bastAction =
              '<span class="badge-status badge-success" title="File BAST: ' + escapeHtml(d.bastFileName || 'BAST Tersimpan') + '">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ' +
              escapeHtml(d.bastFileName || 'BAST Terverifikasi') +
              '</span>';
          }

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(d.id) + '</span></td>' +
            '<td>' + escapeHtml(d.deliveryDate) + '</td>' +
            '<td><span class="cell-client">' + escapeHtml(d.customerName) + '</span></td>' +
            '<td>' + escapeHtml(d.driverName || d.driver || '-') + ' (' + escapeHtml(d.vehiclePlate || '-') + ')</td>' +
            '<td>Total: ' + totalItemsQty + ' Unit</td>' +
            '<td>' + renderStatusBadge(d.status) + '</td>' +
            '<td>' +
            '<div class="erp-action-btns">' +
            '<button type="button" class="btn-erp btn-erp-primary btn-erp-sm" onclick="NPP_ERP.DeliveryController.openDeliveryPrintPreview(\'' + d.id + '\')">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>' +
            '<span>Cetak / Preview SJ</span>' +
            '</button>' +
            bastAction +
            '</div>' +
            '</td>' +
            '</tr>'
          );
        }
      });
      this.table.render();
    },

    bindCreateDeliveryModal: function () {
      var self = this;
      var openBtn = document.getElementById('btnOpenCreateDelivery');
      var modal = document.getElementById('createDeliveryModal');
      var closeBtns = modal ? modal.querySelectorAll('[data-modal-close]') : [];
      var orderSelect = document.getElementById('deliveryOrderSelect');
      var itemsContainer = document.getElementById('deliveryItemsContainer');
      var customerInfoBox = document.getElementById('deliveryCustomerInfoBox');
      var form = document.getElementById('createDeliveryForm');

      if (openBtn && modal) {
        openBtn.addEventListener('click', function () {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          if (roleCfg.code !== 'Operasional' && roleCfg.code !== 'Super Admin' && roleCfg.code !== 'Gudang' && roleCfg.code !== 'Administrator') {
            showToast('Penerbitan Surat Jalan hanya diizinkan untuk Operasional & Super Admin.');
            return;
          }
          self.populateOrderDropdown();
          modal.classList.add('modal-open');
        });
      }

      closeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (modal) modal.classList.remove('modal-open');
        });
      });

      if (orderSelect) {
        orderSelect.addEventListener('change', function () {
          var orderId = orderSelect.value;
          var db = window.NPP_ERP_DATA;
          var order = (db.orders || []).find(function (o) { return o.id === orderId; });

          if (!order) {
            if (customerInfoBox) customerInfoBox.innerHTML = '<span class="cell-subtext">Pilih No. PO Pelanggan di atas untuk memuat data pengiriman.</span>';
            if (itemsContainer) itemsContainer.innerHTML = '';
            return;
          }

          var cust = (db.customers || []).find(function (c) { return c.id === order.customerId; }) || {};
          var destAddress = cust.address || order.address || 'Kawasan Industri';
          var destPic = cust.pic || 'PIC Penerima';

          if (customerInfoBox) {
            customerInfoBox.innerHTML =
              '<div class="erp-doc-meta-grid" style="grid-template-columns: 1fr; gap: 8px;">' +
              '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Pelanggan:</span><strong class="erp-doc-meta-val">' + escapeHtml(order.customerName) + '</strong></div>' +
              '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">No. PO Pelanggan:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(order.clientPoNumber) + '</span></div>' +
              '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">PIC Penerima:</span><span class="erp-doc-meta-val">' + escapeHtml(destPic) + ' (' + escapeHtml(cust.phone || '-') + ')</span></div>' +
              '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Alamat Kirim:</span><span class="erp-doc-meta-val">' + escapeHtml(destAddress) + '</span></div>' +
              '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Status PO:</span><span class="erp-doc-meta-val">' + renderStatusBadge(order.statusApproval) + ' ' + renderStatusBadge(order.statusPengiriman) + '</span></div>' +
              '</div>';
          }

          // Pre-populate address field if exists
          var addressInput = document.getElementById('deliveryDestAddress');
          if (addressInput) addressInput.value = destAddress;

          var picInput = document.getElementById('deliveryRecipientPic');
          if (picInput) picInput.value = destPic;

          // Render checklist of items available in this order
          if (itemsContainer) {
            var itemsHtml = (order.items || []).map(function (it, idx) {
              var skuObj = (db.inventory || []).find(function (i) { return i.sku === it.sku; }) || {};
              var curPhysical = skuObj.fisik || 0;
              var curReserved = skuObj.reservasi || 0;
              var maxShip = Math.min(Number(it.qty) || 0, curReserved > 0 ? curReserved : curPhysical);

              return (
                '<div class="erp-delivery-item-row">' +
                '<input type="checkbox" class="delivery-item-check" data-index="' + idx + '" checked id="deliv_check_' + idx + '">' +
                '<div>' +
                '<label for="deliv_check_' + idx + '" style="font-weight:700; cursor:pointer;">' + escapeHtml(it.name) + '</label>' +
                '<div class="cell-subtext">SKU: <span class="cell-code">' + escapeHtml(it.sku) + '</span> • Pesanan SO: ' + it.qty + ' ' + escapeHtml(it.unit || 'Unit') + '</div>' +
                '</div>' +
                '<div>' +
                '<span class="cell-subtext">Fisik: <strong>' + curPhysical + '</strong></span><br>' +
                '<span class="cell-subtext" style="color:var(--erp-gold);">Reservasi: <strong>' + curReserved + '</strong></span>' +
                '</div>' +
                '<div>' +
                '<label class="erp-label" style="font-size:0.75rem; margin-bottom:2px;">Qty Kirim</label>' +
                '<input type="number" class="erp-input delivery-item-qty" data-index="' + idx + '" min="1" max="' + Math.max(1, maxShip) + '" value="' + Math.max(1, maxShip) + '" style="padding:6px 10px; font-weight:700;">' +
                '</div>' +
                '<div class="cell-subtext">' +
                'Rak: ' + escapeHtml(skuObj.rack || 'Gudang') +
                '</div>' +
                '</div>'
              );
            }).join('');

            itemsContainer.innerHTML = itemsHtml || '<p class="cell-subtext">Tidak ada item dalam pesanan ini.</p>';
          }
        });
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          self.handleCreateDeliverySubmit();
        });
      }
    },

    populateOrderDropdown: function () {
      var db = window.NPP_ERP_DATA;
      var select = document.getElementById('deliveryOrderSelect');
      if (!select) return;

      // Filter: Hanya PO yang Disetujui dan pengiriman belum penuh
      var validOrders = (db.orders || []).filter(function (o) {
        return o.statusApproval === 'Disetujui' && o.statusPengiriman !== 'Terkirim Penuh';
      });

      select.innerHTML = '<option value="">-- Pilih PO Pelanggan Terverifikasi --</option>' +
        validOrders.map(function (o) {
          return '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.id) + ' — ' + escapeHtml(o.customerName) + ' (' + escapeHtml(o.clientPoNumber) + ')</option>';
        }).join('');

      // Auto trigger change if first available
      if (validOrders.length > 0) {
        select.value = validOrders[0].id;
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        select.dispatchEvent(evt);
      }
    },

    handleCreateDeliverySubmit: function () {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var orderSelect = document.getElementById('deliveryOrderSelect');
      var dateInput = document.getElementById('deliveryDateInput');
      var driverInput = document.getElementById('deliveryDriverInput');
      var plateInput = document.getElementById('deliveryPlateInput');
      var addressInput = document.getElementById('deliveryDestAddress');
      var picInput = document.getElementById('deliveryRecipientPic');
      var typeSelect = document.getElementById('deliveryTypeSelect');
      var notesInput = document.getElementById('deliveryNotesInput');

      var orderId = orderSelect ? orderSelect.value : '';
      var order = (db.orders || []).find(function (o) { return o.id === orderId; });

      if (!order) {
        showToast('Pilih PO Pelanggan yang valid terlebih dahulu.');
        return;
      }

      var driver = (driverInput ? driverInput.value : '').trim() || 'Pak Slamet Riyadi';
      var plate = (plateInput ? plateInput.value : '').trim() || 'B 9482 KXT (Blindvan Box NPP-02)';
      var date = (dateInput ? dateInput.value : '').trim() || new Date().toISOString().split('T')[0];
      var address = (addressInput ? addressInput.value : '').trim() || 'Kawasan Industri';
      var pic = (picInput ? picInput.value : '').trim() || order.customerName;
      var delivType = (typeSelect ? typeSelect.value : 'Pengiriman Penuh');

      // Ambil seluruh baris item yang dicentang
      var rows = document.querySelectorAll('.erp-delivery-item-row');
      var shippedItems = [];
      var validationError = null;

      rows.forEach(function (row) {
        var check = row.querySelector('.delivery-item-check');
        var qtyInput = row.querySelector('.delivery-item-qty');
        if (check && check.checked && qtyInput) {
          var idx = parseInt(check.dataset.index, 10);
          var originalItem = order.items[idx];
          var qtyToShip = parseInt(qtyInput.value, 10) || 0;

          if (qtyToShip <= 0) {
            validationError = 'Kuantitas kirim untuk item ' + originalItem.name + ' harus lebih besar dari 0.';
            return;
          }

          var skuObj = (db.inventory || []).find(function (i) { return i.sku === originalItem.sku; });
          if (!skuObj) {
            validationError = 'SKU ' + originalItem.sku + ' tidak ditemukan di gudang.';
            return;
          }

          if (skuObj.fisik < qtyToShip) {
            validationError = 'Stok Fisik SKU ' + skuObj.sku + ' tidak mencukupi (Fisik: ' + skuObj.fisik + ', Diminta: ' + qtyToShip + ').';
            return;
          }

          shippedItems.push({
            sku: originalItem.sku,
            name: originalItem.name,
            qty: qtyToShip,
            unit: originalItem.unit || 'Unit',
            serialRange: 'SN-' + skuObj.brand + '-' + date.replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
            skuObj: skuObj
          });
        }
      });

      if (validationError) {
        showToast('Validasi Gagal: ' + validationError);
        return;
      }

      if (shippedItems.length === 0) {
        showToast('Pilih minimal satu item barang untuk diterbitkan Surat Jalan.');
        return;
      }

      // Generate ID Surat Jalan: SJ-YYYYMM-XXXX
      var d = new Date();
      var yyyymm = d.getFullYear() + '' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1));
      var count = db.deliveries.length + 1;
      var newSjId = 'SJ-' + yyyymm + '-' + (count < 10 ? '000' + count : (count < 100 ? '00' + count : '0' + count));

      // 1. PENGURANGAN STOK FISIK & RESERVASI ATOMIK
      shippedItems.forEach(function (shipped) {
        var sku = shipped.skuObj;
        var q = shipped.qty;

        sku.fisik = Math.max(0, (sku.fisik || 0) - q);
        sku.reservasi = Math.max(0, (sku.reservasi || 0) - q);
        sku.layak = Math.max(0, (sku.fisik || 0) - (sku.tertahan || 0));
        sku.tersedia = Math.max(0, (sku.layak || 0) - (sku.reservasi || 0));

        // Catat ke Buku Besar Mutasi (Stock Ledger)
        var mutCount = db.stockLedger.length + 1;
        var mutId = 'MUT-' + (mutCount < 10 ? '00' + mutCount : (mutCount < 100 ? '0' + mutCount : '' + mutCount));
        db.stockLedger.unshift({
          id: mutId,
          date: date + ' ' + (d.getHours() < 10 ? '0' + d.getHours() : d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()),
          sku: sku.sku,
          skuName: sku.name,
          type: 'KELUAR',
          qty: -q,
          refDoc: newSjId,
          pic: roleCfg.userName,
          finalPhysical: sku.fisik,
          note: 'Pengiriman via ' + newSjId + ' ke ' + order.customerName
        });
      });

      // 2. Tentukan status pengiriman SO
      // Hitung total unit yang dipesan vs total yang sudah dikirim
      var totalOrderedQty = (order.items || []).reduce(function (s, it) { return s + (Number(it.qty) || 0); }, 0);
      var totalShippedNow = shippedItems.reduce(function (s, it) { return s + it.qty; }, 0);

      var previousShippedQty = (db.deliveries || []).filter(function (deliv) {
        return deliv.orderId === order.id;
      }).reduce(function (acc, deliv) {
        return acc + (deliv.items || []).reduce(function (s, it) { return s + (Number(it.qty) || 0); }, 0);
      }, 0);

      var cumulativeShipped = previousShippedQty + totalShippedNow;
      if (cumulativeShipped >= totalOrderedQty) {
        order.statusPengiriman = 'Sedang Dikirim';
        order.statusPemenuhan = 'Terpenuhi Penuh';
      } else {
        order.statusPengiriman = 'Terkirim Sebagian';
        order.statusPemenuhan = 'Diproses';
      }

      // 3. Masukkan ke db.deliveries
      var deliveryObj = {
        id: newSjId,
        orderId: order.id,
        clientPoNumber: order.clientPoNumber,
        customerName: order.customerName,
        deliveryDate: date,
        driverName: driver,
        vehiclePlate: plate,
        deliveryType: delivType,
        status: 'Sedang Dikirim',
        bastFileName: null,
        address: address,
        recipientPic: pic,
        items: shippedItems.map(function (it) {
          return {
            sku: it.sku,
            name: it.name,
            qty: it.qty,
            unit: it.unit,
            serialRange: it.serialRange
          };
        }),
        notes: (notesInput ? notesInput.value : '').trim() || '-'
      };
      db.deliveries.unshift(deliveryObj);

      // 4. Masukkan ke Arsip Dokumen Digital
      var arcCount = db.archives.length + 1;
      db.archives.unshift({
        id: 'ARC-' + d.getFullYear() + '-' + (arcCount < 10 ? '00' + arcCount : (arcCount < 100 ? '0' + arcCount : '' + arcCount)),
        docType: 'Surat Jalan & BAST',
        docNumber: newSjId,
        refId: order.id,
        partner: order.customerName,
        date: date,
        fileName: 'SuratJalan-' + newSjId + '.pdf',
        uploadedBy: roleCfg.userName
      });

      // 5. Catat Audit Log
      addAuditLog(
        'TERBIT_SURAT_JALAN',
        newSjId,
        'Menerbitkan Surat Jalan ' + newSjId + ' (' + delivType + ') ke ' + order.customerName +
        ' via ' + driver + ' (' + plate + ') • Total ' + totalShippedNow + ' Unit dikurangi atomik dari gudang'
      );

      saveDatabase(db);
      RoleManager.updateSidebarCounters();
      this.renderDeliveryKPIs();
      if (this.table) this.table.render();

      var modal = document.getElementById('createDeliveryModal');
      if (modal) modal.classList.remove('modal-open');

      showToast('Surat Jalan ' + newSjId + ' berhasil diterbitkan! Stok fisik & reservasi otomatis dipotong atomik.');
    },

    bindUploadBastModal: function () {
      var self = this;
      var modal = document.getElementById('uploadBastModal');
      var closeBtns = modal ? modal.querySelectorAll('[data-modal-close]') : [];
      var form = document.getElementById('uploadBastForm');

      closeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (modal) modal.classList.remove('modal-open');
        });
      });

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var deliveryId = document.getElementById('bastDeliveryIdHidden').value;
          var signer = (document.getElementById('bastSignerInput').value || '').trim();
          var bastDate = (document.getElementById('bastDateInput').value || '').trim() || new Date().toISOString().split('T')[0];
          var fileInput = document.getElementById('bastFileInput');
          var fileName = fileInput && fileInput.files && fileInput.files[0]
            ? fileInput.files[0].name
            : ('BAST-' + deliveryId + '-Signed.pdf');

          self.handleUploadBastSubmit(deliveryId, signer, bastDate, fileName);
        });
      }
    },

    openUploadBastModal: function (deliveryId) {
      var modal = document.getElementById('uploadBastModal');
      if (!modal) {
        window.location.href = 'delivery-bast.html?id=' + encodeURIComponent(deliveryId);
        return;
      }
      var db = window.NPP_ERP_DATA;
      var delivery = (db.deliveries || []).find(function (d) { return d.id === deliveryId; });
      if (!delivery) return;
      var title = document.getElementById('uploadBastModalTitle');
      var hiddenId = document.getElementById('bastDeliveryIdHidden');
      var signerInput = document.getElementById('bastSignerInput');
      var dateInput = document.getElementById('bastDateInput');

      if (title) title.textContent = 'Upload BAST / Bukti Terima — ' + delivery.id;
      if (hiddenId) hiddenId.value = delivery.id;
      if (signerInput) signerInput.value = delivery.recipientPic || delivery.customerName;
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

      if (modal) modal.classList.add('modal-open');
    },

    handleUploadBastSubmit: function (deliveryId, signer, bastDate, fileName) {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var delivery = (db.deliveries || []).find(function (d) { return d.id === deliveryId; });
      if (!delivery) return;

      delivery.status = 'Terkirim & BAST';
      delivery.bastFileName = fileName;
      delivery.recipientPic = signer || delivery.recipientPic;

      // Update SO status if all deliveries are BAST
      var order = (db.orders || []).find(function (o) { return o.id === delivery.orderId; });
      if (order) {
        var allDeliveriesForOrder = db.deliveries.filter(function (d) { return d.orderId === order.id; });
        var allBast = allDeliveriesForOrder.every(function (d) { return d.status === 'Terkirim & BAST'; });
        if (allBast && order.statusPemenuhan === 'Terpenuhi Penuh') {
          order.statusPengiriman = 'Terkirim Penuh';
        }

        // Cek apakah order sudah bisa diselesaikan penuh (BAST selesai + Pembayaran Lunas)
        if (order.statusPengiriman === 'Terkirim Penuh' && order.statusPenagihan === 'Lunas') {
          order.statusOrder = 'Selesai';
        }
      }

      // Catat ke Arsip
      var arcCount = db.archives.length + 1;
      db.archives.unshift({
        id: 'ARC-' + new Date().getFullYear() + '-' + (arcCount < 10 ? '00' + arcCount : (arcCount < 100 ? '0' + arcCount : '' + arcCount)),
        docType: 'Surat Jalan & BAST',
        docNumber: delivery.id,
        refId: delivery.orderId,
        partner: delivery.customerName,
        date: bastDate,
        fileName: fileName,
        uploadedBy: roleCfg.userName
      });

      addAuditLog(
        'UPLOAD_BAST',
        delivery.id,
        'Mengunggah berkas BAST fisik (' + fileName + ') ditandatangani oleh ' + signer + ' untuk ' + delivery.customerName
      );

      saveDatabase(db);
      RoleManager.updateSidebarCounters();
      this.renderDeliveryKPIs();
      if (this.table) this.table.render();

      var modal = document.getElementById('uploadBastModal');
      if (modal) modal.classList.remove('modal-open');

      showToast('BAST untuk ' + delivery.id + ' berhasil diverifikasi dan disimpan ke arsip digital!');
    },

    openDeliveryPrintPreview: function (deliveryId) {
      var modal = document.getElementById('modalPreviewSuratJalan');
      if (!modal) {
        window.location.href = 'delivery-print.html?id=' + encodeURIComponent(deliveryId);
        return;
      }
      var db = window.NPP_ERP_DATA;
      var delivery = (db.deliveries || []).find(function (d) { return d.id === deliveryId; });
      if (!delivery) return;

      var container = document.getElementById('previewSuratJalanBody');
      if (!modal || !container) return;

      var order = (db.orders || []).find(function (o) { return o.id === delivery.orderId; }) || {};
      var customer = (db.customers || []).find(function (c) { return c.id === order.customerId; }) || {};

      var itemsRows = (delivery.items || []).map(function (it, idx) {
        return (
          '<tr>' +
          '<td style="text-align:center;">' + (idx + 1) + '</td>' +
          '<td><strong>' + escapeHtml(it.sku) + '</strong></td>' +
          '<td><strong>' + escapeHtml(it.name) + '</strong></td>' +
          '<td style="text-align:center; font-family:monospace; font-size:0.75rem;">' + escapeHtml(it.serialRange || '-') + '</td>' +
          '<td style="text-align:center; font-weight:800; font-size:0.95rem;">' + it.qty + '</td>' +
          '<td style="text-align:center;">' + escapeHtml(it.unit || 'Unit') + '</td>' +
          '</tr>'
        );
      }).join('');

      container.innerHTML =
        '<div class="erp-official-doc">' +
        '  <div class="erp-doc-header">' +
        '    <div class="erp-doc-brand">' +
        '      <img src="assets/img/logo.png" alt="PT NPP Logo" class="erp-doc-logo" onerror="this.style.display=\'none\'">' +
        '      <div>' +
        '        <div class="erp-doc-company-name">PT NUSANTARA PUNCAK PERKASA</div>' +
        '        <div class="erp-doc-company-info">Spesialis Sistem Tenaga Industri B2B (Battery, UPS, Stabilizer, Inverter, Solar Panel)</div>' +
        '        <div class="erp-doc-company-info">' + escapeHtml(db.meta.address) + ' • NPWP: ' + escapeHtml(db.meta.npwp) + ' • Telp: (021) 8834-9021</div>' +
        '      </div>' +
        '    </div>' +
        '    <div class="erp-doc-title-block">' +
        '      <div class="erp-doc-title">SURAT JALAN &amp; BAST</div>' +
        '      <div class="erp-doc-number">' + escapeHtml(delivery.id) + '</div>' +
        '      <div class="cell-subtext">Tanggal: ' + escapeHtml(delivery.deliveryDate) + '</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-meta-grid">' +
        '    <div class="erp-doc-meta-col">' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Nama Pelanggan:</span><strong class="erp-doc-meta-val">' + escapeHtml(delivery.customerName) + '</strong></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Alamat Kirim:</span><span class="erp-doc-meta-val">' + escapeHtml(delivery.address || customer.address || 'Kawasan Industri') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">PIC Penerima:</span><span class="erp-doc-meta-val">' + escapeHtml(delivery.recipientPic || customer.pic || '-') + '</span></div>' +
        '    </div>' +
        '    <div class="erp-doc-meta-col">' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">No. PO Pelanggan:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(delivery.clientPoNumber) + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">No. Referensi SO:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(delivery.orderId) + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Kurir / Sopir:</span><span class="erp-doc-meta-val">' + escapeHtml(delivery.driverName) + ' (' + escapeHtml(delivery.vehiclePlate) + ')</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Tipe Pengiriman:</span><span class="erp-doc-meta-val">' + escapeHtml(delivery.deliveryType || 'Standar') + '</span></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-table-wrap">' +
        '    <table class="erp-doc-table">' +
        '      <thead>' +
        '        <tr>' +
        '          <th style="width:40px; text-align:center;">No</th>' +
        '          <th style="width:130px;">Kode SKU</th>' +
        '          <th>Deskripsi Barang &amp; Spesifikasi Teknis</th>' +
        '          <th style="width:150px; text-align:center;">Nomor Seri Unit (S/N)</th>' +
        '          <th style="width:70px; text-align:center;">Qty</th>' +
        '          <th style="width:60px; text-align:center;">Satuan</th>' +
        '        </tr>' +
        '      </thead>' +
        '      <tbody>' + itemsRows + '</tbody>' +
        '    </table>' +
        '  </div>' +
        '  <div class="erp-doc-notice-box">' +
        '    <strong>Ketentuan Serah Terima:</strong> Dilarang menampilkan harga/nilai komersial pada lembar Surat Jalan fisik ini. Seluruh barang di atas diserahkan dalam kondisi baru, tersegel, dan lolos uji Quality Control. Harap periksa fisik kemasan sebelum menandatangani Berita Acara Serah Terima (BAST).' +
        '  </div>' +
        '  <div class="erp-doc-signatures-4">' +
        '    <div class="erp-signature-box">' +
        '      <div class="erp-signature-role">Diserahkan Oleh (Gudang)</div>' +
        '      <div class="erp-signature-space">' +
        '        <div class="erp-doc-digital-stamp">PT NPP<br>LOGISTIK<br>VERIFIED</div>' +
        '      </div>' +
        '      <div class="erp-signature-signer">Budi Santoso<br><span class="cell-subtext-sm">Kepala Gudang NPP</span></div>' +
        '    </div>' +
        '    <div class="erp-signature-box">' +
        '      <div class="erp-signature-role">Mengetahui (Operasional)</div>' +
        '      <div class="erp-signature-space"></div>' +
        '      <div class="erp-signature-signer">Nadia Pramesti<br><span class="cell-subtext-sm">Sales &amp; Operasional</span></div>' +
        '    </div>' +
        '    <div class="erp-signature-box">' +
        '      <div class="erp-signature-role">Pembawa Barang (Ekspedisi)</div>' +
        '      <div class="erp-signature-space"></div>' +
        '      <div class="erp-signature-signer">' + escapeHtml(delivery.driverName) + '<br><span class="cell-subtext-sm">' + escapeHtml(delivery.vehiclePlate) + '</span></div>' +
        '    </div>' +
        '    <div class="erp-signature-box">' +
        '      <div class="erp-signature-role">Diterima Oleh (Pelanggan)</div>' +
        '      <div class="erp-signature-space"></div>' +
        '      <div class="erp-signature-signer">' + escapeHtml(delivery.recipientPic || customer.pic || '(Nama Jelas & Cap)') + '<br><span class="cell-subtext-sm">Tgl: ........................</span></div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      modal.classList.add('modal-open');
    }
  };

  /* ==========================================================================
     14. BILLING CONTROLLER (KHUSUS HALAMAN internal/billing.html — TUGAS 4.2)
     ========================================================================== */
  var BillingController = {
    table: null,

    init: function () {
      if (!document.getElementById('erpBillingPage')) return;

      var self = this;
      ensureDataSchema(window.NPP_ERP_DATA);
      this.checkBillingRBAC();
      this.renderBillingKPIs();
      this.initBillingTable();
      this.bindCreateInvoiceModal();
      this.bindPaymentModal();

      RoleManager.onChange(function () {
        self.checkBillingRBAC();
        self.renderBillingKPIs();
        if (self.table) self.table.render();
      });
    },

    checkBillingRBAC: function () {
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var mainContent = document.getElementById('billingMainContent');
      var lockCard = document.getElementById('billingRbacLockCard');
      var createBtn = document.getElementById('btnOpenCreateInvoice');

      var isRestricted = !roleCfg.canAccessBilling;

      if (mainContent) mainContent.classList.toggle('erp-hidden', isRestricted);
      if (lockCard) lockCard.classList.toggle('erp-hidden', !isRestricted);

      // Hak membuat invoice: Finance & Super Admin
      var canCreate = roleCfg.code === 'Finance' || roleCfg.code === 'Super Admin' || roleCfg.code === 'Administrator';
      if (createBtn) {
        createBtn.disabled = !canCreate;
        createBtn.title = canCreate
          ? 'Terbitkan Invoice Resmi Baru'
          : 'Hanya dapat dilakukan oleh divisi Finance atau Super Admin';
        if (!canCreate) {
          createBtn.classList.add('btn-disabled');
        } else {
          createBtn.classList.remove('btn-disabled');
        }
      }
    },

    renderBillingKPIs: function () {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();
      if (!roleCfg.canViewPrice) return;

      var totalInvoiced = db.invoices.reduce(function (acc, inv) { return acc + (inv.total || 0); }, 0);
      var unpaidInvoiced = db.invoices.filter(function (i) { return i.status === 'Belum Lunas'; })
        .reduce(function (acc, inv) { return acc + (inv.total || 0); }, 0);
      var overdueInvoiced = db.invoices.filter(function (i) { return i.status === 'Jatuh Tempo'; })
        .reduce(function (acc, inv) { return acc + (inv.total || 0); }, 0);
      var paidInvoiced = db.invoices.reduce(function (acc, inv) { return acc + (inv.paidAmount || (inv.status === 'Lunas' ? inv.total : 0)); }, 0);

      var elTotal = document.getElementById('kpiTotalBilling');
      if (elTotal) elTotal.innerHTML = formatMoneyRBAC(totalInvoiced);

      var elUnpaid = document.getElementById('kpiPendingBilling');
      if (elUnpaid) elUnpaid.innerHTML = formatMoneyRBAC(unpaidInvoiced);

      var elOverdue = document.getElementById('kpiOverdueBilling');
      if (elOverdue) elOverdue.innerHTML = formatMoneyRBAC(overdueInvoiced);

      var elPaid = document.getElementById('kpiPaidBilling');
      if (elPaid) elPaid.innerHTML = formatMoneyRBAC(paidInvoiced);
    },

    initBillingTable: function () {
      var self = this;
      this.table = new TableEngine({
        getData: function () {
          return window.NPP_ERP_DATA.invoices || [];
        },
        tbodyId: 'billingTableBody',
        paginationId: 'billingPagination',
        searchInputId: 'billingSearchInput',
        pageSizeSelectId: 'billingPageSizeSelect',
        colSpan: 7,
        emptyMessage: 'Tidak ada data invoice penagihan yang sesuai.',
        filters: [
          {
            selectId: 'billingFilterStatus',
            match: function (item, val) {
              return !val || item.status === val;
            }
          }
        ],
        searchFn: function (inv, q) {
          var text = [
            inv.id,
            inv.orderId,
            inv.clientPoNumber,
            inv.customerName,
            inv.billingType,
            inv.bankRef,
            inv.status
          ].join(' ').toLowerCase();
          return text.indexOf(q.toLowerCase()) !== -1;
        },
        renderRow: function (inv) {
          var paymentAction = '';
          if (inv.status !== 'Lunas') {
            paymentAction =
              '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" onclick="NPP_ERP.BillingController.openPaymentModal(\'' + inv.id + '\')">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' +
              '<span>Catat Bayar</span>' +
              '</button>';
          } else {
            paymentAction =
              '<span class="badge-status badge-success">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Lunas 100%' +
              '</span>';
          }

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(inv.id) + '</span></td>' +
            '<td>' + escapeHtml(inv.invoiceDate) + '</td>' +
            '<td><span class="cell-client">' + escapeHtml(inv.customerName) + '</span></td>' +
            '<td class="col-financial"><strong>' + formatMoneyRBAC(inv.total) + '</strong></td>' +
            '<td>' + escapeHtml(inv.bankRef || inv.bankAccount || 'BCA 521-098-7741') + '</td>' +
            '<td>' + renderStatusBadge(inv.status) + '</td>' +
            '<td>' +
            '<div class="erp-action-btns">' +
            '<button type="button" class="btn-erp btn-erp-primary btn-erp-sm" onclick="NPP_ERP.BillingController.openInvoicePrintPreview(\'' + inv.id + '\')">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>' +
            '<span>Cetak / Preview</span>' +
            '</button>' +
            paymentAction +
            '</div>' +
            '</td>' +
            '</tr>'
          );
        }
      });
      this.table.render();
    },

    bindCreateInvoiceModal: function () {
      var self = this;
      var openBtn = document.getElementById('btnOpenCreateInvoice');
      var modal = document.getElementById('createInvoiceModal');
      var closeBtns = modal ? modal.querySelectorAll('[data-modal-close]') : [];
      var orderSelect = document.getElementById('invoiceOrderSelect');
      var typeSelect = document.getElementById('invoiceTypeSelect');
      var form = document.getElementById('createInvoiceForm');

      if (openBtn && modal) {
        openBtn.addEventListener('click', function () {
          var roleCfg = RoleManager.getCurrentRoleConfig();
          if (roleCfg.code !== 'Finance' && roleCfg.code !== 'Super Admin' && roleCfg.code !== 'Administrator') {
            showToast('Penerbitan Invoice resmi hanya diizinkan untuk Finance & Super Admin.');
            return;
          }
          self.populateOrderDropdown();
          modal.classList.add('modal-open');
        });
      }

      closeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (modal) modal.classList.remove('modal-open');
        });
      });

      if (orderSelect) {
        orderSelect.addEventListener('change', function () {
          self.updateInvoiceCalculations();
        });
      }

      if (typeSelect) {
        typeSelect.addEventListener('change', function () {
          self.updateInvoiceCalculations();
        });
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          self.handleCreateInvoiceSubmit();
        });
      }
    },

    populateOrderDropdown: function () {
      var db = window.NPP_ERP_DATA;
      var select = document.getElementById('invoiceOrderSelect');
      if (!select) return;

      // Filter: Hanya PO yang Disetujui dan belum lunas
      var validOrders = (db.orders || []).filter(function (o) {
        return o.statusApproval === 'Disetujui' && o.statusPenagihan !== 'Lunas';
      });

      select.innerHTML = '<option value="">-- Pilih PO Pelanggan Terverifikasi --</option>' +
        validOrders.map(function (o) {
          return '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.id) + ' — ' + escapeHtml(o.customerName) + ' (' + formatRupiah(o.total) + ')</option>';
        }).join('');

      if (validOrders.length > 0) {
        select.value = validOrders[0].id;
        this.updateInvoiceCalculations();
      }
    },

    updateInvoiceCalculations: function () {
      var db = window.NPP_ERP_DATA;
      var orderSelect = document.getElementById('invoiceOrderSelect');
      var typeSelect = document.getElementById('invoiceTypeSelect');
      var summaryBox = document.getElementById('invoiceSummaryCalcBox');
      var dueInput = document.getElementById('invoiceDueDateInput');

      var orderId = orderSelect ? orderSelect.value : '';
      var order = (db.orders || []).find(function (o) { return o.id === orderId; });

      if (!order || !summaryBox) return;

      var cust = (db.customers || []).find(function (c) { return c.id === order.customerId; }) || {};
      var type = typeSelect ? typeSelect.value : 'Pelunasan Penuh (100%)';

      var percentage = 1.0;
      if (type === 'Tagihan DP 30%') percentage = 0.3;
      else if (type === 'Termin Bertahap (50%)') percentage = 0.5;

      var invDpp = Math.round((order.dpp || 0) * percentage);
      var invPpn = Math.round(invDpp * 0.11);
      var invTotal = invDpp + invPpn;

      summaryBox.innerHTML =
        '<div class="modal-summary-row"><span>Total Nilai Kontrak SO:</span><strong>' + formatRupiah(order.total) + '</strong></div>' +
        '<div class="modal-summary-row"><span>Porsi Tagihan:</span><strong>' + escapeHtml(type) + ' (' + Math.round(percentage * 100) + '%)</strong></div>' +
        '<div class="modal-summary-row"><span>DPP Tagihan:</span><strong>' + formatRupiah(invDpp) + '</strong></div>' +
        '<div class="modal-summary-row"><span>PPN 11%:</span><strong>' + formatRupiah(invPpn) + '</strong></div>' +
        '<div class="modal-summary-total"><span>Grand Total Invoice:</span><strong>' + formatRupiah(invTotal) + '</strong></div>' +
        '<div class="erp-doc-terbilang-box" style="margin-top:8px;">Terbilang: <strong>## ' + escapeHtml(terbilang(invTotal)) + ' ##</strong></div>';

      // Hitung rekomendasi tanggal jatuh tempo
      if (dueInput && !dueInput.value) {
        var days = 30;
        if (cust.paymentTerm === 'NET 14') days = 14;
        else if (cust.paymentTerm === 'NET 45') days = 45;
        else if (type === 'Tagihan DP 30%') days = 7;

        var d = new Date();
        d.setDate(d.getDate() + days);
        dueInput.value = d.toISOString().split('T')[0];
      }
    },

    handleCreateInvoiceSubmit: function () {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var orderSelect = document.getElementById('invoiceOrderSelect');
      var typeSelect = document.getElementById('invoiceTypeSelect');
      var dateInput = document.getElementById('invoiceDateInput');
      var dueInput = document.getElementById('invoiceDueDateInput');
      var bankSelect = document.getElementById('invoiceBankSelect');
      var notesInput = document.getElementById('invoiceNotesInput');

      var orderId = orderSelect ? orderSelect.value : '';
      var order = (db.orders || []).find(function (o) { return o.id === orderId; });

      if (!order) {
        showToast('Pilih PO Pelanggan yang valid terlebih dahulu.');
        return;
      }

      var type = typeSelect ? typeSelect.value : 'Pelunasan Penuh (100%)';
      var invDate = (dateInput ? dateInput.value : '').trim() || new Date().toISOString().split('T')[0];
      var dueDate = (dueInput ? dueInput.value : '').trim() || invDate;
      var bankRef = (bankSelect ? bankSelect.value : 'BCA 521-098-7741');

      var percentage = 1.0;
      if (type === 'Tagihan DP 30%') percentage = 0.3;
      else if (type === 'Termin Bertahap (50%)') percentage = 0.5;

      var invDpp = Math.round((order.dpp || 0) * percentage);
      var invPpn = Math.round(invDpp * 0.11);
      var invTotal = invDpp + invPpn;

      // Generate ID Invoice: INV-YYYYMM-XXXX
      var d = new Date();
      var yyyymm = d.getFullYear() + '' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1));
      var count = db.invoices.length + 1;
      var newInvId = 'INV-' + yyyymm + '-' + (count < 10 ? '000' + count : (count < 100 ? '00' + count : '0' + count));

      var newInvoice = {
        id: newInvId,
        orderId: order.id,
        clientPoNumber: order.clientPoNumber,
        customerName: order.customerName,
        invoiceDate: invDate,
        dueDate: dueDate,
        billingType: type,
        dpp: invDpp,
        ppn: invPpn,
        total: invTotal,
        paidAmount: 0,
        status: 'Belum Lunas',
        bankRef: bankRef,
        items: JSON.parse(JSON.stringify(order.items || [])),
        notes: (notesInput ? notesInput.value : '').trim() || '-'
      };
      db.invoices.unshift(newInvoice);

      // Update SO Dimensi Penagihan
      if (type === 'Tagihan DP 30%') {
        order.statusPenagihan = 'Tagihan DP Terbit';
      } else if (type === 'Termin Bertahap (50%)') {
        order.statusPenagihan = 'Ditagih Sebagian';
      } else {
        order.statusPenagihan = 'Invoice Terbit';
      }
      order.statusPembayaran = 'Menunggu Pembayaran';

      // Catat ke Arsip
      var arcCount = db.archives.length + 1;
      db.archives.unshift({
        id: 'ARC-' + d.getFullYear() + '-' + (arcCount < 10 ? '00' + arcCount : (arcCount < 100 ? '0' + arcCount : '' + arcCount)),
        docType: 'Invoice & Faktur Pajak',
        docNumber: newInvId,
        refId: order.id,
        partner: order.customerName,
        date: invDate,
        fileName: 'Invoice-' + newInvId + '.pdf',
        uploadedBy: roleCfg.userName
      });

      addAuditLog(
        'TERBIT_INVOICE',
        newInvId,
        'Menerbitkan ' + type + ' ' + newInvId + ' senilai ' + formatRupiah(invTotal) +
        ' untuk ' + order.customerName + ' (Tujuan: ' + bankRef + ')'
      );

      saveDatabase(db);
      RoleManager.updateSidebarCounters();
      this.renderBillingKPIs();
      if (this.table) this.table.render();

      var modal = document.getElementById('createInvoiceModal');
      if (modal) modal.classList.remove('modal-open');

      showToast('Invoice ' + newInvId + ' berhasil diterbitkan dan siap dikirim ke klien!');
    },

    bindPaymentModal: function () {
      var self = this;
      var modal = document.getElementById('paymentModal');
      var closeBtns = modal ? modal.querySelectorAll('[data-modal-close]') : [];
      var form = document.getElementById('paymentForm');

      closeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (modal) modal.classList.remove('modal-open');
        });
      });

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var invId = document.getElementById('paymentInvoiceIdHidden').value;
          var payDate = (document.getElementById('paymentDateInput').value || '').trim() || new Date().toISOString().split('T')[0];
          var bankRef = (document.getElementById('paymentBankInput').value || '').trim() || 'BCA Escrow';
          var refTrx = (document.getElementById('paymentRefTrxInput').value || '').trim() || ('TRX-' + Math.floor(100000 + Math.random() * 900000));
          var payAmount = parseFloat(document.getElementById('paymentAmountInput').value) || 0;

          self.handlePaymentSubmit(invId, payDate, bankRef, refTrx, payAmount);
        });
      }
    },

    openPaymentModal: function (invoiceId) {
      var modal = document.getElementById('paymentModal');
      if (!modal) {
        window.location.href = 'billing-payment.html?id=' + encodeURIComponent(invoiceId);
        return;
      }
      var db = window.NPP_ERP_DATA;
      var inv = (db.invoices || []).find(function (i) { return i.id === invoiceId; });
      if (!inv) return;
      var title = document.getElementById('paymentModalTitle');
      var hiddenId = document.getElementById('paymentInvoiceIdHidden');
      var infoBox = document.getElementById('paymentInvoiceInfoBox');
      var amountInput = document.getElementById('paymentAmountInput');
      var dateInput = document.getElementById('paymentDateInput');

      var remaining = Math.max(0, (inv.total || 0) - (inv.paidAmount || 0));

      if (title) title.textContent = 'Pencatatan Pembayaran / Pelunasan — ' + inv.id;
      if (hiddenId) hiddenId.value = inv.id;
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      if (amountInput) {
        amountInput.value = remaining;
        amountInput.max = remaining;
      }

      if (infoBox) {
        infoBox.innerHTML =
          '<div class="erp-doc-meta-grid" style="grid-template-columns: 1fr; gap: 6px;">' +
          '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Pelanggan:</span><strong class="erp-doc-meta-val">' + escapeHtml(inv.customerName) + '</strong></div>' +
          '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Total Tagihan:</span><strong class="erp-doc-meta-val">' + formatRupiah(inv.total) + '</strong></div>' +
          '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Sudah Dibayar:</span><span class="erp-doc-meta-val">' + formatRupiah(inv.paidAmount || 0) + '</span></div>' +
          '<div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Sisa Pelunasan:</span><strong class="erp-doc-meta-val" style="color:var(--erp-navy); font-size:1rem;">' + formatRupiah(remaining) + '</strong></div>' +
          '</div>';
      }

      if (modal) modal.classList.add('modal-open');
    },

    handlePaymentSubmit: function (invId, payDate, bankRef, refTrx, payAmount) {
      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();
      var inv = (db.invoices || []).find(function (i) { return i.id === invId; });
      if (!inv) return;

      var currentPaid = inv.paidAmount || 0;
      var newPaid = currentPaid + payAmount;
      inv.paidAmount = Math.min(inv.total, newPaid);

      if (inv.paidAmount >= inv.total) {
        inv.status = 'Lunas';
      } else {
        inv.status = 'Dibayar Parsial';
      }

      // Periksa status seluruh invoice untuk SO terkait
      var order = (db.orders || []).find(function (o) { return o.id === inv.orderId; });
      if (order) {
        var allInvoicesForOrder = db.invoices.filter(function (i) { return i.orderId === order.id; });
        var allPaid = allInvoicesForOrder.every(function (i) { return i.status === 'Lunas'; });

        if (allPaid) {
          order.statusPenagihan = 'Lunas';
          order.statusPembayaran = 'Lunas';
          // Jika pengiriman juga sudah selesai (BAST), tandai order selesai penuh!
          if (order.statusPengiriman === 'Terkirim Penuh') {
            order.statusOrder = 'Selesai';
          }
        } else {
          order.statusPenagihan = 'Ditagih Sebagian';
          order.statusPembayaran = 'Dibayar Sebagian';
        }
      }

      addAuditLog(
        'CATAT_PELUNASAN',
        inv.id,
        'Mencatat penerimaan pembayaran ' + formatRupiah(payAmount) + ' untuk ' + inv.id +
        ' via ' + bankRef + ' (Ref Mutasi: ' + refTrx + ') • Status Invoice: ' + inv.status
      );

      saveDatabase(db);
      RoleManager.updateSidebarCounters();
      this.renderBillingKPIs();
      if (this.table) this.table.render();

      var modal = document.getElementById('paymentModal');
      if (modal) modal.classList.remove('modal-open');

      showToast('Penerimaan dana ' + formatRupiah(payAmount) + ' berhasil dibukukan!');
    },

    openInvoicePrintPreview: function (invoiceId) {
      var modal = document.getElementById('modalPreviewInvoice');
      if (!modal) {
        window.location.href = 'billing-print.html?id=' + encodeURIComponent(invoiceId);
        return;
      }
      var db = window.NPP_ERP_DATA;
      var inv = (db.invoices || []).find(function (i) { return i.id === invoiceId; });
      if (!inv) return;

      var container = document.getElementById('previewInvoiceBody');
      if (!modal || !container) return;

      var order = (db.orders || []).find(function (o) { return o.id === inv.orderId; }) || {};
      var customer = (db.customers || []).find(function (c) { return c.id === order.customerId; }) || {};

      var items = inv.items && inv.items.length > 0 ? inv.items : (order.items || []);
      var itemsRows = items.map(function (it, idx) {
        var linePrice = Number(it.price) || 0;
        var lineSub = linePrice * (Number(it.qty) || 0);
        return (
          '<tr>' +
          '<td style="text-align:center;">' + (idx + 1) + '</td>' +
          '<td><strong>' + escapeHtml(it.sku) + '</strong></td>' +
          '<td><strong>' + escapeHtml(it.name) + '</strong></td>' +
          '<td style="text-align:center; font-weight:700;">' + it.qty + ' ' + escapeHtml(it.unit || 'Unit') + '</td>' +
          '<td style="text-align:right;">' + formatRupiah(linePrice) + '</td>' +
          '<td style="text-align:right; font-weight:700;">' + formatRupiah(lineSub) + '</td>' +
          '</tr>'
        );
      }).join('');

      container.innerHTML =
        '<div class="erp-official-doc">' +
        '  <div class="erp-doc-header">' +
        '    <div class="erp-doc-brand">' +
        '      <img src="assets/img/logo.png" alt="PT NPP Logo" class="erp-doc-logo" onerror="this.style.display=\'none\'">' +
        '      <div>' +
        '        <div class="erp-doc-company-name">PT NUSANTARA PUNCAK PERKASA</div>' +
        '        <div class="erp-doc-company-info">Solusi Daya Industri B2B Terpadu</div>' +
        '        <div class="erp-doc-company-info">' + escapeHtml(db.meta.address) + ' • NPWP: ' + escapeHtml(db.meta.npwp) + ' • Telp: (021) 8834-9021</div>' +
        '      </div>' +
        '    </div>' +
        '    <div class="erp-doc-title-block">' +
        '      <div class="erp-doc-title">FAKTUR PENJUALAN</div>' +
        '      <div class="erp-doc-number">' + escapeHtml(inv.id) + '</div>' +
        '      <div class="cell-subtext">Tanggal Terbit: ' + escapeHtml(inv.invoiceDate) + '</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-meta-grid">' +
        '    <div class="erp-doc-meta-col">' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Ditagihkan Kepada:</span><strong class="erp-doc-meta-val">' + escapeHtml(inv.customerName) + '</strong></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">NPWP Pelanggan:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(customer.npwp || '01.345.678.9-012.000') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Alamat Penagihan:</span><span class="erp-doc-meta-val">' + escapeHtml(customer.address || 'Kawasan Industri') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">PIC Pembelian:</span><span class="erp-doc-meta-val">' + escapeHtml(customer.pic || '-') + '</span></div>' +
        '    </div>' +
        '    <div class="erp-doc-meta-col">' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">No. PO Pelanggan:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(inv.clientPoNumber) + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">No. Referensi SO:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(inv.orderId) + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Syarat Pembayaran:</span><span class="erp-doc-meta-val">' + escapeHtml(customer.paymentTerm || order.paymentTerm || 'NET 30') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Jatuh Tempo:</span><strong class="erp-doc-meta-val" style="color:var(--status-danger-text);">' + escapeHtml(inv.dueDate) + '</strong></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Tipe Tagihan:</span><span class="erp-doc-meta-val">' + escapeHtml(inv.billingType) + '</span></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-table-wrap">' +
        '    <table class="erp-doc-table">' +
        '      <thead>' +
        '        <tr>' +
        '          <th style="width:40px; text-align:center;">No</th>' +
        '          <th style="width:130px;">Kode SKU</th>' +
        '          <th>Deskripsi Spesifikasi Barang</th>' +
        '          <th style="width:90px; text-align:center;">Kuantitas</th>' +
        '          <th style="width:130px; text-align:right;">Harga Satuan</th>' +
        '          <th style="width:140px; text-align:right;">Subtotal DPP</th>' +
        '        </tr>' +
        '      </thead>' +
        '      <tbody>' + itemsRows + '</tbody>' +
        '    </table>' +
        '  </div>' +
        '  <div class="erp-doc-calc-grid">' +
        '    <div class="erp-doc-calc-box">' +
        '      <div class="erp-doc-calc-row"><span>Dasar Pengenaan Pajak (DPP):</span><strong>' + formatRupiah(inv.dpp) + '</strong></div>' +
        '      <div class="erp-doc-calc-row"><span>Pajak Pertambahan Nilai (PPN 11%):</span><strong>' + formatRupiah(inv.ppn) + '</strong></div>' +
        '      <div class="erp-doc-calc-row-grand"><span>TOTAL TAGIHAN:</span><strong>' + formatRupiah(inv.total) + '</strong></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-terbilang-box">' +
        '    Terbilang: <strong>## ' + escapeHtml(terbilang(inv.total)) + ' ##</strong>' +
        '  </div>' +
        '  <div class="erp-doc-bank-box">' +
        '    <div class="erp-doc-bank-title">Instruksi Pembayaran Transfer Bank:</div>' +
        '    <div class="erp-doc-bank-list">' +
        '      <div>1. <strong>Bank Central Asia (BCA)</strong> — No. Rekening: <strong>521-098-7741</strong> a/n PT Nusantara Puncak Perkasa (KCU Bekasi)</div>' +
        '      <div>2. <strong>Bank Mandiri</strong> — No. Rekening: <strong>156-00-0988234-5</strong> a/n PT Nusantara Puncak Perkasa (KCP Bekasi Juanda)</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-signatures-2">' +
        '    <div class="erp-signature-box">' +
        '      <div class="erp-signature-role">Diterima &amp; Disetujui Oleh (Pelanggan)</div>' +
        '      <div class="erp-signature-space"></div>' +
        '      <div class="erp-signature-signer">' + escapeHtml(inv.customerName) + '<br><span class="cell-subtext-sm">(Tanda Tangan, Nama Jelas &amp; Cap Perusahaan)</span></div>' +
        '    </div>' +
        '    <div class="erp-signature-box">' +
        '      <div class="erp-signature-role">Hormat Kami, PT Nusantara Puncak Perkasa</div>' +
        '      <div class="erp-signature-space">' +
        '        <div class="erp-doc-digital-stamp">PT NPP<br>FINANCE<br>OFFICIAL</div>' +
        '      </div>' +
        '      <div class="erp-signature-signer">Siti Rahmawati / Ir. Darmawan Putra<br><span class="cell-subtext-sm">Finance &amp; Direktur Operasional</span></div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      modal.classList.add('modal-open');
    }
  };

  /* ==========================================================================
     15. DEDICATED CRUD PAGE CONTROLLERS (NO-MODAL ARCHITECTURE)
     ========================================================================== */

var OrderCreatePageController = {
    init: function () {
      if (!document.getElementById('erpOrderCreatePage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var custSel = document.getElementById('orderCustomerSelect');
      var poDateInp = document.getElementById('orderPoDate');
      var delivDateInp = document.getElementById('orderTargetDelivery');
      var tbody = document.getElementById('pageOrderItemsTbody');
      var addBtn = document.getElementById('btnPageAddOrderRow');
      var form = document.getElementById('formCreateOrderPage');

      var fileInput = document.getElementById('orderPdfFile');
      var fileCard = document.getElementById('orderFileCard');
      var fileTitle = document.getElementById('orderFileTitle');
      var fileMeta = document.getElementById('orderFileMeta');
      var btnViewFile = document.getElementById('btnViewOrderFile');
      var btnChangeFile = document.getElementById('btnChangeOrderFile');
      var btnRemoveFile = document.getElementById('btnRemoveOrderFile');
      var modal = document.getElementById('orderFileModal');
      var modalTitle = document.getElementById('orderFileModalTitle');
      var modalMeta = document.getElementById('orderFileModalMeta');
      var previewContainer = document.getElementById('orderFilePreviewContainer');
      var btnCloseModal = document.getElementById('btnCloseOrderFileModal');
      var btnDismissModal = document.getElementById('btnDismissOrderFileModal');
      var btnOpenNewTab = document.getElementById('btnOpenNewTabFile');

      var currentFile = null;
      var currentFileUrl = null;

      var formatSize = function (bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      var closePreviewModal = function () {
        if (modal) modal.classList.remove('modal-open');
      };

      var openPreviewModal = function () {
        if (!currentFile || !modal || !previewContainer) return;
        if (currentFileUrl) {
          try { URL.revokeObjectURL(currentFileUrl); } catch (e) {}
        }
        currentFileUrl = URL.createObjectURL(currentFile);
        if (modalTitle) modalTitle.textContent = 'Pratinjau Berkas PO — ' + currentFile.name;
        if (modalMeta) modalMeta.textContent = (currentFile.type || 'Dokumen') + ' (' + formatSize(currentFile.size) + ')';

        previewContainer.innerHTML = '';
        var isImg = currentFile.type.indexOf('image/') === 0;
        var isPdf = currentFile.type === 'application/pdf' || currentFile.name.toLowerCase().endsWith('.pdf');

        if (isImg) {
          var img = document.createElement('img');
          img.src = currentFileUrl;
          img.className = 'erp-preview-img';
          img.alt = currentFile.name;
          previewContainer.appendChild(img);
        } else if (isPdf) {
          var iframe = document.createElement('iframe');
          iframe.src = currentFileUrl;
          iframe.className = 'erp-preview-frame';
          iframe.title = currentFile.name;
          previewContainer.appendChild(iframe);
        } else {
          var fallback = document.createElement('div');
          fallback.className = 'erp-empty-state';
          fallback.textContent = 'Pratinjau langsung tidak tersedia untuk format berkas ini. Klik tombol "Buka di Tab Baru" di bawah.';
          previewContainer.appendChild(fallback);
        }
        modal.classList.add('modal-open');
      };

      if (fileInput) {
        fileInput.addEventListener('change', function () {
          if (fileInput.files && fileInput.files[0]) {
            currentFile = fileInput.files[0];
            if (fileTitle) fileTitle.textContent = currentFile.name;
            if (fileMeta) {
              var typeStr = currentFile.type.indexOf('image/') === 0 ? 'Berkas Gambar' : (currentFile.name.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Dokumen');
              fileMeta.textContent = formatSize(currentFile.size) + ' • ' + typeStr;
            }
            fileInput.style.display = 'none';
            if (fileCard) fileCard.style.display = 'flex';
          }
        });
      }

      if (btnViewFile) {
        btnViewFile.addEventListener('click', openPreviewModal);
      }

      if (btnChangeFile) {
        btnChangeFile.addEventListener('click', function () {
          if (fileInput) fileInput.click();
        });
      }

      if (btnRemoveFile) {
        btnRemoveFile.addEventListener('click', function () {
          showConfirmAlert({
            type: 'danger',
            title: 'Hapus Berkas Scan PO',
            message: 'Apakah Anda yakin ingin menghapus berkas dokumen scan PO yang telah diunggah?',
            confirmText: 'Hapus Berkas',
            confirmClass: 'btn-erp-danger',
            onConfirm: function () {
              if (fileInput) fileInput.value = '';
              currentFile = null;
              if (currentFileUrl) {
                try { URL.revokeObjectURL(currentFileUrl); } catch (e) {}
                currentFileUrl = null;
              }
              if (fileCard) fileCard.style.display = 'none';
              if (fileInput) fileInput.style.display = 'block';
              closePreviewModal();
              showToast('Berkas scan PO telah dihapus.');
            }
          });
        });
      }

      if (btnCloseModal) btnCloseModal.addEventListener('click', closePreviewModal);
      if (btnDismissModal) btnDismissModal.addEventListener('click', closePreviewModal);
      if (modal) {
        modal.addEventListener('click', function (e) {
          if (e.target === modal) closePreviewModal();
        });
      }
      if (btnOpenNewTab) {
        btnOpenNewTab.addEventListener('click', function () {
          if (currentFileUrl) {
            window.open(currentFileUrl, '_blank');
          }
        });
      }
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('modal-open')) {
          closePreviewModal();
        }
      });

      if (custSel) {
        custSel.innerHTML = '<option value="">-- Pilih Pelanggan B2B --</option>' +
          (db.customers || []).map(function (c) {
            return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + '</option>';
          }).join('');
      }

      var today = new Date().toISOString().split('T')[0];
      var target = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      if (poDateInp) poDateInp.value = today;
      if (delivDateInp) delivDateInp.value = target;

      var calcTotals = function () {
        var dpp = 0;
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function (tr) {
          var price = Number(tr.querySelector('.item-price').value) || 0;
          var qty = Number(tr.querySelector('.item-qty').value) || 0;
          var sub = price * qty;
          var subSpan = tr.querySelector('.item-subtotal');
          if (subSpan) subSpan.textContent = formatRupiah(sub);
          dpp += sub;
        });
        var ppn = Math.round(dpp * 0.11);
        var grand = dpp + ppn;
        var dppEl = document.getElementById('pageSummaryDpp');
        var ppnEl = document.getElementById('pageSummaryPpn');
        var grandEl = document.getElementById('pageSummaryGrandTotal');
        if (dppEl) dppEl.textContent = formatRupiah(dpp);
        if (ppnEl) ppnEl.textContent = formatRupiah(ppn);
        if (grandEl) grandEl.textContent = formatRupiah(grand);
      };

      var addRow = function (preSku, preQty) {
        if (!tbody) return;
        var tr = document.createElement('tr');
        var rowIdx = tbody.children.length + 1;
        var skuOptions = '<option value="">-- Pilih SKU --</option>' +
          (db.products || []).map(function (p) {
            var sel = (preSku && p.sku === preSku) ? ' selected' : '';
            return '<option value="' + escapeHtml(p.sku) + '" data-price="' + p.price + '" data-unit="' + (p.unit || 'Unit') + '"' + sel + '>' + escapeHtml(p.sku + ' — ' + p.name) + '</option>';
          }).join('');

        tr.innerHTML =
          '<td style="text-align:center;">' + rowIdx + '</td>' +
          '<td><select class="erp-select item-sku" required>' + skuOptions + '</select></td>' +
          '<td><input type="number" class="erp-input item-qty" min="1" value="' + (preQty || 10) + '" style="text-align:center;" required /></td>' +
          '<td style="text-align:center;"><span class="item-unit">Unit</span></td>' +
          '<td><input type="number" class="erp-input item-price" min="0" value="0" style="text-align:right;" required /></td>' +
          '<td style="text-align:right; font-weight:600;"><span class="item-subtotal">Rp 0</span></td>' +
          '<td style="text-align:center;"><button type="button" class="btn-erp btn-erp-danger btn-erp-sm btn-del-row" aria-label="Hapus Baris"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>';

        var skuSel = tr.querySelector('.item-sku');
        var qtyInp = tr.querySelector('.item-qty');
        var priceInp = tr.querySelector('.item-price');
        var unitSpan = tr.querySelector('.item-unit');
        var delBtn = tr.querySelector('.btn-del-row');

        var updateSku = function () {
          var opt = skuSel.options[skuSel.selectedIndex];
          if (opt && opt.value) {
            var pr = Number(opt.getAttribute('data-price')) || 0;
            priceInp.value = pr;
            unitSpan.textContent = opt.getAttribute('data-unit') || 'Unit';
          }
          calcTotals();
        };

        skuSel.addEventListener('change', updateSku);
        qtyInp.addEventListener('input', calcTotals);
        priceInp.addEventListener('input', calcTotals);
        delBtn.addEventListener('click', function () {
          var allRows = tbody.querySelectorAll('tr');
          if (allRows.length <= 1) {
            showToast('Minimal harus terdapat 1 baris barang dalam pengadaan.');
            return;
          }
          showConfirmAlert({
            type: 'warning',
            title: 'Hapus Baris Barang',
            message: 'Apakah Anda yakin ingin menghapus baris barang ini dari pengadaan?',
            confirmText: 'Hapus Baris',
            confirmClass: 'btn-erp-danger',
            onConfirm: function () {
              tr.remove();
              calcTotals();
              showToast('Baris barang telah dihapus.');
            }
          });
        });

        tbody.appendChild(tr);
        if (preSku) updateSku();
      };

      if (addBtn) {
        addBtn.addEventListener('click', function () { addRow(); });
      }

      if (db.products && db.products.length > 0) {
        addRow(db.products[0].sku, 20);
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var custId = custSel.value;
          var custObj = (db.customers || []).find(function (c) { return c.id === custId; }) || {};
          var clientPo = (document.getElementById('orderClientPoNum').value || '').trim();
          var poDate = poDateInp.value;
          var delivDate = delivDateInp.value;
          var topVal = document.getElementById('orderPaymentTerm').value;
          var notesVal = (document.getElementById('orderNotes').value || '').trim();

          var items = [];
          var dpp = 0;
          var hasShortage = false;

          tbody.querySelectorAll('tr').forEach(function (tr) {
            var skuSel = tr.querySelector('.item-sku');
            var skuVal = skuSel.value;
            var qtyVal = Number(tr.querySelector('.item-qty').value) || 0;
            var priceVal = Number(tr.querySelector('.item-price').value) || 0;
            var prod = (db.products || []).find(function (p) { return p.sku === skuVal; }) || {};
            var lineSub = qtyVal * priceVal;
            dpp += lineSub;

            var inv = (db.inventory || []).find(function (i) { return i.sku === skuVal; });
            var phys = inv ? (inv.fisik !== undefined ? inv.fisik : (inv.physical || 0)) : 0;
            var hld = inv ? (inv.tertahan !== undefined ? inv.tertahan : (inv.held || 0)) : 0;
            var res = inv ? (inv.reservasi !== undefined ? inv.reservasi : (inv.reserved || 0)) : 0;
            var available = inv ? (inv.tersedia !== undefined ? inv.tersedia : Math.max(0, phys - hld - res)) : 0;
            if (available < qtyVal) hasShortage = true;

            if (inv) {
              var reserveQty = Math.min(Math.max(0, available), qtyVal);
              inv.reservasi = res + reserveQty;
              inv.reserved = inv.reservasi;
              inv.layak = Math.max(0, phys - hld);
              inv.tersedia = Math.max(0, inv.layak - inv.reservasi);
            }

            items.push({
              sku: skuVal,
              name: prod.name || skuVal,
              qty: qtyVal,
              unit: prod.unit || 'Unit',
              price: priceVal,
              subtotal: lineSub
            });
          });

          if (items.length === 0) {
            showToast('Harap tambahkan minimal 1 baris item produk.');
            return;
          }

          var ppn = Math.round(dpp * 0.11);
          var grand = dpp + ppn;
          var newId = 'SO-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000);

          var newOrder = {
            id: newId,
            soId: newId,
            customerId: custId,
            customerName: custObj.name || 'Pelanggan B2B',
            clientPoNumber: clientPo,
            poDate: poDate,
            deliveryTarget: delivDate,
            paymentTerm: topVal,
            salesPic: 'Nadia Pramesti (Sales B2B)',
            statusApproval: 'Menunggu Persetujuan',
            statusPemenuhan: hasShortage ? 'Menunggu Pengadaan' : 'Stok Direservasi',
            statusPengiriman: 'Belum Dikirim',
            statusPenagihan: 'Belum Ditagih',
            statusPembayaran: 'Belum Dibayar',
            notes: notesVal,
            poFileName: currentFile ? currentFile.name : null,
            poFileSize: currentFile ? currentFile.size : null,
            hasPoFile: !!currentFile,
            dpp: dpp,
            ppn: ppn,
            total: grand,
            items: items
          };

          db.orders.unshift(newOrder);
          addAuditLog('SO-CREATE', newId, 'Menerbitkan pesanan pelanggan baru: ' + newId + ' (' + newOrder.customerName + ') senilai ' + formatRupiah(grand));
          saveDatabase(db);
          showToast('Pesanan ' + newId + ' berhasil diterbitkan!');
          setTimeout(function () {
            window.location.href = 'orders.html';
          }, 200);
        });
      }
    }
  };

  var OrderDetailPageController = {
    init: function () {
      if (!document.getElementById('erpOrderDetailPage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var params = new URLSearchParams(window.location.search);
      var soId = params.get('id');
      var order = (db.orders || []).find(function (o) { return o.id === soId || o.soId === soId; });

      var heading = document.getElementById('orderDetailHeading');
      var container = document.getElementById('orderDetailContainer');
      if (!order) {
        if (heading) heading.textContent = 'Pesanan Tidak Ditemukan';
        if (container) container.innerHTML = '<div class="erp-form-card"><p>Nomor pesanan tidak valid atau telah dihapus.</p><a href="orders.html" class="btn-erp btn-erp-primary">Kembali ke Daftar PO</a></div>';
        return;
      }

      if (heading) heading.textContent = 'Detail PO Pelanggan: ' + order.id;

      var roleCfg = RoleManager.getCurrentRoleConfig();
      var canApproveNow = roleCfg.canApprove && order.statusApproval === 'Menunggu Persetujuan';
      var paymentStat = derivePaymentStatus(order);

      var itemsRows = (order.items || []).map(function (it, idx) {
        var priceVal = roleCfg.canViewPrice ? formatMoneyRBAC(it.price, false) : 'TERLINDUNGI (GUDANG)';
        var subVal = roleCfg.canViewPrice ? formatMoneyRBAC(it.subtotal, false) : 'TERLINDUNGI (GUDANG)';
        return (
          '<tr>' +
          '<td style="text-align:center;">' + (idx + 1) + '</td>' +
          '<td><strong>' + escapeHtml(it.sku) + '</strong></td>' +
          '<td>' + escapeHtml(it.name) + '</td>' +
          '<td style="text-align:center; font-weight:600;">' + it.qty + '</td>' +
          '<td style="text-align:center;">' + escapeHtml(it.unit || 'Unit') + '</td>' +
          '<td style="text-align:right;">' + priceVal + '</td>' +
          '<td style="text-align:right; font-weight:700;">' + subVal + '</td>' +
          '</tr>'
        );
      }).join('');

      container.innerHTML =
        '<div class="erp-status-progress-track">' +
        '  <div class="erp-status-progress-card"><span class="erp-status-progress-dim">1. Persetujuan</span><div>' + renderStatusBadge(order.statusApproval) + '</div></div>' +
        '  <div class="erp-status-progress-card"><span class="erp-status-progress-dim">2. Pemenuhan Stok</span><div>' + renderStatusBadge(order.statusPemenuhan) + '</div></div>' +
        '  <div class="erp-status-progress-card"><span class="erp-status-progress-dim">3. Pengiriman</span><div>' + renderStatusBadge(order.statusPengiriman) + '</div></div>' +
        '  <div class="erp-status-progress-card col-financial"><span class="erp-status-progress-dim">4. Penagihan</span><div>' + renderStatusBadge(order.statusPenagihan) + '</div></div>' +
        '  <div class="erp-status-progress-card col-financial"><span class="erp-status-progress-dim">5. Pembayaran</span><div>' + renderStatusBadge(paymentStat) + '</div></div>' +
        '</div>' +

        '<div class="erp-form-card">' +
        '  <div class="erp-detail-grid">' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Nama Pelanggan B2B</span><span class="erp-detail-val">' + escapeHtml(order.customerName) + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">No. PO Klien Eksternal</span><span class="erp-detail-val cell-code">' + escapeHtml(order.clientPoNumber) + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Tanggal PO</span><span class="erp-detail-val">' + escapeHtml(order.poDate || '-') + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Target Tanggal Kirim</span><span class="erp-detail-val">' + escapeHtml(order.deliveryTarget || '-') + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Syarat Pembayaran</span><span class="erp-detail-val">' + escapeHtml(order.paymentTerm || 'Net 30') + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">PIC Sales Penanggung Jawab</span><span class="erp-detail-val">' + escapeHtml(order.salesPic || '-') + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Berkas Scan PO</span><span class="erp-detail-val">' + (order.poFileName ? ('<span class="badge-status badge-info">' + escapeHtml(order.poFileName) + '</span>') : '<span class="badge-status badge-neutral">Belum Dilampirkan</span>') + '</span></div>' +
        '  </div>' +
        '  <div class="erp-form-group erp-form-group-full">' +
        '    <span class="erp-detail-label">Catatan Pengiriman / Instruksi Khusus:</span>' +
        '    <p class="modal-notes-text">' + escapeHtml(order.notes || 'Tidak ada catatan tambahan.') + '</p>' +
        '  </div>' +
        '</div>' +

        '<div class="erp-form-card">' +
        '  <div class="erp-table-wrap">' +
        '    <table class="erp-table">' +
        '      <thead>' +
        '        <tr>' +
        '          <th style="width:40px; text-align:center;">#</th>' +
        '          <th style="width:140px;">Kode SKU</th>' +
        '          <th>Deskripsi Nama Produk</th>' +
        '          <th style="width:80px; text-align:center;">Qty</th>' +
        '          <th style="width:80px; text-align:center;">Satuan</th>' +
        '          <th style="width:160px; text-align:right;">Harga Satuan</th>' +
        '          <th style="width:170px; text-align:right;">Subtotal</th>' +
        '        </tr>' +
        '      </thead>' +
        '      <tbody>' + itemsRows + '</tbody>' +
        '    </table>' +
        '  </div>' +
        '</div>' +

        '<div class="erp-form-card">' +
        '  <div class="erp-detail-grid">' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Dasar Pengenaan Pajak (DPP)</span><span class="erp-detail-val">' + formatMoneyRBAC(order.dpp, false) + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">PPN 11%</span><span class="erp-detail-val">' + formatMoneyRBAC(order.ppn, false) + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Total Tagihan Pesanan</span><span class="erp-detail-val-highlight">' + formatMoneyRBAC(order.total, false) + '</span></div>' +
        '  </div>' +
        '  <div class="erp-form-actions-bar">' +
        '    <a href="orders.html" class="btn-erp btn-erp-secondary"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg><span>Kembali</span></a>' +
        (canApproveNow ?
          '    <button type="button" class="btn-erp btn-erp-danger" id="btnPageRejectOrder">Tolak PO Ini</button>' +
          '    <button type="button" class="btn-erp btn-erp-success" id="btnPageApproveOrder">Setujui PO Pelanggan</button>'
          : '') +
        '  </div>' +
        '</div>';

      var btnApprove = document.getElementById('btnPageApproveOrder');
      var btnReject = document.getElementById('btnPageRejectOrder');
      if (btnApprove) {
        btnApprove.addEventListener('click', function () {
          showConfirmAlert({
            type: 'success',
            title: 'Setujui PO Pelanggan ' + order.id,
            message: 'Otorisasi pesanan ' + order.customerName + ' dengan nilai ' + formatMoneyRBAC(order.total, false) + '? Pesanan akan dilanjutkan ke pemrosesan gudang.',
            confirmText: 'Setujui PO',
            confirmClass: 'btn-erp-success',
            onConfirm: function () {
              order.statusApproval = 'Disetujui';
              order.statusOrder = 'Diproses';
              if (order.statusPemenuhan === 'Stok Direservasi') {
                order.statusPengiriman = 'Siap Kirim Gudang';
              }
              addAuditLog('SO-APPROVE', order.id, 'Menyetujui PO ' + order.id + ' (' + order.customerName + ')');
              saveDatabase(db);
              RoleManager.updateSidebarCounters();
              showToast('PO ' + order.id + ' berhasil disetujui!');
              OrderDetailPageController.init();
            }
          });
        });
      }
      if (btnReject) {
        btnReject.addEventListener('click', function () {
          showConfirmAlert({
            type: 'danger',
            title: 'Tolak PO Pelanggan ' + order.id,
            message: 'Apakah Anda yakin ingin menolak pengajuan pesanan ' + order.customerName + '? Status pesanan akan ditangguhkan.',
            confirmText: 'Tolak PO',
            confirmClass: 'btn-erp-danger',
            onConfirm: function () {
              order.statusApproval = 'Ditolak';
              order.statusOrder = 'Ditangguhkan';
              addAuditLog('SO-REJECT', order.id, 'Menolak PO ' + order.id + ' (' + order.customerName + ')');
              saveDatabase(db);
              RoleManager.updateSidebarCounters();
              showToast('PO ' + order.id + ' telah ditolak.');
              OrderDetailPageController.init();
            }
          });
        });
      }
    }
  };

  var MasterCustomerCreatePageController = {
    init: function () {
      var form = document.getElementById('formCreateCustomerPage');
      if (!form) return;
      var db = window.NPP_ERP_DATA;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var newId = 'CUST-' + String(Math.floor(Math.random() * 9000) + 1000);
        var newCust = {
          id: newId,
          name: document.getElementById('inpCustName').value.trim(),
          pic: document.getElementById('inpCustPic').value.trim(),
          phone: document.getElementById('inpCustPhone').value.trim(),
          email: document.getElementById('inpCustEmail').value.trim(),
          npwp: document.getElementById('inpCustNpwp').value.trim() || '01.000.000.0-000.000',
          paymentTerm: document.getElementById('inpCustTop').value,
          address: document.getElementById('inpCustAddress').value.trim()
        };

        db.customers = db.customers || [];
        db.customers.unshift(newCust);
        addAuditLog('MASTER-CUSTOMER', newId, 'Menambah master pelanggan baru: ' + newCust.name);
        saveDatabase(db);
        showToast('Pelanggan ' + newCust.name + ' berhasil ditambahkan!');
        setTimeout(function () {
          window.location.href = 'master-data.html#customers';
        }, 200);
      });
    }
  };

  var MasterSupplierCreatePageController = {
    init: function () {
      var form = document.getElementById('formCreateSupplierPage');
      if (!form) return;
      var db = window.NPP_ERP_DATA;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var newId = 'SUP-' + String(Math.floor(Math.random() * 9000) + 1000);
        var newSup = {
          id: newId,
          name: document.getElementById('inpSuppName').value.trim(),
          brand: document.getElementById('inpSuppBrand').value.trim(),
          origin: document.getElementById('inpSuppOrigin').value.trim(),
          pic: document.getElementById('inpSuppPic').value.trim(),
          phone: document.getElementById('inpSuppPhone').value.trim(),
          email: document.getElementById('inpSuppEmail').value.trim(),
          leadTime: parseInt(document.getElementById('inpSuppLead').value, 10) || 14,
          bankAccount: document.getElementById('inpSuppBank').value.trim() || 'Bank Escrow Transfer'
        };

        db.suppliers = db.suppliers || [];
        db.suppliers.unshift(newSup);
        addAuditLog('MASTER-SUPPLIER', newId, 'Menambah master supplier baru: ' + newSup.name);
        saveDatabase(db);
        showToast('Supplier ' + newSup.name + ' berhasil ditambahkan!');
        setTimeout(function () {
          window.location.href = 'master-data.html#suppliers';
        }, 200);
      });
    }
  };

  var MasterProductCreatePageController = {
    init: function () {
      var form = document.getElementById('formCreateProductPage');
      if (!form) return;
      var db = window.NPP_ERP_DATA;

      var rackSel = document.getElementById('inpProdRack');
      if (rackSel) {
        var rackList = db.racks || db.warehouseRacks || [];
        rackSel.innerHTML = rackList.map(function (r) {
          return '<option value="' + escapeHtml(r.code) + '">' + escapeHtml(r.code + ' (' + r.zone + ')') + '</option>';
        }).join('');
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var sku = document.getElementById('inpProdSku').value.trim().toUpperCase();
        var name = document.getElementById('inpProdName').value.trim();
        var cat = document.getElementById('inpProdCategory').value;
        var unit = document.getElementById('inpProdUnit').value;
        var rack = document.getElementById('inpProdRack').value;
        var minStock = parseInt(document.getElementById('inpProdMinStock').value, 10) || 0;
        var initStock = parseInt(document.getElementById('inpProdInitialStock').value, 10) || 0;
        var price = parseInt(document.getElementById('inpProdPriceB2B').value, 10) || 0;
        var cost = parseInt(document.getElementById('inpProdCost').value, 10) || 0;
        var isWeb = document.getElementById('inpProdWebSync').value === 'true';

        var newProd = {
          sku: sku,
          name: name,
          category: cat,
          brand: document.getElementById('inpProdBrand').value,
          unit: unit,
          price: price,
          hpp: cost,
          cost: cost,
          minStock: minStock,
          rack: rack,
          publishedWeb: isWeb,
          webPublished: isWeb
        };

        db.products = db.products || [];
        db.products.unshift(newProd);

        db.inventory = db.inventory || [];
        db.inventory.unshift({
          sku: sku,
          name: name,
          category: cat,
          location: rack,
          fisik: initStock,
          tertahan: 0,
          layak: initStock,
          reservasi: 0,
          tersedia: initStock,
          minStock: minStock,
          status: initStock === 0 ? 'Habis' : (initStock <= minStock ? 'Kritis' : 'Normal'),
          physical: initStock,
          held: 0,
          reserved: 0
        });

        addAuditLog('MASTER-PRODUCT', sku, 'Menambah master SKU produk: ' + sku + ' — ' + name);
        saveDatabase(db);
        showToast('SKU Produk ' + sku + ' berhasil ditambahkan!');
        setTimeout(function () {
          window.location.href = 'master-data.html#products';
        }, 200);
      });
    }
  };

  var MasterRackCreatePageController = {
    init: function () {
      var form = document.getElementById('formCreateRackPage');
      if (!form) return;
      var db = window.NPP_ERP_DATA;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var code = document.getElementById('inpRackCode').value.trim().toUpperCase();
        var zone = document.getElementById('inpRackZone').value;
        var type = document.getElementById('inpRackType').value;
        var cap = parseInt(document.getElementById('inpRackCap').value, 10) || 1000;
        var status = document.getElementById('inpRackStatus').value;

        var newRack = {
          code: code,
          zone: zone,
          type: type,
          capacity: cap,
          used: 0,
          status: status
        };

        db.racks = db.racks || [];
        db.racks.unshift(newRack);
        db.warehouseRacks = db.racks;
        addAuditLog('MASTER-RACK', code, 'Menambah lokasi rak gudang baru: ' + code);
        saveDatabase(db);
        showToast('Lokasi Rak ' + code + ' berhasil ditambahkan!');
        setTimeout(function () {
          window.location.href = 'master-data.html#racks';
        }, 200);
      });
    }
  };

  var ProcurementCreatePageController = {
    init: function () {
      if (!document.getElementById('erpProcurementCreatePage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var suppSel = document.getElementById('poSuppSupplierSelect');
      var orderRefSel = document.getElementById('poSuppOrderRefSelect');
      var etaInp = document.getElementById('poSuppEtaDate');
      var tbody = document.getElementById('pagePoSupplierItemsTbody');
      var addBtn = document.getElementById('btnPageAddPoSupplierRow');
      var form = document.getElementById('formCreatePoSupplierPage');

      if (suppSel) {
        suppSel.innerHTML = '<option value="">-- Pilih Supplier / Prinsipal --</option>' +
          (db.suppliers || []).map(function (s) {
            return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name + ' (' + s.origin + ')') + '</option>';
          }).join('');
      }

      if (orderRefSel) {
        orderRefSel.innerHTML = '<option value="">-- Pengadaan Stok Bebas (Buffer Stock Gudang) --</option>' +
          (db.orders || []).filter(function (o) { return o.statusPemenuhan === 'Menunggu Pengadaan'; }).map(function (o) {
            return '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.id + ' — ' + o.customerName) + '</option>';
          }).join('');
      }

      var etaDefault = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];
      if (etaInp) etaInp.value = etaDefault;

      var calcTotals = function () {
        var total = 0;
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function (tr) {
          var price = Number(tr.querySelector('.po-cost').value) || 0;
          var qty = Number(tr.querySelector('.po-qty').value) || 0;
          var sub = price * qty;
          var subSpan = tr.querySelector('.po-subtotal');
          if (subSpan) subSpan.textContent = formatRupiah(sub);
          total += sub;
        });
        var grandEl = document.getElementById('pagePoSupplierGrandTotal');
        if (grandEl) grandEl.textContent = formatRupiah(total);
      };

      var addRow = function (preSku, preQty) {
        if (!tbody) return;
        var tr = document.createElement('tr');
        var rowIdx = tbody.children.length + 1;
        var skuOptions = '<option value="">-- Pilih SKU --</option>' +
          (db.products || []).map(function (p) {
            var sel = (preSku && p.sku === preSku) ? ' selected' : '';
            return '<option value="' + escapeHtml(p.sku) + '" data-cost="' + (p.cost || Math.round(p.price * 0.75)) + '" data-unit="' + (p.unit || 'Unit') + '"' + sel + '>' + escapeHtml(p.sku + ' — ' + p.name) + '</option>';
          }).join('');

        tr.innerHTML =
          '<td style="text-align:center;">' + rowIdx + '</td>' +
          '<td><select class="erp-select po-sku" required>' + skuOptions + '</select></td>' +
          '<td><input type="number" class="erp-input po-qty" min="1" value="' + (preQty || 50) + '" style="text-align:center;" required /></td>' +
          '<td style="text-align:center;"><span class="po-unit">Unit</span></td>' +
          '<td><input type="number" class="erp-input po-cost" min="0" value="0" style="text-align:right;" required /></td>' +
          '<td style="text-align:right; font-weight:600;"><span class="po-subtotal">Rp 0</span></td>' +
          '<td style="text-align:center;"><button type="button" class="btn-erp btn-erp-danger btn-erp-sm btn-del-row" aria-label="Hapus Baris"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>';

        var skuSel = tr.querySelector('.po-sku');
        var qtyInp = tr.querySelector('.po-qty');
        var costInp = tr.querySelector('.po-cost');
        var unitSpan = tr.querySelector('.po-unit');
        var delBtn = tr.querySelector('.btn-del-row');

        var updateSku = function () {
          var opt = skuSel.options[skuSel.selectedIndex];
          if (opt && opt.value) {
            var cst = Number(opt.getAttribute('data-cost')) || 0;
            costInp.value = cst;
            unitSpan.textContent = opt.getAttribute('data-unit') || 'Unit';
          }
          calcTotals();
        };

        skuSel.addEventListener('change', updateSku);
        qtyInp.addEventListener('input', calcTotals);
        costInp.addEventListener('input', calcTotals);
        delBtn.addEventListener('click', function () {
          var allRows = tbody.querySelectorAll('tr');
          if (allRows.length <= 1) {
            showToast('Minimal harus terdapat 1 baris barang dalam pengadaan.');
            return;
          }
          showConfirmAlert({
            type: 'warning',
            title: 'Hapus Baris Barang',
            message: 'Apakah Anda yakin ingin menghapus baris barang ini dari pengadaan?',
            confirmText: 'Hapus Baris',
            confirmClass: 'btn-erp-danger',
            onConfirm: function () {
              tr.remove();
              calcTotals();
              showToast('Baris barang telah dihapus.');
            }
          });
        });

        tbody.appendChild(tr);
        if (preSku) updateSku();
      };

      if (addBtn) {
        addBtn.addEventListener('click', function () { addRow(); });
      }

      if (db.products && db.products.length > 0) {
        addRow(db.products[0].sku, 50);
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var suppId = suppSel.value;
          var suppObj = (db.suppliers || []).find(function (s) { return s.id === suppId; }) || {};
          var orderRef = orderRefSel ? orderRefSel.value : '';
          var etaDate = etaInp.value;
          var topVal = document.getElementById('poSuppPaymentTerm').value;
          var notesVal = (document.getElementById('poSuppNotes').value || '').trim();

          var items = [];
          var total = 0;

          tbody.querySelectorAll('tr').forEach(function (tr) {
            var skuSel = tr.querySelector('.po-sku');
            var skuVal = skuSel.value;
            var qtyVal = Number(tr.querySelector('.po-qty').value) || 0;
            var costVal = Number(tr.querySelector('.po-cost').value) || 0;
            var prod = (db.products || []).find(function (p) { return p.sku === skuVal; }) || {};
            var lineSub = qtyVal * costVal;
            total += lineSub;

            items.push({
              sku: skuVal,
              name: prod.name || skuVal,
              qty: qtyVal,
              unit: prod.unit || 'Unit',
              cost: costVal,
              subtotal: lineSub
            });
          });

          if (items.length === 0) {
            showToast('Harap tambahkan minimal 1 baris SKU.');
            return;
          }

          var newId = 'PO-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000);

          var newPo = {
            id: newId,
            poId: newId,
            supplierId: suppId,
            supplierName: suppObj.name || 'Prinsipal Pabrik',
            refSoId: orderRef || 'BUFFER-STOCK',
            refOrderId: orderRef,
            poDate: new Date().toISOString().split('T')[0],
            orderDate: new Date().toISOString().split('T')[0],
            eta: etaDate,
            etaDate: etaDate,
            paymentTerm: topVal,
            status: 'Diajukan',
            statusApproval: 'Menunggu Persetujuan',
            statusPenerimaan: 'Dalam Perjalanan',
            totalHpp: total,
            total: total,
            items: items,
            notes: notesVal
          };

          db.procurements = db.procurements || [];
          db.procurements.unshift(newPo);
          db.supplierPurchaseOrders = db.procurements;
          addAuditLog('PO-SUPPLIER-CREATE', newId, 'Menerbitkan PO Supplier baru: ' + newId + ' (' + newPo.supplierName + ') senilai ' + formatRupiah(total));
          saveDatabase(db);
          showToast('PO Supplier ' + newId + ' berhasil diajukan!');
          setTimeout(function () {
            window.location.href = 'procurement.html';
          }, 200);
        });
      }
    }
  };

  var ProcurementDetailPageController = {
    init: function () {
      if (!document.getElementById('erpProcurementDetailPage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var params = new URLSearchParams(window.location.search);
      var poId = params.get('id');
      var poList = db.procurements || db.supplierPurchaseOrders || [];
      var po = poList.find(function (p) { return p.id === poId || p.poId === poId; });

      var heading = document.getElementById('poDetailHeading');
      var container = document.getElementById('procurementDetailContainer');
      if (!po) {
        if (heading) heading.textContent = 'PO Supplier Tidak Ditemukan';
        if (container) container.innerHTML = '<div class="erp-form-card"><p>Nomor PO supplier tidak valid atau telah dihapus.</p><a href="procurement.html" class="btn-erp btn-erp-primary">Kembali ke Pengadaan</a></div>';
        return;
      }

      var poCode = po.id || po.poId;
      if (heading) heading.textContent = 'Detail PO Supplier: ' + poCode;

      var roleCfg = RoleManager.getCurrentRoleConfig();
      var canApproveNow = roleCfg.canApprove && (po.statusApproval === 'Menunggu Persetujuan' || po.status === 'Diajukan' || po.status === 'Menunggu Approval');
      var poTotal = po.total !== undefined ? po.total : (po.totalHpp || 0);

      var itemsRows = (po.items || []).map(function (it, idx) {
        var unitCost = it.cost !== undefined ? it.cost : (it.hpp || 0);
        var lineSub = it.subtotal !== undefined ? it.subtotal : (it.qty * unitCost);
        return (
          '<tr>' +
          '<td style="text-align:center;">' + (idx + 1) + '</td>' +
          '<td><strong>' + escapeHtml(it.sku) + '</strong></td>' +
          '<td>' + escapeHtml(it.name) + '</td>' +
          '<td style="text-align:center; font-weight:600;">' + it.qty + '</td>' +
          '<td style="text-align:center;">' + escapeHtml(it.unit || 'Unit') + '</td>' +
          '<td style="text-align:right;">' + (roleCfg.canViewHPP ? formatRupiah(unitCost) : 'TERLINDUNGI') + '</td>' +
          '<td style="text-align:right; font-weight:700;">' + (roleCfg.canViewHPP ? formatRupiah(lineSub) : 'TERLINDUNGI') + '</td>' +
          '</tr>'
        );
      }).join('');

      container.innerHTML =
        '<div class="erp-status-progress-track">' +
        '  <div class="erp-status-progress-card"><span class="erp-status-progress-dim">Status Dokumen</span><div>' + renderStatusBadge(po.status || 'Diajukan') + '</div></div>' +
        '  <div class="erp-status-progress-card"><span class="erp-status-progress-dim">Status Persetujuan</span><div>' + renderStatusBadge(po.statusApproval || 'Menunggu Persetujuan') + '</div></div>' +
        '  <div class="erp-status-progress-card"><span class="erp-status-progress-dim">Status Logistik</span><div>' + renderStatusBadge(po.statusPenerimaan || 'Dalam Perjalanan') + '</div></div>' +
        '</div>' +

        '<div class="erp-form-card">' +
        '  <div class="erp-detail-grid">' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Supplier / Prinsipal</span><span class="erp-detail-val">' + escapeHtml(po.supplierName) + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Tautkan ke SO Pelanggan</span><span class="erp-detail-val cell-code">' + escapeHtml(po.refOrderId || po.refSoId || 'Buffer Stock Bebas') + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Tanggal Order</span><span class="erp-detail-val">' + escapeHtml(po.orderDate || po.poDate || '-') + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Estimasi Tiba (ETA)</span><span class="erp-detail-val">' + escapeHtml(po.etaDate || po.eta || '-') + '</span></div>' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Syarat Pembayaran</span><span class="erp-detail-val">' + escapeHtml(po.paymentTerm || 'T/T') + '</span></div>' +
        '  </div>' +
        '  <div class="erp-form-group erp-form-group-full">' +
        '    <span class="erp-detail-label">Catatan Pengadaan / Packing:</span>' +
        '    <p class="modal-notes-text">' + escapeHtml(po.notes || 'Standar container ekspor pallet kayu dilapisi plastik kedap air.') + '</p>' +
        '  </div>' +
        '</div>' +

        '<div class="erp-form-card">' +
        '  <div class="erp-table-wrap">' +
        '    <table class="erp-table">' +
        '      <thead>' +
        '        <tr>' +
        '          <th style="width:40px; text-align:center;">#</th>' +
        '          <th style="width:140px;">Kode SKU</th>' +
        '          <th>Deskripsi Nama Produk</th>' +
        '          <th style="width:80px; text-align:center;">Qty</th>' +
        '          <th style="width:80px; text-align:center;">Satuan</th>' +
        '          <th style="width:160px; text-align:right;">HPP Beli</th>' +
        '          <th style="width:170px; text-align:right;">Subtotal Beli</th>' +
        '        </tr>' +
        '      </thead>' +
        '      <tbody>' + itemsRows + '</tbody>' +
        '    </table>' +
        '  </div>' +
        '</div>' +

        '<div class="erp-form-card">' +
        '  <div class="erp-detail-grid">' +
        '    <div class="erp-detail-item"><span class="erp-detail-label">Total Nilai Pembelian HPP</span><span class="erp-detail-val-highlight">' + (roleCfg.canViewHPP ? formatRupiah(poTotal) : 'TERLINDUNGI') + '</span></div>' +
        '  </div>' +
        '  <div class="erp-form-actions-bar">' +
        '    <a href="procurement.html" class="btn-erp btn-erp-secondary"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg><span>Kembali</span></a>' +
        (canApproveNow ?
          '    <button type="button" class="btn-erp btn-erp-danger" id="btnPageRejectPo">Tolak PO Supplier</button>' +
          '    <button type="button" class="btn-erp btn-erp-success" id="btnPageApprovePo">Setujui PO Supplier</button>'
          : '') +
        '  </div>' +
        '</div>';

      var btnApprove = document.getElementById('btnPageApprovePo');
      var btnReject = document.getElementById('btnPageRejectPo');
      if (btnApprove) {
        btnApprove.addEventListener('click', function () {
          showConfirmAlert({
            type: 'success',
            title: 'Setujui PO Supplier ' + po.id,
            message: 'Otorisasi PO Supplier ' + po.supplierName + ' senilai ' + (roleCfg.canViewHPP ? formatRupiah(po.total) : 'HPP') + '? Pengadaan akan disetujui untuk pemenuhan pemasok.',
            confirmText: 'Setujui PO',
            confirmClass: 'btn-erp-success',
            onConfirm: function () {
              po.statusApproval = 'Disetujui';
              po.status = 'Disetujui';
              addAuditLog('PO-SUPPLIER-APPROVE', po.id, 'Menyetujui PO Supplier ' + po.id + ' (' + po.supplierName + ')');
              saveDatabase(db);
              showToast('PO Supplier ' + po.id + ' berhasil disetujui!');
              ProcurementDetailPageController.init();
            }
          });
        });
      }
      if (btnReject) {
        btnReject.addEventListener('click', function () {
          showConfirmAlert({
            type: 'danger',
            title: 'Tolak PO Supplier ' + po.id,
            message: 'Apakah Anda yakin ingin menolak PO Supplier ' + po.id + ' (' + po.supplierName + ')? Status pengadaan akan ditangguhkan.',
            confirmText: 'Tolak PO',
            confirmClass: 'btn-erp-danger',
            onConfirm: function () {
              po.statusApproval = 'Ditolak';
              po.status = 'Ditolak';
              addAuditLog('PO-SUPPLIER-REJECT', po.id, 'Menolak PO Supplier ' + po.id + ' (' + po.supplierName + ')');
              saveDatabase(db);
              showToast('PO Supplier ' + po.id + ' telah ditolak.');
              ProcurementDetailPageController.init();
            }
          });
        });
      }
    }
  };

  var InventoryGrCreatePageController = {
    init: function () {
      if (!document.getElementById('erpInventoryGrCreatePage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var poSel = document.getElementById('grSupplierPoSelect');
      var dateInp = document.getElementById('grDate');
      var tbody = document.getElementById('pageGrItemsTbody');
      var form = document.getElementById('formCreateGrPage');

      if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];

      var poList = db.procurements || db.supplierPurchaseOrders || [];

      if (poSel) {
        poSel.innerHTML = '<option value="">-- Pilih Dokumen PO Supplier Aktif --</option>' +
          poList.map(function (p) {
            var pid = p.id || p.poId;
            return '<option value="' + escapeHtml(pid) + '">' + escapeHtml(pid + ' — ' + p.supplierName + ' (' + (p.items || []).length + ' SKU)') + '</option>';
          }).join('');

        poSel.addEventListener('change', function () {
          var poId = poSel.value;
          var po = poList.find(function (p) { return (p.id || p.poId) === poId; });
          if (!tbody) return;
          if (!po || !po.items || po.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px;">Silakan pilih PO Supplier terlebih dahulu.</td></tr>';
            return;
          }

          var rackList = db.racks || db.warehouseRacks || [];
          var rackOptions = rackList.map(function (r) {
            return '<option value="' + escapeHtml(r.code) + '">' + escapeHtml(r.code) + '</option>';
          }).join('');

          tbody.innerHTML = po.items.map(function (it, idx) {
            return (
              '<tr>' +
              '<td style="text-align:center;">' + (idx + 1) + '</td>' +
              '<td><strong class="gr-sku">' + escapeHtml(it.sku) + '</strong><br><span class="cell-subtext">' + escapeHtml(it.name) + '</span></td>' +
              '<td style="text-align:center; font-weight:600;">' + it.qty + ' ' + escapeHtml(it.unit || 'Unit') + '</td>' +
              '<td><input type="number" class="erp-input gr-qty-passed" min="0" max="' + it.qty + '" value="' + it.qty + '" style="text-align:center;" required /></td>' +
              '<td><input type="number" class="erp-input gr-qty-hold" min="0" max="' + it.qty + '" value="0" style="text-align:center;" required /></td>' +
              '<td><select class="erp-select gr-rack">' + rackOptions + '</select></td>' +
              '</tr>'
            );
          }).join('');
        });

        // Trigger change if there is any PO
        if (poList.length > 0) {
          poSel.value = poList[0].id || poList[0].poId;
          poSel.dispatchEvent(new Event('change'));
        }
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var poId = poSel.value;
          var po = poList.find(function (p) { return (p.id || p.poId) === poId; });
          if (!po) {
            showToast('Pilih PO Supplier yang valid.');
            return;
          }

          var grId = 'GR-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000);
          var grDate = dateInp.value;
          var docRef = (document.getElementById('grDeliveryDocNum').value || '').trim();
          var inspector = (document.getElementById('grInspector').value || '').trim();
          var notes = (document.getElementById('grQcNotes').value || '').trim();

          tbody.querySelectorAll('tr').forEach(function (tr) {
            var skuEl = tr.querySelector('.gr-sku');
            if (!skuEl) return;
            var sku = skuEl.textContent.trim();
            var passed = parseInt(tr.querySelector('.gr-qty-passed').value, 10) || 0;
            var hold = parseInt(tr.querySelector('.gr-qty-hold').value, 10) || 0;
            var rack = tr.querySelector('.gr-rack').value;

            var inv = (db.inventory || []).find(function (i) { return i.sku === sku; });
            if (inv) {
              var curFisik = inv.fisik !== undefined ? inv.fisik : (inv.physical || 0);
              var curHold = inv.tertahan !== undefined ? inv.tertahan : (inv.held || 0);
              var curRes = inv.reservasi !== undefined ? inv.reservasi : (inv.reserved || 0);
              inv.fisik = curFisik + passed + hold;
              inv.tertahan = curHold + hold;
              inv.layak = Math.max(0, inv.fisik - inv.tertahan);
              inv.tersedia = Math.max(0, inv.layak - curRes);
              inv.physical = inv.fisik;
              inv.held = inv.tertahan;
              inv.location = rack;
            } else {
              db.inventory.push({
                sku: sku,
                fisik: passed + hold,
                tertahan: hold,
                layak: passed,
                reservasi: 0,
                tersedia: passed,
                physical: passed + hold,
                held: hold,
                reserved: 0,
                location: rack
              });
            }

            db.stockLedger = db.stockLedger || [];
            db.stockLedger.unshift({
              id: 'MUT-' + Math.floor(Math.random() * 90000 + 10000),
              date: grDate,
              refDoc: grId,
              sku: sku,
              type: 'MASUK',
              qty: passed + hold,
              balanceAfter: inv ? inv.fisik : (passed + hold),
              pic: inspector,
              officer: inspector
            });
          });

          po.statusPenerimaan = 'Diterima Gudang';
          po.status = 'Selesai';
          addAuditLog('GOODS-RECEIPT', grId, 'Menerima barang & uji QC untuk PO ' + po.id + ' (' + docRef + ') oleh ' + inspector);
          saveDatabase(db);
          showToast('Goods Receipt ' + grId + ' berhasil disimpan & saldo stok diperbarui!');
          setTimeout(function () {
            window.location.href = 'inventory.html#gr';
          }, 200);
        });
      }
    }
  };

  var DeliveryCreatePageController = {
    init: function () {
      if (!document.getElementById('erpDeliveryCreatePage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var ordSel = document.getElementById('delivOrderSelect');
      var dateInp = document.getElementById('delivDate');
      var tbody = document.getElementById('pageDeliveryItemsTbody');
      var destArea = document.getElementById('delivDestination');
      var form = document.getElementById('formCreateDeliveryPage');

      if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];

      if (ordSel) {
        var approvedOrders = (db.orders || []).filter(function (o) {
          return o.statusApproval === 'Disetujui' && o.statusPengiriman !== 'Terkirim Penuh';
        });

        ordSel.innerHTML = '<option value="">-- Pilih Pesanan Pelanggan --</option>' +
          approvedOrders.map(function (o) {
            return '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.id + ' — ' + o.customerName) + '</option>';
          }).join('');

        ordSel.addEventListener('change', function () {
          var ordId = ordSel.value;
          var ord = (db.orders || []).find(function (o) { return o.id === ordId; });
          if (!tbody) return;
          if (!ord) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px;">Silakan pilih SO terlebih dahulu.</td></tr>';
            if (destArea) destArea.value = '';
            return;
          }

          var cust = (db.customers || []).find(function (c) { return c.id === ord.customerId; }) || {};
          if (destArea) destArea.value = cust.address || 'Kawasan Industri, Gudang Penerima';

          tbody.innerHTML = (ord.items || []).map(function (it, idx) {
            var inv = (db.inventory || []).find(function (i) { return i.sku === it.sku; }) || {};
            var res = inv.reservasi !== undefined ? inv.reservasi : (inv.reserved || 0);
            return (
              '<tr>' +
              '<td style="text-align:center;"><input type="checkbox" class="deliv-item-check" checked /></td>' +
              '<td><strong class="deliv-sku">' + escapeHtml(it.sku) + '</strong><br><span class="cell-subtext">' + escapeHtml(it.name) + '</span></td>' +
              '<td style="text-align:center;">' + it.qty + '</td>' +
              '<td style="text-align:center; font-weight:600; color:var(--erp-navy);">' + res + '</td>' +
              '<td><input type="number" class="erp-input deliv-qty-send" min="1" max="' + it.qty + '" value="' + Math.min(it.qty, Math.max(1, res)) + '" style="text-align:center;" required /></td>' +
              '<td style="text-align:center;">' + escapeHtml(it.unit || 'Unit') + '</td>' +
              '</tr>'
            );
          }).join('');
        });

        if (approvedOrders.length > 0) {
          ordSel.value = approvedOrders[0].id;
          ordSel.dispatchEvent(new Event('change'));
        }
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var ordId = ordSel.value;
          var ord = (db.orders || []).find(function (o) { return o.id === ordId; });
          if (!ord) {
            showToast('Pilih pesanan yang valid.');
            return;
          }

          var sjId = 'SJ-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000);
          var delivDate = dateInp.value;
          var courier = (document.getElementById('delivCourier').value || '').trim();
          var driver = (document.getElementById('delivDriver').value || '').trim();
          var plate = (document.getElementById('delivVehiclePlate').value || '').trim();
          var dest = (destArea ? destArea.value : '').trim();
          var notes = (document.getElementById('delivNotes').value || '').trim();

          var sentItems = [];
          tbody.querySelectorAll('tr').forEach(function (tr) {
            var check = tr.querySelector('.deliv-item-check');
            if (check && check.checked) {
              var sku = tr.querySelector('.deliv-sku').textContent.trim();
              var qty = parseInt(tr.querySelector('.deliv-qty-send').value, 10) || 0;
              var prod = (db.products || []).find(function (p) { return p.sku === sku; }) || {};

              var inv = (db.inventory || []).find(function (i) { return i.sku === sku; });
              if (inv) {
                var curFisik = inv.fisik !== undefined ? inv.fisik : (inv.physical || 0);
                var curHold = inv.tertahan !== undefined ? inv.tertahan : (inv.held || 0);
                var curRes = inv.reservasi !== undefined ? inv.reservasi : (inv.reserved || 0);
                inv.fisik = Math.max(0, curFisik - qty);
                inv.reservasi = Math.max(0, curRes - qty);
                inv.layak = Math.max(0, inv.fisik - curHold);
                inv.tersedia = Math.max(0, inv.layak - inv.reservasi);
                inv.physical = inv.fisik;
                inv.reserved = inv.reservasi;
              }

              db.stockLedger = db.stockLedger || [];
              db.stockLedger.unshift({
                id: 'MUT-' + Math.floor(Math.random() * 90000 + 10000),
                date: delivDate,
                refDoc: sjId,
                sku: sku,
                type: 'KELUAR',
                qty: qty,
                balanceAfter: inv ? inv.fisik : 0,
                pic: driver + ' (' + plate + ')',
                officer: driver + ' (' + plate + ')'
              });

              sentItems.push({
                sku: sku,
                name: prod.name || sku,
                qty: qty,
                unit: prod.unit || 'Unit'
              });
            }
          });

          if (sentItems.length === 0) {
            showToast('Pilih minimal 1 item untuk dikirim.');
            return;
          }

          var newDelivery = {
            id: sjId,
            orderId: ord.id,
            clientPoNumber: ord.clientPoNumber,
            customerName: ord.customerName,
            deliveryDate: delivDate,
            courier: courier,
            driver: driver,
            driverName: driver,
            vehiclePlate: plate,
            recipientPic: ord.customerName,
            destination: dest,
            address: dest,
            status: 'Sedang Dikirim',
            items: sentItems,
            notes: notes
          };

          db.deliveries = db.deliveries || [];
          db.deliveries.unshift(newDelivery);

          ord.statusPengiriman = 'Terkirim Sebagian';
          addAuditLog('DELIVERY-CREATE', sjId, 'Menerbitkan Surat Jalan ' + sjId + ' untuk ' + ord.customerName + ' armada ' + plate);
          saveDatabase(db);
          showToast('Surat Jalan ' + sjId + ' berhasil diterbitkan & stok fisik terpotong!');
          setTimeout(function () {
            window.location.href = 'delivery.html';
          }, 200);
        });
      }
    }
  };

  var DeliveryBastPageController = {
    init: function () {
      if (!document.getElementById('erpDeliveryBastPage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var params = new URLSearchParams(window.location.search);
      var delivId = params.get('id');
      var deliv = (db.deliveries || []).find(function (d) { return d.id === delivId; });

      var docIdEl = document.getElementById('bastDocId');
      var custEl = document.getElementById('bastCustomerName');
      var courierEl = document.getElementById('bastCourierVehicle');
      var dateInp = document.getElementById('bastReceivedDate');
      var form = document.getElementById('formUploadBastPage');

      if (!deliv) {
        showToast('Dokumen pengiriman tidak ditemukan.');
        return;
      }

      if (docIdEl) docIdEl.textContent = deliv.id;
      if (custEl) custEl.textContent = deliv.customerName;
      if (courierEl) courierEl.textContent = (deliv.driver || deliv.courier || '-') + ' (' + (deliv.vehiclePlate || '-') + ')';
      if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var receiver = (document.getElementById('bastReceiverName').value || '').trim();
          var bastDate = dateInp.value;
          var fileEl = document.getElementById('bastFile');
          var fileName = (fileEl && fileEl.files && fileEl.files.length > 0) ? fileEl.files[0].name : ('BAST-' + deliv.id + '-Signed.pdf');

          deliv.status = 'Terkirim & BAST';
          deliv.bastFileName = fileName;
          deliv.recipientPic = receiver;

          var ord = (db.orders || []).find(function (o) { return o.id === deliv.orderId; });
          if (ord) {
            ord.statusPengiriman = 'Terkirim Penuh';
            if (ord.statusPenagihan === 'Lunas') {
              ord.statusOrder = 'Selesai';
            }
          }

          db.archives = db.archives || [];
          db.archives.unshift({
            id: 'ARC-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000),
            docType: 'Surat Jalan & BAST',
            docNumber: deliv.id,
            refId: deliv.orderId,
            partner: deliv.customerName,
            date: bastDate,
            fileName: fileName,
            uploadedBy: 'Budi Santoso (Kepala Gudang)'
          });

          addAuditLog('BAST-UPLOAD', deliv.id, 'Verifikasi BAST fisik ' + deliv.id + ' penerima ' + receiver);
          saveDatabase(db);
          showToast('BAST untuk ' + deliv.id + ' berhasil diverifikasi & disimpan!');
          setTimeout(function () {
            window.location.href = 'delivery.html';
          }, 200);
        });
      }
    }
  };

  var DeliveryPrintPageController = {
    init: function () {
      if (!document.getElementById('erpDeliveryPrintPage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var params = new URLSearchParams(window.location.search);
      var delivId = params.get('id');
      var container = document.getElementById('deliveryPrintContainer');
      if (!container) return;

      var deliv = (db.deliveries || []).find(function (d) { return d.id === delivId; });
      if (!deliv) {
        container.innerHTML = '<p>Dokumen Surat Jalan tidak ditemukan.</p><a href="delivery.html" class="btn-erp btn-erp-primary">Kembali</a>';
        return;
      }

      var ord = (db.orders || []).find(function (o) { return o.id === deliv.orderId; }) || {};
      var cust = (db.customers || []).find(function (c) { return c.id === ord.customerId; }) || {};

      var itemsRows = (deliv.items || []).map(function (it, idx) {
        return (
          '<tr>' +
          '<td style="text-align:center;">' + (idx + 1) + '</td>' +
          '<td><strong>' + escapeHtml(it.sku) + '</strong></td>' +
          '<td>' + escapeHtml(it.name) + '</td>' +
          '<td style="text-align:center; font-weight:700;">' + it.qty + ' ' + escapeHtml(it.unit || 'Unit') + '</td>' +
          '<td>Kondisi Baru, Segel Utuh & Bebas Cacat</td>' +
          '</tr>'
        );
      }).join('');

      container.innerHTML =
        '<div class="erp-official-doc">' +
        '  <div class="erp-doc-header">' +
        '    <div class="erp-doc-brand">' +
        '      <div>' +
        '        <div class="erp-doc-company-name">PT NUSANTARA PUNCAK PERKASA</div>' +
        '        <div class="erp-doc-company-info">Solusi Daya Industri B2B Terpadu: Baterai, UPS, Stabilizer & Solar Power</div>' +
        '        <div class="erp-doc-company-info">' + escapeHtml(db.meta.address) + ' • Telp: (021) 8834-9021</div>' +
        '      </div>' +
        '    </div>' +
        '    <div class="erp-doc-title-block">' +
        '      <div class="erp-doc-title">SURAT JALAN PENGIRIMAN</div>' +
        '      <div class="erp-doc-number">' + escapeHtml(deliv.id) + '</div>' +
        '      <div class="cell-subtext">Tanggal Kirim: ' + escapeHtml(deliv.deliveryDate) + '</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-meta-grid">' +
        '    <div class="erp-doc-meta-col">' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Tujuan Pengiriman:</span><strong class="erp-doc-meta-val">' + escapeHtml(deliv.customerName) + '</strong></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Alamat Proyek/Site:</span><span class="erp-doc-meta-val">' + escapeHtml(deliv.destination || cust.address || 'Kawasan Industri') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">PIC Penerima Lokasi:</span><span class="erp-doc-meta-val">' + escapeHtml(deliv.recipientPic || cust.pic || '-') + '</span></div>' +
        '    </div>' +
        '    <div class="erp-doc-meta-col">' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Referensi SO:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(deliv.orderId) + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">No. PO Klien:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(ord.clientPoNumber || '-') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Pengemudi / Nopol:</span><span class="erp-doc-meta-val">' + escapeHtml((deliv.driver || deliv.courier) + ' • ' + (deliv.vehiclePlate || '')) + '</span></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-table-wrap">' +
        '    <table class="erp-doc-table">' +
        '      <thead>' +
        '        <tr>' +
        '          <th style="width:40px; text-align:center;">No</th>' +
        '          <th style="width:140px;">Kode SKU</th>' +
        '          <th>Deskripsi Spesifikasi Barang</th>' +
        '          <th style="width:110px; text-align:center;">Kuantitas Fisik</th>' +
        '          <th style="width:200px;">Keterangan Inspeksi</th>' +
        '        </tr>' +
        '      </thead>' +
        '      <tbody>' + itemsRows + '</tbody>' +
        '    </table>' +
        '  </div>' +
        '  <div class="erp-doc-signatures-4">' +
        '    <div class="erp-signature-box"><div class="erp-signature-role">Dibuat Oleh (Admin/Sales)</div><div class="erp-signature-space"></div><div class="erp-signature-signer">Nadia Pramesti<br><span class="cell-subtext-sm">Sales &amp; Operasional</span></div></div>' +
        '    <div class="erp-signature-box"><div class="erp-signature-role">Gudang Pengirim (Checker)</div><div class="erp-signature-space"></div><div class="erp-signature-signer">Budi Santoso<br><span class="cell-subtext-sm">Kepala Gudang NPP</span></div></div>' +
        '    <div class="erp-signature-box"><div class="erp-signature-role">Pengemudi / Kurir</div><div class="erp-signature-space"></div><div class="erp-signature-signer">' + escapeHtml(deliv.driver || deliv.courier || 'Kurir Logistik') + '<br><span class="cell-subtext-sm">Ekspedisi Logistik</span></div></div>' +
        '    <div class="erp-signature-box"><div class="erp-signature-role">Diterima Lengkap (Pelanggan)</div><div class="erp-signature-space"></div><div class="erp-signature-signer">' + escapeHtml(deliv.recipientPic || deliv.customerName) + '<br><span class="cell-subtext-sm">Tanda Tangan &amp; Cap Basah</span></div></div>' +
        '  </div>' +
        '</div>';
    }
  };

  var BillingCreatePageController = {
    init: function () {
      if (!document.getElementById('erpBillingCreatePage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var ordSel = document.getElementById('invOrderSelect');
      var typeSel = document.getElementById('invBillingType');
      var dateInp = document.getElementById('invDate');
      var dueInp = document.getElementById('invDueDate');
      var form = document.getElementById('formCreateInvoicePage');

      var today = new Date().toISOString().split('T')[0];
      var due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      if (dateInp) dateInp.value = today;
      if (dueInp) dueInp.value = due;

      var updateCalc = function () {
        var ordId = ordSel ? ordSel.value : '';
        var ord = (db.orders || []).find(function (o) { return o.id === ordId; });
        var bType = typeSel ? typeSel.value : 'Pelunasan 100%';

        var dpp = 0;
        if (ord) {
          var ratio = 1;
          if (bType.indexOf('30%') !== -1) ratio = 0.3;
          else if (bType.indexOf('50%') !== -1) ratio = 0.5;
          else if (bType.indexOf('20%') !== -1) ratio = 0.2;
          dpp = Math.round((ord.dpp || 0) * ratio);
        }

        var ppn = Math.round(dpp * 0.11);
        var grand = dpp + ppn;

        var dppEl = document.getElementById('invCalcDpp');
        var ppnEl = document.getElementById('invCalcPpn');
        var totalEl = document.getElementById('invCalcTotal');
        if (dppEl) dppEl.textContent = formatRupiah(dpp);
        if (ppnEl) ppnEl.textContent = formatRupiah(ppn);
        if (totalEl) totalEl.textContent = formatRupiah(grand);
      };

      if (ordSel) {
        var unbilledOrders = (db.orders || []).filter(function (o) {
          return o.statusApproval === 'Disetujui' && o.statusPenagihan !== 'Lunas';
        });

        ordSel.innerHTML = '<option value="">-- Pilih Pesanan Pelanggan --</option>' +
          unbilledOrders.map(function (o) {
            return '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.id + ' — ' + o.customerName + ' (' + formatRupiah(o.total) + ')') + '</option>';
          }).join('');

        ordSel.addEventListener('change', updateCalc);
        if (typeSel) typeSel.addEventListener('change', updateCalc);

        if (unbilledOrders.length > 0) {
          ordSel.value = unbilledOrders[0].id;
          updateCalc();
        }
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var ordId = ordSel.value;
          var ord = (db.orders || []).find(function (o) { return o.id === ordId; });
          if (!ord) {
            showToast('Pilih pesanan yang valid.');
            return;
          }

          var bType = typeSel.value;
          var invDate = dateInp.value;
          var dueDate = dueInp.value;
          var notes = (document.getElementById('invNotes').value || '').trim();

          var ratio = 1;
          if (bType.indexOf('30%') !== -1) ratio = 0.3;
          else if (bType.indexOf('50%') !== -1) ratio = 0.5;
          else if (bType.indexOf('20%') !== -1) ratio = 0.2;

          var dpp = Math.round((ord.dpp || 0) * ratio);
          var ppn = Math.round(dpp * 0.11);
          var total = dpp + ppn;

          var invId = 'INV-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000);

          var newInv = {
            id: invId,
            orderId: ord.id,
            customerName: ord.customerName,
            clientPoNumber: ord.clientPoNumber,
            invoiceDate: invDate,
            dueDate: dueDate,
            billingType: bType,
            bankAccount: 'Bank Central Asia (BCA) 521-098-7741',
            dpp: dpp,
            ppn: ppn,
            total: total,
            paidAmount: 0,
            status: 'Belum Dibayar',
            items: ord.items || [],
            notes: notes
          };

          db.invoices = db.invoices || [];
          db.invoices.unshift(newInv);

          ord.statusPenagihan = (ratio === 1) ? 'Invoice Terbit' : 'Ditagih Sebagian';
          addAuditLog('INVOICE-CREATE', invId, 'Menerbitkan faktur komersial ' + invId + ' (' + bType + ') untuk ' + ord.customerName + ' senilai ' + formatRupiah(total));
          saveDatabase(db);
          showToast('Faktur Penjualan ' + invId + ' berhasil diterbitkan!');
          setTimeout(function () {
            window.location.href = 'billing.html';
          }, 200);
        });
      }
    }
  };

  var BillingPaymentPageController = {
    init: function () {
      if (!document.getElementById('erpBillingPaymentPage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var params = new URLSearchParams(window.location.search);
      var invId = params.get('id');
      var inv = (db.invoices || []).find(function (i) { return i.id === invId; });

      var invNoEl = document.getElementById('payInvNumber');
      var custEl = document.getElementById('payCustomerName');
      var totalEl = document.getElementById('payInvoiceTotal');
      var amountInp = document.getElementById('payAmount');
      var dateInp = document.getElementById('payDate');
      var form = document.getElementById('formRecordPaymentPage');

      if (!inv) {
        showToast('Faktur tagihan tidak ditemukan.');
        return;
      }

      var remaining = Math.max(0, (inv.total || 0) - (inv.paidAmount || 0));

      if (invNoEl) invNoEl.textContent = inv.id;
      if (custEl) custEl.textContent = inv.customerName;
      if (totalEl) totalEl.textContent = formatRupiah(inv.total) + ' (Sisa: ' + formatRupiah(remaining) + ')';
      if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];
      if (amountInp) amountInp.value = remaining;

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var payAmount = parseFloat(amountInp.value) || 0;
          var payDate = dateInp.value;
          var bank = document.getElementById('payBank').value;
          var ref = (document.getElementById('payRefNumber').value || '').trim();

          inv.paidAmount = Math.min(inv.total, (inv.paidAmount || 0) + payAmount);
          if (inv.paidAmount >= inv.total) {
            inv.status = 'Lunas';
          } else {
            inv.status = 'Dibayar Parsial';
          }

          var ord = (db.orders || []).find(function (o) { return o.id === inv.orderId; });
          if (ord) {
            if (inv.status === 'Lunas') {
              ord.statusPenagihan = 'Lunas';
              ord.statusPembayaran = 'Lunas';
              if (ord.statusPengiriman === 'Terkirim Penuh') {
                ord.statusOrder = 'Selesai';
              }
            } else {
              ord.statusPembayaran = 'Dibayar Sebagian';
            }
          }

          addAuditLog('PAYMENT-RECORD', inv.id, 'Menerima pembayaran ' + formatRupiah(payAmount) + ' via ' + bank + ' (' + ref + ')');
          saveDatabase(db);
          showToast('Pembayaran ' + formatRupiah(payAmount) + ' berhasil dibukukan!');
          setTimeout(function () {
            window.location.href = 'billing.html';
          }, 200);
        });
      }
    }
  };

  var BillingPrintPageController = {
    init: function () {
      if (!document.getElementById('erpBillingPrintPage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      var db = window.NPP_ERP_DATA;
      var params = new URLSearchParams(window.location.search);
      var invId = params.get('id');
      var container = document.getElementById('billingPrintContainer');
      if (!container) return;

      var inv = (db.invoices || []).find(function (i) { return i.id === invId; });
      if (!inv) {
        container.innerHTML = '<p>Dokumen Faktur Penjualan tidak ditemukan.</p><a href="billing.html" class="btn-erp btn-erp-primary">Kembali</a>';
        return;
      }

      var ord = (db.orders || []).find(function (o) { return o.id === inv.orderId; }) || {};
      var cust = (db.customers || []).find(function (c) { return c.id === ord.customerId; }) || {};

      var itemsRows = (inv.items || ord.items || []).map(function (it, idx) {
        var price = it.price || 0;
        var sub = it.subtotal || (it.qty * price);
        return (
          '<tr>' +
          '<td style="text-align:center;">' + (idx + 1) + '</td>' +
          '<td><strong>' + escapeHtml(it.sku) + '</strong></td>' +
          '<td>' + escapeHtml(it.name) + '</td>' +
          '<td style="text-align:center; font-weight:700;">' + it.qty + ' ' + escapeHtml(it.unit || 'Unit') + '</td>' +
          '<td style="text-align:right;">' + formatRupiah(price) + '</td>' +
          '<td style="text-align:right; font-weight:700;">' + formatRupiah(sub) + '</td>' +
          '</tr>'
        );
      }).join('');

      container.innerHTML =
        '<div class="erp-official-doc">' +
        '  <div class="erp-doc-header">' +
        '    <div class="erp-doc-brand">' +
        '      <div>' +
        '        <div class="erp-doc-company-name">PT NUSANTARA PUNCAK PERKASA</div>' +
        '        <div class="erp-doc-company-info">Solusi Daya Industri B2B Terpadu: Battery, UPS, Stabilizer & Inverter</div>' +
        '        <div class="erp-doc-company-info">' + escapeHtml(db.meta.address) + ' • NPWP: ' + escapeHtml(db.meta.npwp) + ' • Telp: (021) 8834-9021</div>' +
        '      </div>' +
        '    </div>' +
        '    <div class="erp-doc-title-block">' +
        '      <div class="erp-doc-title">FAKTUR PENJUALAN</div>' +
        '      <div class="erp-doc-number">' + escapeHtml(inv.id) + '</div>' +
        '      <div class="cell-subtext">Tanggal Terbit: ' + escapeHtml(inv.invoiceDate) + '</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-meta-grid">' +
        '    <div class="erp-doc-meta-col">' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Ditagihkan Kepada:</span><strong class="erp-doc-meta-val">' + escapeHtml(inv.customerName) + '</strong></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">NPWP Pelanggan:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(cust.npwp || '01.345.678.9-012.000') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Alamat Penagihan:</span><span class="erp-doc-meta-val">' + escapeHtml(cust.address || 'Kawasan Industri') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">PIC Pembelian:</span><span class="erp-doc-meta-val">' + escapeHtml(cust.pic || '-') + '</span></div>' +
        '    </div>' +
        '    <div class="erp-doc-meta-col">' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">No. PO Klien:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(inv.clientPoNumber || ord.clientPoNumber || '-') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Referensi SO:</span><span class="erp-doc-meta-val cell-code">' + escapeHtml(inv.orderId) + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Syarat Pembayaran:</span><span class="erp-doc-meta-val">' + escapeHtml(cust.paymentTerm || ord.paymentTerm || 'Net 30') + '</span></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Jatuh Tempo:</span><strong class="erp-doc-meta-val" style="color:var(--status-danger-text);">' + escapeHtml(inv.dueDate) + '</strong></div>' +
        '      <div class="erp-doc-meta-row"><span class="erp-doc-meta-label">Termin Penagihan:</span><span class="erp-doc-meta-val">' + escapeHtml(inv.billingType || 'Pelunasan 100%') + '</span></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-table-wrap">' +
        '    <table class="erp-doc-table">' +
        '      <thead>' +
        '        <tr>' +
        '          <th style="width:40px; text-align:center;">No</th>' +
        '          <th style="width:140px;">Kode SKU</th>' +
        '          <th>Deskripsi Spesifikasi Barang</th>' +
        '          <th style="width:100px; text-align:center;">Kuantitas</th>' +
        '          <th style="width:140px; text-align:right;">Harga Satuan B2B</th>' +
        '          <th style="width:150px; text-align:right;">Subtotal DPP</th>' +
        '        </tr>' +
        '      </thead>' +
        '      <tbody>' + itemsRows + '</tbody>' +
        '    </table>' +
        '  </div>' +
        '  <div class="erp-doc-calc-grid">' +
        '    <div class="erp-doc-calc-box">' +
        '      <div class="erp-doc-calc-row"><span>Dasar Pengenaan Pajak (DPP):</span><strong>' + formatRupiah(inv.dpp) + '</strong></div>' +
        '      <div class="erp-doc-calc-row"><span>Pajak Pertambahan Nilai (PPN 11%):</span><strong>' + formatRupiah(inv.ppn) + '</strong></div>' +
        '      <div class="erp-doc-calc-row-grand"><span>TOTAL TAGIHAN:</span><strong>' + formatRupiah(inv.total) + '</strong></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-terbilang-box">' +
        '    Terbilang: <strong>## ' + escapeHtml(terbilang(inv.total)) + ' ##</strong>' +
        '  </div>' +
        '  <div class="erp-doc-bank-box">' +
        '    <div class="erp-doc-bank-title">Instruksi Pembayaran Transfer Bank:</div>' +
        '    <div class="erp-doc-bank-list">' +
        '      <div>1. <strong>Bank Central Asia (BCA)</strong> — No. Rekening: <strong>521-098-7741</strong> a/n PT Nusantara Puncak Perkasa (KCU Bekasi)</div>' +
        '      <div>2. <strong>Bank Mandiri</strong> — No. Rekening: <strong>156-00-0988234-5</strong> a/n PT Nusantara Puncak Perkasa (KCP Bekasi Juanda)</div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-doc-signatures-2">' +
        '    <div class="erp-signature-box"><div class="erp-signature-role">Diterima &amp; Disetujui Oleh (Pelanggan)</div><div class="erp-signature-space"></div><div class="erp-signature-signer">' + escapeHtml(inv.customerName) + '<br><span class="cell-subtext-sm">(Tanda Tangan, Nama Jelas &amp; Cap Perusahaan)</span></div></div>' +
        '    <div class="erp-signature-box"><div class="erp-signature-role">Hormat Kami, PT Nusantara Puncak Perkasa</div><div class="erp-signature-space"><div class="erp-doc-digital-stamp">PT NPP<br>FINANCE<br>OFFICIAL</div></div><div class="erp-signature-signer">Siti Rahmawati / Ir. Darmawan Putra<br><span class="cell-subtext-sm">Finance &amp; Direktur Operasional</span></div></div>' +
        '  </div>' +
        '</div>';
    }
  };

  /* ==========================================================================
     14B. KONTROLER MODUL ARSIP DOKUMEN DIGITAL & AUDIT TRAIL (HLD BAGIAN 9)
     ========================================================================== */
  var ArchiveController = {
    init: function () {
      if (!document.getElementById('erpArchivePage')) return;
      ensureDataSchema(window.NPP_ERP_DATA);
      this.bindTabSwitching();
      this.updateCounts();
      this.initArchiveTable();
      this.initAuditTable();
      this.bindPreviewModal();
    },

    updateCounts: function () {
      var db = window.NPP_ERP_DATA;
      var archives = db.archives || [];
      var auditLogs = db.auditLogs || [];

      var elA = document.getElementById('countTabArchives');
      var elL = document.getElementById('countTabAuditLogs');
      if (elA) elA.textContent = archives.length;
      if (elL) elL.textContent = auditLogs.length;

      var kpiTotal = document.getElementById('kpiTotalArchives');
      var kpiPo = document.getElementById('kpiPoArchives');
      var kpiBast = document.getElementById('kpiBastArchives');
      var kpiLogs = document.getElementById('kpiTotalAuditLogs');

      if (kpiTotal) kpiTotal.textContent = archives.length + ' Dokumen';
      if (kpiPo) {
        var poCount = archives.filter(function (a) {
          return (a.docType || '').indexOf('PO') !== -1;
        }).length;
        kpiPo.textContent = poCount + ' Berkas';
      }
      if (kpiBast) {
        var bastCount = archives.filter(function (a) {
          return (a.docType || '').indexOf('Surat Jalan') !== -1 || (a.docType || '').indexOf('BAST') !== -1;
        }).length;
        kpiBast.textContent = bastCount + ' Berkas';
      }
      if (kpiLogs) kpiLogs.textContent = auditLogs.length + ' Catatan';
    },

    bindTabSwitching: function () {
      var self = this;
      var tabBtns = document.querySelectorAll('[data-archive-tab]');
      var tabPanes = document.querySelectorAll('[data-archive-pane]');

      tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-archive-tab');
          tabBtns.forEach(function (b) {
            b.classList.toggle('erp-tab-btn-active', b.getAttribute('data-archive-tab') === target);
          });
          tabPanes.forEach(function (pane) {
            pane.classList.toggle('tab-pane-active', pane.getAttribute('data-archive-pane') === target);
          });
        });
      });
    },

    initArchiveTable: function () {
      this.archiveTable = new TableEngine({
        tbodyId: 'archiveTableBody',
        paginationId: 'archivePagination',
        searchInputId: 'archiveSearchInput',
        pageSizeSelectId: 'archivePageSizeSelect',
        defaultPageSize: 5,
        colSpan: 7,
        filters: [
          {
            selectId: 'archiveFilterDocType',
            match: function (item, val) {
              return !val || item.docType === val;
            }
          }
        ],
        searchFn: function (d, q) {
          var text = [
            d.id,
            d.docType,
            d.docNumber,
            d.refId,
            d.partner,
            d.fileName,
            d.uploadedBy,
            d.date
          ].join(' ').toLowerCase();
          return text.indexOf(q.toLowerCase()) !== -1;
        },
        getData: function () {
          return window.NPP_ERP_DATA.archives || [];
        },
        renderRow: function (d) {
          var badgeClass = 'badge-neutral';
          if ((d.docType || '').indexOf('PO') !== -1) badgeClass = 'badge-info';
          else if ((d.docType || '').indexOf('Surat Jalan') !== -1 || (d.docType || '').indexOf('BAST') !== -1) badgeClass = 'badge-primary';
          else if ((d.docType || '').indexOf('Invoice') !== -1) badgeClass = 'badge-warning';

          return (
            '<tr>' +
            '<td>' + escapeHtml(d.date || '-') + '</td>' +
            '<td><span class="badge-status ' + badgeClass + '">' + escapeHtml(d.docType || 'Dokumen') + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(d.docNumber || d.id) + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(d.refId || '-') + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(d.partner || '-') + '</span></td>' +
            '<td><span class="cell-subtext">' + escapeHtml(d.fileName || '-') + '</span></td>' +
            '<td>' +
            '<div class="erp-action-btns">' +
            '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" onclick="NPP_ERP.ArchiveController.openDocModal(\'' + d.id + '\')">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
            '<span>Lihat / Unduh</span>' +
            '</button>' +
            '</div>' +
            '</td>' +
            '</tr>'
          );
        }
      });
      this.archiveTable.render();
    },

    initAuditTable: function () {
      this.auditTable = new TableEngine({
        tbodyId: 'auditTableBody',
        paginationId: 'auditPagination',
        searchInputId: 'auditSearchInput',
        pageSizeSelectId: 'auditPageSizeSelect',
        defaultPageSize: 5,
        colSpan: 6,
        filters: [
          {
            selectId: 'auditFilterRole',
            match: function (item, val) {
              return !val || item.role === val;
            }
          }
        ],
        searchFn: function (log, q) {
          var text = [
            log.id,
            log.timestamp,
            log.user,
            log.role,
            log.action,
            log.target,
            log.detail
          ].join(' ').toLowerCase();
          return text.indexOf(q.toLowerCase()) !== -1;
        },
        getData: function () {
          return window.NPP_ERP_DATA.auditLogs || [];
        },
        renderRow: function (log) {
          var actionBadge = 'badge-info';
          if ((log.action || '').indexOf('REJECT') !== -1) actionBadge = 'badge-danger';
          else if ((log.action || '').indexOf('APPROVE') !== -1) actionBadge = 'badge-success';
          else if ((log.action || '').indexOf('CREATE') !== -1 || (log.action || '').indexOf('INPUT') !== -1) actionBadge = 'badge-info';
          else if ((log.action || '').indexOf('INVOICE') !== -1 || (log.action || '').indexOf('PAYMENT') !== -1) actionBadge = 'badge-warning';

          return (
            '<tr>' +
            '<td><span class="cell-code" style="font-size:0.75rem;">' + escapeHtml(log.timestamp || '-') + '</span></td>' +
            '<td><strong>' + escapeHtml(log.user || 'Sistem NPP') + '</strong></td>' +
            '<td><span class="badge-status badge-neutral">' + escapeHtml(log.role || 'Sistem') + '</span></td>' +
            '<td><span class="badge-status ' + actionBadge + '">' + escapeHtml(log.action || 'LOG') + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(log.target || '-') + '</span></td>' +
            '<td><span>' + escapeHtml(log.detail || '-') + '</span></td>' +
            '</tr>'
          );
        }
      });
      this.auditTable.render();
    },

    bindPreviewModal: function () {
      var modal = document.getElementById('archiveDocModal');
      var closeBtn = document.getElementById('btnCloseArchiveModal');
      var dismissBtn = document.getElementById('btnDismissArchiveModal');
      var downloadBtn = document.getElementById('btnDownloadArchiveFile');

      if (!modal) return;

      var closeModal = function () {
        modal.classList.remove('modal-open');
        modal.setAttribute('aria-hidden', 'true');
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });

      if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
          var fname = downloadBtn.getAttribute('data-filename') || 'Dokumen-NPP.pdf';
          showToast('Mengunduh berkas arsip resmi: ' + fname);
        });
      }
    },

    openDocModal: function (id) {
      var db = window.NPP_ERP_DATA;
      var doc = (db.archives || []).find(function (a) { return a.id === id; });
      if (!doc) return;

      var modal = document.getElementById('archiveDocModal');
      var titleEl = document.getElementById('archiveModalTitle');
      var subtitleEl = document.getElementById('archiveModalSubtitle');
      var metaGrid = document.getElementById('archiveModalMetaGrid');
      var viewer = document.getElementById('archiveModalViewer');
      var directLink = document.getElementById('btnArchiveDirectLink');
      var downloadBtn = document.getElementById('btnDownloadArchiveFile');

      if (!modal) return;

      if (titleEl) titleEl.textContent = 'Pratinjau Dokumen: ' + (doc.docNumber || doc.id);
      if (subtitleEl) subtitleEl.textContent = doc.docType + ' • Diunggah oleh: ' + (doc.uploadedBy || 'Petugas');

      if (metaGrid) {
        metaGrid.innerHTML =
          '<div class="erp-detail-item"><span class="erp-detail-label">Kategori Dokumen</span><span class="erp-detail-val">' + escapeHtml(doc.docType) + '</span></div>' +
          '<div class="erp-detail-item"><span class="erp-detail-label">Nomor Dokumen</span><span class="erp-detail-val cell-code">' + escapeHtml(doc.docNumber || '-') + '</span></div>' +
          '<div class="erp-detail-item"><span class="erp-detail-label">Referensi Pesanan</span><span class="erp-detail-val cell-code">' + escapeHtml(doc.refId || '-') + '</span></div>' +
          '<div class="erp-detail-item"><span class="erp-detail-label">Partner / Mitra B2B</span><span class="erp-detail-val">' + escapeHtml(doc.partner || '-') + '</span></div>' +
          '<div class="erp-detail-item"><span class="erp-detail-label">Tanggal Terbit</span><span class="erp-detail-val">' + escapeHtml(doc.date || '-') + '</span></div>' +
          '<div class="erp-detail-item"><span class="erp-detail-label">Nama Berkas Digital</span><span class="erp-detail-val cell-code">' + escapeHtml(doc.fileName || '-') + '</span></div>';
      }

      if (viewer) {
        viewer.innerHTML =
          '<div style="text-align:center; padding:32px 20px; display:flex; flex-direction:column; align-items:center; gap:12px;">' +
          '  <div class="erp-file-icon-box" style="width:56px; height:56px; border-radius:14px;">' +
          '    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' +
          '  </div>' +
          '  <div>' +
          '    <strong style="font-size:0.95rem; color:var(--erp-heading);">' + escapeHtml(doc.fileName) + '</strong>' +
          '    <div class="cell-subtext" style="margin-top:4px;">Dokumen Resmi PT Nusantara Puncak Perkasa • Terverifikasi Enkripsi Digital</div>' +
          '  </div>' +
          '</div>';
      }

      if (directLink) {
        var href = '#';
        var label = 'Buka Dokumen Resmi';
        if ((doc.docType || '').indexOf('Surat Jalan') !== -1) {
          href = 'delivery-print.html?id=' + encodeURIComponent(doc.docNumber);
          label = 'Cetak Surat Jalan';
        } else if ((doc.docType || '').indexOf('Invoice') !== -1) {
          href = 'billing-print.html?id=' + encodeURIComponent(doc.docNumber);
          label = 'Cetak Faktur Penjualan';
        } else if ((doc.refId || '').indexOf('SO-') !== -1) {
          href = 'orders-detail.html?id=' + encodeURIComponent(doc.refId);
          label = 'Buka Detail PO Pelanggan';
        }

        if (href !== '#') {
          directLink.href = href;
          directLink.style.display = 'inline-flex';
          var spanEl = directLink.querySelector('span');
          if (spanEl) spanEl.textContent = label;
        } else {
          directLink.style.display = 'none';
        }
      }

      if (downloadBtn) {
        downloadBtn.setAttribute('data-filename', doc.fileName || 'dokumen.pdf');
      }

      modal.classList.add('modal-open');
      modal.setAttribute('aria-hidden', 'false');
    }
  };

  /* ==========================================================================
     15. EKSPOR API GLOBAL & AUTO-INIT SAAT DOM READY
     ========================================================================== */
  window.NPP_ERP = {
    ROLE_CONFIG: ROLE_CONFIG,
    RoleManager: RoleManager,
    TableEngine: TableEngine,
    DashboardController: DashboardController,
    OrdersController: OrdersController,
    MasterDataController: MasterDataController,
    InventoryController: InventoryController,
    ProcurementController: ProcurementController,
    DeliveryController: DeliveryController,
    BillingController: BillingController,
    ArchiveController: ArchiveController,
    OrderCreatePageController: OrderCreatePageController,
    OrderDetailPageController: OrderDetailPageController,
    MasterCustomerCreatePageController: MasterCustomerCreatePageController,
    MasterSupplierCreatePageController: MasterSupplierCreatePageController,
    MasterProductCreatePageController: MasterProductCreatePageController,
    MasterRackCreatePageController: MasterRackCreatePageController,
    ProcurementCreatePageController: ProcurementCreatePageController,
    ProcurementDetailPageController: ProcurementDetailPageController,
    InventoryGrCreatePageController: InventoryGrCreatePageController,
    DeliveryCreatePageController: DeliveryCreatePageController,
    DeliveryBastPageController: DeliveryBastPageController,
    DeliveryPrintPageController: DeliveryPrintPageController,
    BillingCreatePageController: BillingCreatePageController,
    BillingPaymentPageController: BillingPaymentPageController,
    BillingPrintPageController: BillingPrintPageController,
    saveDatabase: saveDatabase,
    resetDatabase: resetDatabase,
    formatRupiah: formatRupiah,
    formatMoneyRBAC: formatMoneyRBAC,
    terbilang: terbilang,
    renderStatusBadge: renderStatusBadge,
    escapeHtml: escapeHtml,
    addAuditLog: addAuditLog,
    showToast: showToast,
    showConfirmAlert: showConfirmAlert,
    ThemeManager: ThemeManager
  };

  document.addEventListener('DOMContentLoaded', function () {
    ThemeManager.init();
    RoleManager.initTopbarSwitcher();
    DashboardController.init();
    OrdersController.init();
    MasterDataController.init();
    InventoryController.init();
    ProcurementController.init();
    DeliveryController.init();
    BillingController.init();
    ArchiveController.init();
    OrderCreatePageController.init();
    OrderDetailPageController.init();
    MasterCustomerCreatePageController.init();
    MasterSupplierCreatePageController.init();
    MasterProductCreatePageController.init();
    MasterRackCreatePageController.init();
    ProcurementCreatePageController.init();
    ProcurementDetailPageController.init();
    InventoryGrCreatePageController.init();
    DeliveryCreatePageController.init();
    DeliveryBastPageController.init();
    DeliveryPrintPageController.init();
    BillingCreatePageController.init();
    BillingPaymentPageController.init();
    BillingPrintPageController.init();
  });
})();
