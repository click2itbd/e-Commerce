const fs = require('fs');

function updateFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const nl = c.includes('\r\n') ? '\r\n' : '\n';
  c = c.replace(/\r\n/g, '\n');

  // Change input to textarea and update logic
  const oldUI = `<div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 mt-2">
                          <label className="block text-[11px] font-bold text-blue-800 mb-1.5 uppercase">Quick Add Specs (Comma Separated)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={bulkSpecInput}
                              onChange={e => setBulkSpecInput(e.target.value)}
                              placeholder="e.g. Processor, RAM, Storage, Warranty"
                              className="flex-1 px-3 py-1.5 border border-blue-200 rounded-md focus:ring-blue-500 text-sm bg-white"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const items = bulkSpecInput.split(',').map(s => s.trim()).filter(s => s);
                                  if (items.length > 0) {
                                    const newSpecs = { ...(formData.specs || {}) };
                                    items.forEach(item => {
                                      if (!newSpecs[item]) newSpecs[item] = '';
                                    });
                                    setFormData({ ...formData, specs: newSpecs });
                                    setBulkSpecInput('');
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const items = bulkSpecInput.split(',').map(s => s.trim()).filter(s => s);
                                if (items.length > 0) {
                                  const newSpecs = { ...(formData.specs || {}) };
                                  items.forEach(item => {
                                    if (!newSpecs[item]) newSpecs[item] = '';
                                  });
                                  setFormData({ ...formData, specs: newSpecs });
                                  setBulkSpecInput('');
                                }
                              }}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-md font-bold text-xs hover:bg-blue-700"
                            >
                              Add Fields
                            </button>
                          </div>
                        </div>`;

  const processLogic = `
    // Split by newline or comma
    const items = bulkSpecInput.split(/[\\n,]+/).map(s => s.trim()).filter(s => s);
    if (items.length > 0) {
      const newSpecs = { ...(formData.specs || {}) };
      items.forEach(item => {
        // Try to split by colon, dash, or equals to extract Key and Value
        const match = item.match(/^(.*?)\\s*[:\\-=]\\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          const val = match[2].trim();
          newSpecs[key] = val; // Always overwrite if they pasted a value
        } else {
          // No value found, just create the field if it doesn't exist
          if (newSpecs[item] === undefined) newSpecs[item] = '';
        }
      });
      setFormData({ ...formData, specs: newSpecs });
      setBulkSpecInput('');
    }
  `;

  const newUI = `<div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 mt-2">
                          <label className="block text-[11px] font-bold text-blue-800 mb-1.5 uppercase">Quick Paste Specs (Key: Value)</label>
                          <div className="flex gap-2 items-start">
                            <textarea 
                              value={bulkSpecInput}
                              onChange={e => setBulkSpecInput(e.target.value)}
                              placeholder="e.g. Processor: Intel i5\nRAM: 16GB\nStorage: 512GB SSD"
                              className="flex-1 px-3 py-2 border border-blue-200 rounded-md focus:ring-blue-500 text-sm bg-white min-h-[60px]"
                            />
                            <button
                              type="button"
                              onClick={() => {${processLogic}}}
                              className="bg-blue-600 text-white px-3 py-2 rounded-md font-bold text-xs hover:bg-blue-700 h-[60px]"
                            >
                              Add Fields
                            </button>
                          </div>
                        </div>`;

  if (c.includes(oldUI)) {
    c = c.replace(oldUI, newUI);
    fs.writeFileSync(filePath, c.replace(/\n/g, nl));
    console.log('Successfully updated ' + filePath);
  } else {
    console.log('Regex failed in ' + filePath);
  }
}

updateFile('src/pages/admin/tabs/inventory/Inventory.tsx');
updateFile('src/pages/ecommerceDashboard/EcommerceInventory.tsx');