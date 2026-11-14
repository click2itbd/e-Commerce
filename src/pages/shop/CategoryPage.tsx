import { Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { Layout } from '../../components/Layout';
import { ProductCard } from '../../components/ProductCard';
import { Filter, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';

import { coreCategories, peripheralCategories } from '../../components/PCBuilder/constants';
import { SEO } from '../../components/SEO';


// Curated list of high-value filter attributes (case-insensitive)
const CURATED_FILTERABLE_SPECS = new Set([
  'processor', 'cpu', 'cores', 'threads', 'socket',
  'ram', 'memory', 'capacity', 'ram type', 'type (ddr4/ddr5)',
  'storage', 'storage type', 'interface',
  'graphics', 'gpu', 'graphics card', 'memory size',
  'display', 'screen size', 'resolution', 'refresh rate', 'panel type', 'aspect ratio',
  'connectivity', 'ports', 'wireless', 'bluetooth',
  'lens', 'night vision distance', 'night vision', 'sensor', 'channels',
  'wattage', 'power supply', 'modular', 'efficiency rating',
  'form factor', 'chipset', 'motherboard support',
  'switch type', 'dpi', 'color', 'polar pattern',
  'speed', 'wi-fi speed', 'bands', 'antenna', 'coverage',
  'voltage', 'backup time', 'battery', 'battery life',
  'print speed', 'functions', 'weatherproof rating'
]);

// Ignored low-value / noisy descriptive spec keys
const IGNORED_SPEC_KEYS = new Set([
  'warranty', 'description', 'model', 'brand', 'weight', 'dimensions',
  'package contents', 'package content', 'in the box', 'accessories',
  'features', 'special features', 'overview', 'origin', 'made in',
  'operating temperature', 'storage temperature', 'humidity', 'power consumption',
  'notes', 'note', 'certification', 'certifications', 'safety', 'body material'
]);

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const CategoryPage: React.FC = () => {
  const { categorySlug, subCategorySlug, subSubCategorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [sortBy, setSortBy] = useState('newest');
  const [showInStock, setShowInStock] = useState(true);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: 200000 });
    setShowInStock(true);
    setShowOutOfStock(true);
    setShowDiscountedOnly(false);
    setMinRating(0);
    setSelectedSpecs({});
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (priceRange.min > 0 || priceRange.max < 200000) count += 1;
    if (!showInStock || !showOutOfStock) count += 1;
    if (Object.keys(selectedSpecs).length > 0) count += Object.keys(selectedSpecs).length;
    return count;
  }, [selectedCategories, selectedBrands, priceRange, showInStock, showOutOfStock, selectedSpecs]);
  const itemsPerPage = 12;

  const [categorySearch, setCategorySearch] = useState('');

  // Find category info for banner
  const categoryInfo = useMemo(() => {
    if (!categorySlug) return null;
    return [...coreCategories, ...peripheralCategories].find(c => c.id === categorySlug) || null;
  }, [categorySlug]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, 'products'));
        const snap = await getDocs(q);
        let productsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        
        if (categorySlug || subCategorySlug) {
          productsData = productsData.filter(p => {
            const prodCat = (p.category || '').toLowerCase();
            const prodSubCat = (p.subCategory || '').toLowerCase();
            
            const catSlug = (categorySlug || '').toLowerCase().replace(/-/g, ' ');
            const subCatSlug = (subCategorySlug || '').toLowerCase().replace(/-/g, ' ');
            const subSubCatSlug = (subSubCategorySlug || '').toLowerCase().replace(/-/g, ' ');
            const prodSubSubCat = (p.subSubCategory || '').toLowerCase();

            const synonyms: Record<string, string[]> = {
              'cpu': ['processor', 'cpu'],
              'ram': ['memory', 'ram'],
              'motherboard': ['mainboard', 'motherboard'],
              'graphics-card': ['gpu', 'vga', 'graphics', 'graphics card'],
              'power-supply': ['psu', 'power supply', 'power'],
              'casing': ['case', 'casing', 'chassis', 'cabinet'],
              'storage': ['ssd', 'hdd', 'nvme', 'hard drive', 'storage', 'pendrive'],
              'cpu-cooler': ['cooler', 'liquid cooling', 'air cooler', 'cpu cooler'],
              'monitor': ['monitor', 'display', 'screen'],
              'ups': ['ups', 'offline', 'online', 'power'],
              'mouse': ['mouse', 'mice'],
              'keyboard': ['keyboard', 'keypad']
            };

            
              if (subSubCatSlug) {
                if (prodSubSubCat.includes(subSubCatSlug)) return true;
                const targetText = prodSubCat || prodCat;
                if (targetText.includes(subSubCatSlug)) return true;
                return false;
              }

              // If a specific subCategory is requested (e.g., /category/components/cpu)
            if (subCatSlug) {
              const targetText = prodSubCat || prodCat; // If product doesn't have subCategory, check its main category just in case
              
              if (targetText.includes(subCatSlug)) return true;
              if (categoryInfo?.name && targetText.includes(categoryInfo.name.toLowerCase().split(' ')[0])) return true;
              
              const checks = synonyms[(subCategorySlug || '').toLowerCase()] || [];
              if (checks.some(word => targetText.includes(word))) return true;
              
              // Also check if the literal prodCat matches subCatSlug (some users might add CPU as a main category)
              if (prodCat.includes(subCatSlug)) return true;
              
              return false; // Did not match the subcategory requested
            }
            
            // If only the main category is requested (e.g., /category/components)
            if (catSlug) {
              if (prodCat.includes(catSlug)) return true;
              
              const checks = synonyms[(categorySlug || '').toLowerCase()] || [];
              if (checks.some(word => prodCat.includes(word))) return true;
            }
            
            return false;
          });
        }

        setProducts(productsData.filter(p => p.showInStore !== false));
      } catch (error) {
        console.error('Error fetching category products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug, subCategorySlug, subSubCategorySlug]);

  
  const availableSubCategories = useMemo(() => {
    if (subSubCategorySlug) return [];
    
    const items = new Set<string>();
    products.forEach(p => {
      if (subCategorySlug) {
        if (p.subSubCategory) items.add(p.subSubCategory);
      } else if (categorySlug) {
        if (p.subCategory) items.add(p.subCategory);
      } else {
        if (p.category) items.add(p.category);
      }
    });
    return Array.from(items).sort();
  }, [products, categorySlug, subCategorySlug, subSubCategorySlug]);

  const availableCategoriesWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const availableBrandsWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.brand) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const availableBrands = useMemo(() => {
    const brands = products.map(p => p.brand).filter(Boolean);
    return Array.from(new Set(brands)).sort();
  }, [products]);

  const availableSpecs = useMemo<Record<string, string[]>>(() => {
    // Only extract and display specifications when on a specific category or subcategory page!
    // In All Products (/shop), specs from different categories create a cluttered, chaotic list.
    if (!categorySlug) return {};

    const specs: Record<string, Set<string>> = {};
    products.forEach(p => {
      if (p.specs) {
        Object.entries(p.specs).forEach(([key, val]) => {
          if (!val) return;
          const cleanKey = key.trim();
          const lowerKey = cleanKey.toLowerCase();
          
          // Exclude noisy/blacklisted keys
          if (IGNORED_SPEC_KEYS.has(lowerKey)) return;

          // Only keep curated high-value filter attributes
          const isAllowed = CURATED_FILTERABLE_SPECS.has(lowerKey) || 
            Array.from(CURATED_FILTERABLE_SPECS).some(allowed => lowerKey.includes(allowed));
          
          if (!isAllowed) return;

          const strVal = val.toString().trim();
          // Skip extremely long text descriptions that shouldn't be checkbox values
          if (!strVal || strVal.length > 50) return;

          if (!specs[cleanKey]) specs[cleanKey] = new Set();
          specs[cleanKey].add(strVal);
        });
      }
    });
    const formatted: Record<string, string[]> = {};
    Object.keys(specs).forEach(k => {
      // Only include filters that have at least 1 selectable value
      if (specs[k].size > 0) {
        formatted[k] = Array.from(specs[k]).sort();
      }
    });
    return formatted;
  }, [products, categorySlug]);


  const filteredProducts = products
    .filter(p => p.price >= priceRange.min && p.price <= priceRange.max)
    .filter(p => {
      const isOut = Boolean(p.isOutOfStock);
      const isIn = !p.isOutOfStock;
      if (showInStock && showOutOfStock) return true;
      if (!showInStock && !showOutOfStock) return true;
      if (showInStock) return isIn;
      if (showOutOfStock) return isOut;
      return true;
    })
    .filter(p => {
      if (!categorySlug && selectedCategories.length > 0) {
        return p.category && selectedCategories.includes(p.category);
      }
      return true;
    })
    .filter(p => {
      if (selectedBrands.length === 0) return true;
      return p.brand && selectedBrands.includes(p.brand);
    })
    .filter(p => {
      if (!categorySlug) return true;
      if (Object.keys(selectedSpecs).length === 0) return true;
      return Object.entries(selectedSpecs).every(([key, allowedVals]) => {
        if (allowedVals.length === 0) return true;
        if (!p.specs || !p.specs[key]) return false;
        return allowedVals.includes(p.specs[key].toString());
      });
    })
    .filter(p => {
      if (!categorySearch.trim()) return true;
      const term = categorySearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term) ||
        (p.model || '').toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [priceRange, showInStock, showOutOfStock, selectedBrands, sortBy, categorySlug, subCategorySlug]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const CategoryIcon = categoryInfo?.icon || LayoutGrid;

  const activeName = (subSubCategorySlug || subCategorySlug || categorySlug || 'All Products').replace(/-/g, ' ');
  const formattedCategoryName = activeName === 'All Products' ? 'All Products' : activeName.charAt(0).toUpperCase() + activeName.slice(1);
  const canonicalCategoryUrl = categorySlug 
    ? `https://click2itbd.com/category/${categorySlug}${subCategorySlug ? `/${subCategorySlug}` : ''}${subSubCategorySlug ? `/${subSubCategorySlug}` : ''}`
    : 'https://click2itbd.com/shop';

  const categoryBreadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://click2itbd.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categorySlug ? categorySlug.replace(/-/g, ' ') : 'All Products',
        item: categorySlug ? `https://click2itbd.com/category/${categorySlug}` : 'https://click2itbd.com/shop'
      },
      ...(subCategorySlug ? [{
        '@type': 'ListItem',
        position: 3,
        name: subCategorySlug.replace(/-/g, ' '),
        item: `https://click2itbd.com/category/${categorySlug}/${subCategorySlug}`
      }] : []),
      ...(subSubCategorySlug ? [{
        '@type': 'ListItem',
        position: 4,
        name: subSubCategorySlug.replace(/-/g, ' '),
        item: canonicalCategoryUrl
      }] : [])
    ]
  };

  const activePrices = filteredProducts
    .map(p => Number(p.discountPrice || p.price || 0))
    .filter(v => v > 0);
  const minCategoryPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;
  const maxCategoryPrice = activePrices.length > 0 ? Math.max(...activePrices) : 0;
  const currentYear = new Date().getFullYear();

  const categoryItemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${formattedCategoryName} Products in Bangladesh`,
    'numberOfItems': filteredProducts.length,
    'itemListElement': filteredProducts.slice(0, 12).map((p, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': p.name,
      'url': `https://click2itbd.com/product/${p.id}`,
      'image': p.imageUrl || (Array.isArray(p.images) && p.images[0]) || ''
    }))
  };

  const categoryFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': `What is the ${formattedCategoryName} price range in Bangladesh (${currentYear})?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': minCategoryPrice > 0
            ? `${formattedCategoryName} price in Bangladesh starts from ৳${minCategoryPrice.toLocaleString()} up to ৳${maxCategoryPrice.toLocaleString()} at CLICK2IT with official brand warranty.`
            : `Browse genuine ${formattedCategoryName} at competitive prices in Bangladesh at CLICK2IT.`
        }
      },
      {
        '@type': 'Question',
        'name': `Where to buy original ${formattedCategoryName} in Dhaka, Bangladesh?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `You can buy 100% authentic ${formattedCategoryName} online at click2itbd.com or visit CLICK2IT at Multiplan Center, New Elephant Road, Dhaka with nationwide home delivery.`
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title={categorySlug ? `${formattedCategoryName} Price in Bangladesh ${currentYear} | CLICK2IT` : `All Products - Shop Online in Bangladesh ${currentYear} | CLICK2IT`}
        description={categorySlug
          ? `Explore ${filteredProducts.length} genuine ${formattedCategoryName} at best price in Bangladesh${minCategoryPrice > 0 ? ` starting from ৳${minCategoryPrice.toLocaleString()}` : ''} at CLICK2IT. Official warranty & fast delivery.`
          : `Browse ${filteredProducts.length} genuine computers, laptops, PC components & accessories at best price in Bangladesh${minCategoryPrice > 0 ? ` starting from ৳${minCategoryPrice.toLocaleString()}` : ''} at CLICK2IT.`}
        keywords={categorySlug
          ? `${activeName}, ${activeName} price in bd, ${activeName} price in bangladesh ${currentYear}, buy ${activeName} dhaka, click2it shop`
          : `all products, computers, laptops, pc components price in bd, buy online bangladesh ${currentYear}, click2it shop`}
        canonical={canonicalCategoryUrl}
        schema={[categoryBreadcrumbsSchema, categoryItemListSchema, categoryFaqSchema]}
      />
      <div className="bg-[#f8f9fa] min-h-screen pt-4 sm:pt-6 pb-20">
        <div className="w-full mx-auto">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] text-gray-500 mb-4 sm:mb-6 font-medium min-w-0 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-[#F97316] transition-colors">
              Home
            </Link>
            {!categorySlug && (
              <>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
                <span className="text-[#081621] font-bold">All Products</span>
              </>
            )}
            {categorySlug && (
              <>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
                {subCategorySlug ? (
                  <Link
                    to={`/category/${categorySlug}`}
                    className="capitalize hover:text-[#F97316] transition-colors"
                  >
                    {categorySlug.replace(/-/g, ' ')}
                  </Link>
                ) : (
                  <span className="capitalize text-[#081621] font-bold">
                    {categorySlug.replace(/-/g, ' ')}
                  </span>
                )}
              </>
            )}
            {subCategorySlug && (
              <>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
                {subSubCategorySlug ? (
                  <Link
                    to={`/category/${categorySlug}/${subCategorySlug}`}
                    className="capitalize hover:text-[#F97316] transition-colors"
                  >
                    {subCategorySlug.replace(/-/g, ' ')}
                  </Link>
                ) : (
                  <span className="capitalize text-[#081621] font-bold">
                    {subCategorySlug.replace(/-/g, ' ')}
                  </span>
                )}
              </>
            )}
            {subSubCategorySlug && (
              <>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
                <span className="capitalize text-[#081621] font-bold">
                  {subSubCategorySlug.replace(/-/g, ' ')}
                </span>
              </>
            )}
          </div>

          

          <button
            type="button"
            aria-expanded={mobileFiltersOpen}
            onClick={() => setMobileFiltersOpen(open => !open)}
            className="lg:hidden w-full mb-3 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#081621] shadow-xs active:scale-[0.99] transition-all hover:bg-gray-50"
          >
            <Filter size={16} className="text-[#F97316]" />
            <span>{mobileFiltersOpen ? 'Hide Filters' : 'Filter Products'}</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-[#F97316] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Filters Sidebar */}
            <motion.aside 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`w-full lg:w-64 shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}
            >
              <div className="max-h-[65vh] overflow-y-auto bg-white p-4 sm:p-5 rounded-md shadow-sm border border-gray-200 lg:max-h-none lg:overflow-visible lg:sticky lg:top-24">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                  <Filter size={18} className="text-[#081621]" />
                  <h2 className="font-bold text-[15px] text-[#081621] flex-1">Filter Options</h2>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-xs bg-orange-50 text-[#F97316] px-3 py-1 rounded-full font-bold hover:bg-orange-100 transition-colors">
                      Clear All ({activeFiltersCount})
                    </button>
                  )}
                </div>

                {/* All Products: Categories Checkboxes Filter */}
                {!categorySlug && availableCategoriesWithCount.length > 0 && (
                  <div className="mb-6 border-b border-gray-100 pb-6">
                    <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide flex items-center justify-between">
                      <span>CATEGORIES</span>
                      {selectedCategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategories([])}
                          className="text-[11px] text-[#F97316] hover:underline font-semibold"
                        >
                          Reset
                        </button>
                      )}
                    </h3>
                    <div className="space-y-2.5 max-h-52 overflow-y-auto custom-scrollbar pr-2">
                      {availableCategoriesWithCount.map(({ name, count }) => (
                        <label key={name} className="flex items-center justify-between gap-2 cursor-pointer group">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input 
                              type="checkbox" 
                              checked={selectedCategories.includes(name)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCategories([...selectedCategories, name]);
                                else setSelectedCategories(selectedCategories.filter(c => c !== name));
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white accent-[#F97316]" 
                            />
                            <span className="text-[13px] text-gray-600 group-hover:text-[#F97316] transition-colors truncate">{name}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">{count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Page: Subcategories Navigation */}
                {categorySlug && availableSubCategories.length > 0 && (
                  <div className="mb-6 border-b border-gray-100 pb-6">
                    <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide">SUBCATEGORIES</h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {availableSubCategories.map(sub => (
                        <Link 
                          key={sub} 
                          to={`/category/${categorySlug}${subCategorySlug ? `/${subCategorySlug}/${sub}` : `/${sub}`}`}
                          className="block text-[13px] text-gray-600 hover:text-[#F97316] hover:bg-orange-50 px-2 py-1.5 rounded transition-colors truncate"
                        >
                          {sub.replace(/-/g, ' ')}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="mb-6 border-b border-gray-100 pb-6">
                  <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide flex justify-between items-center">
                    <span>PRICE RANGE</span>
                    {(priceRange.min > 0 || priceRange.max < 200000) && (
                      <button
                        type="button"
                        onClick={() => setPriceRange({ min: 0, max: 200000 })}
                        className="text-[11px] text-[#F97316] hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                      <input 
                        type="number" 
                        value={priceRange.min}
                        onChange={e => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                        className="w-full pl-7 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] outline-none transition-all shadow-inner"
                        placeholder="Min"
                      />
                    </div>
                    <span className="text-gray-300 font-black">-</span>
                    <div className="relative w-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
                      <input 
                        type="number" 
                        value={priceRange.max}
                        onChange={e => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 0 })}
                        className="w-full pl-7 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] outline-none transition-all shadow-inner"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                {/* Brands */}
                <div className="mb-6 border-b border-gray-100 pb-6">
                  <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide flex items-center justify-between">
                    <span>BRANDS</span>
                    {selectedBrands.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedBrands([])}
                        className="text-[11px] text-[#F97316] hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                  </h3>
                  {availableBrandsWithCount.length > 0 ? (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {availableBrandsWithCount.map(({ name: brand, count }) => (
                        <label key={brand} className="flex items-center justify-between gap-2 cursor-pointer group">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input 
                              type="checkbox" 
                              checked={selectedBrands.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedBrands([...selectedBrands, brand]);
                                else setSelectedBrands(selectedBrands.filter(b => b !== brand));
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white accent-[#F97316]" 
                            />
                            <span className="text-[13px] text-gray-600 group-hover:text-[#F97316] transition-colors capitalize truncate">{brand}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">{count}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No brands available</p>
                  )}
                </div>

                {/* Stock Status */}
                <div className={categorySlug && Object.entries(availableSpecs).length > 0 ? 'mb-6 border-b border-gray-100 pb-6' : ''}>
                  <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide">AVAILABILITY</h3>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={showInStock}
                        onChange={e => setShowInStock(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white accent-[#F97316]" 
                      />
                      <span className="text-[13px] text-gray-600 group-hover:text-[#F97316] transition-colors">In Stock</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={showOutOfStock}
                        onChange={e => setShowOutOfStock(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white accent-[#F97316]" 
                      />
                      <span className="text-[13px] text-gray-600 group-hover:text-[#F97316] transition-colors">Out of Stock</span>
                    </label>
                  </div>
                </div>

                {/* Category-Specific Specifications: ONLY rendered when in a specific category */}
                {categorySlug && Object.entries(availableSpecs).map(([specName, specValues]) => (
                  <div key={specName} className="pt-6 mt-6 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide flex items-center justify-between">
                      <span>{specName}</span>
                      {selectedSpecs[specName]?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSpecs(prev => {
                              const next = { ...prev };
                              delete next[specName];
                              return next;
                            });
                          }}
                          className="text-[11px] text-[#F97316] hover:underline font-semibold"
                        >
                          Reset
                        </button>
                      )}
                    </h3>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {specValues.map(val => (
                        <label key={val} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white accent-[#F97316]"
                            checked={selectedSpecs[specName]?.includes(val) || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedSpecs(prev => {
                                const current = prev[specName] || [];
                                if (checked) {
                                  return { ...prev, [specName]: [...current, val] };
                                } else {
                                  const updated = current.filter(v => v !== val);
                                  if (updated.length === 0) {
                                    const next = { ...prev };
                                    delete next[specName];
                                    return next;
                                  }
                                  return { ...prev, [specName]: updated };
                                }
                              });
                            }}
                          />
                          <span className="text-[13px] text-gray-600 group-hover:text-[#F97316] transition-colors truncate">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Mobile Apply Filters Button */}
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="lg:hidden w-full mt-6 py-2.5 bg-[#081621] hover:bg-[#F97316] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Apply Filters ({filteredProducts.length} Results)
                </button>

              </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-grow min-w-0">
              <div className="bg-white p-3 sm:p-4 rounded-md shadow-sm border border-gray-200 mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-center">
                <div className="relative w-full sm:w-64">
                  <input 
                    type="text" 
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder={categorySlug ? "Search in this category..." : "Search in all products..."}
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-[13px] focus:border-[#F97316] focus:ring-0 outline-none transition-all"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[13px] font-medium text-gray-500 whitespace-nowrap">
                    {filteredProducts.length} results
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-gray-500">Sort By:</span>
                    <select 
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="text-[13px] font-medium text-[#081621] border border-gray-200 bg-gray-50 rounded focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] py-1 pl-3 pr-8 cursor-pointer outline-none transition-all"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-md h-80 animate-pulse border border-gray-200"></div>
                  ))}
                </div>
              ) : paginatedProducts.length > 0 ? (
                <>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-10"
                  >
                    {paginatedProducts.map(product => (
                      <motion.div key={product.id} variants={itemVariants}>
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-200 rounded-md text-[13px] font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={cn(
                              "w-8 h-8 rounded-md flex items-center justify-center text-[13px] font-bold transition-colors",
                              currentPage === i + 1 
                                ? "bg-[#F97316] text-white border border-[#F97316]" 
                                : "text-gray-600 hover:bg-gray-100 border border-transparent"
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-200 rounded-md text-[13px] font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-md border border-gray-200 p-12 text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Filter size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-[#081621] mb-2">No components found</h3>
                  <p className="text-gray-500 text-sm font-medium">Try adjusting your filters or search criteria.</p>
                </div>
              )}

              {/* Recently Viewed Section */}
              <RecentlyViewedSection />
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const RecentlyViewedSection = () => {
  const { recentlyViewed } = useRecentlyViewed();

  if (!recentlyViewed || recentlyViewed.length === 0) return null;

  return (
    <div className="mt-16 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-[#081621]">Recently Viewed</h3>
        <div className="h-px bg-gray-200 flex-grow"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-4">
        {recentlyViewed.slice(0, 4).map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
