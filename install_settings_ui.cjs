const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const [settingsTab, setSettingsTab]')) {
  content = content.replace(
    "const [activeTab, setActiveTab]",
    "const [settingsTab, setSettingsTab] = useState<'business' | 'pos' | 'tax' | 'invoice' | 'zatca' | 'email' | 'sms' | 'whatsapp' | 'whitelabel' | 'pwa'>('business');\n  const [activeTab, setActiveTab]"
  );
}

const newSettingsUI = `
        ) : activeTab === 'settings' && isAdmin ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Setting List Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-[#7B61FF] text-white">
                  <h3 className="font-bold">Setting List</h3>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { id: 'business', icon: Briefcase, label: 'Business Setting' },
                    { id: 'pos', icon: ShoppingCart, label: 'POS Setting' },
                    { id: 'tax', icon: Percent, label: 'Tax Setting' },
                    { id: 'invoice', icon: FileText, label: 'Invoice Setting' },
                    { id: 'zatca', icon: FileText, label: 'Zatca Setting' },
                    { id: 'email', icon: Mail, label: 'Email Setting' },
                    { id: 'sms', icon: Mail, label: 'SMS Setting' },
                    { id: 'whatsapp', icon: Mail, label: 'Whatsapp Setting' },
                    { id: 'whitelabel', icon: Settings, label: 'Whitelabel Setting' },
                    { id: 'pwa', icon: Settings, label: 'PWA Setting' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id as any)}
                      className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors \${settingsTab === tab.id ? "bg-[#7B61FF] text-white font-bold" : "text-gray-600 hover:bg-gray-50"}\`}
                    >
                      <tab.icon size={16} /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Setting Content */}
            <div className="flex-1 space-y-6">
              <form onSubmit={handleSaveSettings}>
                {settingsTab === 'business' ? (
                  <>
                    {/* Business Setting Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700">Business Setting</h3>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Business Name <span className="text-red-500">*</span></label>
                          <input type="text" value={settingsFormData.businessName || ''} onChange={e => setSettingsFormData({...settingsFormData, businessName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="Computer Zone" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Address <span className="text-red-500">*</span></label>
                          <textarea rows={1} value={settingsFormData.address || ''} onChange={e => setSettingsFormData({...settingsFormData, address: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="1100 Edinger Ave, Tustin, CA 92780"></textarea>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Website</label>
                          <div className="flex">
                            <input type="text" value={settingsFormData.website || ''} onChange={e => setSettingsFormData({...settingsFormData, website: e.target.value})} className="flex-1 text-sm border-gray-200 rounded-l-md focus:ring-[#7B61FF]" placeholder="Enter Website" />
                            <span className="bg-[#7B61FF] text-white px-3 flex items-center justify-center rounded-r-md"><Settings size={16}/></span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Email <span className="text-red-500">*</span></label>
                          <input type="email" value={settingsFormData.contactEmail || ''} onChange={e => setSettingsFormData({...settingsFormData, contactEmail: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="info@computerzone.com" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Phone <span className="text-red-500">*</span></label>
                          <input type="text" value={settingsFormData.contactPhone || ''} onChange={e => setSettingsFormData({...settingsFormData, contactPhone: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="(210) 224-13135" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Date Format <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.dateFormat || 'm/d/Y'} onChange={e => setSettingsFormData({...settingsFormData, dateFormat: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="m/d/Y">m/d/Y</option>
                            <option value="d/m/Y">d/m/Y</option>
                            <option value="Y-m-d">Y-m-d</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Zone Name <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.zoneName || 'Asia/Dhaka'} onChange={e => setSettingsFormData({...settingsFormData, zoneName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Asia/Dhaka">Asia/Dhaka</option>
                            <option value="America/Los_Angeles">America/Los_Angeles</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Currency <span className="text-red-500">*</span></label>
                          <input type="text" value={settingsFormData.currency || 'Tk.'} onChange={e => setSettingsFormData({...settingsFormData, currency: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Currency Position <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.currencyPosition || 'Before Amount'} onChange={e => setSettingsFormData({...settingsFormData, currencyPosition: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Before Amount">Before Amount</option>
                            <option value="After Amount">After Amount</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Precision</label>
                          <select value={settingsFormData.precision || '2 Digit'} onChange={e => setSettingsFormData({...settingsFormData, precision: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="2 Digit">2 Digit</option>
                            <option value="0 Digit">0 Digit</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Thousand Separator</label>
                          <select value={settingsFormData.thousandSeparator || 'Select Thousand Separator'} onChange={e => setSettingsFormData({...settingsFormData, thousandSeparator: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Select Thousand Separator">Select Thousand Separator</option>
                            <option value="Comma (,)">Comma (,)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Decimal Separator <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.decimalSeparator || 'Dot (.)'} onChange={e => setSettingsFormData({...settingsFormData, decimalSeparator: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Dot (.)">Dot (.)</option>
                            <option value="Comma (,)">Comma (,)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Installment Days <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.installmentDays || '3 Days'} onChange={e => setSettingsFormData({...settingsFormData, installmentDays: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="3 Days">3 Days</option>
                            <option value="7 Days">7 Days</option>
                            <option value="30 Days">30 Days</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">E-Commerce Checker <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.ecommerceChecker || 'No'} onChange={e => setSettingsFormData({...settingsFormData, ecommerceChecker: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Item Setting Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700">Item Setting</h3>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Is Loyalty Enable <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.isLoyaltyEnable || 'Enable'} onChange={e => setSettingsFormData({...settingsFormData, isLoyaltyEnable: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Enable">Enable</option>
                            <option value="Disable">Disable</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Minimum Point To Redeem <span className="text-red-500">*</span></label>
                          <input type="number" value={settingsFormData.minimumPointToRedeem || 40} onChange={e => setSettingsFormData({...settingsFormData, minimumPointToRedeem: Number(e.target.value)})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Loyalty Rate <span className="text-red-500">*</span></label>
                          <input type="number" step="0.1" value={settingsFormData.loyaltyRate || 0.1} onChange={e => setSettingsFormData({...settingsFormData, loyaltyRate: Number(e.target.value)})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Product Code Start From <span className="text-red-500">*</span></label>
                          <input type="text" value={settingsFormData.productCodeStartFrom || '000001'} onChange={e => setSettingsFormData({...settingsFormData, productCodeStartFrom: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                      </div>
                    </div>
                  </>
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
                )}
                
                <div className="flex justify-end gap-2 mt-4 pb-12">
                   <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#7B61FF] text-white rounded-md font-bold hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {loading ? 'Saving...' : <><CheckSquare size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
`;

content = content.replace(
  /\) : activeTab === 'settings' && isAdmin \? \([\s\S]*?<\/div>\s*<\/div>\s*\)\s*:\s*activeTab === 'services'/,
  newSettingsUI.trim() + "\n        ) : activeTab === 'services'"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Settings successfully replaced.');
