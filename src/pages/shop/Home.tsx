import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { Product } from "../../types";
import { ProductCard } from "../../components/ProductCard";
import { Layout } from "../../components/Layout";
import { HeroBanner } from "../../components/HeroBanner";
import {
  ChevronRight,
  Laptop,
  Cpu,
  Monitor,
  MousePointer2,
  Fan,
  Server,
  Database,
  HardDrive,
  Plug,
  Keyboard,
  Mouse,
  BatteryCharging,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { SEO } from "../../components/SEO";
import { formatCurrency } from "../../lib/utils";
import { ChevronLeft } from "lucide-react";
import {
  FlashSale,
  ProductCarousel,
  PromoBentoGrid,
  TopBrands,
  Testimonials,
} from "../../components/home/HomeSections";

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          limit(12),
        );
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    {
      name: "CPU",
      imageUrl: "/images/placeholders/cpu_placeholder.jpg",
      slug: "cpu",
    },
    {
      name: "CPU Cooler",
      imageUrl: "/images/placeholders/cooler_placeholder.jpg",
      slug: "cpu-cooler",
    },
    {
      name: "Motherboard",
      imageUrl: "/images/placeholders/motherboard_placeholder.jpg",
      slug: "motherboard",
    },
    {
      name: "RAM",
      imageUrl: "/images/placeholders/ram_placeholder.jpg",
      slug: "ram",
    },
    {
      name: "Storage",
      imageUrl: "/images/placeholders/storage_placeholder.jpg",
      slug: "storage",
    },
    {
      name: "Graphics Card",
      imageUrl: "/images/placeholders/gpu_placeholder.jpg",
      slug: "graphics-card",
    },
    {
      name: "Power Supply",
      imageUrl: "/images/placeholders/psu_placeholder.jpg",
      slug: "power-supply",
    },
    {
      name: "Casing",
      imageUrl: "/images/placeholders/casing_placeholder.jpg",
      slug: "casing",
    },
    {
      name: "Monitor",
      imageUrl: "/images/placeholders/monitor_placeholder.jpg",
      slug: "monitor",
    },
    {
      name: "Casing Cooler",
      imageUrl: "/images/placeholders/cooler_placeholder.jpg",
      slug: "casing-cooler",
    },
    {
      name: "Keyboard",
      imageUrl: "/images/placeholders/keyboard_placeholder.jpg",
      slug: "keyboard",
    },
    {
      name: "Mouse",
      imageUrl: "/images/placeholders/mouse_placeholder.jpg",
      slug: "mouse",
    },
    {
      name: "Speaker & Home Theater",
      imageUrl: "/images/placeholders/speaker_placeholder.jpg",
      slug: "speaker",
    },
    {
      name: "Headphone",
      imageUrl: "/images/placeholders/headphone_placeholder.jpg",
      slug: "headphone",
    },
    {
      name: "UPS",
      imageUrl: "/images/placeholders/ups_placeholder.jpg",
      slug: "ups",
    },
    {
      name: "CCTV CAMERA",
      imageUrl: "/images/placeholders/cctv_placeholder.jpg",
      slug: "cctv-camera",
    },
  ];

  return (
    <Layout>
      <SEO
        title="Shop Electronics & PC Components"
        description="Buy the best electronics, PC components, laptops, and accessories online at unbeatable prices."
        keywords="pc components, electronics, laptops, buy online, click2it shop"
      />
      {/* Hero Section */}
      <HeroBanner />

      {/* Categories */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-[#081621] relative after:content-[''] after:absolute after:-bottom-[11px] after:left-0 after:w-16 after:h-1 after:bg-[#F97316]">
            Featured Categories
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-8">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/category/components/${cat.slug}`}
              className="flex flex-col items-center justify-start gap-3 group cursor-pointer"
            >
              <div className="h-14 w-14 md:h-16 md:w-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply contrast-125 brightness-110"
                />
              </div>
              <span className="font-medium text-gray-700 text-[11px] md:text-xs text-center leading-tight group-hover:text-orange-500 transition-colors px-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Sale */}
      {products.length > 0 && <FlashSale products={products} />}

      {/* New Arrivals */}
      <ProductCarousel title="New Arrivals" products={products.filter(p => p.isNewArrival).slice(0, 8).length > 0 ? products.filter(p => p.isNewArrival).slice(0, 8) : products.slice(0, 8)} />

      {/* Promo Bento Grid */}
      <PromoBentoGrid />

      {/* Best Sellers */}
      <ProductCarousel
        title="Best Sellers"
        products={products.filter(p => p.isBestSeller).slice(0, 8).length > 0 ? products.filter(p => p.isBestSeller).slice(0, 8) : products.slice().reverse().slice(0, 8)}
      />

      {/* Promotional Banner */}
      {/* Top Brands */}
      <TopBrands />

      {/* Featured Products */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-[#081621] relative after:content-[''] after:absolute after:-bottom-[11px] after:left-0 after:w-16 after:h-1 after:bg-[#F97316]">
            Featured Products
          </h2>
          <Link
            to="/shop"
            className="text-[#F97316] font-bold text-sm hover:underline flex items-center"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80"
              ></div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {products.slice(0, 12).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">
              No products found. Add some in the admin panel!
            </p>
          </div>
        )}
      </section>

      {/* About & SEO Description */}

      {/* New Beautiful PC Builder Banner */}
      <section className="mt-16 mb-8 relative overflow-hidden rounded-3xl shadow-2xl group">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=2000&auto=format&fit=crop"
            alt="PC Builder"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081621] via-[#081621]/90 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#081621]/80 md:hidden"></div>
        </div>

        <div className="relative p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 z-10">
          <div className="flex-1 max-w-2xl text-center md:text-left">
            <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-sm mb-6 uppercase tracking-wider backdrop-blur-sm">
              Intelligent PC Builder
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                আপনার স্বপ্নের পিসি বিল্ড করুন <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                  খুব সহজেই
                </span>{" "}
                আমাদের সাথে!
              </h2>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 opacity-90 drop-shadow-md">
                স্মার্ট পিসি বিল্ডার দিয়ে মাত্র কয়েক মিনিটেই চেক করে নিন আপনার পছন্দের পিসির বাজেট এবং পার্টসগুলোর সামঞ্জস্যতা!
              </p>

            <Link
              to="/pc-builder"
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all transform hover:-translate-y-1 w-full md:w-auto"
            >
              Start PC Build <ChevronRight size={24} />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};
