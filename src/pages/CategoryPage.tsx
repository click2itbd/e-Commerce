import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { Layout } from '../components/Layout';
import { ProductCard } from '../components/ProductCard';
import { Filter, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export const CategoryPage: React.FC = () => {
  const { categorySlug, subCategorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [sortBy, setSortBy] = useState('newest');
  const [showInStock, setShowInStock] = useState(true);
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, 'products'));
        
        // Note: Firestore queries for categories might be complex if we use slugs.
        // Usually, we store category names or IDs.
        // For simplicity, we'll fetch all and filter client-side if slugs are used,
        // unless we know the exact field name.
        const snap = await getDocs(q);
        let productsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        
        // Filter by category slug (case-insensitive fuzzy match)
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
      return 0; // newest etc
    });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <span>Home</span>
          <ChevronRight size={14} />
          <span className="capitalize">{categorySlug?.replace(/-/g, ' ')}</span>
          {subCategorySlug && (
            <>
              <ChevronRight size={14} />
              <span className="capitalize font-bold text-gray-900">{subCategorySlug.replace(/-/g, ' ')}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter size={18} className="text-[#EF4444]" />
                <h2 className="font-bold">Filters</h2>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Price Range</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={priceRange.min}
                      onChange={e => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                      className="w-full text-sm border-gray-200 rounded-md p-2"
                      placeholder="Min"
                    />
                    <span>-</span>
                    <input 
                      type="number" 
                      value={priceRange.max}
                      onChange={e => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 0 })}
                      className="w-full text-sm border-gray-200 rounded-md p-2"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Stock Status</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#EF4444] transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showInStock}
                      onChange={e => setShowInStock(e.target.checked)}
                      className="rounded text-[#EF4444] focus:ring-[#EF4444]" 
                    />
                    <span className="font-medium">In Stock</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#EF4444] transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showOutOfStock}
                      onChange={e => setShowOutOfStock(e.target.checked)}
                      className="rounded text-[#EF4444] focus:ring-[#EF4444]" 
                    />
                    <span className="font-medium">Stock Out</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-grow">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h1 className="text-xl font-bold capitalize">
                {subCategorySlug ? subCategorySlug.replace(/-/g, ' ') : categorySlug?.replace(/-/g, ' ')}
                <span className="text-sm font-normal text-gray-400 ml-2">({filteredProducts.length} items)</span>
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">Sort By:</span>
                  <select 
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] py-1 pl-2 pr-8"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg h-80 animate-pulse border border-gray-100"></div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-400 text-lg">No products found in this category.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};
