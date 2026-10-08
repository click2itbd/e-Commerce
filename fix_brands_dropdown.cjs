const fs = require('fs');

function updateFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const nl = c.includes('\r\n') ? '\r\n' : '\n';
  
  // 1. Add state for dropdown if not exists
  if (!c.includes('isBrandDropdownOpen')) {
    c = c.replace(/const \[brandFilter, setBrandFilter\] = useState\('all'\);/, "const [brandFilter, setBrandFilter] = useState('all');\n  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);\n  const brandDropdownRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    const handleClickOutside = (event: MouseEvent) => {\n      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {\n        setIsBrandDropdownOpen(false);\n      }\n    };\n    document.addEventListener('mousedown', handleClickOutside);\n    return () => document.removeEventListener('mousedown', handleClickOutside);\n  }, []);");
  }

  // 2. Replace the native select with custom dropdown
  const nativeSelectRegex = /<div className="relative">[\s\n]*<Tag className="absolute left-3 top-1\/2 -translate-y-1\/2 text-gray-400" size=\{14\} \/>[\s\n]*<select[\s\n]*value=\{brandFilter\}[\s\n]*onChange=\{\(e\) => setBrandFilter\(e\.target\.value\)\}[\s\S]*?<\/select>[\s\n]*<\/div>/m;
  
  const customDropdown = `<div className="relative" ref={brandDropdownRef}>
              <div 
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium text-slate-700 min-w-[140px] cursor-pointer flex items-center justify-between"
              >
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <span className="truncate max-w-[100px]">{brandFilter === 'all' ? 'All Brands' : brandFilter}</span>
                <ChevronRight className={\`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform \${isBrandDropdownOpen ? 'rotate-90' : ''}\`} size={14} />
              </div>
              
              {isBrandDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-[320px] bg-white border border-gray-100 shadow-xl rounded-xl z-50 p-3 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setBrandFilter('all'); setIsBrandDropdownOpen(false); }}
                      className={\`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors \${brandFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}\`}
                    >
                      All Brands
                    </button>
                    {brands.map((b: any) => (
                      <button
                        key={b.id || b.name}
                        onClick={() => { setBrandFilter(b.name); setIsBrandDropdownOpen(false); }}
                        className={\`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors truncate \${brandFilter === b.name ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}\`}
                        title={b.name}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>`;

  if (c.match(nativeSelectRegex)) {
    c = c.replace(nativeSelectRegex, customDropdown);
  } else {
    console.log('Regex did not match for ' + filePath);
  }
  
  // Make sure ChevronRight is imported
  if (!c.includes('ChevronRight')) {
    c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, ChevronRight } from 'lucide-react';");
  }

  fs.writeFileSync(filePath, c);
}

updateFile('src/pages/ecommerceDashboard/EcommerceInventory.tsx');
updateFile('src/pages/admin/tabs/inventory/Inventory.tsx');
console.log('Updated brands dropdown to custom 2-column dropdown');