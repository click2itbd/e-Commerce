import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import {
  Search,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Package,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

interface BrandItem {
  name: string;
  category: 'Components' | 'Laptops & Desktops' | 'Networking & CCTV' | 'Peripherals & Gear' | 'Monitors & Storage';
  description: string;
  featured?: boolean;
  logo?: string;
  productCount?: number;
}

const curatedBrands: BrandItem[] = [
  // Components
  { name: 'Intel', category: 'Components', description: 'Core i3, i5, i7, i9, Core Ultra desktop processors and workstation CPUs.', featured: true, logo: '/images/brands/intel.svg' },
  { name: 'AMD', category: 'Components', description: 'Ryzen 3, 5, 7, 9 desktop processors and Radeon RX gaming graphics cards.', featured: true, logo: '/images/brands/amd.svg' },
  { name: 'NVIDIA', category: 'Components', description: 'GeForce RTX gaming GPUs and studio graphics accelerators.', featured: true },
  { name: 'ASUS', category: 'Components', description: 'ROG, TUF Gaming, Prime motherboards, graphics cards, monitors, and laptops.', featured: true, logo: '/images/brands/asus.svg' },
  { name: 'MSI', category: 'Components', description: 'MAG, MPG, and PRO series motherboards, GPUs, liquid coolers, and gaming monitors.', featured: true, logo: '/images/brands/msi.svg' },
  { name: 'Gigabyte', category: 'Components', description: 'AORUS & Ultra Durable motherboards, graphics cards, and power supplies.', featured: true, logo: '/images/brands/gigabyte.svg' },
  { name: 'Value-Top', category: 'Components', description: 'ATX/mATX gaming cases, power supplies, CPU coolers, and office monitors.', featured: true, logo: '/images/brands/valuetop.svg' },
  { name: 'Corsair', category: 'Components', description: 'Vengeance DDR4/DDR5 gaming RAM, modular PSUs, AIO coolers, and PC cases.', featured: true },

  // Monitors & Storage
  { name: 'KingSpec', category: 'Monitors & Storage', description: 'High-speed NVMe M.2 PCIe SSDs, SATA solid-state drives, and DDR4/DDR5 memory.', featured: true, logo: '/images/brands/kingspec.svg' },
  { name: 'Kingston', category: 'Monitors & Storage', description: 'FURY Beast DDR4/DDR5 desktop RAM and NVMe PCIe 4.0 solid-state drives.', featured: true },
  { name: 'Samsung', category: 'Monitors & Storage', description: '980/990 PRO NVMe SSDs and Odyssey / Essential high-refresh monitors.', featured: true },
  { name: 'Western Digital', category: 'Monitors & Storage', description: 'WD Blue, Black SN850X NVMe SSDs, and Purple surveillance hard drives.' },

  // Laptops & Desktops
  { name: 'HP', category: 'Laptops & Desktops', description: 'Pavilion, ProBook, EliteBook, Victus, and OMEN gaming laptops & printers.', featured: true },
  { name: 'Dell', category: 'Laptops & Desktops', description: 'Inspiron, Vostro, Latitude business laptops and UltraSharp monitors.', featured: true },
  { name: 'Lenovo', category: 'Laptops & Desktops', description: 'IdeaPad, ThinkPad, LOQ, and Legion gaming laptops and all-in-one PCs.', featured: true },
  { name: 'Acer', category: 'Laptops & Desktops', description: 'Aspire, Swift, Nitro, and Predator series laptops and gaming displays.' },
  { name: 'Apple', category: 'Laptops & Desktops', description: 'MacBook Air, MacBook Pro, Mac mini, and iPad powered by Apple Silicon.' },

  // Networking & CCTV
  { name: 'TP-Link', category: 'Networking & CCTV', description: 'Archer Wi-Fi 6 routers, Deco mesh systems, and gigabit network switches.', featured: true },
  { name: 'MikroTik', category: 'Networking & CCTV', description: 'RouterBOARDs, Cloud Core routers, and enterprise ISP networking gear.', featured: true },
  { name: 'Hikvision', category: 'Networking & CCTV', description: 'IP & HD surveillance cameras, NVRs, DVRs, and smart security systems.', featured: true },
  { name: 'Dahua', category: 'Networking & CCTV', description: 'Full-color CCTV cameras, XVR/NVR recorders, and access control terminals.' },
  { name: 'D-Link', category: 'Networking & CCTV', description: 'Wireless routers, unmanaged/managed switches, and networking cables.' },
  { name: 'Tenda', category: 'Networking & CCTV', description: 'Dual-band home Wi-Fi routers, range extenders, and PoE switches.' },

  // Peripherals & Gear
  { name: 'Logitech', category: 'Peripherals & Gear', description: 'G-Series gaming mice, mechanical keyboards, webcams, and wireless combos.', featured: true, logo: '/images/brands/logitech.svg' },
  { name: 'A4Tech', category: 'Peripherals & Gear', description: 'Bloody gaming mice, mechanical keyboards, and durable office peripherals.', featured: true },
  { name: 'Fantech', category: 'Peripherals & Gear', description: 'RGB gaming headsets, mechanical keyboards, mice, and desk mats.' },
  { name: 'Razer', category: 'Peripherals & Gear', description: 'DeathAdder & Viper gaming mice, BlackShark headsets, and Chroma keyboards.' },
];

export const Brands = () => {
  const { settings } = useSettings();
  const brandName = settings?.brandName || 'Click2IT BD';
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dbBrands, setDbBrands] = useState<Array<{ name: string; logo?: string }>>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    const loadBrandData = async () => {
      try {
        const [brandsSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'store_brands')),
          getDocs(collection(db, 'products')),
        ]);

        if (!mounted) return;

        const fetchedBrands = brandsSnap.docs
          .map((d) => d.data())
          .filter((b) => b && b.name && b.isActive !== false)
          .map((b) => ({ name: String(b.name).trim(), logo: b.logo || '' }));

        const counts: Record<string, number> = {};
        productsSnap.docs.forEach((d) => {
          const data = d.data();
          const bName = String(data.brand || '').trim();
          if (!bName) return;
          const key = bName.toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        });

        setDbBrands(fetchedBrands);
        setProductCounts(counts);
      } catch (err) {
        console.error('Failed to load live brand stats:', err);
      }
    };
    loadBrandData();
    return () => {
      mounted = false;
    };
  }, []);

  const mergedBrands = useMemo(() => {
    const map = new Map<string, BrandItem>();

    curatedBrands.forEach((b) => {
      const key = b.name.toLowerCase();
      map.set(key, {
        ...b,
        productCount: productCounts[key] || 0,
      });
    });

    dbBrands.forEach((b) => {
      const key = b.name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          logo: b.logo || existing.logo,
          featured: true,
          productCount: productCounts[key] || existing.productCount || 0,
        });
      } else {
        map.set(key, {
          name: b.name,
          category: 'Components',
          description: `Explore authentic ${b.name} products with official warranty at ${brandName}.`,
          featured: true,
          logo: b.logo,
          productCount: productCounts[key] || 0,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const countDiff = (b.productCount || 0) - (a.productCount || 0);
      if (countDiff !== 0) return countDiff;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [dbBrands, productCounts, brandName]);

  const categories = [
    'All',
    'Components',
    'Monitors & Storage',
    'Laptops & Desktops',
    'Networking & CCTV',
    'Peripherals & Gear',
  ];

  const filteredBrands = mergedBrands.filter((brand) => {
    const matchesCategory =
      selectedCategory === 'All' || brand.category === selectedCategory;
    const matchesSearch =
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout fullWidth>
      <SEO
        title={`Authorized Tech Brands & Partners - ${brandName}`}
        description={`Shop 100% genuine computer components, laptops, monitors, CCTV, and gaming accessories from top global brands at ${brandName}.`}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white py-14 md:py-20">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={14} /> 100% Authentic &amp; Official Warranty
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Authorized <span className="text-orange-400">Tech Brands</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8">
            Browse genuine processors, motherboards, graphics cards, laptops, monitors, and networking hardware from world-leading manufacturers available at <strong>{brandName}</strong>.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search brand (e.g. Intel, AMD, ASUS, MSI, Value-Top, Logitech)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm backdrop-blur-md"
            />
            <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-slate-50/80 py-12 min-h-[60vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Brands Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.name}
                to={`/search?q=${encodeURIComponent(brand.name)}`}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    {/* Brand Monogram / Logo Box */}
                    <div className="h-12 px-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center min-w-[3rem]">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="max-h-7 max-w-[96px] object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const next = e.currentTarget.nextElementSibling as HTMLElement;
                            if (next) next.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span
                        style={{ display: brand.logo ? 'none' : 'block' }}
                        className="text-sm font-black tracking-tight text-slate-800 uppercase"
                      >
                        {brand.name.slice(0, 2)}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {brand.productCount && brand.productCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                          <Package size={11} /> {brand.productCount} {brand.productCount === 1 ? 'Product' : 'Products'}
                        </span>
                      ) : brand.featured ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 size={11} /> Authorized
                        </span>
                      ) : null}
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {brand.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-1.5">
                    {brand.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {brand.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                    Browse {brand.name} <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                  <span className="text-slate-400 inline-flex items-center gap-1 text-[11px]">
                    <ShieldCheck size={12} className="text-emerald-500" /> Official
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {filteredBrands.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">
                No brands found matching &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-3 text-sm text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Brands;
