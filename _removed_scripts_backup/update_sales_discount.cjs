const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add saleDiscountCodeInput
if (!content.includes('const [saleDiscountCodeInput, setSaleDiscountCodeInput] = useState')) {
  // Find where setSaleData is defined
  const definitionRegex = /const \[saleData, setSaleData\] = useState\(\{[\s\S]*?discountAmount: 0,\n\s*\}\);/;
  
  const replacement = `const [saleData, setSaleData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    items: [] as any[],
    type: 'invoice' as any,
    discountAmount: 0,
    appliedDiscountPercentage: 0,
    appliedDiscountCode: '',
  });

  const [saleDiscountCodeInput, setSaleDiscountCodeInput] = useState('');

  const handleApplySaleDiscountCode = () => {
    if (!saleDiscountCodeInput) return;
    const foundCode = discountCodes.find(c => c.code.toUpperCase() === saleDiscountCodeInput.toUpperCase() && c.isActive);
    if (foundCode) {
      if (new Date(foundCode.expiryDate) < new Date()) {
        toast.error("Discount code expired");
        return;
      }
      setSaleData({
        ...saleData,
        appliedDiscountPercentage: foundCode.discountPercentage,
        appliedDiscountCode: foundCode.code,
        discountAmount: 0 // Reset manual
      });
      toast.success(\`Discount code applied: \${foundCode.discountPercentage}% off\`);
    } else {
      toast.error("Invalid discount code");
    }
  };
`;
  content = content.replace(definitionRegex, replacement);
}

// 2. Add effectiveDiscount calculation to handleCreateSale
const handleCreateRegex = /const subtotal = saleData\.items\.reduce\(\(sum, item\) => sum \+ \(item\.price \* item\.quantity\), 0\);\n\s*const total = subtotal \- \(saleData\.discountAmount \|\| 0\);\n\s*const orderData = \{\n\s*\.\.\.saleData,\n\s*documentNumber: docNumber,\n\s*total: Math\.max\(0, total\),/g;

const handleCreateReplacement = `const subtotal = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const effectiveDiscount = saleData.appliedDiscountPercentage > 0 
        ? (subtotal * saleData.appliedDiscountPercentage) / 100 
        : (saleData.discountAmount || 0);
      const total = subtotal - effectiveDiscount;
      const orderData = {
        ...saleData,
        discountAmount: effectiveDiscount,
        documentNumber: docNumber,
        total: Math.max(0, total),`;

content = content.replace(handleCreateRegex, handleCreateReplacement);


// 3. Reset state on success
const resetSaleRegex = /setSaleData\(\{\n\s*customerName: '',\n\s*customerPhone: '',\n\s*customerEmail: '',\n\s*shippingAddress: '',\n\s*items: \[\]\,\n\s*type: 'invoice',\n\s*discountAmount: 0,\n\s*\}\);/;

const resetSaleReplacement = `setSaleData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: '',
        items: [],
        type: 'invoice',
        discountAmount: 0,
        appliedDiscountPercentage: 0,
        appliedDiscountCode: '',
      });
      setSaleDiscountCodeInput('');`;

content = content.replace(resetSaleRegex, resetSaleReplacement);


// 4. Update JSX in the Create Sale modal block
// Look for the discount amount div part
const jsxDiscountRegex = /<div className="flex flex-col gap-2">\n\s*<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Amount<\/label>\n\s*<input\n\s*type="number"\n\s*placeholder="Discount Amount"\n\s*value=\{saleData.discountAmount\}\n\s*onChange=\{e => setSaleData\(\{ \.\.\.saleData, discountAmount: parseFloat\(e.target.value\) \|\| 0 \}\)\}\n\s*className="w-full border-gray-200 rounded-md"\n\s*\/>\n\s*<\/div>/;

const jsxDiscountReplacement = `<div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Code (e.g. SUMMER20)"
                          value={saleDiscountCodeInput}
                          onChange={e => setSaleDiscountCodeInput(e.target.value)}
                          className="flex-1 border-gray-200 rounded-md focus:ring-[#EF4444]"
                        />
                        <button
                          type="button"
                          onClick={handleApplySaleDiscountCode}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-bold hover:bg-gray-200"
                        >
                          Apply
                        </button>
                      </div>
                      {saleData.appliedDiscountCode && (
                        <div className="flex items-center justify-between mt-1 p-2 bg-green-50 rounded-md border border-green-100">
                          <span className="text-xs text-green-700 font-bold">Applied: {saleData.appliedDiscountCode} ({saleData.appliedDiscountPercentage}%)</span>
                          <button 
                            type="button" 
                            onClick={() => setSaleData({...saleData, appliedDiscountCode: '', appliedDiscountPercentage: 0})}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <hr className="flex-1 border-gray-200" />
                      <span className="text-[10px] uppercase font-bold text-gray-400">OR</span>
                      <hr className="flex-1 border-gray-200" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Manual Discount (Amount)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        disabled={saleData.appliedDiscountPercentage > 0}
                        value={saleData.discountAmount}
                        onChange={e => setSaleData({ ...saleData, discountAmount: parseFloat(e.target.value) || 0 })}
                        className={\`w-full border-gray-200 rounded-md \${saleData.appliedDiscountPercentage > 0 ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-[#EF4444]'}\`}
                      />
                    </div>
                  </div>`;

content = content.replace(jsxDiscountRegex, jsxDiscountReplacement);

// 5. Update Total renderer in Create Sale summary
const subtotalTotalRegex = /<span className="text-xl font-bold text-\[\#EF4444\]">\n\s*\{formatCurrency\(saleData\.items\.reduce\(\(sum, item\) => sum \+ \(item\.price \* item\.quantity\), 0\)\)\}\n\s*<\/span>\n\s*<\/div>/g;

const subtotalTotalReplacement = `<div className="flex flex-col items-end gap-1">
                          {(() => {
                            const subt = saleData.items.reduce((s, item) => s + (item.price * item.quantity), 0);
                            const effDiscount = saleData.appliedDiscountPercentage > 0 
                              ? (subt * saleData.appliedDiscountPercentage) / 100 
                              : (saleData.discountAmount || 0);
                            
                            return (
                              <>
                                {effDiscount > 0 && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatCurrency(subt)}
                                  </span>
                                )}
                                <span className="text-xl font-bold text-[#EF4444]">
                                  {formatCurrency(subt - effDiscount)}
                                </span>
                                {effDiscount > 0 && (
                                  <span className="text-xs text-green-600 font-bold">
                                    Saved {formatCurrency(effDiscount)}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>`;

content = content.replace(subtotalTotalRegex, subtotalTotalReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('AdminDashboard updated for sales discount code application.');
