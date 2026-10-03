const fs = require('fs');
let lines = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8').split('\n');

// Insert after line 980 (index 979)
const insertAfter = 979; // 0-indexed
const deleteBtn = `                          <button onClick={() => handleDeleteService(record.id)} className="text-gray-500 hover:text-red-700 bg-gray-50 hover:bg-red-50 p-1.5 rounded shadow-sm transition-all" title="Delete Service Record">\r
                            <Trash2 size={14} />\r
                          </button>`;

lines.splice(insertAfter + 1, 0, deleteBtn);

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', lines.join('\n'), 'utf8');
console.log("Inserted delete button at line", insertAfter + 1);
