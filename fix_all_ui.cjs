const fs = require('fs');
let inv = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');

const injection = `
                  <div className="col-span-2 pt-4 mt-4 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3">Product Attributes (Filters)</h3>
                    <p className="text-[10px] text-gray-500 mb-2">e.g. Color, RAM, Storage (Used for shop filters)</p>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = { ...(formData.specs || {}) };
                          let keyName = "New Attribute";
                          let counter = 1;
                          while(newSpecs[keyName]) {
                              keyName = "New Attribute " + counter;
                              counter++;
                          }
                          newSpecs[keyName] = '';
                          setFormData({ ...formData, specs: newSpecs });
                        }}
                        className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded font-bold hover:bg-blue-50 border border-blue-100 transition-colors mb-3 shadow-sm inline-block"
                      >
                        + Add Attribute
                      </button>
                      
                      {Object.keys(formData.specs || {}).length === 0 ? (
                        <p className="text-xs text-gray-400 font-medium">No attributes added yet.</p>
                      ) : (
                        <div className="space-y-2">
                        {Object.entries(formData.specs || {}).map(([key, value], index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Name (e.g. Color)"
                              value={key}
                              onChange={e => {
                                const newSpecs = { ...formData.specs };
                                const val = newSpecs[key];
                                delete newSpecs[key];
                                newSpecs[e.target.value] = val;
                                setFormData({ ...formData, specs: newSpecs });
                              }}
                              className="w-1/3 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 font-bold text-gray-700"
                            />
                            <input
                              type="text"
                              placeholder="Value (e.g. Black)"
                              value={value}
                              onChange={e => {
                                const newSpecs = { ...formData.specs };
                                newSpecs[key] = e.target.value;
                                setFormData({ ...formData, specs: newSpecs });
                              }}
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSpecs = { ...formData.specs };
                                delete newSpecs[key];
                                setFormData({ ...formData, specs: newSpecs });
                              }}
                              className="px-2 text-red-400 hover:text-red-600 transition-colors"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 pt-4 mt-2 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3">Offers & Linking (FBT / Bundle)</h3>
                    
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 text-sm font-bold text-purple-700 cursor-pointer bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                        <input type="checkbox" checked={formData.isBundle || false} onChange={e => setFormData({...formData, isBundle: e.target.checked})} className="rounded border-purple-300 text-purple-600 focus:ring-purple-500" />
                        Is Dedicated Bundle Product
                      </label>
                    </div>

                    {formData.isBundle && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                        <label className="block text-sm font-bold text-purple-800 mb-2">Bundle Items</label>
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
                              <img src={p.images?.[0]} className="w-6 h-6 rounded object-cover" />
                              <span className="truncate">{p.name}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-purple-600 mt-2 font-bold">When this bundle is ordered, stock will be deducted from these individual items.</p>
                      </div>
                    )}
                    
                    {!formData.isBundle && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-bold text-blue-800">Frequently Bought Together (FBT)</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 font-bold">Combo Discount (Tk):</span>
                            <input type="number" value={formData.fbtDiscount || 0} onChange={e => setFormData({...formData, fbtDiscount: Number(e.target.value)})} className="w-24 px-2 py-1 text-sm rounded border border-blue-200 focus:ring-1 focus:ring-blue-500" />
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
                              <img src={p.images?.[0]} className="w-6 h-6 rounded object-cover" />
                              <span className="truncate">{p.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
`;

if (!inv.includes('Offers & Linking')) {
    inv = inv.replace('              </form>', injection + '\n              </form>');
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', inv, 'utf8');
    console.log('Successfully injected UI before </form>');
}