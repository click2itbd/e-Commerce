const fs = require('fs');

const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf-8');

const targetStr = `                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700 capitalize">{settingsTab.replace(/([A-Z])/g, ' $1').trim()} Setting</h3>
                    </div>
                    <div className="p-6 text-center py-12 text-gray-400">
                      <Settings size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-bold text-lg capitalize">{settingsTab.replace(/([A-Z])/g, ' $1').trim()} Module</p>
                      <p className="text-sm">Configuring options for {settingsTab} are under development.</p>
                    </div>
                  </div>
                )}`;

const replacementStr = `                ) : settingsTab === 'pos' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">POS Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">POS Fast Mode Enable</label>
                        <select value={settingsFormData.posFastMode || 'No'} onChange={e => setSettingsFormData({...settingsFormData, posFastMode: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Receipt Printer Type</label>
                        <select value={settingsFormData.receiptPrinterType || 'Thermal'} onChange={e => setSettingsFormData({...settingsFormData, receiptPrinterType: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="Thermal">Thermal Printer</option>
                          <option value="A4">A4 Printer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'tax' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Tax Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Default Tax Rate (%)</label>
                        <input type="number" step="0.01" value={settingsFormData.defaultTaxRate || 0} onChange={e => setSettingsFormData({...settingsFormData, defaultTaxRate: Number(e.target.value)})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tax Name</label>
                        <input type="text" value={settingsFormData.taxName || 'VAT'} onChange={e => setSettingsFormData({...settingsFormData, taxName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="e.g. VAT" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">VAT Number</label>
                        <input type="text" value={settingsFormData.vatNumber || ''} onChange={e => setSettingsFormData({...settingsFormData, vatNumber: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'invoice' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Invoice Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Invoice Prefix</label>
                        <input type="text" value={settingsFormData.invoicePrefix || 'INV-'} onChange={e => setSettingsFormData({...settingsFormData, invoicePrefix: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Invoice Terms & Conditions</label>
                        <textarea rows={4} value={settingsFormData.invoiceTerms || ''} onChange={e => setSettingsFormData({...settingsFormData, invoiceTerms: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"></textarea>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'zatca' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Zatca Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ZATCA e-Invoicing Enable</label>
                        <select value={settingsFormData.zatcaEnable || 'No'} onChange={e => setSettingsFormData({...settingsFormData, zatcaEnable: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ZATCA Phase</label>
                        <select value={settingsFormData.zatcaPhase || '1'} onChange={e => setSettingsFormData({...settingsFormData, zatcaPhase: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="1">Phase 1</option>
                          <option value="2">Phase 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Commercial Registration Number (CRN)</label>
                        <input type="text" value={settingsFormData.zatcaCrn || ''} onChange={e => setSettingsFormData({...settingsFormData, zatcaCrn: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'email' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Email Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Driver</label>
                        <input type="text" value={settingsFormData.mailDriver || 'smtp'} onChange={e => setSettingsFormData({...settingsFormData, mailDriver: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Host</label>
                        <input type="text" value={settingsFormData.mailHost || ''} onChange={e => setSettingsFormData({...settingsFormData, mailHost: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="smtp.gmail.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Port</label>
                        <input type="text" value={settingsFormData.mailPort || '587'} onChange={e => setSettingsFormData({...settingsFormData, mailPort: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Username</label>
                        <input type="text" value={settingsFormData.mailUsername || ''} onChange={e => setSettingsFormData({...settingsFormData, mailUsername: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Password</label>
                        <input type="password" value={settingsFormData.mailPassword || ''} onChange={e => setSettingsFormData({...settingsFormData, mailPassword: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Encryption</label>
                        <select value={settingsFormData.mailEncryption || 'tls'} onChange={e => setSettingsFormData({...settingsFormData, mailEncryption: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'sms' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">SMS Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">SMS API URL</label>
                        <input type="text" value={settingsFormData.smsApiUrl || ''} onChange={e => setSettingsFormData({...settingsFormData, smsApiUrl: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">SMS API Key</label>
                        <input type="text" value={settingsFormData.smsApiKey || ''} onChange={e => setSettingsFormData({...settingsFormData, smsApiKey: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Sender ID</label>
                        <input type="text" value={settingsFormData.smsSenderId || ''} onChange={e => setSettingsFormData({...settingsFormData, smsSenderId: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'whatsapp' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Whatsapp Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Whatsapp API URL</label>
                        <input type="text" value={settingsFormData.whatsappApiUrl || ''} onChange={e => setSettingsFormData({...settingsFormData, whatsappApiUrl: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Whatsapp Access Token</label>
                        <input type="password" value={settingsFormData.whatsappAccessToken || ''} onChange={e => setSettingsFormData({...settingsFormData, whatsappAccessToken: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'whitelabel' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Whitelabel Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Application Name <span className="text-red-500">*</span></label>
                        <input type="text" value={settingsFormData.brandName || ''} onChange={e => setSettingsFormData({...settingsFormData, brandName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="My Business App" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Logo URL</label>
                        <input type="text" value={settingsFormData.logoUrl || ''} onChange={e => setSettingsFormData({...settingsFormData, logoUrl: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="https://example.com/logo.png" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Primary Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={settingsFormData.primaryColor || '#7B61FF'} onChange={e => setSettingsFormData({...settingsFormData, primaryColor: e.target.value})} className="h-9 p-1 w-12 border-gray-200 rounded-md" />
                          <input type="text" value={settingsFormData.primaryColor || '#7B61FF'} onChange={e => setSettingsFormData({...settingsFormData, primaryColor: e.target.value})} className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'pwa' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">PWA Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Enable PWA</label>
                        <select value={settingsFormData.pwaEnable || 'No'} onChange={e => setSettingsFormData({...settingsFormData, pwaEnable: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">App Name</label>
                        <input type="text" value={settingsFormData.pwaAppName || ''} onChange={e => setSettingsFormData({...settingsFormData, pwaAppName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Short Name</label>
                        <input type="text" value={settingsFormData.pwaShortName || ''} onChange={e => setSettingsFormData({...settingsFormData, pwaShortName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Theme Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={settingsFormData.pwaThemeColor || '#ffffff'} onChange={e => setSettingsFormData({...settingsFormData, pwaThemeColor: e.target.value})} className="h-9 p-1 w-12 border-gray-200 rounded-md" />
                          <input type="text" value={settingsFormData.pwaThemeColor || '#ffffff'} onChange={e => setSettingsFormData({...settingsFormData, pwaThemeColor: e.target.value})} className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Background Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={settingsFormData.pwaBackgroundColor || '#ffffff'} onChange={e => setSettingsFormData({...settingsFormData, pwaBackgroundColor: e.target.value})} className="h-9 p-1 w-12 border-gray-200 rounded-md" />
                          <input type="text" value={settingsFormData.pwaBackgroundColor || '#ffffff'} onChange={e => setSettingsFormData({...settingsFormData, pwaBackgroundColor: e.target.value})} className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700 capitalize">{settingsTab.replace(/([A-Z])/g, ' $1').trim()} Setting</h3>
                    </div>
                    <div className="p-6 text-center py-12 text-gray-400">
                      <Settings size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-bold text-lg capitalize">{settingsTab.replace(/([A-Z])/g, ' $1').trim()} Module</p>
                      <p className="text-sm">Configuring options for {settingsTab} are under development.</p>
                    </div>
                  </div>
                )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(path, content, 'utf-8');
  console.log('Successfully updated settings fields');
} else {
  console.log('Could not find target string to replace.');
}
