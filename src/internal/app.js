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
      var canReceiveGr = roleCfg.code === 'Gudang' || roleCfg.code === 'Administrator';
      var btnGr = document.getElementById('btnOpenCreateGrModal');
      var hintEl = document.getElementById('invGrRbacHint');

      if (btnGr) {
        btnGr.disabled = !canReceiveGr;
        btnGr.title = canReceiveGr
          ? 'Catat Penerimaan Barang Fisik & Inspeksi QC Gudang'
          : 'Hanya peran Stok Gudang atau Administrator yang dapat mencatat Penerimaan Barang & QC';
      }
      if (hintEl) {
        hintEl.textContent = canReceiveGr
          ? 'Otorisasi Gudang & QC Aktif (' + roleCfg.display + ') • Bebas Informasi Harga/HPP'
          : 'Mode Pantau (' + roleCfg.display + ') • Input GR & QC khusus Stok Gudang & Admin';
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
            '<td><span class="cell-code">' + escapeHtml(item.sku) + '</span><span class="cell-subtext">Audit: ' + escapeHtml(item.lastAudit || '2026-11-06') + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(item.name) + '</span><span class="cell-subtext">' + escapeHtml(item.category) + ' (' + escapeHtml(item.unit) + ')</span></td>' +
            '<td><span class="badge-status badge-neutral">' + escapeHtml(item.rack) + '</span></td>' +
            '<td><strong>' + item.fisik + '</strong> ' + escapeHtml(item.unit) + '</td>' +
            '<td>' +
            (item.tertahan > 0
              ? '<span class="badge-status badge-danger"><span class="badge-dot"></span>' + item.tertahan + ' Karantina</span>'
              : '<span class="cell-subtext">0 ' + escapeHtml(item.unit) + '</span>') +
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
            '<td><span class="cell-code">' + escapeHtml(row.date) + '</span><span class="cell-subtext">ID: ' + escapeHtml(row.id) + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(row.refDoc) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(row.sku) + '</span><span class="cell-subtext">' + escapeHtml(row.skuName) + '</span></td>' +
            '<td>' + renderStatusBadge(row.type) + '</td>' +
            '<td><span class="' + qtyCls + '">' + escapeHtml(qtyFormatted) + ' Unit</span></td>' +
            '<td><strong>' + (row.finalPhysical != null ? row.finalPhysical : '-') + ' Unit</strong></td>' +
            '<td><strong>' + escapeHtml(row.pic) + '</strong><span class="cell-subtext">' + escapeHtml(row.note || '-') + '</span></td>' +
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
            '<td><span class="cell-code">' + escapeHtml(gr.id) + '</span><span class="cell-subtext">Tgl: ' + escapeHtml(gr.date) + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(gr.poSupplierId) + '</span><span class="cell-subtext">' + escapeHtml(gr.supplierName) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(gr.sku) + '</span><span class="cell-subtext">' + escapeHtml(gr.skuName) + '</span></td>' +
            '<td><strong>' + gr.qtyReceived + ' Unit</strong></td>' +
            '<td><span class="badge-status badge-success"><span class="badge-dot"></span>' + gr.qtyPassed + ' Lolos QC</span></td>' +
            '<td>' +
            (gr.qtyHold > 0
              ? '<span class="badge-status badge-danger"><span class="badge-dot"></span>' + gr.qtyHold + ' Karantina</span>'
              : '<span class="cell-subtext">0 Hold</span>') +
            '</td>' +
            '<td><span class="badge-status badge-neutral">' + escapeHtml(gr.rackTarget) + '</span></td>' +
            '<td><strong>' + escapeHtml(gr.inspector) + '</strong><span class="cell-subtext">' + escapeHtml(gr.notes || '-') + '</span></td>' +
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
          if (roleCfg.code !== 'Gudang' && roleCfg.code !== 'Administrator') {
            showToast('Akses ditolak: Hanya peran Stok Gudang atau Administrator yang dapat mencatat Penerimaan Barang & QC.');
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
          type: 'MASUK (GR-QC)',
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
          type: 'TERTAHAN (QC)',
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
      if (elAppSub) elAppSub.textContent = 'Perlu persetujuan Direktur / Approver';

      var elValLabel = document.getElementById('procKpiValueLabel');
      var elValAmount = document.getElementById('procKpiValueAmount');
      var elValSub = document.getElementById('procKpiValueSub');

      if (roleCfg.code === 'Gudang' || !roleCfg.canViewHPP) {
        if (elValLabel) elValLabel.textContent = '4. Total Kuantitas Pengadaan';
        if (elValAmount) elValAmount.textContent = totalPoUnits + ' Unit / Cell';
        if (elValSub) elValSub.textContent = 'Mode RBAC: Nilai HPP Pembelian disembunyikan';
      } else {
        if (elValLabel) elValLabel.textContent = '4. Total Nilai PO Supplier';
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
      var canCreatePo = roleCfg.code === 'Purchasing' || roleCfg.code === 'Administrator';
      var btnCreate = document.getElementById('btnOpenCreatePoModal');
      var hintEl = document.getElementById('procRbacActionHint');

      if (btnCreate) {
        btnCreate.disabled = !canCreatePo;
        btnCreate.title = canCreatePo
          ? 'Terbitkan PO Baru ke Prinsipal / Pabrikan'
          : 'Hanya peran Purchasing atau Administrator yang dapat menerbitkan PO Supplier baru';
      }
      if (hintEl) {
        hintEl.textContent = canCreatePo
          ? 'Otorisasi Penerbitan PO Supplier Aktif (' + roleCfg.display + ')'
          : 'Mode Pantau (' + roleCfg.display + ') — Penerbitan PO khusus Purchasing & Admin';
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
          var canCreatePo = roleCfg.code === 'Purchasing' || roleCfg.code === 'Administrator';

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(item.sku) + '</span><span class="cell-subtext">Rak: ' + escapeHtml(item.rack) + '</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(item.name) + '</span><span class="cell-subtext">Prinsipal: ' + escapeHtml(item.supplierName) + '</span></td>' +
            '<td><span class="cell-stock-available">' + item.tersedia + ' ' + escapeHtml(item.unit) + '</span></td>' +
            '<td><strong>' + item.minStok + ' ' + escapeHtml(item.unit) + '</strong></td>' +
            '<td>' +
            (item.backorderQty > 0
              ? '<span class="badge-status badge-danger">' + item.backorderQty + ' ' + escapeHtml(item.unit) + ' (' + escapeHtml(item.refOrderId) + ')</span>'
              : '<span class="cell-subtext">0 (Restock Buffer)</span>') +
            '</td>' +
            '<td><strong class="qty-change-plus">+' + item.recommendedQty + ' ' + escapeHtml(item.unit) + '</strong><span class="cell-subtext">Lead Time: ' + item.leadTimeDays + ' Hari</span></td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(item.hpp, true) + '</span></td>' +
            '<td>' + renderStatusBadge(item.priority) + '</td>' +
            '<td>' +
            '<button type="button" class="btn-erp btn-erp-primary btn-erp-sm" data-quick-po-sku="' + escapeHtml(item.sku) + '" ' +
            (canCreatePo ? '' : 'disabled title="Khusus Purchasing & Administrator"') + '>' +
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
            '<div class="erp-Filter-group">' +
            '<button type="button" class="btn-erp btn-erp-secondary btn-erp-sm" data-view-po="' + po.id + '">Detail PO</button>' +
            (canApprove
              ? '<button type="button" class="btn-erp btn-erp-success btn-erp-sm" data-approve-po="' + po.id + '">Setujui</button>' +
                '<button type="button" class="btn-erp btn-erp-danger btn-erp-sm" data-reject-po="' + po.id + '">Tolak</button>'
              : '') +
            '</div>';

          return (
            '<tr>' +
            '<td><span class="cell-code">' + escapeHtml(po.id) + '</span><span class="cell-subtext">' + totalUnits + ' Unit Dipesan</span></td>' +
            '<td><span class="cell-client">' + escapeHtml(po.supplierName) + '</span><span class="cell-subtext">ID: ' + escapeHtml(po.supplierId) + '</span></td>' +
            '<td><span class="cell-code">' + escapeHtml(po.refOrderId || 'Restock Gudang') + '</span></td>' +
            '<td><strong>Tgl: ' + escapeHtml(po.orderDate) + '</strong><span class="cell-subtext">ETA Tiba: ' + escapeHtml(po.etaDate) + '</span></td>' +
            '<td class="col-financial"><span class="cell-money">' + formatMoneyRBAC(po.total || po.totalHpp, true) + '</span><span class="cell-subtext">Termasuk PPN 11%</span></td>' +
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
        showToast('Akses ditolak: Hanya Approver atau Administrator yang dapat mengotorisasi PO Supplier.');
        return;
      }

      var db = window.NPP_ERP_DATA;
      var po = db.procurements.find(function (p) { return p.id === poId; });
      if (!po) return;

      po.statusApproval = decision;
      saveDatabase(db);
      addAuditLog(
        decision === 'Disetujui' ? 'APPROVE_PO_SUPPLIER' : 'REJECT_PO_SUPPLIER',
        po.id,
        'Mengubah status otorisasi PO Supplier ' + po.id + ' (' + po.supplierName + ') menjadi: ' + decision
      );

      this.renderProcurementKPIs();
      if (this.poTable) this.poTable.render();
      showToast('Status PO Supplier ' + po.id + ' berhasil diperbarui menjadi: ' + decision);
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
          if (roleCfg.code !== 'Purchasing' && roleCfg.code !== 'Administrator') {
            showToast('Akses ditolak: Hanya peran Purchasing atau Administrator yang dapat menerbitkan PO Supplier.');
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
        rowEl.remove();
        self.recalculatePoTotals();
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
        '<div class="modal-card-title-strong">Estimasi Tiba (ETA): ' + escapeHtml(po.etaDate) + '</div>' +
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
     13. EKSPOR API GLOBAL & AUTO-INIT SAAT DOM READY
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
    InventoryController.init();
    ProcurementController.init();
  });
})();
