const fs = require('fs');
let c = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

const regex = /(<button[\s\S]*?onClick=\{\(e\) => \{[\s\S]*?addToWishlist[\s\S]*?<\/button>)/;
if (c.match(regex) && !c.includes('USED')) {
  c = c.replace(regex, `$1\n          {(product as any).condition === 'used' && (
            <div className="absolute top-2 left-2 z-20 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              USED
            </div>
          )}`);
  fs.writeFileSync('src/components/ProductCard.tsx', c.replace(/\n/g, nl));
  console.log('Added via Regex');
} else {
  console.log('Regex match failed');
}