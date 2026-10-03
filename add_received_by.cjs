const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

// 1. Add receivedBy to ServiceRecord interface
code = code.replace(
  'newSerialNumber?: string;',
  'newSerialNumber?: string;\n  receivedBy?: string;'
);

// 2. Add receivedBy to defaultFormData
code = code.replace(
  "paymentStatus: 'pending',\n        });",
  "paymentStatus: 'pending',\n          receivedBy: '',\n        });"
);

// 3. Add "Received By" input field BEFORE the Save/Cancel buttons (after Service Charge div)
const afterServiceCharge = `                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"`;
const withReceivedBy = `                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Received By</label>
                  <input
                    type="text"
                    placeholder="Staff name who received"
                    value={(serviceFormData as any).receivedBy || ''}
                    onChange={e => setServiceFormData({ ...serviceFormData, receivedBy: e.target.value } as any)}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"`;
code = code.replace(afterServiceCharge, withReceivedBy);

// 4. Add receivedBy to service receipt PDF table body
code = code.replace(
  "['5', 'Issue Description', record.issueDescription || 'N/A'],",
  "['5', 'Issue Description', record.issueDescription || 'N/A'],\n          ['6', 'Received By', (record as any).receivedBy || 'N/A'],"
);

fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code, 'utf8');
console.log("Added Received By field");
