const fs = require('fs');
let comp = fs.readFileSync('src/pages/shop/Compare.tsx', 'utf8');

const importTarget = `import { formatCurrency, cn } from '../../lib/utils';`;
const importNew = `import { formatCurrency, cn } from '../../lib/utils';\nimport { useState } from 'react';`;

if (!comp.includes('import { useState }')) {
    comp = comp.replace(importTarget, importNew);
}

const hookTarget = `export const ComparePage: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();`;

const hookNew = `export const ComparePage: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [hideSimilar, setHideSimilar] = useState(false);

  const isDifferent = (key, isBasic) => {
    if (compareItems.length <= 1) return false;
    const values = compareItems.map(p => {
      if (isBasic) {
        if (key === 'stock') return p.stock > 0 ? 'instock' : 'outofstock';
        return String(p[key] || '').toLowerCase();
      }
      return String(p.specs?.[key] || '').toLowerCase();
    });
    return !values.every(v => v === values[0]);
  };
`;
if (!comp.includes('highlightDiff')) {
    comp = comp.replace(hookTarget, hookNew);
}

const headerTarget = `            <button 
              onClick={clearCompare}
              className="text-sm text-red-500 hover:text-white border border-red-200 hover:bg-red-500 hover:border-red-500 font-bold transition-all px-5 py-2 rounded-md"
            >
              Clear All
            </button>
          </motion.div>`;
          
const headerNew = `            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
                <input type="checkbox" checked={highlightDiff} onChange={e => setHighlightDiff(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500" />
                Highlight Differences
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
                <input type="checkbox" checked={hideSimilar} onChange={e => setHideSimilar(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500" />
                Hide Similarities
              </label>
              <button 
                onClick={clearCompare}
                className="text-sm text-red-500 hover:text-white border border-red-200 hover:bg-red-500 hover:border-red-500 font-bold transition-all px-5 py-2 rounded-lg"
              >
                Clear All
              </button>
            </div>
          </motion.div>`;

if (!comp.includes('Hide Similarities')) {
    comp = comp.replace(headerTarget, headerNew);
}


// Now replace the label rendering
// Price is always different? Not necessarily, but let's keep price always visible.
// Basic details labels:
const basicLabelTarget = `                {/* Basic Details */}
                {mainSpecLabels.map(spec => (
                   <div key={spec.key} className="px-6 py-4 border-b border-gray-200 min-h-[64px] flex items-center bg-gray-50">
                     <span className="font-bold text-gray-700 text-sm">{spec.label}</span>
                   </div>
                ))}`;

const basicLabelNew = `                {/* Basic Details */}
                {mainSpecLabels.map(spec => {
                  const diff = isDifferent(spec.key, true);
                  if (hideSimilar && !diff) return null;
                  return (
                    <div key={spec.key} className={cn("px-6 py-4 border-b border-gray-200 min-h-[64px] flex items-center transition-colors", diff && highlightDiff ? "bg-yellow-50/80" : "bg-gray-50")}>
                      <span className="font-bold text-gray-700 text-sm">{spec.label}</span>
                    </div>
                  );
                })}`;
comp = comp.replace(basicLabelTarget, basicLabelNew);

// Dynamic technical specs labels:
const techLabelTarget = `                    {allSpecKeys.map(specKey => (
                      <div key={specKey} className="px-6 py-4 border-b border-gray-200 min-h-[64px] flex items-center bg-gray-50">
                        <span className="font-bold text-gray-700 text-sm">{specKey}</span>
                      </div>
                    ))}`;
const techLabelNew = `                    {allSpecKeys.map(specKey => {
                      const diff = isDifferent(specKey, false);
                      if (hideSimilar && !diff) return null;
                      return (
                        <div key={specKey} className={cn("px-6 py-4 border-b border-gray-200 min-h-[64px] flex items-center transition-colors", diff && highlightDiff ? "bg-yellow-50/80" : "bg-gray-50")}>
                          <span className="font-bold text-gray-700 text-sm">{specKey}</span>
                        </div>
                      );
                    })}`;
comp = comp.replace(techLabelTarget, techLabelNew);

// Price Row inside the Product Columns:
const priceRowTarget = `                  {/* Price Row */}
                  <div className="p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center bg-white text-center">
                    <span className="text-lg font-black text-[#EF4444]">{formatCurrency(product.price)}</span>
                  </div>`;
const priceRowNew = `                  {/* Price Row */}
                  <div className="p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center bg-white text-center">
                    <span className="text-lg font-black text-[#EF4444]">
                      {product.discountPrice ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm line-through text-gray-400 font-bold">{formatCurrency(product.price)}</span>
                          <span>{formatCurrency(product.discountPrice)}</span>
                        </div>
                      ) : formatCurrency(product.price)}
                    </span>
                  </div>`;
comp = comp.replace(priceRowTarget, priceRowNew);


// Basic details columns
const basicDetailsColsTarget = `                  {/* Basic Details Rows */}
                  <div className="p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm bg-white text-center">
                    <span className="font-bold capitalize">{product.brand || '-'}</span>
                  </div>
                  <div className="p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm bg-white text-center">
                    <span className="uppercase tracking-wider text-xs font-bold">{product.category || '-'}</span>
                  </div>
                  <div className="p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-sm bg-white text-center">
                    {product.stock > 0 
                      ? <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">In Stock</span> 
                      : <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">Out of Stock</span>
                    }
                  </div>
                  <div className="p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm bg-white text-center">
                    <span className="font-medium">{product.warrantyMonths ? \`\${product.warrantyMonths} Months\` : 'No Warranty'}</span>
                  </div>`;

const basicDetailsColsNew = `                  {/* Basic Details Rows */}
                  {(!hideSimilar || isDifferent('brand', true)) && (
                    <div className={cn("p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm text-center transition-colors", isDifferent('brand', true) && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                      <span className="font-bold capitalize">{product.brand || '-'}</span>
                    </div>
                  )}
                  {(!hideSimilar || isDifferent('category', true)) && (
                    <div className={cn("p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm text-center transition-colors", isDifferent('category', true) && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                      <span className="uppercase tracking-wider text-xs font-bold">{product.category || '-'}</span>
                    </div>
                  )}
                  {(!hideSimilar || isDifferent('stock', true)) && (
                    <div className={cn("p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-sm text-center transition-colors", isDifferent('stock', true) && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                      {product.stock > 0 
                        ? <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">In Stock</span> 
                        : <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">Out of Stock</span>
                      }
                    </div>
                  )}
                  {(!hideSimilar || isDifferent('warrantyMonths', true)) && (
                    <div className={cn("p-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-gray-700 text-sm text-center transition-colors", isDifferent('warrantyMonths', true) && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                      <span className="font-medium">{product.warrantyMonths ? \`\${product.warrantyMonths} Months\` : 'No Warranty'}</span>
                    </div>
                  )}`;
comp = comp.replace(basicDetailsColsTarget, basicDetailsColsNew);

// Dynamic technical specs columns
const techColsTarget = `                      {allSpecKeys.map(specKey => {
                        const val = product.specs?.[specKey];
                        return (
                          <div key={specKey} className="px-4 py-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-center bg-white">
                            <span className={cn(
                              "text-sm font-medium",
                              val ? "text-gray-800" : "text-gray-300"
                            )}>
                              {val || '-'}
                            </span>
                          </div>
                        );
                      })}`;

const techColsNew = `                      {allSpecKeys.map(specKey => {
                        const val = product.specs?.[specKey];
                        const diff = isDifferent(specKey, false);
                        if (hideSimilar && !diff) return null;
                        return (
                          <div key={specKey} className={cn("px-4 py-4 border-b border-gray-200 min-h-[64px] flex items-center justify-center text-center transition-colors", diff && highlightDiff ? "bg-yellow-50/50" : "bg-white")}>
                            <span className={cn(
                              "text-sm font-medium",
                              val ? "text-gray-800" : "text-gray-300"
                            )}>
                              {val || '-'}
                            </span>
                          </div>
                        );
                      })}`;
comp = comp.replace(techColsTarget, techColsNew);

fs.writeFileSync('src/pages/shop/Compare.tsx', comp, 'utf8');
console.log('Advanced Compare logic injected successfully');