const fs = require('fs');

let c = fs.readFileSync('src/pages/shop/CategoryPage.tsx', 'utf8');

// Replace the price range block and sliders
const oldPriceRegex = /<div className="mb-6">[\s\S]*?<h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide">BRANDS<\/h3>/;

const newPriceUI = `<div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide flex justify-between items-center">
                      PRICE RANGE
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

                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-800 mb-3 tracking-wide">BRANDS</h3>`;

if (c.match(oldPriceRegex)) {
  c = c.replace(oldPriceRegex, newPriceUI);
}

// Add Clear filter button
if (!c.includes('clearFilters')) {
  c = c.replace(/const \[showOutOfStock, setShowOutOfStock\] = useState\(false\);/, "const [showOutOfStock, setShowOutOfStock] = useState(false);\n  const clearFilters = () => {\n    setSelectedBrands([]);\n    setPriceRange({ min: 0, max: 500000 });\n    setShowInStock(false);\n    setShowOutOfStock(false);\n    setSelectedSpecs({});\n  };");
}
c = c.replace(/<Filter size=\{18\} className="text-\[#081621\]" \/>\s*<h2 className="font-bold text-\[15px\] text-\[#081621\]">Filter Options<\/h2>/, "<Filter size={18} className=\"text-[#081621]\" />\n                    <h2 className=\"font-bold text-[15px] text-[#081621] flex-1\">Filter Options</h2>\n                    <button onClick={clearFilters} className=\"text-xs bg-orange-50 text-[#F97316] px-3 py-1 rounded-full font-bold hover:bg-orange-100 transition-colors\">Clear</button>");

// Change all native checkboxes to use accent-color for Orange
c = c.replace(/className="w-4 h-4 rounded-sm border-gray-300 text-\[#F97316\] focus:ring-\[#F97316\] transition-all cursor-pointer bg-white"/g, 'className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white accent-[#F97316]"');

fs.writeFileSync('src/pages/shop/CategoryPage.tsx', c);
console.log('Category filter upgraded');