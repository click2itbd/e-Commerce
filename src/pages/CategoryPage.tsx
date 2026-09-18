import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { Layout } from '../components/Layout';
import { ProductCard } from '../components/ProductCard';
import { Filter, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { coreCategories, peripheralCategories } from '../components/PCBuilder/constants';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const CategoryPage: React.FC = () => {
  const { categorySlug, subCategorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [sortBy, setSortBy] = useState('newest');
  const [showInStock, setShowInStock] = useState(true);
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  // Find category info for banner
  const categoryInfo = useMemo(() => {
    if (!categorySlug) return null;
    return [...coreCategories, ...peripheralCategories].find(c => c.id === categorySlug) || null;
  }, [categorySlug]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, 'products'), limit(200));
        const snap = await getDocs(q);
        let productsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        
        if (categorySlug) {
           productsData = productsData.filter(p => 
             p.category.toLowerCase().includes(categorySlug.toLowerCase().replace(/-/g, ' ')) ||
             (subCategorySlug && p.category.toLowerCase().includes(subCategorySlug.toLowerCase().replace(/-/g, ' ')))
           );
        }

        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching category products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug, subCategorySlug]);

  const filteredProducts = products
    .filter(p => p.price >= priceRange.min && p.price <= priceRange.max)
    .filter(p => {
      if (p.stock > 0) return showInStock;
      return showOutOfStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });

  const CategoryIcon = categoryInfo?.icon || LayoutGrid;

  return (
    <Layout fullWidth>
      <div className="bg-[#f8fafc] min-h-screen pt-8 pb-20 selection:bg-slate-900 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 font-medium">
            <span>Home</span>
            <ChevronRight size={14} />
            <span className="capitalize">{categorySlug?.replace(/-/g, ' ')}</span>
            {subCategorySlug && (
              <>
                <ChevronRight size={14} />
                <span className="capitalize text-slate-900">{subCategorySlug.replace(/-/g, ' ')}</span>
              </>
            )}
          </div>

          {/* Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 mb-8 border border-slate-200 flex items-center justify-between shadow-sm overflow-hidden relative"
          >
            <div className="relative z-10 flex items-center gap-6">
              <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0">
                <CategoryIcon size={40} className="text-slate-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight mb-2">
                  {subCategorySlug ? subCategorySlug.replace(/-/g, ' ') : (categoryInfo?.name || categorySlug?.replace(/-/g, ' '))}
                </h1>
                <p className="text-slate-500 font-medium text-lg">{filteredProducts.length} components available</p>
              </div>
            </div>
            
            {categoryInfo?.placeholderImage && (
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 mix-blend-multiply pointer-events-none">
                <img src={categoryInfo.placeholderImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
              </div>
            )}
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-72 shrink-0"
            >
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 sticky top-24">
                <div className="flex items-center gap-2 mb-8">
                  <Filter size={20} className="text-slate-900" />
                  <h2 className="font-bold text-lg text-slate-900">Filters</h2>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider">Price Range</h3>
                  <div className="flex items-center gap-3">
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">৳</span>
                      <input 
                        type="number" 
                        value={priceRange.min}
                        onChange={e => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border-transparent rounded-xl text-sm font-semibold focus:border-slate-900 focus:ring-0 transition-colors"
                        placeholder="Min"
                      />
                    </div>
                    <span className="text-slate-400 font-bold">-</span>
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">৳</span>
                      <input 
                        type="number" 
                        value={priceRange.max}
                        onChange={e => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border-transparent rounded-xl text-sm font-semibold focus:border-slate-900 focus:ring-0 transition-colors"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider">Stock Status</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={showInStock}
                          onChange={e => setShowInStock(e.target.checked)}
                          className="w-5 h-5 rounded-lg border-2 border-slate-300 text-slate-900 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer checked:border-slate-900 bg-slate-50" 
                        />
                      </div>
                      <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">In Stock</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={showOutOfStock}
                          onChange={e => setShowOutOfStock(e.target.checked)}
                          className="w-5 h-5 rounded-lg border-2 border-slate-300 text-slate-900 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer checked:border-slate-900 bg-slate-50" 
                        />
                      </div>
                      <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Out of Stock</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-grow min-w-0">
              <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">Sort By:</span>
                  <select 
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="text-sm font-bold text-slate-900 border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-slate-900 py-2 pl-4 pr-10 cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-slate-200"></div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {filteredProducts.map(product => (
                    <motion.div key={product.id} variants={itemVariants}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-32 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center"
                >
                  <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <LayoutGrid size={48} className="text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No components found</h3>
                  <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">Try adjusting your filters or price range to find what you're looking for.</p>
                </motion.div>
              )}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};
