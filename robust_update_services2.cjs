const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

// Right Col injection
const rightColTrigger = '<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Charge</label>';
const lines = code.split('\n');
const rcIndex = lines.findIndex(l => l.includes(rightColTrigger));

if (rcIndex !== -1) {
  // Found Service Charge label at rcIndex
  // The input and closing div are on the next lines. Let's find the closing div of this block.
  // rcIndex - 1 is the <div> for Service charge
  // rcIndex + 7 is the </div> (approx)
  // Let's just search for the next </div> after input
  let endDiv = rcIndex;
  while (!lines[endDiv].includes('</div>')) { endDiv++; }
  
  const injectFields = `                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prepared By</label>
                    <input
                      type="text"
                      value={serviceFormData.preparedBy || ''}
                      onChange={e => setServiceFormData({ ...serviceFormData, preparedBy: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      placeholder="Staff name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      value={serviceFormData.receivedAt?.split('T')[0] || ''}
                      onChange={e => setServiceFormData({ ...serviceFormData, receivedAt: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>`;
  
  lines.splice(endDiv + 1, 0, injectFields);
  code = lines.join('\n');
  console.log("Right Col updated");
}

// Edit Button injection
const editTrigger = 'title="Edit Service"';
const l2 = code.split('\n');
const editIdx = l2.findIndex(l => l.includes(editTrigger));

if (editIdx !== -1) {
  // It's the <button ...> line
  // We need to inject the delete button after its closing </button>
  let endBtn = editIdx;
  while (!l2[endBtn].includes('</button>')) { endBtn++; }
  
  const delBtn = `                            <button onClick={() => handleDeleteService(record.id)} className="text-gray-400 hover:text-red-500 mx-1 p-1.5 transition-colors" title="Delete Service">
                              <Trash2 size={16} />
                            </button>`;
  l2.splice(endBtn + 1, 0, delBtn);
  code = l2.join('\n');
  
  // also fix receivedAt in the edit button onClick
  code = code.replace(
    "...defaultFormData,\n                                  ...record,\n                                });",
    "...defaultFormData,\n                                  ...record,\n                                  receivedAt: record.receivedAt ? record.receivedAt.split('T')[0] : new Date().toISOString().split('T')[0],\n                                });"
  );
  
  console.log("Edit button updated");
}

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
console.log("Written successfully");

