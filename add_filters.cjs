const fs = require('fs');

let c = fs.readFileSync('src/pages/shop/CategoryPage.tsx', 'utf8');

// 1. Add states
if (!c.includes('showDiscountedOnly')) {
  c = c.replace(/const \[showOutOfStock, setShowOutOfStock\] = useState\(true\);/, "const [showOutOfStock, setShowOutOfStock] = useState(true);\n  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);\n  const [minRating, setMinRating] = useState(0);");
}

// 2. Update clearFilters
c = c.replace(/setShowOutOfStock\(true\);/, "setShowOutOfStock(true);\n    setShowDiscountedOnly(false);\n    setMinRating(0);");

// 3. Update filteredProducts
c = c.replace(/\.filter\(p => \{\n\s*if \(\!categorySearch\.trim\(\)\) return true;/, ".filter(p => {\n      if (showDiscountedOnly) {\n        // Discount price must exist and be less than regular price, OR explicitly marked\n        if (!p.discountPrice || p.discountPrice >= p.price) return false;\n      }\n      if (minRating > 0) {\n        if ((p.rating || 0) < minRating) return false;\n      }\n      return true;\n    })\n      .filter(p => {\n        if (!categorySearch.trim()) return true;");

// 4. Derive availableSubCategories
if (!c.includes('availableSubCategories')) {
  const subCatLogic = `
  const availableSubCategories = useMemo(() => {
    if (subSubCategorySlug) return [];
    
    const items = new Set<string>();
    products.forEach(p => {
      if (subCategorySlug) {
        if (p.subSubCategory) items.add(p.subSubCategory);
      } else if (categorySlug) {
        if (p.subCategory) items.add(p.subCategory);
      }
    });
    return Array.from(items).sort();
  }, [products, categorySlug, subCategorySlug, subSubCategorySlug]);
`;
  c = c.replace(/const availableBrands = useMemo\(\(\) => \{/, subCatLogic + "\n  const availableBrands = useMemo(() => {");
}

// 5. Add UI elements to Filter Options
const uiAddition = `
                  {/* Offers Filter */}
                  <div className="mb-6 border-t border-gray-100 pt-6">
                    <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide">SPECIAL OFFERS</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={showDiscountedOnly}
                          onChange={e => setShowDiscountedOnly(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white accent-[#F97316]" 
                        />
                        <span className="text-[13px] text-gray-600 group-hover:text-[#F97316] transition-colors font-medium">Discounted Items</span>
                      </label>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="mb-6 border-t border-gray-100 pt-6">
                    <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide">CUSTOMER RATINGS</h3>
                    <div className="space-y-3">
                      {[4, 3, 2, 1].map(rating => (
                        <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="rating_filter"
                            checked={minRating === rating}
                            onChange={() => setMinRating(rating)}
                            className="w-4 h-4 text-[#F97316] focus:ring-[#F97316] border-gray-300 cursor-pointer accent-[#F97316]" 
                          />
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg key={i} className={\`w-3.5 h-3.5 \${i < rating ? 'text-[#F97316]' : 'text-gray-300'} fill-current\`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="text-[13px] text-gray-600 ml-1 group-hover:text-[#F97316] transition-colors">& Up</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
`;

if (!c.includes('SPECIAL OFFERS')) {
  c = c.replace(/<div className="mb-6">\s*<h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide">STOCK STATUS<\/h3>/, uiAddition + "\n                  <div className=\"mb-6 border-t border-gray-100 pt-6\">\n                    <h3 className=\"text-xs font-bold text-gray-800 mb-3 tracking-wide\">STOCK STATUS</h3>");
}

// Subcategory drill-down
const subCatUI = `
                  {availableSubCategories.length > 0 && (
                    <div className="mb-6 border-b border-gray-100 pb-6">
                      <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide">CATEGORIES</h3>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {availableSubCategories.map(sub => (
                          <Link 
                            key={sub} 
                            to={\`/category/\${categorySlug}\${subCategorySlug ? \`/\${subCategorySlug}/\${sub}\` : \`/\${sub}\`}\`}
                            className="block text-[13px] text-gray-600 hover:text-[#F97316] hover:bg-orange-50 px-2 py-1.5 rounded transition-colors truncate"
                          >
                            {sub.replace(/-/g, ' ')}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
`;

if (!c.includes('availableSubCategories.map')) {
  c = c.replace(/<div className="mb-6">\s*<h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide flex justify-between items-center">\s*PRICE RANGE/, subCatUI + "\n                  <div className=\"mb-6\">\n                    <h3 className=\"text-xs font-bold text-gray-800 mb-3 tracking-wide flex justify-between items-center\">\n                      PRICE RANGE");
}

fs.writeFileSync('src/pages/shop/CategoryPage.tsx', c);
console.log('Added all 3 filters');