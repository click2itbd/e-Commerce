const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

// 1. Add service presets state and updateItemName function area - add after useState declarations
const stateInsertAfter = `  const [showPCBuilderModal, setShowPCBuilderModal] = useState(false);`;
const newState = `  const [showPCBuilderModal, setShowPCBuilderModal] = useState(false);
  const [servicePresets, setServicePresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('service_presets');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      'Motherboard Problem Fix',
      'Power Supply Fix',
      'Screen / Display Repair',
      'Keyboard Repair',
      'OS Installation / Reinstall',
      'Data Recovery',
      'Cooling Fan Replacement',
      'RAM Upgrade',
      'Battery Replacement',
      'Charging Port Fix',
      'Virus Removal',
      'Repair / Servicing',
    ];
  });
  const [editingPresets, setEditingPresets] = useState(false);
  const [newPresetText, setNewPresetText] = useState('');`;

code = code.replace(stateInsertAfter, newState);

// 2. Replace the simple text input with dropdown + editable
const oldServiceInput = `                              <div className="flex flex-col gap-1 w-full max-w-sm mb-1">
                                <label className="text-[10px] uppercase font-bold text-indigo-500">Service Description</label>
                                <input 
                                  type="text" 
                                  value={item.name} 
                                  onChange={e => updateItemName(item.id, e.target.value)}
                                  placeholder="e.g. OS Installation, Keyboard Repair..."
                                  className="w-full border border-indigo-200 bg-indigo-50/30 rounded py-1 px-2 font-semibold text-xs focus:ring-indigo-500"
                                />
                              </div>`;

const newServiceInput = `                              <div className="flex flex-col gap-1 w-full mb-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <label className="text-[10px] uppercase font-bold text-indigo-500">Service Description</label>
                                  <button type="button" onClick={() => setEditingPresets(ep => !ep)} className="text-[9px] text-indigo-400 hover:text-indigo-600 underline">{editingPresets ? 'Done' : 'Edit Options'}</button>
                                </div>
                                <div className="flex gap-1">
                                  <select
                                    value={servicePresets.includes(item.name) ? item.name : '__custom__'}
                                    onChange={e => {
                                      if (e.target.value !== '__custom__') updateItemName(item.id, e.target.value);
                                    }}
                                    className="border border-indigo-200 bg-indigo-50/30 rounded py-1 px-2 font-semibold text-xs focus:ring-indigo-500 flex-1"
                                  >
                                    {servicePresets.map(p => <option key={p} value={p}>{p}</option>)}
                                    {!servicePresets.includes(item.name) && <option value="__custom__">{item.name || 'Custom...'}</option>}
                                  </select>
                                </div>
                                <input 
                                  type="text" 
                                  value={item.name} 
                                  onChange={e => updateItemName(item.id, e.target.value)}
                                  placeholder="Or type custom description..."
                                  className="w-full border border-indigo-100 bg-white rounded py-1 px-2 text-xs text-gray-600 focus:ring-indigo-500 mt-1"
                                />
                                {editingPresets && (
                                  <div className="mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200 space-y-1">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase">Manage Presets</p>
                                    {servicePresets.map((p, pi) => (
                                      <div key={pi} className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={p}
                                          onChange={e => {
                                            const updated = [...servicePresets];
                                            updated[pi] = e.target.value;
                                            setServicePresets(updated);
                                            localStorage.setItem('service_presets', JSON.stringify(updated));
                                          }}
                                          className="flex-1 border border-indigo-200 rounded px-2 py-0.5 text-xs"
                                        />
                                        <button type="button" onClick={() => {
                                          const updated = servicePresets.filter((_, i) => i !== pi);
                                          setServicePresets(updated);
                                          localStorage.setItem('service_presets', JSON.stringify(updated));
                                        }} className="text-red-400 hover:text-red-600 text-xs px-1">?</button>
                                      </div>
                                    ))}
                                    <div className="flex gap-1 mt-1">
                                      <input
                                        type="text"
                                        value={newPresetText}
                                        onChange={e => setNewPresetText(e.target.value)}
                                        placeholder="Add new option..."
                                        className="flex-1 border border-indigo-300 rounded px-2 py-0.5 text-xs"
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' && newPresetText.trim()) {
                                            const updated = [...servicePresets, newPresetText.trim()];
                                            setServicePresets(updated);
                                            localStorage.setItem('service_presets', JSON.stringify(updated));
                                            setNewPresetText('');
                                          }
                                        }}
                                      />
                                      <button type="button" onClick={() => {
                                        if (newPresetText.trim()) {
                                          const updated = [...servicePresets, newPresetText.trim()];
                                          setServicePresets(updated);
                                          localStorage.setItem('service_presets', JSON.stringify(updated));
                                          setNewPresetText('');
                                        }
                                      }} className="bg-indigo-600 text-white rounded px-2 py-0.5 text-xs">+ Add</button>
                                    </div>
                                  </div>
                                )}
                              </div>`;

code = code.replace(oldServiceInput, newServiceInput);

fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
console.log("Added service presets dropdown to SalesForm.tsx");
