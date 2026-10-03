const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

// 1. Add createdBy to purchaseForm state
code = code.replace(/reference: '',\n    notes: '',/g, "reference: '',\n    notes: '',\n    createdBy: '',");

// 2. Fix createdBy in addDoc payloads
code = code.replace(/createdBy: profile\?\.displayName \|\| profile\?\.email \|\| 'Admin',/g, "createdBy: purchaseForm.createdBy || profile?.displayName || profile?.email || 'Admin',");

// 3. Add UI field
const uiTarget = `<div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>`;

const uiReplacement = `<div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Prepared By (Staff Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fahad, Atik..."
                    value={purchaseForm.createdBy || profile?.displayName || profile?.email?.split('@')[0] || 'Admin'}
                    onChange={e => setPurchaseForm({ ...purchaseForm, createdBy: e.target.value })}
                    className="w-full text-sm border-gray-300 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>`;

code = code.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', code, 'utf8');
console.log("Updated Purchases");
