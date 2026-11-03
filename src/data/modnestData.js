export const navLinks = [
  { label: 'Home', href: '#home', active: true },
  { label: 'Services', href: '#services', active: false },
  { label: 'About', href: '#about', active: false },
  { label: 'Review', href: '#review', active: false },
]

export const heroAvatars = [
  { id: 1, name: 'User 1', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
  { id: 2, name: 'User 2', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
  { id: 3, name: 'User 3', src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80' },
  { id: 4, name: 'User 4', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' },
]

export const heroMiniHighlights = [
  { id: 1, title: 'Unlimited Furniture', meta: '400+ July 2025' },
  { id: 2, title: 'New interior design', meta: '100+ July 2025' },
]

export const statsList = [
  {
    id: 1,
    number: '7K+',
    description: 'Each piece we sell is crafted with care, quality, and timeless design—making ever',
  },
  {
    id: 2,
    number: '40+',
    description: "We don't just sell furniture—we help bring your vision to life. Our team has successfully",
  },
  {
    id: 3,
    number: '10+',
    description: 'With a decade of experience in modern furniture and interior aesthetics, ModNest',
  },
]

export const featuresList = [
  {
    id: 'shield',
    title: 'Crafted with Care',
    description:
      'Every piece is made with precision and passion by skilled artisans. We pay close attention to the details — from the grain of the wood.',
  },
  {
    id: 'leaf',
    title: 'Eco-Friendly Approach',
    description:
      'Sustainability is at the heart of everything we do. From responsibly sourced materials to environmentally conscious packaging.',
  },
  {
    id: 'sofa',
    title: 'Comfort-First Design',
    description:
      'We design with real life in mind. Our furniture combines ergonomic principles with cozy textures and supportive shapes, so your',
  },
]

export const catalogCategories = ['Bed room', 'Living room', 'Dinning room', 'Indore', 'Kitchen']

export const marketingContacts = [
  { label: 'Marketing 1 (WhatsApp)', phone: '+62 878-3505-5088', waUrl: 'https://wa.me/6287835055088' },
  { label: 'Marketing 2 (WhatsApp)', phone: '+62 851-5726-6860', waUrl: 'https://wa.me/6285157266860' },
]

export const productsList = [
  {
    id: 1,
    name: 'Kawasaki Ninja 400',
    subtitle: 'KRT Edition ABS • Full Paper ATPM',
    price: 'Rp 148.000.000',
    priceNote: 'Negotiable',
    discount: 'ATPM',
    category: 'Living room',
    rating: '4.9',
    reviewsCount: 42,
    badge: 'Ready Stock • Full Paper',
    image: 'https://images.unsplash.com/photo-1580341289255-5b47c98a59dd?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1580341289255-5b47c98a59dd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=1000&q=80',
    ],
    unitOverview: [
      'Fullpaper ATPM NIK 2020 / Registrasi 2021',
      'ODO 4.xxx km slowgoing (Very Low Miles)',
      'Surat lengkap (BPKB, STNK, Faktur, Kunci Serep)',
      'Pajak hidup panjang • Kondisi mulus siap pakai',
    ],
    description:
      'FS: KAWASAKI NINJA 400 KRT EDITION ABS FULL SPEC. Unit simpanan dengan kilometer sangat rendah (4.xxx km on going), surat-surat resmi ATPM lengkap, serta sudah dilengkapi part modifikasi branded original.',
    keyMetrics: [
      { label: 'NIK / Reg', value: '2020 / 2021', sub: 'Fullpaper ATPM Resmi' },
      { label: 'Odometer', value: '4.xxx km', sub: 'Slowgoing (Very Low)' },
      { label: 'Documents', value: 'Complete', sub: 'BPKB, STNK, Faktur' },
      { label: 'Engine', value: '399 cc', sub: 'Parallel-Twin DOHC' },
    ],
    modCategories: [
      {
        title: 'Performance & Exhaust',
        items: [
          'Akrapovič Carbon Racing Full System Exhaust',
          'DID ERV7 520 Gold Racing Chain',
          'Driven Sprocket Rear Gear',
          'K&N High-Flow Air Filter',
        ],
      },
      {
        title: 'Braking System',
        items: [
          'Brembo RCS 15 Corsa Corta Master Brake',
          'Brembo 4P Front Caliper Black Edition',
          'Brembo Rear 2P Caliper',
          'HEL Braided Brake Lines Front & Rear',
        ],
      },
      {
        title: 'Suspension & Handling',
        items: [
          'Öhlins STX 46 Rear Shock Absorber',
          'Öhlins Steering Damper + Norton Bracket',
          'Pirelli Diablo Supercorsa V3 Tires',
        ],
      },
      {
        title: 'Carbon, Control & Accessories',
        items: [
          'LighTech Adjustable Rearset Footstep',
          'Carbonstar Front Fender & Hugger',
          'GB Racing Engine Cover Set',
          'ZeroGravity Corsa Windshield',
        ],
      },
    ],
    specs: {
      engine: [
        { label: 'Engine Type', value: '4-Stroke, 2-Cylinder, DOHC, 8-Valve, Liquid-Cooled' },
        { label: 'Displacement', value: '399 cc' },
        { label: 'Max Power', value: '49.0 HP @ 10,000 rpm' },
        { label: 'Max Torque', value: '38.0 Nm @ 8,000 rpm' },
        { label: 'Transmission', value: '6-Speed, Return Shift with Assist & Slipper Clutch' },
        { label: 'Fuel System', value: 'DFI with 32mm Throttle Bodies (x2)' },
      ],
      chassis: [
        { label: 'Frame Type', value: 'Trellis, High-Tensile Steel' },
        { label: 'Front Suspension', value: '41mm Telescopic Fork' },
        { label: 'Rear Suspension', value: 'Bottom-Link Uni-Trak (Upgraded Öhlins STX 46)' },
        { label: 'Front & Rear Brakes', value: '310mm / 220mm Petal Disc with Dual-Channel ABS' },
      ],
      dimensions: [
        { label: 'Dimensions (L x W x H)', value: '1,990 x 710 x 1,120 mm' },
        { label: 'Seat Height', value: '785 mm' },
        { label: 'Curb Weight', value: '168 kg' },
        { label: 'Fuel Capacity', value: '14.0 Liters' },
      ],
    },
  },
  {
    id: 2,
    name: 'Kawasaki ZX-6R / ZX636',
    subtitle: 'ABS Black Edition (5 in Indo) • Full SpecHedon',
    price: 'Rp 365.000.000',
    priceNote: 'Negotiable',
    discount: '5 in Indo',
    category: 'Living room',
    rating: '5.0',
    reviewsCount: 89,
    badge: 'Collector Spec • 5 in Indo',
    image: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580341289255-5b47c98a59dd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
    ],
    unitOverview: [
      'Fullpaper ATPM NIK 2014 / Registrasi 2020',
      'ODO 7.xxx km slowgoing (VERY LOW)',
      'Surat lengkap (BPKB, STNK, FAKTUR)',
      'Rare ABS Black Edition (Hanya 5 Unit di Indonesia)',
    ],
    description:
      'BISMILLAHIRAHMANIRAHIM — FS: KAWASAKI ZX6R/ZX636 ABS BLACK EDITION (5 in Indo). Fullpaper ATPM NIK 2014, Registrasi 2020, ODO 7.xxx km slowgoing (VERY LOW), Surat lengkap (BPKB, STNK, FAKTUR) dengan deretan part modifikasi high-end mulai dari OZ Racing GASS RSA, Öhlins TTX GP, hingga Full Brembo Black Edition.',
    keyMetrics: [
      { label: 'NIK / Reg', value: '2014 / 2020', sub: 'Fullpaper ATPM Resmi' },
      { label: 'Odometer', value: '7.xxx km', sub: 'Slowgoing (VERY LOW)' },
      { label: 'Documents', value: 'Complete', sub: 'BPKB, STNK, FAKTUR' },
      { label: 'Rarity', value: '5 in Indo', sub: 'ABS Black Edition' },
    ],
    modCategories: [
      {
        title: 'Performance & Exhaust',
        items: [
          'Austin Racing GP1RR Exhaust',
          'Titanium Full System Header',
          'EK Chain SRX Chain',
          'Sunstar Rear Gear',
        ],
      },
      {
        title: 'Braking System',
        items: [
          'Brembo RCS 19 CorsaCorta Master Brake',
          'Brembo M4 Black Edition Calipers',
          'Brembo P2 Black Edition Rear Caliper',
          'Brembo Full Floating Disc Brake',
          'Braketech Floating Rear Disc',
          'HEL Double Front Brake Line',
          'HEL Rear Brake Line',
          'AEM Front Brake Reservoir',
          'AEM Rear Brake Reservoir',
        ],
      },
      {
        title: 'Suspension & Handling',
        items: [
          'Öhlins TTX GP Rear Shock',
          'Öhlins Steering Damper',
          'Öhlins Steering Damper Bracket',
          'Kendmoto Triple Clamp',
        ],
      },
      {
        title: 'Wheels & Tires',
        items: [
          'OZ Racing GASS RSA Gold Wheels',
          'Pirelli Supercorsa V4 Tires',
        ],
      },
      {
        title: 'Cooling System',
        items: [
          'Samco Sport Radiator Hose',
          'Engine Ice Coolant',
          'RNG Radiator Cover',
        ],
      },
      {
        title: 'Protection',
        items: [
          'GB Racing Engine Cover',
          'Evotech Performance Frame Sliders',
          'Evotech Front Axle Slider',
          'Lightech Proguard',
          'Mirror Blanking',
        ],
      },
      {
        title: 'Control & Riding Parts',
        items: [
          'Accossato Quick Throttle',
          'Accossato Switch',
          'CRG Clutch Lever',
          'LighTech Rearset Footstep',
          'Lightech Chain Adjuster',
          'Lightech Bar End',
          'Lightech Fuel Cap',
          'Lightech Oil Cap',
        ],
      },
      {
        title: 'Carbon Parts',
        items: [
          'Carbonstar Front Fender',
          'Carbonstar Frame Cover',
          'Carbon Tank Pad',
          'Carbon Hugger',
          'Carbon Swingarm Cover',
          'Carbon Single Seat',
          'Carbon Rear Fairing Cover',
          'Carbonstar Air Scoop',
        ],
      },
      {
        title: 'Aero & Exterior',
        items: [
          'Winglet Downforce',
          'ZeroGravity Windshield',
          'RNG Tank Grip',
          'JPA Front Turn Signal',
          'Project One Stoplamp 3 in 1',
        ],
      },
      {
        title: 'Titanium Hardware',
        items: [
          'Titanium Rear Caliper Bolts',
          'Titanium Front Disc Bolts',
          'Titanium Rear Disc Bolts',
          'Titanium Footstep Bolts',
          'Titanium Gear Bolts',
          'Titanium Kill Switch Bolts',
          'Titanium Banjo Bolts',
        ],
      },
    ],
    specs: {
      engine: [
        { label: 'Engine Type', value: '4-Stroke, 4-Cylinder Inline, DOHC, 16-Valve, Liquid-Cooled' },
        { label: 'Displacement', value: '636 cc' },
        { label: 'Max Power', value: '131 HP @ 13,500 rpm (Ram Air)' },
        { label: 'Max Torque', value: '71.0 Nm @ 11,500 rpm' },
        { label: 'Electronics', value: 'KTRC (3-Mode Traction Control) + Power Modes + KIBS ABS' },
        { label: 'Transmission', value: '6-Speed Cassette with FCC Assist & Slipper Clutch' },
      ],
      chassis: [
        { label: 'Frame Type', value: 'Perimeter, Pressed Aluminum' },
        { label: 'Front Suspension', value: '41mm Inverted Showa SFF-BP Fork' },
        { label: 'Rear Suspension', value: 'Uni-Trak with Öhlins TTX GP Full Adjustable' },
        { label: 'Wheelset', value: 'OZ Racing GASS RSA Forged Aluminum Gold' },
      ],
      dimensions: [
        { label: 'Dimensions (L x W x H)', value: '2,085 x 705 x 1,115 mm' },
        { label: 'Wheelbase', value: '1,395 mm' },
        { label: 'Seat Height', value: '830 mm' },
        { label: 'Fuel Capacity', value: '17.0 Liters' },
      ],
    },
  },
  {
    id: 3,
    name: 'KTM RC 390',
    subtitle: 'Factory Racing Spec • Full Paper ATPM',
    price: 'Rp 118.000.000',
    priceNote: 'Negotiable',
    discount: 'ATPM',
    category: 'Living room',
    rating: '4.8',
    reviewsCount: 34,
    badge: 'Ready Stock • Low KM',
    image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580341289255-5b47c98a59dd?auto=format&fit=crop&w=1000&q=80',
    ],
    unitOverview: [
      'Fullpaper ATPM NIK 2022 / Registrasi 2023',
      'ODO 3.xxx km slowgoing',
      'Surat lengkap (BPKB, STNK, Faktur)',
      'WP APEX Suspension & Supermoto ABS',
    ],
    description:
      'FS: KTM RC 390 FACTORY RACING SPEC. Motor supersport ringan dengan handling setajam silet, dilengkapi suspensi WP APEX adjustable dan knalpot racing titanium.',
    keyMetrics: [
      { label: 'NIK / Reg', value: '2022 / 2023', sub: 'Fullpaper ATPM' },
      { label: 'Odometer', value: '3.xxx km', sub: 'Slowgoing' },
      { label: 'Documents', value: 'Complete', sub: 'BPKB, STNK, Faktur' },
      { label: 'Dry Weight', value: '155 kg', sub: 'Ultralight Bionic' },
    ],
    modCategories: [
      {
        title: 'Performance & Exhaust',
        items: ['Remus Slip-On Titanium Exhaust', 'KTM PowerParts Racing Air Filter'],
      },
      {
        title: 'Suspension & Brakes',
        items: ['WP APEX 43mm USD Adjustable Fork', 'ByBre Radial 4-Piston Caliper + HEL Lines'],
      },
    ],
    specs: {
      engine: [
        { label: 'Engine Type', value: '1-Cylinder, 4-Stroke, DOHC, Liquid-Cooled' },
        { label: 'Displacement', value: '373.2 cc' },
      ],
      chassis: [
        { label: 'Frame Type', value: 'Steel Trellis Frame, Powder Coated' },
        { label: 'Front Suspension', value: 'WP APEX 43mm USD Fork' },
      ],
      dimensions: [
        { label: 'Seat Height', value: '824 mm' },
        { label: 'Dry Weight', value: '155 kg' },
      ],
    },
  },
  {
    id: 4,
    name: 'KTM 790 Duke',
    subtitle: 'The Scalpel LC8c • Full Paper ATPM',
    price: 'Rp 275.000.000',
    priceNote: 'Negotiable',
    discount: 'ATPM',
    category: 'Living room',
    rating: '4.9',
    reviewsCount: 51,
    badge: 'Ready Stock • Full Spec',
    image: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580341289255-5b47c98a59dd?auto=format&fit=crop&w=1000&q=80',
    ],
    unitOverview: [
      'Fullpaper ATPM NIK 2019 / Registrasi 2020',
      'ODO 5.xxx km slowgoing',
      'Surat lengkap (BPKB, STNK, Faktur)',
      'Track Pack Unlocked + Quickshifter+',
    ],
    description:
      'FS: KTM 790 DUKE "THE SCALpel" FULL PAPER. Naked streetfighter 799cc 2-silinder dengan torsi brutal, sudah unlock Track Mode, Anti-Wheelie Mode, dan Akrapovič Titanium.',
    keyMetrics: [
      { label: 'NIK / Reg', value: '2019 / 2020', sub: 'Fullpaper ATPM' },
      { label: 'Odometer', value: '5.xxx km', sub: 'Slowgoing' },
      { label: 'Documents', value: 'Complete', sub: 'BPKB, STNK, Faktur' },
      { label: 'Max Power', value: '105 HP', sub: 'LC8c Parallel Twin' },
    ],
    modCategories: [
      {
        title: 'Performance & Exhaust',
        items: ['Akrapovič Slip-On Line Titanium', 'KTM Track Pack Software Unlocked', 'Quickshifter+ Up & Down'],
      },
      {
        title: 'Protection & Accessories',
        items: ['Evotech Frame & Axle Sliders', 'KTM PowerParts Ergo Seat', 'CRG Bar-End Mirrors'],
      },
    ],
    specs: {
      engine: [
        { label: 'Engine Type', value: '2-Cylinder, 4-Stroke, DOHC Parallel Twin' },
        { label: 'Displacement', value: '799 cc' },
      ],
      chassis: [
        { label: 'Frame Type', value: 'Chromium-Molybdenum-Steel Frame' },
        { label: 'Suspension', value: 'WP APEX 43mm Open-Cartridge USD' },
      ],
      dimensions: [
        { label: 'Seat Height', value: '825 mm' },
        { label: 'Dry Weight', value: '169 kg' },
      ],
    },
  },
  {
    id: 5,
    name: 'Yamaha YZF-R6',
    subtitle: 'RJ15 / BN6 Race Spec • Full Paper',
    price: 'Rp 395.000.000',
    priceNote: 'Negotiable',
    discount: 'Collector',
    category: 'Living room',
    rating: '5.0',
    reviewsCount: 112,
    badge: 'Rare Collector Unit',
    image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=1000&q=80',
    ],
    unitOverview: [
      'Fullpaper Resmi NIK 2018 / Registrasi 2019',
      'ODO 6.xxx km slowgoing (Very Low)',
      'Surat lengkap (BPKB, STNK, Faktur)',
      'Full System SC Project Titanium + Brembo GP4RX',
    ],
    description:
      'FS: YAMAHA YZF-R6 RACE SPEC FULL PAPER. Supersport 600cc 4-silinder legendaris dengan raungan 16.500 RPM, Titanium Valve, dan paket modifikasi sirkuit kelas atas.',
    keyMetrics: [
      { label: 'NIK / Reg', value: '2018 / 2019', sub: 'Fullpaper Resmi' },
      { label: 'Odometer', value: '6.xxx km', sub: 'Slowgoing' },
      { label: 'Documents', value: 'Complete', sub: 'BPKB, STNK, Faktur' },
      { label: 'Redline', value: '16,500 RPM', sub: 'Titanium Valves' },
    ],
    modCategories: [
      {
        title: 'Performance & Exhaust',
        items: ['SC Project CR-T Titanium Full System', 'Woolich Racing ECU Flash + Quickshifter', 'BMC Race Air Filter'],
      },
      {
        title: 'Braking & Suspension',
        items: ['Brembo GP4RX Nickel Calipers', 'Brembo RCS 19 Corsa Corta', 'Öhlins TTX GP Rear Shock', 'Öhlins Steering Damper'],
      },
    ],
    specs: {
      engine: [
        { label: 'Engine Type', value: '599cc Liquid-Cooled DOHC Inline 4-Cylinder; 16 Titanium Valves' },
        { label: 'Max Power', value: '118.4 HP @ 14,500 rpm' },
      ],
      chassis: [
        { label: 'Frame Type', value: 'Aluminum Deltabox with Magnesium Rear Subframe' },
        { label: 'Front Suspension', value: '43mm KYB R1-Spec Inverted Fork' },
      ],
      dimensions: [
        { label: 'Seat Height', value: '850 mm' },
        { label: 'Wet Weight', value: '190 kg' },
      ],
    },
  },
  {
    id: 6,
    name: 'Royal Enfield Bullet 500',
    subtitle: 'Heritage Custom Gold Leaf • Full Paper ATPM',
    price: 'Rp 135.000.000',
    priceNote: 'Negotiable',
    discount: 'ATPM',
    category: 'Living room',
    rating: '4.8',
    reviewsCount: 38,
    badge: 'Collector Heritage',
    image: 'https://images.unsplash.com/photo-1622185135505-2d795003994a?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1622185135505-2d795003994a?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=1000&q=80',
    ],
    unitOverview: [
      'Fullpaper ATPM NIK 2019 / Registrasi 2020',
      'ODO 4.xxx km kolektor item',
      'Surat lengkap (BPKB, STNK, Faktur)',
      'Hand-Painted Madras Stripes',
    ],
    description:
      'FS: ROYAL ENFIELD BULLET 500 EFI FULL PAPER ATPM. Klasik ikonik 500cc long-stroke single yang sudah discontinue, kondisi mint kolektor.',
    keyMetrics: [
      { label: 'NIK / Reg', value: '2019 / 2020', sub: 'Fullpaper ATPM' },
      { label: 'Odometer', value: '4.xxx km', sub: 'Mint Condition' },
      { label: 'Documents', value: 'Complete', sub: 'BPKB, STNK, Faktur' },
      { label: 'Displacement', value: '499 cc', sub: 'Long-Stroke Single' },
    ],
    modCategories: [
      {
        title: 'Classic Upgrades & Accessories',
        items: [
          'Hitchcocks Motorcycles Brass Exhaust',
          'Genuine Leather Spring Solo Saddle',
          'OEM Royal Enfield Chrome Crash Guard',
          'Avon Roadrider MKII Classic Tires',
        ],
      },
    ],
    specs: {
      engine: [
        { label: 'Engine Type', value: 'Single Cylinder, 4-Stroke, Twinspark, Air-Cooled' },
        { label: 'Displacement', value: '499 cc' },
      ],
      chassis: [
        { label: 'Frame Type', value: 'Single Downtube, Using Engine as Stressed Member' },
        { label: 'Brakes', value: '280mm Front / 240mm Rear Disc with Dual-Channel ABS' },
      ],
      dimensions: [
        { label: 'Seat Height', value: '800 mm' },
        { label: 'Curb Weight', value: '195 kg' },
      ],
    },
  },
]

export const craftedCollections = [
  {
    id: 1,
    tag: 'New Collection',
    title: 'Center Table',
    items: ['Square table', 'Round table', 'Wooden table', 'Glass table'],
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&q=80',
    alt: 'Ducati SuperSport',
  },
  {
    id: 2,
    tag: 'New Collection',
    title: 'Center Table',
    items: ['Square table', 'Round table', 'Wooden table', 'Glass table'],
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80',
    alt: 'Harley-Davidson Street Bob',
  },
  {
    id: 3,
    tag: 'New Collection',
    title: 'Center Table',
    items: ['Wooden table', 'Glass table'],
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
    alt: 'Harley-Davidson LiveWire',
  },
]

export const testimonialsList = [
  {
    id: 1,
    name: 'Nicolas Menze',
    role: 'CEO, Company',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    quote:
      'I was skeptical about e-learning at first, but after using this platform, I am a true believer. The content is top-notch and the ability to connect with other learners has enhanced my experience.',
  },
  {
    id: 2,
    name: 'Nicolas Menze',
    role: 'CEO, Company',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    quote:
      'I was skeptical about e-learning at first, but after using this platform, I am a true believer. The content is top-notch and the ability to connect with other learners has enhanced my experience.',
  },
  {
    id: 3,
    name: 'Nicolas Menze',
    role: 'CEO, Company',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    quote:
      'I was skeptical about e-learning at first, but after using this platform, I am a true believer. The content is top-notch and the ability to connect with other learners has enhanced my experience.',
  },
]

export const themeOptions = [
  { id: 'ohlins', label: 'Öhlins Gold', dotClass: 'bg-[#D4AF37]', btnClass: 'bg-zinc-950 text-[#D4AF37]' },
  { id: 'light', label: 'Light', dotClass: 'bg-[#111111]', btnClass: 'bg-white text-[#111111]' },
  { id: 'brembo', label: 'Carbon Red', dotClass: 'bg-red-500', btnClass: 'keep-white bg-zinc-950 text-white' },
  { id: 'titanium', label: 'Titanium', dotClass: 'bg-sky-400', btnClass: 'keep-white bg-zinc-950 text-white' },
]
