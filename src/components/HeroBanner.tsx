import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: 'hero_slider' | 'deal_of_the_day' | 'sidebar_ad' | 'footer_banner';
  isActive: boolean;
  order: number;
}

// ─── Slide transition variants ────────────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

// ─── Default slides when DB is empty ──────────────────────────────
const defaultSlides = [
  { id: 'default-1', imageUrl: '/banners/hero-main.jpg', targetUrl: '/category/components', title: 'GAMING SETUPS' },
  { id: 'default-2', imageUrl: '/banners/hero-main.jpg', targetUrl: '/category/components/monitor', title: 'MONITORS & DISPLAYS' },
];

const defaultSidebanners = [
  { id: 'side-1', imageUrl: '/banners/side-acc.jpg', targetUrl: '/category/components', title: 'ACCESSORIES' },
  { id: 'side-2', imageUrl: '/banners/side-gadget.jpg', targetUrl: '/category/components', title: 'GADGETS' },
];

export const HeroBanner: React.FC = () => {
  const [heroSlides, setHeroSlides] = useState<Banner[]>([]);
  const [sidebarAds, setSidebarAds] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch banners from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'store_banners'),
      orderBy('order', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allBanners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Banner[];

      const activeBanners = allBanners.filter(b => b.isActive);
      setHeroSlides(activeBanners.filter(b => b.position === 'hero_slider'));
      setSidebarAds(activeBanners.filter(b => b.position === 'sidebar_ad'));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching banners:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasDBBanners = heroSlides.length > 0;
  const slides = hasDBBanners ? heroSlides : defaultSlides;
  const sideBanners = (heroSlides.length > 0 && sidebarAds.length > 0) ? sidebarAds.slice(0, 2) : defaultSidebanners;
  const totalSlides = slides.length;

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides, isPaused]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // ─── Banner link helper ──────────────────────────────────────
  const BannerLink: React.FC<{ url?: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ url, children, className, style }) => {
    if (!url) return <div className={className} style={style}>{children}</div>;
    if (url.startsWith('http')) {
      return <a href={url} target="_blank" rel="noreferrer" className={className} style={style}>{children}</a>;
    }
    return <Link to={url} className={className} style={style}>{children}</Link>;
  };

  // ─── Loading skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <section className="mb-8">
        <div style={{ display: 'flex', gap: '12px' }}>
          <div  className="w-full lg:flex-1 h-[250px] md:h-[350px] lg:h-[475px] bg-gray-200 rounded-xl animate-pulse" />
          <div style={{ width: '350px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }} className="hidden lg:flex">
            <div  style={{ flex: 1 }} />
            <div  style={{ flex: 1 }} />
          </div>
        </div>
      </section>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section className="mb-8">
      {/* Desktop: side-by-side row with fixed height, Mobile: column stacked */}
      <div className="flex flex-col lg:flex-row" style={{ gap: '12px' }}>
        {/* ─── Main Hero Slider ─────────────────────────────── */}
        <div
          
          className="relative w-full lg:flex-1 h-[250px] md:h-[350px] lg:h-[475px] rounded-xl overflow-hidden bg-gray-100 group cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentSlideData?.id || currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'tween', duration: 0.45, ease: 'easeInOut' },
                opacity: { duration: 0.3 },
              }}
              className="absolute inset-0"
            >
              <BannerLink url={currentSlideData?.targetUrl} className="block w-full h-full relative">
                <img
                  src={currentSlideData?.imageUrl}
                  alt={currentSlideData?.title || 'Banner'}
                  className="w-full h-full object-cover"
                  loading="eager"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#081621]/90 via-[#081621]/50 to-transparent flex flex-col justify-center px-12 md:px-16 lg:px-24">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight uppercase"
                  >
                    {currentSlideData?.title}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl md:text-3xl text-gray-200 font-bold mb-8"
                  >
                    {currentSlideData?.id === 'default-1' ? 'Up to 25% Off' : 'Limited Time Offer'}
                  </motion.p>
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#F97316] hover:bg-[#e06612] text-white font-bold py-3 md:py-4 px-8 md:px-10 rounded-full w-fit shadow-[0_4px_14px_0_rgba(249,115,22,0.4)] transition-all active:scale-95 text-lg"
                  >
                    Shop Collection
                  </motion.button>
                </div>
              </BannerLink>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next slide"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {totalSlides > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                  style={idx === currentSlide ? { width: '28px', height: '10px' } : { width: '10px', height: '10px' }}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentSlide
                      ? 'bg-[#F97316]'
                      : 'bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── Sidebar Banners (Right Side) ──────────────────── */}
        <div
          className="hidden lg:flex flex-col"
          style={{ width: '350px', flexShrink: 0, gap: '12px' }}
        >
          {sideBanners.map((banner) => (
            <BannerLink
              key={banner.id}
              url={banner.targetUrl}
              className="block rounded-xl overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow group/side relative"
              style={{ height: '231.5px' }}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover group-hover/side:scale-[1.05] transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-1 drop-shadow-md">{banner.title}</h3>
                <p className="text-base font-semibold text-white/90 italic drop-shadow-md">
                  {banner.id === 'side-1' ? 'Top Picks' : 'Trending Now'}
                </p>
              </div>
            </BannerLink>
          ))}
        </div>
      </div>
    </section>
  );
};
