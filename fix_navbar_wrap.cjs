const fs = require('fs');
let c = fs.readFileSync('src/components/navbars/EcommerceNavbar.tsx', 'utf8');
c = c.replace(/className="flex items-center gap-1 h-full text-\[13px\] font-bold transition-colors"/g, 'className="flex items-center gap-1 h-full text-[13px] font-bold transition-colors whitespace-nowrap"');
fs.writeFileSync('src/components/navbars/EcommerceNavbar.tsx', c);
console.log('Added whitespace-nowrap');