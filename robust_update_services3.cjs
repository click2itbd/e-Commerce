const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

const editTrigger = 'title="Edit Service/Payment"';
const l2 = code.split('\n');
const editIdx = l2.findIndex(l => l.includes(editTrigger));

if (editIdx !== -1) {
  let endBtn = editIdx;
  while (!l2[endBtn].includes('</button>')) { endBtn++; }
  
  const delBtn = `                          <button onClick={() => handleDeleteService(record.id)} className="text-gray-500 hover:text-red-700 bg-gray-50 hover:bg-red-50 p-1.5 rounded shadow-sm transition-all" title="Delete Service">
                            <Trash2 size={14} />
                          </button>`;
  l2.splice(endBtn + 1, 0, delBtn);
  code = l2.join('\n');
  
  // also fix receivedAt in the edit button onClick
  code = code.replace(
    "setServiceFormData({...record,",
    "setServiceFormData({...record, receivedAt: record.receivedAt ? record.receivedAt.split('T')[0] : new Date().toISOString().split('T')[0],"
  );
  
  console.log("Edit button updated");
}

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
console.log("Written successfully");
