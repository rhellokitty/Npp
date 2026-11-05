/**
 * PT Nusantara Puncak Perkasa — Master Data Produk
 * Ubah data spesifikasi, harga, gambar, dan fitur produk langsung di file ini.
 */
window.NPP_PRODUCTS = {
  1: {
    id: 1,
    name: 'Baterai RITAR VRLA AGM & Deep Cycle',
    subtitle: 'RITAR Power • Valve Regulated Lead Acid & High Rate Discharge',
    price: 'Hubungi Sales',
    priceNote: 'Penawaran Formal B2B',
    discount: 'RITAR',
    rating: '4.9',
    reviewsCount: 38,
    badge: 'Ready Stock • Gudang Pusat',
    image: 'assets/product/RITAR.webp',
    gallery: [
      'assets/product/RITAR.webp'
    ],
    unitOverview: [
      'Didistribusikan resmi oleh PT Nusantara Puncak Perkasa',
      'Keandalan tinggi untuk sistem UPS, Telekomunikasi & Data Center',
      'Bebas perawatan (VRLA AGM) dengan self-discharge rendah',
      'Garansi resmi dan dukungan teknis komisioning'
    ],
    description: 'Baterai RITAR didistribusikan resmi oleh PT Nusantara Puncak Perkasa untuk menjawab kebutuhan daya cadangan kritis seperti Uninterruptible Power Supply (UPS), sistem perbankan, telekomunikasi, dan gardu industri dengan keandalan debit tinggi serta durabilitas jangka panjang.',
    keyMetrics: [
      { label: 'Tegangan / Kapasitas', value: '48V / 200Ah', sub: '9.6 kWh Energi' },
      { label: 'Siklus Hidup', value: '6000+ Cycles', sub: '@80% Depth of Discharge' },
      { label: 'Garansi', value: '5 Tahun', sub: 'Garansi Prinsipal NPP' },
      { label: 'Komunikasi', value: 'RS485 / CAN', sub: 'Modbus Protocol' }
    ],
    modCategories: [
      { title: 'Sistem Sel & Elektrikal', items: ['Grade A Prismatic LiFePO4 Cells', 'Internal Fast Blown Fuse', 'DC Breaker Isolator 250A', 'Terminal Tembaga M8 Lapis Nikel'] },
      { title: 'Battery Management (BMS)', items: ['Active Cell Balancing Circuit', 'Over-Voltage & Under-Voltage Protection', 'Dual Probe Temperature Sensor', 'SOC LED & LCD Status Panel'] },
      { title: 'Chassis & Pemasangan', items: ['Standard 19-inch Server Rack Mounting', 'Heavy Gauge Cold Rolled Steel Enclosure', 'IP21 Ingress Protection Rating'] }
    ],
    specs: {
      engine: [
        { label: 'Nominal Voltage', value: '48V DC (Operating: 42.0V - 54.0V)' },
        { label: 'Rated Capacity', value: '200 Ah / 9,600 Wh' },
        { label: 'Max Charge/Discharge Current', value: '100A Kontinu (150A Puncak 10s)' },
        { label: 'Efisiensi Daya', value: '≥ 95% Round Trip' }
      ],
      chassis: [
        { label: 'Proteksi Standar', value: 'IEC 62619, IEC 62040, UN38.3' },
        { label: 'Interface Monitoring', value: 'RS485, CAN, Dry Contact Alarm' }
      ],
      dimensions: [
        { label: 'Dimensi Unit (W x D x H)', value: '442 x 520 x 222 mm (5U)' },
        { label: 'Berat Bersih', value: '78.5 kg' }
      ]
    }
  },
  2: {
    id: 2,
    name: 'UPS Ablerex Enterprise Modular',
    subtitle: 'Ablerex Power Solutions • Online Double Conversion 3:3',
    price: 'Hubungi Sales',
    priceNote: 'Termasuk Komisioning Resmi',
    discount: 'Ablerex',
    rating: '5.0',
    reviewsCount: 45,
    badge: 'Tier III/IV Ready',
    image: 'assets/product/UPS Ablerex1.webp',
    gallery: [
      'assets/product/UPS Ablerex1.webp',
      'assets/product/UPS Ablerex2.webp',
      'assets/product/UPS Ablerex3.webp'
    ],
    unitOverview: [
      'Didistribusikan resmi oleh PT Nusantara Puncak Perkasa',
      'Teknologi Online Double Conversion dengan proteksi beban penuh',
      'Arsitektur efisiensi tinggi hemat energi hingga 96.5%',
      'Dukungan suku cadang dan kontrak servis berkala'
    ],
    description: 'UPS Ablerex merupakan solusi proteksi daya terdepan yang disediakan PT Nusantara Puncak Perkasa. Dirancang khusus untuk menjamin kelangsungan daya tanpa jeda (zero transfer time) pada operasional rumah sakit, perbankan, telekomunikasi, dan manufaktur berteknologi tinggi.',
    keyMetrics: [
      { label: 'Kapasitas', value: '100 kVA / 100 kW', sub: 'Power Factor 1.0' },
      { label: 'Efisiensi', value: '96.5%', sub: 'Mode Double Conversion' },
      { label: 'Redundansi', value: 'N+X Modular', sub: 'Hot Swappable Module' },
      { label: 'Transfer Time', value: '0 ms', sub: 'Pure Online Sine Wave' }
    ],
    modCategories: [
      { title: 'Modul Daya & Inverter', items: ['IGBT 3-Level Topologi Inverter', 'Hot-Swappable 25kVA Power Modules', 'Bypass Statis Sentral', 'Dynamic Voltage Regulation'] },
      { title: 'Proteksi & Keandalan', items: ['Surge Protection Device Type II', 'Isolasi Galvanis Opsional', 'Perlindungan Korsleting Beban Penuh', 'Kepatuhan Standar IEC 62040-3'] },
      { title: 'Antarmuka & Pengendalian', items: ['7-inch Color Touchscreen HMI', 'Dual Ethernet SNMP Card', 'Modbus RTU RS485 Interface', 'Dry Contact Relay Output'] }
    ],
    specs: {
      engine: [
        { label: 'Input Voltage', value: '380V/400V/415V AC 3-Phase + N (-40% s/d +25%)' },
        { label: 'Output Voltage', value: '380V/400V/415V AC 3-Phase ±1%' },
        { label: 'Output Power Factor', value: '1.0' },
        { label: 'THDi / THDv', value: '< 3% Beban Linier' }
      ],
      chassis: [
        { label: 'Standar Keamanan', value: 'IEC/EN 62040-1, IEC/EN 62040-2' },
        { label: 'Proteksi Kabinet', value: 'IP20 dengan Filter Debu Modular' }
      ],
      dimensions: [
        { label: 'Dimensi Kabinet (W x D x H)', value: '600 x 900 x 2000 mm' },
        { label: 'Berat Kabinet Kosong', value: '190 kg (Modul: 28 kg/unit)' }
      ]
    }
  },
  3: {
    id: 3,
    name: 'Baterai BSB Industrial Storage VRLA',
    subtitle: 'BSB Battery • Standby & Cyclic Industrial Power Solution',
    price: 'Hubungi Sales',
    priceNote: 'Penawaran Formal B2B',
    discount: 'BSB',
    rating: '4.8',
    reviewsCount: 41,
    badge: 'BSB Battery',
    image: 'assets/product/BSB.webp',
    gallery: [
      'assets/product/BSB.webp'
    ],
    unitOverview: [
      'Didistribusikan resmi oleh PT Nusantara Puncak Perkasa',
      'Dirancang untuk keandalan catu daya industri dan infrastruktur',
      'Bebas perawatan berkala dengan sistem katup VRLA berstandar global',
      'Dukungan jaminan kualitas dan ketersediaan stok'
    ],
    description: 'Baterai BSB merupakan salah satu lini baterai industri utama dari PT Nusantara Puncak Perkasa. Dirancang untuk memberikan performa daya tahan luar biasa pada instalasi cadangan UPS, telekomunikasi, sistem kontrol SCADA, dan utilitas industri kelistrikan.',
    keyMetrics: [
      { label: 'Tegangan / Kapasitas', value: '12V / 200Ah', sub: '10HR Rate @ 25°C' },
      { label: 'Tipe Elektrolit', value: 'Silica Gel', sub: 'Non-Spillable Design' },
      { label: 'Masa Desain', value: '10 - 12 Tahun', sub: 'Float Service Life' },
      { label: 'Terminal', value: 'Tembaga M8', sub: 'Low Resistance' }
    ],
    modCategories: [
      { title: 'Material & Konstruksi', items: ['Plat Timbal Kemurnian 99.99%', 'Pemisah Microporous Polymer AGM/Gel', 'Katup Pengaman Tekanan Satu Arah', 'Wadah Plastik ABS Tahan Api (UL94-V0)'] },
      { title: 'Standar Pengujian', items: ['Standar IEC 60896-21/22', 'Kepatuhan Standar Baterai Telekomunikasi', 'Sertifikasi CE & ISO 9001/14001'] }
    ],
    specs: {
      engine: [
        { label: 'Tegangan Nominal', value: '12V' },
        { label: 'Kapasitas (20Hr)', value: '200 Ah (10.0A ke 10.8V)' },
        { label: 'Resistansi Internal', value: 'Sekitar 3.5 mΩ (Penuh Terisi)' },
        { label: 'Tegangan Floating Charge', value: '13.5V - 13.8V @ 25°C' }
      ],
      chassis: [
        { label: 'Bahan Wadah', value: 'ABS Tahan Benturan dan Api' },
        { label: 'Koneksi Terminal', value: 'Baut Tembaga M8' }
      ],
      dimensions: [
        { label: 'Dimensi Unit (W x D x H)', value: '522 x 240 x 218 mm' },
        { label: 'Berat Bersih', value: '62.0 kg' }
      ]
    }
  }
};
