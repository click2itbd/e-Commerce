const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', 'utf8');

const regex = /<input\s+type="number"\s+min="1"\s+value=\{Math\.max\(1, Math\.round\(\(formData\.warrantyMonths \|\| 0\) \/ 12\)\)\}\s+onChange=\{e => setFormData\(\{ \.\.\.formData, warrantyMonths: Math\.max\(1, Number\(e\.target\.value\)\) \* 12 \}\)\}\s+className="w-20 font-black text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"\s+\/>\s+<span className="text-xs font-bold text-slate-500 uppercase">Years<\/span>/m;

const replacement = `<input
                                  type="number"
                                  min="1"
                                  value={formData.warrantyMonths || 0}
                                  onChange={e => setFormData({ ...formData, warrantyMonths: Math.max(1, Number(e.target.value)) })}
                                  className="w-20 font-black text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"
                                />
                                <span className="text-xs font-bold text-slate-500 uppercase">Months</span>`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/pages/admin/tabs/inventory/Inventory.tsx', content, 'utf8');
  console.log("SUCCESS: Replaced Warranty with Months");
} else {
  console.log("FAILED to find Warranty input");
}
