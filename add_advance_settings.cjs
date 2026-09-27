const fs = require('fs');
let settings = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceSettings.tsx', 'utf8');

const targetStr = `                <p className="text-xs text-gray-500 mt-1">Set 0 to disable free shipping</p>
              </div>
            </div>
          </div>`;

const newFields = `                <p className="text-xs text-gray-500 mt-1">Set 0 to disable free shipping</p>
              </div>
            </div>
            
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
          </div>`;

if (!settings.includes('Require Advance Delivery Charge')) {
    settings = settings.replace(targetStr, newFields);
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceSettings.tsx', settings, 'utf8');
    console.log('Added advance delivery charge to Settings UI');
}