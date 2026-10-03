const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', 'utf8');

const target = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Document Type</label>`;

const replacement = `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Prepared By</label>
                <input
                  type="text"
                  placeholder="e.g. Fahad, Atik..."
                  value={saleData.createdBy || ''}
                  onChange={e => setSaleData({ ...saleData, createdBy: e.target.value })}
                  className="w-full border-gray-200 rounded text-xs focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Document Type</label>`;

if (code.includes('grid-cols-1 md:grid-cols-2 gap-4">')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/admin/tabs/sales/SalesForm.tsx', code, 'utf8');
    console.log("Updated SalesForm");
} else {
    console.log("SalesForm target not found!");
}
