const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

const targetRegex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-3">\s*<div>\s*<label className="block font-bold text-gray-700 uppercase mb-1">\s*Supplier \/ Vendor <span className="text-red-500">\*<\/span>\s*<\/label>/s;

const replacement = `<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Prepared By (Staff)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fahad, Atik..."
                      value={purchaseForm.createdBy || ''}
                      onChange={e => setPurchaseForm({ ...purchaseForm, createdBy: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 font-bold text-gray-900 focus:ring-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Supplier / Vendor <span className="text-red-500">*</span>
                    </label>`;

if (code.match(targetRegex)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', code, 'utf8');
    console.log("Updated Purchases successfully");
} else {
    console.log("Regex did not match");
}
