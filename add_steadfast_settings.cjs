const fs = require('fs');
let settings = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceSettings.tsx', 'utf8');

const storePoliciesBlock = `{/* Store Policies */}`;

const steadfastBlock = `
          {/* Steadfast Courier Integration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-800">Steadfast Courier Integration</h3>
              </div>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">API Integration</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input type="text" name="steadfastApiKey" value={settings.steadfastApiKey || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Steadfast API Key" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input type="password" name="steadfastSecretKey" value={settings.steadfastSecretKey || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Steadfast Secret Key" />
              </div>
              <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                <strong>Note:</strong> By adding Steadfast API keys, a "Send to Steadfast" button will appear in the Orders panel to automatically push orders and get a Tracking ID.
              </div>
            </div>
          </div>
          
          {/* Store Policies */}`;

if (!settings.includes('Steadfast Courier Integration')) {
    settings = settings.replace(storePoliciesBlock, steadfastBlock);
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceSettings.tsx', settings, 'utf8');
    console.log('Added Steadfast Settings UI');
}