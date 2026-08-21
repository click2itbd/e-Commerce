import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Layout } from '../components/Layout';
import { ChevronRight, Laptop, Cpu, Monitor, MousePointer2, Fan, Server, Database, HardDrive, Plug, Keyboard, Mouse, BatteryCharging } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { SEO } from '../components/SEO';
import DomainPricingSection from '../pages/hosting-sections/DomainPricingSection';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(12));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    { name: 'CPU', icon: <Cpu size={24} />, slug: 'cpu' },
    { name: 'CPU Cooler', icon: <Fan size={24} />, slug: 'cpu-cooler' },
    { name: 'Motherboard', icon: <Server size={24} />, slug: 'motherboard' },
    { name: 'RAM', icon: <Database size={24} />, slug: 'ram' },
    { name: 'Storage', icon: <HardDrive size={24} />, slug: 'storage' },
    { name: 'Graphics Card', icon: <Monitor size={24} />, slug: 'graphics-card' },
    { name: 'Power Supply', icon: <Plug size={24} />, slug: 'power-supply' },
    { name: 'Casing', icon: <Server size={24} />, slug: 'casing' },
    { name: 'Monitor', icon: <Monitor size={24} />, slug: 'monitor' },
    { name: 'Casing Cooler', icon: <Fan size={24} />, slug: 'casing-cooler' },
    { name: 'Keyboard', icon: <Keyboard size={24} />, slug: 'keyboard' },
    { name: 'Mouse', icon: <Mouse size={24} />, slug: 'mouse' },
    { name: 'UPS', icon: <BatteryCharging size={24} />, slug: 'ups' },
  ];

  return (
    <Layout>
      <SEO 
        title="Shop Electronics & PC Components"
        description="Buy the best electronics, PC components, laptops, and accessories online at unbeatable prices."
        keywords="pc components, electronics, laptops, buy online, click2it shop"
      />
      {/* Hero Section */}
      <section className="mb-12">
        <div className="bg-[#222222] text-white rounded-lg flex flex-col md:flex-row items-center justify-between p-6 md:p-12 lg:h-[450px] overflow-hidden">
          <div className="max-w-xl mb-6 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">MAC</h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">Retina. Now in colossal and ginormous.</p>
            <button className="bg-blue-600 text-white px-6 py-3 md:px-8 md:py-3 rounded font-bold hover:bg-blue-700 w-full md:w-auto">
              SHOP NOW!
            </button>
          </div>
          <img
            src="https://picsum.photos/seed/imac/600/400"
            alt="Mac"
            className="w-full md:w-1/2 object-contain max-h-64 md:max-h-none"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#081621]">Featured Categories</h2>
          <div className="h-1 flex-grow mx-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              to={`/category/components/${cat.slug}`}
              className="bg-white p-3 md:p-4 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 md:gap-3 group cursor-pointer border border-gray-100"
            >
              <div 
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 transition-all group-hover:bg-[#EF4444] group-hover:text-white"
              >
                {cat.icon}
              </div>
              <span className="font-bold text-gray-800 text-[10px] md:text-xs text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#081621]">Featured Products</h2>
          <div className="h-1 flex-grow mx-6 bg-gray-200 rounded-full"></div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-64 md:h-80 animate-pulse"></div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No products found. Add some in the admin panel!</p>
          </div>
        )}
      </section>

      {/* Domain Pricing Section */}
      <DomainPricingSection />
    </Layout>
  );
};
