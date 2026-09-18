const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

code = code.replace(
  "domainContact: 'default',",
  "domainContact: 'default',\n    customFirstName: '',\n    customLastName: '',\n    customEmail: '',\n    customPhone: '',\n    customAddress1: '',\n    customCity: '',\n    customState: '',\n    customPostcode: '',"
);

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

const targetDropdown = `</select>
              </div>
            </div>
          )`;

if (!code.includes('Custom Contact Details')) {
  code = code.split('</select>\n              </div>').join('</select>\n              </div>' + '\n' + customContactUI);
}

// Update payment method mapping to only keep bkash
const targetPaymentMethods = `{[
                { id: 'bkash', label: 'bKash', img: 'https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png' },
                { id: 'nagad', label: 'Nagad', img: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png' },
                { id: 'card', label: 'Cards (Visa/Master)', img: 'https://cdn-icons-png.flaticon.com/512/196/196578.png' },
                { id: 'bank', label: 'Bank Transfer', img: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png' }
              ].map(method => (`;

const newPaymentMethods = `{[
                { id: 'bkash', label: 'bKash', img: 'https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png' },
                { id: 'nagad', label: 'Nagad (Coming Soon)', img: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png', disabled: true },
                { id: 'card', label: 'Cards (Coming Soon)', img: 'https://cdn-icons-png.flaticon.com/512/196/196578.png', disabled: true },
                { id: 'bank', label: 'Bank Transfer (Coming Soon)', img: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png', disabled: true }
              ].map(method => (`;

if (code.includes(targetPaymentMethods)) {
  code = code.replace(targetPaymentMethods, newPaymentMethods);
}

// Modify the radio button map rendering to support disabled state
const oldRadioLabel = `<label key={method.id} className={\`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all \${formData.paymentMethod === method.id ? 'border-[#0E2A47] bg-[#0E2A47]/5' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}\`}>
                    <input type="radio" name="paymentMethod" value={method.id} checked={formData.paymentMethod === method.id} onChange={handleChange} className="sr-only" />`;

const newRadioLabel = `<label key={method.id} className={\`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all \${method.disabled ? 'opacity-50 cursor-not-allowed border-slate-100 grayscale bg-slate-50' : 'cursor-pointer'} \${formData.paymentMethod === method.id && !method.disabled ? 'border-[#0E2A47] bg-[#0E2A47]/5' : !method.disabled ? 'border-slate-100 hover:border-slate-200 hover:bg-slate-50' : ''}\`}>
                    <input type="radio" name="paymentMethod" value={method.id} checked={formData.paymentMethod === method.id} onChange={handleChange} disabled={method.disabled} className="sr-only" />`;

if (code.includes(oldRadioLabel)) {
  code = code.replace(oldRadioLabel, newRadioLabel);
}

fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
console.log('Done modifying domainContact UI and payment methods.');
