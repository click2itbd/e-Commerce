const fs = require('fs');

let inv = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', 'utf8');

const descriptionEnd = `</textarea>
                  </div>`;

const newAttributesBlock = `</textarea>
                  </div>
                  
                  {/* Attributes / Specifications for Filtering */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="block text-sm font-bold text-gray-700">Product Attributes (Filters)</label>
                        <p className="text-[10px] text-gray-500">e.g. Color, RAM, Storage (Used for shop filters)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = { ...(formData.specs || {}) };
                          // Ensure unique key if "New Attribute" exists
                          let keyName = "New Attribute";
                          let counter = 1;
                          while(newSpecs[keyName]) {
                              keyName = "New Attribute " + counter;
                              counter++;
                          }
                          newSpecs[keyName] = '';
                          setFormData({ ...formData, specs: newSpecs });
                        }}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium hover:bg-blue-100 transition-colors border border-blue-100"
                      >
                        + Add Attribute
                      </button>
                    </div>
                    
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {Object.keys(formData.specs || {}).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4 font-medium">No attributes added yet.<br/>Add attributes like "Color", "RAM" to enable filtering.</p>
                      ) : (
                        Object.entries(formData.specs || {}).map(([key, value], index) => (
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
                              className="px-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>`;

if (!inv.includes('Product Attributes (Filters)')) {
  inv = inv.replace(descriptionEnd, newAttributesBlock);
  fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceInventory.tsx', inv, 'utf8');
  console.log('Added Attributes section successfully!');
} else {
  console.log('Attributes section already exists.');
}