const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/admin/POS/components/POSSidebar.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `isRedeemingPoints: boolean;\n  setIsRedeemingPoints: (v: boolean) => void;\n}`,
  `isRedeemingPoints: boolean;\n  setIsRedeemingPoints: (v: boolean) => void;\n  saleSource: 'in_store' | 'online';\n  setSaleSource: (v: 'in_store' | 'online') => void;\n}`
);

content = content.replace(
  `setIsRedeemingPoints,\n}) => {`,
  `setIsRedeemingPoints,\n  saleSource,\n  setSaleSource,\n}) => {`
);

const target = `<div className="mt-4 flex gap-2">`;
const replacement = `<div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sale Source</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSaleSource('in_store')}
                  className={cn("flex-1 py-2 text-sm font-bold rounded", saleSource === 'in_store' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}
                >
                  In-Store / POS
                </button>
                <button
                  onClick={() => setSaleSource('online')}
                  className={cn("flex-1 py-2 text-sm font-bold rounded", saleSource === 'online' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}
                >
                  Online Sale
                </button>
              </div>
            </div>\n            <div className="mt-4 flex gap-2">`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated POSSidebar.tsx');
