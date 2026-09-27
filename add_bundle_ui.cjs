const fs = require('fs');

let inv = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');

const bundleToggle = `
                    <label className="flex items-center gap-2 text-sm font-bold text-purple-700 cursor-pointer bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                      <input type="checkbox" checked={formData.isBundle || false} onChange={e => setFormData({...formData, isBundle: e.target.checked})} className="rounded border-purple-300 text-purple-600 focus:ring-purple-500" />
                      Is Bundle Product
                    </label>
`;

const replacePoint = `<label className="flex items-center gap-2 text-sm font-bold text-red-700 cursor-pointer bg-red-50 
px-3 py-2 rounded-lg border border-red-200">`;

if (!inv.includes('Is Bundle Product')) {
    inv = inv.replace(replacePoint, bundleToggle + replacePoint);
}

const fbtBundleUI = `
                  {/* Bundle & FBT Section */}
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3">Offers & Linking</h3>
                    
                    {formData.isBundle && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                        <label className="block text-sm font-bold text-purple-800 mb-2">Bundle Items (Select products included in this bundle)</label>
                        <div className="max-h-40 overflow-y-auto space-y-2 bg-white p-2 rounded border border-purple-100">
                          {products.filter(p => p.id !== formData.id && !p.isBundle).map(p => (
                            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input 
                                type="checkbox" 
                                checked={(formData.bundleItems || []).some(bi => bi.productId === p.id)}
                                onChange={(e) => {
                                  const current = formData.bundleItems || [];
                                  if (e.target.checked) {
                                    setFormData({...formData, bundleItems: [...current, { productId: p.id, quantity: 1 }]});
                                  } else {
                                    setFormData({...formData, bundleItems: current.filter(bi => bi.productId !== p.id)});
                                  }
                                }}
                              />
                              <img src={p.images[0]} className="w-6 h-6 rounded object-cover" />
                              <span className="truncate">{p.name}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-purple-600 mt-2">When this bundle is ordered, stock will be deducted from these individual items.</p>
                      </div>
                    )}
                    
                    {!formData.isBundle && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-bold text-blue-800">Frequently Bought Together (FBT)</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600">Combo Discount (Tk):</span>
                            <input type="number" value={formData.fbtDiscount || 0} onChange={e => setFormData({...formData, fbtDiscount: Number(e.target.value)})} className="w-20 px-2 py-1 text-sm rounded border border-blue-200" />
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 bg-white p-2 rounded border border-blue-100">
                          {products.filter(p => p.id !== formData.id && !p.isBundle).map(p => (
                            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input 
                                type="checkbox" 
                                checked={(formData.fbtProducts || []).includes(p.id)}
                                onChange={(e) => {
                                  const current = formData.fbtProducts || [];
                                  if (e.target.checked) {
                                    setFormData({...formData, fbtProducts: [...current, p.id]});
                                  } else {
                                    setFormData({...formData, fbtProducts: current.filter(id => id !== p.id)});
                                  }
                                }}
                              />
                              <img src={p.images[0]} className="w-6 h-6 rounded object-cover" />
                              <span className="truncate">{p.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
`;

const descriptionUIEnd = `</textarea>
                  </div>`;
                  
if (!inv.includes('Frequently Bought Together (FBT)')) {
    // Inject right after Description text area
    inv = inv.replace(descriptionUIEnd, descriptionUIEnd + fbtBundleUI);
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', inv, 'utf8');
    console.log('Added FBT and Bundle UI to Inventory');
}