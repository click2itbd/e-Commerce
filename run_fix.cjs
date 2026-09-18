const fs = require('fs');

// Run the original script first to build the base HostingCheckout.tsx
require('./script.cjs');

// Now modify the generated HostingCheckout.tsx
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

// 1. Add new state fields
code = code.replace(
  "domainContact: 'default',",
  "domainContact: 'default',\n      customFirstName: '',\n      customLastName: '',\n      customEmail: '',\n      customPhone: '',\n      customAddress1: '',\n      customCity: '',\n      customState: '',\n      customPostcode: '',\n      transactionId: '',"
);

// 2. Add custom contact UI
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

code = code.replace(/(<select name="domainContact"[^>]+>[\s\S]*?<\/select>\s*<\/div>)/, (match) => match + '\n' + customContactUI);

// 3. Bind transactionId input
code = code.replace(
  'name="transactionId" placeholder="bKash TrxID *"',
  'name="transactionId" value={formData.transactionId} onChange={handleChange} placeholder="bKash TrxID *"'
);

// 4. Update order payload
code = code.replace("paymentStatus: 'pending',", "paymentStatus: formData.paymentMethod === 'bkash' && formData.transactionId ? 'processing' : 'pending',");
code = code.replace("paymentMethod: formData.paymentMethod,", "paymentMethod: formData.paymentMethod,\n        transactionId: formData.transactionId,\n        domainContactDetails: formData.domainContact === 'custom' ? {\n          firstName: formData.customFirstName,\n          lastName: formData.customLastName,\n          email: formData.customEmail,\n          phone: formData.customPhone,\n          address1: formData.customAddress1,\n          city: formData.customCity,\n          state: formData.customState,\n          postcode: formData.customPostcode,\n        } : null,");

// 5. Remove bKash API initialization
code = code.replace(/if \(formData\.paymentMethod === 'bkash'\) \{[\s\S]*?else if \(formData\.paymentMethod === 'card'\) \{/, "if (formData.paymentMethod === 'card') {");

// 6. Require Transaction ID before submit
code = code.replace(/toast\.error\('You must agree to the Terms of Service\.'\);\s*return;\s*\}/, "toast.error('You must agree to the Terms of Service.');\n      return;\n    }\n    if (formData.paymentMethod === 'bkash' && (!formData.transactionId || !formData.transactionId.trim())) {\n      toast.error('Please enter the bKash Transaction ID (TrxID)');\n      return;\n    }");

// 7. Make other payment methods "Coming Soon"
code = code.replace(/\{\s*id:\s*'nagad',\s*label:\s*'Nagad'/g, "{ id: 'nagad', disabled: true, label: 'Nagad (Coming Soon)'");
code = code.replace(/\{\s*id:\s*'card',\s*label:\s*'Cards \(Visa\/Master\)'/g, "{ id: 'card', disabled: true, label: 'Cards (Coming Soon)'");
code = code.replace(/\{\s*id:\s*'bank',\s*label:\s*'Bank Transfer'/g, "{ id: 'bank', disabled: true, label: 'Bank Transfer (Coming Soon)'");

// 8. Add disabled logic to radio buttons
code = code.replace(
  /<label key=\{method\.id\} className=\{\`cursor-pointer border-2.*?\}\`\}>/,
  "<label key={method.id} className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method.disabled ? 'opacity-50 cursor-not-allowed border-slate-100 grayscale bg-slate-50' : 'cursor-pointer'} ${formData.paymentMethod === method.id && !method.disabled ? 'border-[#0E2A47] bg-[#0E2A47]/5' : !method.disabled ? 'border-slate-100 hover:border-slate-200 hover:bg-slate-50' : ''}`}>"
);
code = code.replace(
  /<input type="radio" name="paymentMethod" value=\{method\.id\} checked=\{formData\.paymentMethod === method\.id\} onChange=\{handleChange\} className="hidden" \/>/,
  '<input type="radio" name="paymentMethod" value={method.id} checked={formData.paymentMethod === method.id} onChange={handleChange} disabled={method.disabled} className="hidden" />'
);

fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
console.log("File HostingCheckout.tsx processed perfectly!");
