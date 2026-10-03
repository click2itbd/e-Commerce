const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', 'utf8');

const target = `<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Supplier / Vendor <span className="text-red-500">*</span>
                    </label>`;

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

if (code.includes('grid-cols-1 md:grid-cols-3 gap-3">')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/admin/tabs/purchase/Purchases.tsx', code, 'utf8');
    console.log("Updated Purchases");
} else {
    console.log("Purchases target not found!");
}
