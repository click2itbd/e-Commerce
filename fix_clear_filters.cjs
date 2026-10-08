const fs = require('fs');

let c = fs.readFileSync('src/pages/shop/CategoryPage.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';

// Check if clearFilters is already defined
if (!c.includes('const clearFilters =')) {
  c = c.replace(/const \[currentPage, setCurrentPage\] = useState\(1\);/, "const [currentPage, setCurrentPage] = useState(1);\n\n  const clearFilters = () => {\n    setSelectedBrands([]);\n    setPriceRange({ min: 0, max: 200000 });\n    setShowInStock(true);\n    setShowOutOfStock(true);\n    setSelectedSpecs({});\n    setCurrentPage(1);\n  };");
  fs.writeFileSync('src/pages/shop/CategoryPage.tsx', c);
  console.log('clearFilters added');
} else {
  console.log('clearFilters already exists');
}