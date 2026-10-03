const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

// 1. Add createdBy to saleData initial state (we'll just use a normal string 'Admin' as default since hooks might not be ready, but actually we can set it in useEffect or just let the UI handle it)
code = code.replace(/customerEmail: '',\n    shippingAddress: '',/g, "customerEmail: '',\n    shippingAddress: '',\n    createdBy: '',");

// 2. Fix the createdBy in the addDoc payload
code = code.replace(/createdBy: profile\?\.displayName \|\| profile\?\.email \|\| 'Admin',/, "createdBy: saleData.createdBy || profile?.displayName || profile?.email || 'Admin',");

// 3. Add UI field
const uiTarget = `<div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>`;

const uiReplacement = `<div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Prepared By (Staff Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fahad, Atik..."
                  value={saleData.createdBy || profile?.displayName || profile?.email?.split('@')[0] || 'Admin'}
                  onChange={e => setSaleData({ ...saleData, createdBy: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>`;

code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
console.log("Updated SalesForm");
