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

  /* ==========================================================================
     1. DEFINISI 6 PERAN PENGGUNA (RBAC — HLD BAGIAN 3)
     ========================================================================== */
  var ROLE_CONFIG = {
    'Administrator': {
      code: 'Administrator',
      display: 'Administrator',
      shortLabel: 'Administrator',
      email: 'admin@nusantarapuncakperkasa.co.id',
      userName: 'Raja Daffa (SysAdmin)',
      canViewPrice: true,
      canViewHPP: true,
      canApprove: true,
      canAccessBilling: true,
      bannerTitle: 'Akses Penuh Sistem Operasional (Superuser Administrator)',
      bannerDesc: 'Anda memiliki otorisasi penuh ke seluruh 8 modul operasional, konfigurasi Master Data, persetujuan dokumen (Approval), keuangan, dan Audit Trail.',
      restrictionText: 'Full Access • 8 Modul Aktif'
    },
    'Sales / Operasional': {
      code: 'Sales / Operasional',
      display: 'Sales & PO',
      shortLabel: 'Sales & PO',
      email: 'sales@nusantarapuncakperkasa.co.id',
      userName: 'Nadia Pramesti (Sales B2B)',
      canViewPrice: true,
      canViewHPP: false,
      canApprove: false,
      canAccessBilling: true,
      bannerTitle: 'Peran Aktif: Sales & Administrasi PO Pelanggan',
      bannerDesc: 'Fokus kerja: Pencatatan PO Pelanggan (SO), unggah berkas PO asli klien, pengecekan Stok Tersedia (Available to Promise), dan koordinasi jadwal pengiriman.',
      restrictionText: 'HPP Supplier Disembunyikan • Butuh Otorisasi Approver'
    },
    'Purchasing': {
      code: 'Purchasing',
      display: 'Purchasing',
      shortLabel: 'Purchasing',
      email: 'purchasing@nusantarapuncakperkasa.co.id',
      userName: 'Hendra Gunawan (Procurement)',
      canViewPrice: true,
      canViewHPP: true,
      canApprove: false,
      canAccessBilling: false,
      bannerTitle: 'Peran Aktif: Purchasing & Pengadaan Prinsipal',
      bannerDesc: 'Fokus kerja: Memantau antrean kekurangan stok (Backorder/Shortage), menerbitkan PO ke Prinsipal (RITAR, BSB, Ablerex), dan memonitor lead-time kedatangan.',
      restrictionText: 'Fokus PO Supplier & HPP • Otorisasi PO oleh Pimpinan'
    },
    'Gudang': {
      code: 'Gudang',
      display: 'Stok Gudang',
      shortLabel: 'Stok Gudang',
      email: 'gudang@nusantarapuncakperkasa.co.id',
      userName: 'Budi Santoso (Kepala Gudang)',
      canViewPrice: false,
      canViewHPP: false,
      canApprove: false,
      canAccessBilling: false,
      bannerTitle: 'Peran Aktif: Kontrol Stok Gudang, QC & Logistik Pengiriman',
      bannerDesc: 'Fokus kerja: Mengelola 5 Saldo Stok (Fisik, Tertahan, Layak, Reservasi, Tersedia), inspeksi penerimaan barang (GR & QC), serta pencetakan Surat Jalan.',
      restrictionText: 'PROTEKSI AKTIF: Seluruh Harga, HPP, Omset & Invoice Disembunyikan'
    },
    'Finance': {
      code: 'Finance',
      display: 'Finance & Invoice',
      shortLabel: 'Finance & Invoice',
      email: 'finance@nusantarapuncakperkasa.co.id',
      userName: 'Siti Rahmawati (Finance & AR)',
      canViewPrice: true,
      canViewHPP: true,
      canApprove: false,
      canAccessBilling: true,
      bannerTitle: 'Peran Aktif: Finance, Penagihan (Invoicing) & Kontrol Piutang',
      bannerDesc: 'Fokus kerja: Penerbitan Invoice Resmi (DP, Termin, Pelunasan + PPN 11%), rekonsiliasi BAST/Surat Jalan, dan pencatatan bukti pelunasan rekening BCA/Mandiri.',
      restrictionText: 'Akses Keuangan & Piutang • Tanpa Hak Ubah Stok Fisik'
    },
    'Pimpinan / Approver': {
      code: 'Pimpinan / Approver',
      display: 'Approver',
      shortLabel: 'Approver',
      email: 'pimpinan@nusantarapuncakperkasa.co.id',
      userName: 'Ir. Darmawan Putra (Direktur Operasional)',
      canViewPrice: true,
      canViewHPP: true,
      canApprove: true,
      canAccessBilling: true,
      bannerTitle: 'Peran Aktif: Pimpinan & Otorisasi Eksekutif (Approver)',
      bannerDesc: 'Fokus kerja: Meninjau KPI strategis perusahaan, menyetujui atau menolak PO Pelanggan bernilai besar & PO Pengadaan Supplier, serta mengawasi piutang jatuh tempo.',
      restrictionText: 'Hak Otorisasi (Approve / Reject) Aktif'
    }
  };

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
          statusPengiriman: 'Terkirim Penuh (BAST)',
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
          statusPengiriman: 'Terkirim Penuh (BAST)',
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
          statusPengiriman: 'Terkirim Penuh (BAST)',
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
          statusPengiriman: 'Terkirim Penuh (BAST)',
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
          statusPengiriman: 'Terkirim Penuh (BAST)',
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
          statusPengiriman: 'Terkirim Penuh (BAST)',
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
          statusPengiriman: 'Terkirim Penuh (BAST)',
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
          statusReceiving: 'Diterima Penuh (GR)',
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
        { id: 'MUT-009', date: '2026-11-06 09:40', sku: 'SKU-BSB-FT150', skuName: 'Baterai BSB FT12-150', type: 'RESERVASI (+)', qty: 16, refDoc: 'SO-202611-0012', pic: 'Nadia Pramesti', note: 'Reservasi otomatis PO PT. Jasnita Telekomindo Tbk' },
        { id: 'MUT-008', date: '2026-11-05 15:20', sku: 'SKU-ABL-ARS30K', skuName: 'UPS Ablerex Ares 30 kVA 3-Phase', type: 'RESERVASI (+)', qty: 2, refDoc: 'SO-202611-0011', pic: 'Nadia Pramesti', note: 'Reservasi proyek PT. The Master Steel Mfc' },
        { id: 'MUT-007', date: '2026-11-05 11:10', sku: 'SKU-RTR-12100', skuName: 'Baterai RITAR RA12-100', type: 'KELUAR (SJ)', qty: -16, refDoc: 'SJ-202611-0008', pic: 'Budi Santoso', note: 'Pengiriman parsial Tahap 1 ke PT. Daya Pustaka Indonesia' },
        { id: 'MUT-006', date: '2026-11-03 14:05', sku: 'SKU-AVR-30KVA', skuName: 'Servo Stabilizer 3-Phase 30 kVA', type: 'RESERVASI (+)', qty: 3, refDoc: 'SO-202611-0009', pic: 'Nadia Pramesti', note: 'Reservasi PO PT. Sumber Abadi Indonesia' },
        { id: 'MUT-005', date: '2026-11-02 16:30', sku: 'SKU-ABL-MS10K', skuName: 'UPS Ablerex Mars II MS10000RT', type: 'MASUK (GR-QC)', qty: 6, refDoc: 'GR-202611-0004', pic: 'Budi Santoso', note: 'Penerimaan prinsipal Ablerex lolos QC 100%' },
        { id: 'MUT-004', date: '2026-11-01 10:15', sku: 'SKU-RTR-12100', skuName: 'Baterai RITAR RA12-100', type: 'MASUK (GR-QC)', qty: 38, refDoc: 'GR-202611-0003', pic: 'Budi Santoso', note: 'Penerimaan layak pakai ke RAK-A01' },
        { id: 'MUT-003', date: '2026-11-01 10:18', sku: 'SKU-RTR-12100', skuName: 'Baterai RITAR RA12-100', type: 'TERTAHAN (QC)', qty: 2, refDoc: 'GR-202611-0003', pic: 'Budi Santoso', note: 'Karantina 2 unit ke RAK-QC untuk klaim prinsipal' }
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
        { id: 'LOG-1008', timestamp: '2026-11-06 10:15:22', user: 'Nadia Pramesti', role: 'Sales / Operasional', action: 'INPUT_PO_PELANGGAN', target: 'SO-202611-0012', detail: 'Membuat pesanan baru PT. Jasnita Telekomindo Tbk senilai Rp 169.608.000 (Menunggu Approval)' },
        { id: 'LOG-1007', timestamp: '2026-11-05 16:40:10', user: 'Siti Rahmawati', role: 'Finance', action: 'TERBIT_INVOICE_DP', target: 'INV-202611-0006', detail: 'Menerbitkan Tagihan DP 30% untuk PT. The Master Steel Mfc (SO-202611-0011)' },
        { id: 'LOG-1006', timestamp: '2026-11-05 14:12:05', user: 'Budi Santoso', role: 'Gudang', action: 'CETAK_SURAT_JALAN', target: 'SJ-202611-0008', detail: 'Menerbitkan Surat Jalan pengiriman parsial Tahap 1 ke PT. Daya Pustaka Indonesia' },
        { id: 'LOG-1005', timestamp: '2026-11-04 11:30:49', user: 'Ir. Darmawan Putra', role: 'Pimpinan / Approver', action: 'APPROVE_SO', target: 'SO-202611-0010', detail: 'Menyetujui PO Pelanggan PT. Daya Pustaka Indonesia & mengaktifkan kuota pengiriman' },
        { id: 'LOG-1004', timestamp: '2026-11-02 16:28:00', user: 'Budi Santoso', role: 'Gudang', action: 'QC_GOODS_RECEIPT', target: 'GR-202611-0004', detail: 'Menerima 6 unit UPS Ablerex 10 kVA dari PO-202610-0003 (100% Lolos QC -> RAK-B01)' }
      ]
    };
  }

  /* ==========================================================================
     3. INISIALISASI & PERSISTENSI DATABASE DI LOCALSTORAGE
     ========================================================================== */
  function loadDatabase() {
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
      return '<span class="badge-status badge-neutral" title="Disembunyikan untuk peran Gudang">Terproteksi (RBAC)</span>';
    }
    if (isHpp && !role.canViewHPP) {
      return '<span class="badge-status badge-neutral" title="HPP hanya untuk Purchasing, Finance, Approver & Admin">HPP Terproteksi</span>';
    }
    return formatRupiah(amount);
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
      s.indexOf('aktif') !== -1
    ) {
      return 'badge-success';
    }
    if (
      s.indexOf('menunggu') !== -1 ||
      s.indexOf('sebagian') !== -1 ||
      s.indexOf('perjalanan') !== -1 ||
      s.indexOf('tagihan dp') !== -1 ||
      s.indexOf('invoice terbit') !== -1 ||
      s.indexOf('belum lunas') !== -1
    ) {
      return 'badge-warning';
    }
    if (
      s.indexOf('jatuh tempo') !== -1 ||
      s.indexOf('ditolak') !== -1 ||
      s.indexOf('kritis') !== -1 ||
      s.indexOf('tertahan') !== -1 ||
      s.indexOf('habis') !== -1
    ) {
      return 'badge-danger';
    }
    if (
      s.indexOf('diproses') !== -1 ||
      s.indexOf('dikonfirmasi') !== -1 ||
      s.indexOf('direservasi') !== -1
    ) {
      return 'badge-info';
    }
    return 'badge-neutral';
  }

  function renderStatusBadge(label) {
    var cls = getStatusBadgeClass(label);
    return '<span class="badge-status ' + cls + '"><span class="badge-dot"></span>' + escapeHtml(label) + '</span>';
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
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c99d51" stroke-width="2.4">' +
      '<path d="M20 6 9 17l-5-5"/>' +
      '</svg>' +
      '<span>' + escapeHtml(message) + '</span>';
    toast.classList.add('erp-toast-visible');
    if (toast._timer) clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('erp-toast-visible');
    }, 3400);
  }

  /* ==========================================================================
     5. ROLE MANAGER (RBAC 6 PERAN & SINKRONISASI UI REAL-TIME)
     ========================================================================== */
  var RoleManager = {
    listeners: [],

    getCurrentSession: function () {
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
      var def = ROLE_CONFIG['Administrator'];
      return {
        role: def.code,
        email: def.email,
        userName: def.userName,
        loginAt: new Date().toISOString()
      };
    },

    getCurrentRoleConfig: function () {
      var session = this.getCurrentSession();
      return ROLE_CONFIG[session.role] || ROLE_CONFIG['Administrator'];
    },

    setRole: function (roleCode) {
      var cfg = ROLE_CONFIG[roleCode] || ROLE_CONFIG['Administrator'];
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

      // 1. Toggle class proteksi harga pada body jika role adalah Gudang
      if (cfg.code === 'Gudang') {
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

      // 5. Sembunyikan menu Penagihan & Invoice pada Sidebar jika role adalah Gudang
      var billingNavItems = document.querySelectorAll('[data-nav-module="billing"]');
      billingNavItems.forEach(function (el) {
        el.classList.toggle('erp-hidden', cfg.code === 'Gudang');
      });

      // 6. Toggle elemen dengan atribut data-rbac-ApproveOnly
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

    var fromNum = totalItems === 0 ? 0 : startIdx + 1;
    var toNum = endIdx;

    var pageButtons = [];
    pageButtons.push(
      '<button type="button" class="erp-page-btn" data-page="' + (this.currentPage - 1) + '" ' +
      (this.currentPage <= 1 ? 'disabled' : '') + '>Sebelumnya</button>'
    );

    for (var p = 1; p <= totalPages; p++) {
      var activeCls = p === this.currentPage ? ' erp-page-btn-active' : '';
      pageButtons.push(
        '<button type="button" class="erp-page-btn' + activeCls + '" data-page="' + p + '">' + p + '</button>'
      );
    }

    pageButtons.push(
      '<button type="button" class="erp-page-btn" data-page="' + (this.currentPage + 1) + '" ' +
      (this.currentPage >= totalPages ? 'disabled' : '') + '>Berikutnya</button>'
    );

    container.innerHTML =
      '<div class="erp-pagination-info">' +
      'Menampilkan <strong>' + fromNum + '–' + toNum + '</strong> dari <strong>' + totalItems + '</strong> data' +
      '</div>' +
      '<div class="erp-pagination-controls">' + pageButtons.join('') + '</div>';

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

      if (roleCfg.code === 'Gudang') {
        if (kpiOmsetLabel) kpiOmsetLabel.textContent = 'Realisasi Surat Jalan';
        if (kpiOmsetVal) kpiOmsetVal.textContent = totalDeliveredReady + ' Pengiriman';
        if (kpiOmsetSub) kpiOmsetSub.textContent = 'Mode Gudang: Nilai Rupiah disembunyikan';
      } else {
        if (kpiOmsetLabel) kpiOmsetLabel.textContent = 'Omset Bulan Berjalan';
        if (kpiOmsetVal) kpiOmsetVal.textContent = formatRupiah(totalOmsetNov);
        if (kpiOmsetSub) kpiOmsetSub.textContent = novOrders.length + ' PO masuk periode November 2026';
      }

      // 3. Antrean Approval
      var pendingSO = db.orders.filter(function (o) { return o.statusApproval === 'Menunggu Persetujuan'; }).length;
      var pendingPO = db.procurements.filter(function (p) { return p.statusApproval === 'Menunggu Persetujuan'; }).length;
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

      // 5. Piutang Jatuh Tempo (Atau Total Kuota Reservasi bila role = Gudang)
      var overdueInvs = db.invoices.filter(function (inv) { return inv.status === 'Jatuh Tempo'; });
      var overdueSum = overdueInvs.reduce(function (acc, inv) { return acc + (inv.total - inv.paidAmount); }, 0);
      var totalReservedUnits = db.inventory.reduce(function (acc, i) { return acc + i.reservasi; }, 0);

      var kpiReceivableLabel = document.getElementById('kpiReceivableLabel');
      var kpiReceivableVal = document.getElementById('kpiReceivableVal');
      var kpiReceivableSub = document.getElementById('kpiReceivableSub');

      if (roleCfg.code === 'Gudang') {
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
      var roleTag = document.getElementById('quickApprovalRoleHint');
      if (!container) return;

      var db = window.NPP_ERP_DATA;
      var roleCfg = RoleManager.getCurrentRoleConfig();

      if (roleTag) {
        roleTag.textContent = roleCfg.canApprove
          ? 'Otorisasi Aktif (' + roleCfg.display + ')'
          : 'Mode Baca — Otorisasi oleh Approver / Admin';
      }

      var pendingOrders = db.orders.filter(function (o) {
        return o.statusApproval === 'Menunggu Persetujuan';
      });

      if (pendingOrders.length === 0) {
        container.innerHTML =
          '<div class="approval-item">' +
          '<div class="approval-item-top">' +
          '<span class="approval-item-id">Semua Dokumen Terotorisasi</span>' +
          '<span class="badge-status badge-success"><span class="badge-dot"></span>Zero Backlog</span>' +
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
            '<span class="badge-status badge-warning"><span class="badge-dot"></span>Menunggu Otorisasi Pimpinan</span>' +
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
        showToast('Akses ditolak: Hanya Approver atau Administrator yang dapat mengotorisasi PO.');
        return;
      }

      var db = window.NPP_ERP_DATA;
      var order = db.orders.find(function (o) { return o.id === soId; });
      if (!order) return;

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
      this.renderKPIs();
      this.renderQuickApprovalPanel();
      if (this.ordersTable) this.ordersTable.render();
      showToast('Dokumen ' + order.id + ' berhasil diperbarui menjadi: ' + newStatus);
    },

    renderStockSummaryStrip: function () {
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
            '<div class="erp-Filter-group">' +
            '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" data-view-order="' + order.id + '">Rincian</button>' +
            (canApproveNow
              ? '<button type="button" class="btn-erp btn-erp-gold btn-erp-sm" data-quick-approve="' + order.id + '">Setujui</button>'
              : '') +
            '</div>';

          return (
            '<tr>' +
            '<td>' +
            '<span class="cell-code">' + escapeHtml(order.id) + '</span>' +
            '<span class="cell-subtext">' + escapeHtml(order.orderDate) + '</span>' +
            '</td>' +
            '<td>' +
            '<span class="cell-client">' + escapeHtml(order.customerName) + '</span>' +
            '<span class="cell-subtext">Ref PO: ' + escapeHtml(order.clientPoNumber) + '</span>' +
            '</td>' +
            '<td class="col-financial">' +
            '<span class="cell-money">' + formatMoneyRBAC(order.total, false) + '</span>' +
            '<span class="cell-subtext">Termin: ' + escapeHtml(order.paymentTerm) + '</span>' +
            '</td>' +
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
            ? '<span class="badge-status badge-danger"><span class="badge-dot"></span>Stok Kritis (Min ' + item.minStok + ')</span>'
            : '<span class="badge-status badge-success"><span class="badge-dot"></span>Stok Aman</span>';

          return (
            '<tr>' +
            '<td>' +
            '<span class="cell-code">' + escapeHtml(item.sku) + '</span>' +
            '<span class="cell-subtext">Rak: ' + escapeHtml(item.rack) + '</span>' +
            '</td>' +
            '<td>' +
            '<span class="cell-client">' + escapeHtml(item.name) + '</span>' +
            '<span class="cell-subtext">' + escapeHtml(item.category) + ' • Satuan: ' + escapeHtml(item.unit) + '</span>' +
            '</td>' +
            '<td><strong>' + item.fisik + '</strong> ' + escapeHtml(item.unit) + '</td>' +
            '<td>' +
            (item.tertahan > 0
              ? '<span class="badge-status badge-danger">' + item.tertahan + ' Hold</span>'
              : '<span class="cell-subtext">0</span>') +
            '</td>' +
            '<td><strong>' + item.layak + '</strong> ' + escapeHtml(item.unit) + '</td>' +
            '<td><span class="badge-status badge-info">' + item.reservasi + ' Direservasi</span></td>' +
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
        '<div class="stock-formula-box"><div class="stock-formula-title">1. Status Order</div>' + renderStatusBadge(order.statusOrder) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">2. Status Approval</div>' + renderStatusBadge(order.statusApproval) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">3. Pemenuhan Stok</div>' + renderStatusBadge(order.statusPemenuhan) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">4. Pengiriman (SJ)</div>' + renderStatusBadge(order.statusPengiriman) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">5. Penagihan (INV)</div>' + renderStatusBadge(order.statusPenagihan) + '</div>' +
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
        '<span class="erp-kpi-label">Ringkasan Nilai Transaksi (PPN 11%)</span>' +
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
      var rbacNote = document.getElementById('ordersRbacActionHint');
      var canCreateSO = roleCfg.code === 'Sales / Operasional' || roleCfg.code === 'Administrator';

      if (btnCreate) {
        btnCreate.disabled = !canCreateSO;
        btnCreate.title = canCreateSO
          ? 'Buat PO Pelanggan B2B Baru'
          : 'Hanya peran Sales & PO atau Administrator yang dapat menginput PO Pelanggan baru';
      }
      if (rbacNote) {
        rbacNote.textContent = canCreateSO
          ? 'Hak Input PO Aktif (' + roleCfg.display + ')'
          : 'Mode Baca (' + roleCfg.display + ') — Input PO hanya untuk Sales & Admin';
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

      if (roleCfg.code === 'Gudang') {
        if (elTotalLabel) elTotalLabel.textContent = '1. Total Volume Pesanan';
        if (elTotalVal) elTotalVal.textContent = totalUnitsOrdered + ' Unit / Cell';
        if (elTotalSub) elTotalSub.textContent = 'Dari ' + totalOrders + ' dokumen PO Pelanggan (Harga Terproteksi)';
      } else {
        if (elTotalLabel) elTotalLabel.textContent = '1. Total Nilai PO Pelanggan';
        if (elTotalVal) elTotalVal.textContent = formatRupiah(totalValue);
        if (elTotalSub) elTotalSub.textContent = 'Akumulasi ' + totalOrders + ' PO Pelanggan B2B (+PPN 11%)';
      }

      var elAppVal = document.getElementById('ordersKpiApprovalVal');
      var elAppSub = document.getElementById('ordersKpiApprovalSub');
      if (elAppVal) elAppVal.textContent = pendingApprovalCount + ' PO Pending';
      if (elAppSub) elAppSub.textContent = 'Menunggu otorisasi Pimpinan / Approver';

      var elFulVal = document.getElementById('ordersKpiFulfillmentVal');
      var elFulSub = document.getElementById('ordersKpiFulfillmentSub');
      if (elFulVal) elFulVal.textContent = reservedCount + ' Terkunci • ' + shortageCount + ' Backorder';
      if (elFulSub) elFulSub.textContent = 'Status ketersediaan & reservasi stok gudang';

      var elPayVal = document.getElementById('ordersKpiPaymentVal');
      var elPaySub = document.getElementById('ordersKpiPaymentSub');
      if (elPayVal) elPayVal.textContent = paidCount + ' Lunas • ' + overdueCount + ' Overdue';
      if (elPaySub) elPaySub.textContent = 'Monitoring penyelesaian tagihan & pembayaran';
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
            '<div class="erp-Filter-group">' +
            '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" data-open-so-detail="' + order.id + '">Detail PO</button>' +
            (canApproveNow
              ? '<button type="button" class="btn-erp btn-erp-success btn-erp-sm" data-approve-so-row="' + order.id + '">Setujui</button>' +
                '<button type="button" class="btn-erp btn-erp-danger btn-erp-sm" data-reject-so-row="' + order.id + '">Tolak</button>'
              : '') +
            '</div>';

          return (
            '<tr>' +
            '<td>' +
            '<span class="cell-code">' + escapeHtml(order.id) + '</span>' +
            '<span class="cell-subtext">Tgl: ' + escapeHtml(order.orderDate) + ' • Target: ' + escapeHtml(order.deliveryTarget) + '</span>' +
            '</td>' +
            '<td>' +
            '<span class="cell-client">' + escapeHtml(order.customerName) + '</span>' +
            '<span class="cell-subtext">PO Klien: ' + escapeHtml(order.clientPoNumber) + ' (' + totalQty + ' Unit)</span>' +
            '</td>' +
            '<td class="col-financial">' +
            '<span class="cell-money">' + formatMoneyRBAC(order.total, false) + '</span>' +
            '<span class="cell-subtext">TOP: ' + escapeHtml(order.paymentTerm) + '</span>' +
            '</td>' +
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
        showToast('Akses ditolak: Otorisasi PO hanya untuk peran Approver atau Administrator.');
        return;
      }

      var db = window.NPP_ERP_DATA;
      var order = db.orders.find(function (o) { return o.id === soId; });
      if (!order) return;

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
      this.renderOrdersKPIs();
      if (this.table) this.table.render();
      showToast('Status persetujuan ' + order.id + ' diperbarui menjadi: ' + decision);
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
          if (roleCfg.code !== 'Sales / Operasional' && roleCfg.code !== 'Administrator') {
            showToast('Hanya peran Sales & PO atau Administrator yang diizinkan menginput PO Pelanggan baru.');
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
        rowEl.remove();
        self.recalculateOrderFormTotals();
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
            type: 'RESERVASI (+)',
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
      if (title) title.textContent = 'Detail PO Pelanggan — ' + order.id + ' (' + order.clientPoNumber + ')';

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
        '<span class="erp-kpi-label">Jadwal Pengiriman & Syarat Pembayaran (TOP)</span>' +
        '<div class="modal-card-title-strong">Target Kirim: ' + escapeHtml(order.deliveryTarget) + '</div>' +
        '<span class="cell-subtext">Tgl Input SO: ' + escapeHtml(order.orderDate) + ' • TOP: ' + escapeHtml(order.paymentTerm) + '</span>' +
        '<span class="cell-subtext">Sales PIC: ' + escapeHtml(order.salesPic) + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="stock-formula-strip modal-five-dim-strip">' +
        '<div class="stock-formula-box"><div class="stock-formula-title">1. Persetujuan</div>' + renderStatusBadge(order.statusApproval) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">2. Pemenuhan Stok</div>' + renderStatusBadge(order.statusPemenuhan) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">3. Pengiriman (SJ)</div>' + renderStatusBadge(order.statusPengiriman) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">4. Penagihan (INV)</div>' + renderStatusBadge(order.statusPenagihan) + '</div>' +
        '<div class="stock-formula-box"><div class="stock-formula-title">5. Pembayaran</div>' + renderStatusBadge(paymentStat) + '</div>' +
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
        '<span class="erp-kpi-label">Kalkulasi Nilai Transaksi B2B (PPN 11%)</span>' +
        '<div class="modal-summary-row"><span>DPP (Dasar Pengenaan Pajak):</span><strong>' + formatMoneyRBAC(order.dpp, false) + '</strong></div>' +
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
            '<td><span class="cell-code">' + escapeHtml(c.id) + '</span><span class="cell-subtext">' + escapeHtml(c.sector || 'Industri B2B') + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(c.name) + '</span></td>' +
            '<td><strong>' + escapeHtml(c.pic) + '</strong><span class="cell-subtext">' + escapeHtml(c.rolePic || 'Procurement PIC') + '</span></td>' +
            '<td><span>' + escapeHtml(c.phone) + '</span><span class="cell-subtext">' + escapeHtml(c.email) + '</span></td>' +
            '<td>' + escapeHtml(c.address) + '</td>' +
            '<td><span class="cell-code">' + escapeHtml(c.npwp) + '</span></td>' +
            '<td><span class="badge-status badge-info"><span class="badge-dot"></span>' + escapeHtml(c.paymentTerm) + '</span></td>' +
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
            '<td><span class="cell-code">' + escapeHtml(s.id) + '</span><span class="cell-subtext">' + escapeHtml(s.status || 'Prinsipal Resmi') + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(s.name) + '</span><span class="cell-subtext">' + escapeHtml(s.category) + '</span></td>' +
            '<td>' + escapeHtml(s.origin) + '</td>' +
            '<td><strong>' + escapeHtml(s.pic) + '</strong><span class="cell-subtext">' + escapeHtml(s.phone) + ' • ' + escapeHtml(s.email) + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(s.bankAccount || '-') + '</span><span class="cell-subtext">TOP: ' + escapeHtml(s.paymentTerm) + '</span></td>' +
            '<td><span class="badge-status badge-warning"><span class="badge-dot"></span>' + s.leadTimeDays + ' Hari Kalender</span></td>' +
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
            '<td><span class="cell-code">' + escapeHtml(p.sku) + '</span><span class="cell-subtext">Rak: ' + escapeHtml(p.rack) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(p.name) + '</span><span class="cell-subtext">Brand: ' + escapeHtml(p.brand || 'NPP Industrial') + '</span></td>' +
            '<td>' + escapeHtml(p.category) + '</td>' +
            '<td><strong>' + escapeHtml(p.unit) + '</strong></td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(p.sellPrice, false) + '</span></td>' +
            '<td><strong>' + p.minStok + ' ' + escapeHtml(p.unit) + '</strong><span class="cell-subtext">Stok ATP: ' + p.tersedia + ' ' + escapeHtml(p.unit) + '</span></td>' +
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
            '<td><span class="cell-code">' + escapeHtml(r.code) + '</span><span class="cell-subtext">PIC: ' + escapeHtml(r.pic || 'Gudang NPP') + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(r.zone) + '</span></td>' +
            '<td><span class="badge-status badge-info"><span class="badge-dot"></span>' + escapeHtml(r.capacity) + '</span></td>' +
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
     11. EKSPOR API GLOBAL & AUTO-INIT SAAT DOM READY
     ========================================================================== */
  window.NPP_ERP = {
    ROLE_CONFIG: ROLE_CONFIG,
    RoleManager: RoleManager,
    TableEngine: TableEngine,
    DashboardController: DashboardController,
    OrdersController: OrdersController,
    MasterDataController: MasterDataController,
    saveDatabase: saveDatabase,
    resetDatabase: resetDatabase,
    formatRupiah: formatRupiah,
    formatMoneyRBAC: formatMoneyRBAC,
    renderStatusBadge: renderStatusBadge,
    escapeHtml: escapeHtml,
    addAuditLog: addAuditLog,
    showToast: showToast
  };

  document.addEventListener('DOMContentLoaded', function () {
    RoleManager.initTopbarSwitcher();
    DashboardController.init();
    OrdersController.init();
    MasterDataController.init();
  });
})();
