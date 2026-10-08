const fs = require('fs');

let c = fs.readFileSync('src/components/navbars/EcommerceNavbar.tsx', 'utf8');

// Change gap
c = c.replace(/<ul className="flex items-center gap-8 h-full">/g, '<ul className="flex items-center gap-4 xl:gap-6 h-full">');

// Change text size
c = c.replace(/className="flex items-center gap-1 h-full text-sm font-bold transition-colors"/g, 'className="flex items-center gap-1 h-full text-[13px] font-bold transition-colors"');

fs.writeFileSync('src/components/navbars/EcommerceNavbar.tsx', c);
console.log('Updated Navbar spacing and size');