const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

const targetDropdown = `                  <select name="domainContact" value={formData.domainContact} onChange={handleChange} className="border border-slate-200 p-3 rounded-xl text-sm min-w-[300px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0E2A47]/20 focus:border-[#0E2A47] transition-all">
                    <option value="default">Use Default Contact (Details Above)</option>
                    <option value="custom">Add New Contact</option>
                  </select>
                </div>`;

const customContactUI = `              {formData.domainContact === 'custom' && (
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
              )}`;

if (code.includes('name="domainContact"')) {
  // Use regex to replace instead of relying on exact spacing
  const regex = /(<select name="domainContact".*?<\/select>\s*<\/div>)/s;
  code = code.replace(regex, `$1\n${customContactUI}`);
}

fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
console.log('Injected custom contact UI with regex!');
