const fs = require('fs');
const lines = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8').split('\n');

// Insert after line 664 (index 663) - after the Service Charge closing </div>
const insertIdx = 664; // 0-indexed = line 665

const newLines = [
`                <div>`,
`                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Received By</label>`,
`                  <input`,
`                    type="text"`,
`                    placeholder="Staff name who received"`,
`                    value={(serviceFormData as any).receivedBy || ''}`,
`                    onChange={e => setServiceFormData({ ...serviceFormData, receivedBy: e.target.value } as any)}`,
`                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"`,
`                  />`,
`                </div>`,
];

lines.splice(insertIdx, 0, ...newLines);
fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', lines.join('\n'), 'utf8');
console.log("Inserted Received By field at line", insertIdx);
