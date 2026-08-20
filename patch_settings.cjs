const fs = require('fs');
let file = fs.readFileSync('src/pages/admin/tabs/others/Settings.tsx', 'utf8');

const newUI = `
                  <div className="mt-8 pt-6 border-t">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-4 mb-6">
                      <div className="text-sm text-blue-800">
                        <p className="font-bold mb-1">CloudLinux Partner API Integration</p>
                        <p>Enter your CloudLinux Network (CLN) credentials below to automate IP license provisioning. These are stored securely and never exposed to clients.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CLN Login</label>
                        <input 
                          type="text"
                          value={apiKeys.clnLogin || ''}
                          onChange={(e) => setApiKeys({...apiKeys, clnLogin: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7B61FF]"
                          placeholder="Partner Login Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Secret Key</label>
                        <input 
                          type="password"
                          value={apiKeys.clnSecretKey || ''}
                          onChange={(e) => setApiKeys({...apiKeys, clnSecretKey: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#7B61FF]"
                          placeholder="Partner API Secret Key"
                        />
                      </div>
                    </div>
                  </div>
`;

file = file.replace(/(<label className="block text-sm font-bold text-gray-700">Sandbox Mode<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/, '$1' + newUI);

fs.writeFileSync('src/pages/admin/tabs/others/Settings.tsx', file);
