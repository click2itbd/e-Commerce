const fs = require('fs');

let c = fs.readFileSync('src/pages/shop/CategoryPage.tsx', 'utf8');

// Add Clear Filters function
if (!c.includes('clearFilters')) {
  c = c.replace(/const \[showOutOfStock, setShowOutOfStock\] = useState\(false\);/, "const [showOutOfStock, setShowOutOfStock] = useState(false);\n  const clearFilters = () => {\n    setSelectedBrands([]);\n    setPriceRange({ min: 0, max: 500000 });\n    setShowInStock(false);\n    setShowOutOfStock(false);\n    setSelectedSpecs({});\n  };");
}

// Add Clear Filters button to the UI
c = c.replace(/<Filter size=\{18\} className="text-\[#081621\]" \/>\s*<h2 className="font-bold text-\[15px\] text-\[#081621\]">Filter Options<\/h2>/, "<Filter size={18} className=\"text-[#081621]\" />\n                    <h2 className=\"font-bold text-[15px] text-[#081621] flex-1\">Filter Options</h2>\n                    <button onClick={clearFilters} className=\"text-xs text-[#F97316] font-bold hover:underline\">Clear</button>");

// Custom checkboxes replacement
// Find: className="w-4 h-4 rounded-sm border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white"
c = c.replace(/className="w-4 h-4 rounded-sm border-gray-300 text-\[#F97316\] focus:ring-\[#F97316\] transition-all cursor-pointer bg-white"/g, 'className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] transition-all cursor-pointer bg-white accent-[#F97316]"');

// Wait, accent-color works perfectly in Tailwind for native checkboxes! `accent-[#F97316]`
// Let's improve the Price Range UI
// Remove the ugly range sliders entirely and just leave the clean inputs?
// Let's check what the price range UI looks like in code.