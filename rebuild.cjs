const fs = require('fs');

require('./script.cjs');

let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

// 1. Fix imports (from '../' -> '../../')
code = code.replace(/from '\.\.\//g, "from '../../");

// 2. Add custom form fields to initial state
code = code.replace(
  "domainContact: 'default',",
  "domainContact: 'default',\n      customFirstName: '',\n      customLastName: '',\n      customEmail: '',\n      customPhone: '',\n      customAddress1: '',\n      customCity: '',\n      customState: '',\n      customPostcode: '',\n      transactionId: '',"
);

// 3. Remove bKash API redirect
code = code.replace(/if \(formData\.paymentMethod === 'bkash'\) \{[\s\S]*?else if \(formData\.paymentMethod === 'card'\) \{/, "if (formData.paymentMethod === 'card') {");

// 4. Add TrxID validation
code = code.replace(
  "toast.error('You must agree to the Terms of Service.');\n      return;\n    }",
  "toast.error('You must agree to the Terms of Service.');\n      return;\n    }\n    if (formData.paymentMethod === 'bkash' && (!formData.transactionId || !formData.transactionId.trim())) {\n      toast.error('Please enter the bKash Transaction ID (TrxID)');\n      return;\n    }"
);

// 5. Fix duplicate extDomainItems/extHostingItems declarations
code = code.replace(/const domainItems = items\.filter/g, 'let extDomainItems = items.filter');
code = code.replace(/const hostingItems = items\.filter/g, 'let extHostingItems = items.filter');
code = code.replace(/for \(const domainItem of domainItems\)/g, 'for (const domainItem of extDomainItems)');
code = code.replace(/for \(const hostingItem of hostingItems\)/g, 'for (const hostingItem of extHostingItems)');
code = code.replace(/let extDomainItems = items\.filter.*?;\s*let extHostingItems = items\.filter.*?;/gs, '');
code = code.replace(/const newOrderRef/, 'let extDomainItems = items.filter(i => i.itemType === \'domain\' || i.itemType === \'domain_transfer\');\n      let extHostingItems = items.filter(i => i.itemType === \'hosting\');\n      const newOrderRef');

// 6. Update orderData
code = code.replace("paymentStatus: 'pending',", "paymentStatus: formData.paymentMethod === 'bkash' && formData.transactionId ? 'processing' : 'pending',");
code = code.replace(
  "paymentMethod: formData.paymentMethod,\n        notes: formData.notes,",
  "paymentMethod: formData.paymentMethod,\n        transactionId: formData.transactionId,\n        domainContactDetails: formData.domainContact === 'custom' ? {\n          firstName: formData.customFirstName, lastName: formData.customLastName,\n          email: formData.customEmail, phone: formData.customPhone,\n          address1: formData.customAddress1, city: formData.customCity,\n          state: formData.customState, postcode: formData.customPostcode,\n        } : null,\n        notes: formData.notes,"
);

// 7. Inject Custom Contact UI after domainContact dropdown
const customContactUI = `
              {formData.domainContact === 'custom' && (
                <div className="mt-6 bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 max-w-3xl mx-auto">
                  <h4 className="font-semibold text-slate-800 mb-4">Custom Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="customFirstName" value={formData.customFirstName} onChange={handleChange} placeholder="First Name *" required className="border border-slate-200 p-3 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47]" />
                    <input type="text" name="customLastName" value={formData.customLastName} onChange={handleChange} placeholder="Last Name *" required className="border border-slate-200 p-3 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47]" />
                    <input type="email" name="customEmail" value={formData.customEmail} onChange={handleChange} placeholder="Email Address *" required className="border border-slate-200 p-3 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47]" />
                    <input type="tel" name="customPhone" value={formData.customPhone} onChange={handleChange} placeholder="Phone Number *" required className="border border-slate-200 p-3 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47]" />
                  </div>
                  <input type="text" name="customAddress1" value={formData.customAddress1} onChange={handleChange} placeholder="Street Address *" required className="border border-slate-200 p-3 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47]" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" name="customCity" value={formData.customCity} onChange={handleChange} placeholder="City *" required className="border border-slate-200 p-3 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47]" />
                    <input type="text" name="customState" value={formData.customState} onChange={handleChange} placeholder="State/Division *" required className="border border-slate-200 p-3 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47]" />
                    <input type="text" name="customPostcode" value={formData.customPostcode} onChange={handleChange} placeholder="Postcode *" required className="border border-slate-200 p-3 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47]" />
                  </div>
                </div>
              )}
`;
code = code.replace(/(<select name="domainContact"[\s\S]*?<\/select>\s*<\/div>)/, (match) => match + '\n' + customContactUI);

// 8. Replace payment method list with disabled options and bKash manual section
const paymentMethodsBlock = `              {[
                { id: 'bkash', label: 'bKash', img: 'https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png' },
                { id: 'nagad', label: 'Nagad', img: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png' },
                { id: 'card', label: 'Cards (Visa/Master)', img: 'https://cdn-icons-png.flaticon.com/512/196/196578.png' },
                { id: 'bank', label: 'Bank Transfer', img: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png' }
              ].map(method => (
                <label key={method.id} className={\`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all \${formData.paymentMethod === method.id ? 'border-[#6EC72A] bg-[#6EC72A]/5' : 'border-slate-100 hover:border-slate-300'}\`}>
                  <input type="radio" name="paymentMethod" value={method.id} checked={formData.paymentMethod === method.id} onChange={handleChange} className="hidden" />
                  <div className="h-10 flex items-center justify-center">
                    <img src={method.img} alt={method.label} className="max-h-full object-contain mix-blend-multiply opacity-90" />
                  </div>
                  <span className={\`text-xs font-semibold text-center \${formData.paymentMethod === method.id ? 'text-[#6EC72A]' : 'text-slate-500'}\`}>{method.label}</span>
                </label>
              ))}`;

const newPaymentMethodsBlock = `              {[
                { id: 'bkash', label: 'bKash', img: 'https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png', disabled: false },
                { id: 'nagad', label: 'Nagad (Coming Soon)', img: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png', disabled: true },
                { id: 'card', label: 'Cards (Coming Soon)', img: 'https://cdn-icons-png.flaticon.com/512/196/196578.png', disabled: true },
                { id: 'bank', label: 'Bank Transfer (Coming Soon)', img: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png', disabled: true }
              ].map(method => (
                <label key={method.id} className={\`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all \${method.disabled ? 'opacity-50 cursor-not-allowed border-slate-100 grayscale bg-slate-50' : 'cursor-pointer'} \${formData.paymentMethod === method.id && !method.disabled ? 'border-[#0E2A47] bg-[#0E2A47]/5' : !method.disabled ? 'border-slate-100 hover:border-slate-200 hover:bg-slate-50' : ''}\`}>
                  <input type="radio" name="paymentMethod" value={method.id} checked={formData.paymentMethod === method.id} onChange={handleChange} disabled={method.disabled} className="hidden" />
                  <div className="h-10 flex items-center justify-center">
                    <img src={method.img} alt={method.label} className="max-h-full object-contain mix-blend-multiply opacity-90" />
                  </div>
                  <span className={\`text-xs font-semibold text-center \${formData.paymentMethod === method.id ? 'text-[#6EC72A]' : 'text-slate-500'}\`}>{method.label}</span>
                </label>
              ))}`;

code = code.replace(paymentMethodsBlock, newPaymentMethodsBlock);

// 9. Inject bKash manual section right before Additional Notes
const bkashManualSection = `
          {formData.paymentMethod === 'bkash' && (
            <div className="mb-10 bg-pink-50 border border-pink-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src="https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png" alt="bKash" className="h-8 object-contain" />
                  <div>
                    <h4 className="font-bold text-pink-900 text-base">bKash Manual Payment</h4>
                    <p className="text-xs text-pink-600">Send money to our bKash number below</p>
                  </div>
                </div>
                <span className="bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1 rounded-full">Manual Payment</span>
              </div>
              <div className="bg-white rounded-xl border border-pink-100 p-4 mb-5">
                <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">bKash Personal Number</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-pink-700 tracking-wider font-mono">{(settings as any)?.manualBkashNumber || settings?.bkashNumber || '01700000000'}</span>
                  <button type="button" onClick={() => { navigator.clipboard.writeText((settings as any)?.manualBkashNumber || settings?.bkashNumber || '01700000000'); toast.success('Number copied!'); }} className="flex items-center gap-1.5 bg-pink-100 hover:bg-pink-200 text-pink-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    ?? Copy Number
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Amount to Pay: <strong className="text-slate-800">?{grandTotal.toFixed(2)}</strong></p>
              </div>
              <div className="bg-white rounded-xl border border-pink-100 p-4 mb-4">
                <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">? How to Pay</p>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Open bKash app &amp; tap <strong>Make Payment</strong></li>
                  <li>Send <strong>?{grandTotal.toFixed(2)}</strong> to the number above</li>
                  <li>Copy the <strong>TrxID</strong> below &amp; click <strong>Complete Order</strong></li>
                </ol>
              </div>
              <div>
                <label className="block text-xs font-bold text-pink-800 mb-2 uppercase tracking-wide">bKash Transaction ID (TrxID) *</label>
                <input type="text" name="transactionId" value={formData.transactionId} onChange={handleChange} placeholder="e.g. 8IJ27B1234" required className="border border-pink-300 bg-white p-3.5 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all font-mono uppercase tracking-wider" />
                <p className="text-xs text-pink-600 mt-1.5">?? Please enter the exact Transaction ID (TrxID) received via SMS after payment.</p>
              </div>
            </div>
          )}
`;

code = code.replace('{/* Additional Notes */}', bkashManualSection + '\n          {/* Additional Notes */}');

fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
console.log('Done! HostingCheckout.tsx rebuilt with all features.');
