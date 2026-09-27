const fs = require('fs');
let settings = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceSettings.tsx', 'utf8');

const newFields = `
            <div className="p-6 border-t border-gray-100 bg-orange-50 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-3 text-sm font-bold text-gray-800 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" name="requireAdvanceDeliveryCharge" checked={settings.requireAdvanceDeliveryCharge || false} onChange={(e) => setSettings(prev => ({...prev, requireAdvanceDeliveryCharge: e.target.checked}))} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </div>
                  Require Advance Delivery Charge (For COD)
                </label>
                <p className="text-xs text-gray-500 mt-2">Prevents fake orders by forcing the customer to pay the delivery charge in advance before confirming a COD order.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">bKash/Nagad Number (For Advance Payment)</label>
                <input type="text" name="advancePaymentNumber" value={settings.advancePaymentNumber || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. 017XXXXXXX (Personal/Agent)" />
              </div>
            </div>
          </div>
`;

if (!settings.includes('Require Advance Delivery Charge')) {
    const splitPoint = '{/* Contact Info */}';
    const parts = settings.split(splitPoint);
    if (parts.length === 2) {
        // We need to inject before Contact Info, BUT remove the closing div of the previous section, and close it after.
        // Actually the previous section closes with `</div>` `</div>` `</div>`.
        // Let's just put it right before `{/* Contact Info */}` but as a separate card!
        
        const standaloneCard = `
          {/* Advance Delivery Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">Advanced COD Protection</h3>
            </div>
            <div className="p-6 bg-orange-50 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-3 text-sm font-bold text-gray-800 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" name="requireAdvanceDeliveryCharge" checked={settings.requireAdvanceDeliveryCharge || false} onChange={(e) => setSettings(prev => ({...prev, requireAdvanceDeliveryCharge: e.target.checked}))} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </div>
                  Require Advance Delivery Charge (For COD)
                </label>
                <p className="text-xs text-gray-500 mt-2">Prevents fake orders by forcing the customer to pay the delivery charge in advance before confirming a COD order.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">bKash/Nagad Number (For Advance Payment)</label>
                <input type="text" name="advancePaymentNumber" value={settings.advancePaymentNumber || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. 017XXXXXXX (Personal/Agent)" />
              </div>
            </div>
          </div>
        `;
        
        settings = parts[0] + standaloneCard + splitPoint + parts[1];
        fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceSettings.tsx', settings, 'utf8');
        console.log('Fixed Settings UI');
    }
}