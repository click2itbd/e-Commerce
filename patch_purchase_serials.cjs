const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update backend handleCreatePurchase to handle array
content = content.replace(
  "const addedSerials = item.newSerials.split('\\n').map((s: string) => s.trim()).filter((s: string) => s);",
  "const addedSerials = Array.isArray(item.newSerials) ? item.newSerials.filter((s: string) => s.trim()) : item.newSerials.split('\\n').map((s: string) => s.trim()).filter((s: string) => s);"
);

// Update UI
const oldUI = `                              {item.hasSerialTracking && (
                                <tr className="bg-orange-50/50">
                                  <td colSpan={5} className="px-4 py-3">
                                    <label className="block text-[10px] font-bold text-orange-600 uppercase mb-1 flex items-center gap-1">
                                      <Ticket size={12} /> Scan/Enter Serials (1 per line)
                                    </label>
                                    <textarea
                                      value={item.newSerials || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const lines = val.split('\\n').filter(s => s.trim() !== '');
                                        // Update quantity based on lines
                                        const newQty = lines.length;
                                        const newData = { ...purchaseData };
                                        const iidx = newData.items.findIndex(i => i.id === item.id);
                                        if (iidx !== -1) {
                                          newData.items[iidx].newSerials = val;
                                          newData.items[iidx].quantity = newQty;
                                          setPurchaseData(newData);
                                        }
                                      }}
                                      className="w-full text-xs font-mono border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                                      rows={2}
                                      placeholder="Scan barcodes here..."
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1 mt-1">Quantity automatically updates based on number of serials: <strong>{item.quantity}</strong> detected.</p>
                                  </td>
                                </tr>
                              )}`;

const newUI = `                              {item.hasSerialTracking && (
                                <tr className="bg-orange-50/50">
                                  <td colSpan={5} className="px-4 py-3">
                                    <label className="block text-[10px] font-bold text-orange-600 uppercase mb-2 flex items-center gap-1">
                                      <Ticket size={12} /> Enter/Scan Serials for each unit
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {Array.from({ length: Math.max(1, item.quantity || 1) }).map((_, idx) => (
                                        <div key={idx} className="flex flex-col">
                                          <span className="text-[10px] text-orange-700 font-bold mb-0.5">Unit {idx + 1}</span>
                                          <input
                                            type="text"
                                            value={(Array.isArray(item.newSerials) ? item.newSerials[idx] : (item.newSerials?.split('\\n')[idx] || '')) || ''}
                                            onChange={(e) => {
                                              const newArr = Array.isArray(item.newSerials) ? [...item.newSerials] : (item.newSerials ? item.newSerials.split('\\n') : []);
                                              newArr[idx] = e.target.value;
                                              const newData = { ...purchaseData };
                                              const iidx = newData.items.findIndex(i => i.id === item.id);
                                              if (iidx !== -1) {
                                                newData.items[iidx].newSerials = newArr;
                                                setPurchaseData(newData);
                                              }
                                            }}
                                            className="w-full text-xs font-mono border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                                            placeholder="Scan barcode..."
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}`;

content = content.replace(oldUI, newUI);

// Make quantity editable again
const oldQty = "onChange={e => updatePurchaseItem(item.id, 'quantity', Number(e.target.value))}\n                                    className=\"w-20 text-xs border-gray-200 rounded-md\"\n                                    readOnly={item.hasSerialTracking}";
const newQty = "onChange={e => updatePurchaseItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}\n                                    className=\"w-20 text-xs border-gray-200 rounded-md\"";

content = content.replace(oldQty, newQty);

fs.writeFileSync(path, content, 'utf8');
console.log('Update purchase serial tracking UI complete');
