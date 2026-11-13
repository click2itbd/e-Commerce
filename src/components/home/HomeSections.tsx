import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Clock, Zap, ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Award } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';
import { formatCurrency } from '../../lib/utils';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import promoLaptopsImg from '../../../public/banners/promo-laptops.jpg';
import promoAccessoriesImg from '../../../public/banners/promo-accessories.jpg';

// --- Top Brands ---
export const TopBrands = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'store_brands'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeBrands = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as { id: string; isActive?: boolean }))
        .filter(b => b.isActive !== false);
      setBrands(activeBrands);
    });
    return () => unsubscribe();
  }, []);

  const defaultBrands = [
    { name: 'Intel', logo: '/images/brands/intel.svg', category: 'Processors' },
    { name: 'AMD', logo: '/images/brands/amd.svg', category: 'Ryzen & Radeon' },
    { name: 'Asus', logo: '/images/brands/asus.svg', category: 'ROG & Boards' },
    { name: 'MSI', logo: '/images/brands/msi.svg', category: 'Gaming Hardware' },
    { name: 'Gigabyte', logo: '/images/brands/gigabyte.svg', category: 'AORUS & Boards' },
    { name: 'KingSpec', logo: '/images/brands/kingspec.svg', category: 'SSD & Memory' },
    { name: 'Value-Top', logo: '/images/brands/valuetop.svg', category: 'Casing & Power' },
    { name: 'Logitech', logo: '/images/brands/logitech.svg', category: 'Peripherals' },
    { name: 'Samsung', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/samsung.svg', category: 'Monitors & Storage' },
    { name: 'Corsair', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/corsair.svg', category: 'RAM & Cooling' },
    { name: 'Kingston', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/kingstontechnology.svg', category: 'FURY Gaming' },
    { name: 'TP-Link', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tplink.svg', category: 'Wi-Fi & Routers' },
    { name: 'HP', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hp.svg', category: 'Laptops & Gear' },
    { name: 'Dell', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dell.svg', category: 'Laptops & Displays' },
  ];

  // If brands exist in Firestore, prioritize them and supplement with defaults if small
  const displayBrands = brands.length > 0 
    ? [...brands, ...defaultBrands.filter(db => !brands.some(b => b.name?.toLowerCase() === db.name.toLowerCase()))]
    : defaultBrands;

  const fallbackSvg = (text: string) =>
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 50'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc' rx='8'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-weight='800' font-size='20' fill='%230f172a'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-14 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
      {/* Decorative subtle ambient lights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-bold text-[#F97316] mb-2 shadow-2xs">
            <Sparkles size={12} className="text-[#F97316]" />
            <span>Authorized Official Partners</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F97316] flex items-center justify-center shadow-2xs shrink-0">
              <Star className="w-4 h-4 fill-[#F97316]" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#081621] tracking-tight">
              Top Brands
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 pl-10.5">
            Explore 100% authentic tech gear with official manufacturer warranty & after-sales service
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link
            to="/brands"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#0E2A47] hover:text-[#F97316] bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
          >
            <span>View All Brands</span>
            <ArrowRight size={13} />
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-white hover:bg-[#0E2A47] hover:border-[#0E2A47] flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Previous Brands"
              aria-label="Previous Brands"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-white hover:bg-[#0E2A47] hover:border-[#0E2A47] flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Next Brands"
              aria-label="Next Brands"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Brand Cards Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory relative z-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {displayBrands.map((brand, idx) => (
          <Link
            key={brand.id || brand.name || idx}
            to={`/search?q=${encodeURIComponent(brand.name)}`}
            className="group relative flex flex-col items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-300 hover:-translate-y-1.5 transition-all duration-300 shrink-0 w-[145px] sm:w-[165px] md:w-[180px] snap-start overflow-hidden text-center cursor-pointer"
            title={`Browse ${brand.name} Products`}
          >
            {/* Top Micro Label */}
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 group-hover:text-[#F97316] transition-colors">
                Partner
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"
                title="Verified Genuine Brand"
              />
            </div>

            {/* Logo Box */}
            <div className="h-14 sm:h-16 w-full flex items-center justify-center p-2 rounded-xl bg-slate-50/70 group-hover:bg-orange-50/40 transition-colors">
              <img
                src={brand.logo}
                alt={brand.name}
                onError={(e) => {
                  e.currentTarget.src = fallbackSvg(brand.name);
                }}
                className="max-h-10 sm:max-h-11 max-w-[110px] w-auto object-contain transition-all duration-300 filter grayscale contrast-125 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110"
                title={brand.name}
                loading="lazy"
              />
            </div>

            {/* Brand Title & Category */}
            <div className="mt-3 w-full">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-[#F97316] transition-colors truncate">
                {brand.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {brand.category || 'Authorized Gear'}
              </p>
            </div>

            {/* Explore Micro Link */}
            <div className="mt-2 text-[10px] font-bold text-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 transform translate-y-1 group-hover:translate-y-0">
              <span>View Gear</span>
              <ArrowRight size={10} />
            </div>

            {/* Hover Bottom Glow Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      {/* Trust Guarantee Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-200/70 text-slate-600 text-xs relative z-10">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-slate-200/60 shadow-2xs">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-800 text-[11px] sm:text-xs">100% Genuine Tech</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-slate-200/60 shadow-2xs">
          <Award size={16} className="text-blue-600 shrink-0" />
          <span className="font-bold text-slate-800 text-[11px] sm:text-xs">Official Brand Warranty</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-slate-200/60 shadow-2xs">
          <Zap size={16} className="text-amber-500 shrink-0" />
          <span className="font-bold text-slate-800 text-[11px] sm:text-xs">Authorized Partners</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-slate-200/60 shadow-2xs">
          <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
          <span className="font-bold text-slate-800 text-[11px] sm:text-xs">Direct Support & EMI</span>
        </div>
      </div>
    </section>
  );
};

// --- Flash Sale ---
export const FlashSale = ({ products }: { products: Product[] }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [config, setConfig] = useState<any>({ enabled: false, title: 'Flash Sale', endTime: '' });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'store_banners', 'ecommerce_flash_sale'));
        if (snap.exists()) {
          setConfig(snap.data());
        }
      } catch (e) {
        console.error('Failed to fetch flash sale config', e);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!config.endTime) return;
    const endDate = new Date(config.endTime).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate - now;
      
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [config.endTime]);

  if (!config.enabled) return null;

  const flashProducts = products.filter(p => p.isFlashSale);
  
  if (flashProducts.length === 0) return null;

  return (
    <section className="mb-12 bg-gradient-to-r from-[#081621] to-[#142270] rounded-2xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden mt-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 relative z-10 gap-2 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-400 font-bold mb-2">
            <Zap size={20} className="fill-orange-400" />
            <span>LIMITED TIME OFFER</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black">{config.title || 'Flash Sale'}</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">Ends in:</span>
          <div className="flex gap-2">
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-center border border-white/10">
              <span className="block text-xl font-bold text-orange-400">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase text-gray-400">Days</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-center border border-white/10">
              <span className="block text-xl font-bold text-orange-400">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase text-gray-400">Hrs</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-center border border-white/10">
              <span className="block text-xl font-bold text-orange-400">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase text-gray-400">Min</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-center border border-white/10">
              <span className="block text-xl font-bold text-orange-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase text-gray-400">Sec</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 relative z-10">
        {flashProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl text-[#081621] p-1 transform transition-transform hover:-translate-y-1">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

// --- Product Carousel ---
export const ProductCarousel = ({ title, products }: { title: string, products: Product[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-2">
        <h2 className="text-xl md:text-2xl font-bold text-[#081621] relative after:content-[''] after:absolute after:-bottom-[11px] after:left-0 after:w-16 after:h-1 after:bg-[#F97316]">
          {title}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-full border border-gray-200 hover:bg-[#F97316] hover:text-white hover:border-[#F97316] transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-full border border-gray-200 hover:bg-[#F97316] hover:text-white hover:border-[#F97316] transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-4 snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(product => (
          <div key={product.id} className="min-w-[160px] max-w-[160px] sm:min-w-[280px] sm:max-w-[280px] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

// --- Promo Bento Grid ---
const resolvePromoBannerUrl = (url: string | undefined, fallback: string): string => {
  if (!url) return fallback;
  if (url === '/banners/promo-laptops.jpg' || url.includes('photo-1603302576837')) {
    return promoLaptopsImg;
  }
  if (
    url === '/banners/promo-accessories.jpg' ||
    url.includes('photo-1598550476439') ||
    url.includes('photo-1615663245857')
  ) {
    return promoAccessoriesImg;
  }
  return url;
};

export const PromoBentoGrid = () => {
  const [promoBanners, setPromoBanners] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'store_banners'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((b: any) => b.isActive);
        const leftPromo = activeDocs.find((b: any) => b.position === 'promo_banner_left' || (b.position === 'promo_banner' && b.order === 0));
        const rightPromo = activeDocs.find((b: any) => b.position === 'promo_banner_right' || (b.position === 'promo_banner' && b.order === 1));
        
        const combinedPromos = [];
        if (leftPromo) combinedPromos.push(leftPromo);
        if (rightPromo) combinedPromos.push(rightPromo);
        
        setPromoBanners(combinedPromos);
    });
    return () => unsubscribe();
  }, []);

  const banner1 = promoBanners[0];
  const banner2 = promoBanners[1];
  const banner1Img = resolvePromoBannerUrl(banner1?.imageUrl, promoLaptopsImg);
  const banner2Img = resolvePromoBannerUrl(banner2?.imageUrl, promoAccessoriesImg);

  return (
    <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
      <Link to={banner1?.targetUrl || "/category/laptop"} className="md:col-span-2 relative rounded-2xl overflow-hidden group h-[190px] sm:h-[230px] md:h-[250px] bg-gradient-to-r from-gray-900 to-gray-800">
        <img src={banner1Img} alt={banner1?.title || "Laptops"} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
        
      </Link>
      
      <Link to={banner2?.targetUrl || "/category/accessories"} className="md:col-span-1 relative rounded-2xl overflow-hidden group h-[190px] sm:h-[230px] md:h-[250px] bg-gradient-to-br from-blue-900 to-indigo-900">
        <img src={banner2Img} alt={banner2?.title || "Accessories"} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
        
      </Link>
    </section>
  );
};

// --- Testimonials ---
export const Testimonials = () => {
  const reviews = [
    { name: 'Rahim Uddin', role: 'Gamer', comment: 'Built my dream PC from Click2IT. The cable management was flawless and delivery was super fast!', rating: 5 },
    { name: 'Sanjida Akter', role: 'Freelancer', comment: 'Bought a Macbook Pro for my design work. Best price in the market and very professional behavior.', rating: 5 },
    { name: 'Tanvir Hasan', role: 'Software Engineer', comment: 'Their after-sales support is unmatched. Had an issue with my RAM, they replaced it within 2 days.', rating: 5 }
  ];

  return (
    <section className="mb-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-[#081621] mb-4">What Our Customers Say</h2>
        <p className="text-gray-600">Thousands of happy customers across Bangladesh</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-1 text-orange-400 mb-4">
              {[...Array(review.rating)].map((_, i) => <Star key={i} size={18} className="fill-orange-400" />)}
            </div>
            <p className="text-gray-600 mb-6 italic">"{review.comment}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[#081621]">
                {review.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-[#081621] text-sm">{review.name}</h4>
                <p className="text-xs text-gray-500">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
