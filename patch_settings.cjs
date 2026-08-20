const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/tabs/others/Settings.tsx', 'utf8');

const domainResellerCode = `            ) : settingsTab === 'domain_reseller' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-700">Domain Reseller API</h3>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-4">
                    <div className="text-sm text-yellow-800">
                      <p className="font-bold mb-1">Dynadot Reseller Integration</p>
                      <p>Enter your Dynadot API key below to enable real-time domain availability checks and automated registration. Make sure you have whitelisted this server's IP in your Dynadot account.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dynadot API Key</label>
                      <input 
                        type="password"
                        value={settingsFormData.apiSettings?.dynadotApiKey || ''}
                        onChange={(e) => setSettingsFormData({...settingsFormData, apiSettings: {...settingsFormData.apiSettings, dynadotApiKey: e.target.value}})}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7B61FF]"
                        placeholder="Enter your Dynadot API key"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">USD to BDT Exchange Rate</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">৳</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={settingsFormData.apiSettings?.usdToBdtRate || 120}
                          onChange={(e) => setSettingsFormData({...settingsFormData, apiSettings: {...settingsFormData.apiSettings, usdToBdtRate: parseFloat(e.target.value)}})}
                          className="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7B61FF]"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Used to convert Dynadot USD prices to BDT</p>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div>
                        <label className="block text-sm font-bold text-gray-700">Sandbox Mode</label>
                        <p className="text-xs text-gray-500">Use Dynadot Sandbox API for testing without spending money</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsFormData({...settingsFormData, apiSettings: {...settingsFormData.apiSettings, isSandboxMode: !settingsFormData.apiSettings?.isSandboxMode}})}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          settingsFormData.apiSettings?.isSandboxMode ? "bg-[#7B61FF]" : "bg-gray-200"
                        )}
                      >
                        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", settingsFormData.apiSettings?.isSandboxMode ? "translate-x-6" : "translate-x-1")} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>`;

if (!content.includes("settingsTab === 'domain_reseller'")) {
    const submitButtonDiv = content.indexOf('<div className="flex justify-end gap-2 mt-4 pb-12">');
    
    if (submitButtonDiv !== -1) {
        content = content.substring(0, submitButtonDiv) + domainResellerCode + '\n            ) : (\n            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">\n                <p className="text-sm">Configuring options for {settingsTab} are under development.</p>\n              </div>\n          )\n          }\n          \n          ' + content.substring(submitButtonDiv);
        
        // Remove the old fallback logic to avoid syntax error
        content = content.replace(/\) : \(\s*<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">\s*<p className="text-sm">Configuring options for \{settingsTab\} are under development\.<\/p>\s*<\/div>\s*\)\s*\}/, '}');
        
        fs.writeFileSync('src/pages/admin/tabs/others/Settings.tsx', content, 'utf8');
        console.log('Patched Settings.tsx');
    }
} else {
    console.log('Already patched Settings.tsx');
}
