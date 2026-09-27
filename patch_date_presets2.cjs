const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

const regex = /<button\s+onClick=\{handleExportFilteredOrders\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;

const quickFilters = `
      {/* Quick Date Presets */}
      <div className="px-6 mt-3 flex items-center gap-2 overflow-x-auto pb-2 shrink-0">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-2">Quick Dates:</span>
        <button onClick={() => {
          const d = new Date().toISOString().split('T')[0];
          setOrderStartDate(d); setOrderEndDate(d); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">Today</button>
        <button onClick={() => {
          const d = new Date(); d.setDate(d.getDate() - 1);
          const ds = d.toISOString().split('T')[0];
          setOrderStartDate(ds); setOrderEndDate(ds); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">Yesterday</button>
        <button onClick={() => {
          const end = new Date().toISOString().split('T')[0];
          const d = new Date(); d.setDate(d.getDate() - 7);
          const start = d.toISOString().split('T')[0];
          setOrderStartDate(start); setOrderEndDate(end); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">Last 7 Days</button>
        <button onClick={() => {
          const d = new Date();
          const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
          setOrderStartDate(start); setOrderEndDate(end); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">This Month</button>
        <button onClick={() => {
          setOrderStartDate(''); setOrderEndDate(''); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">Clear</button>
      </div>
`;

if (content.match(regex)) {
    const matched = content.match(regex)[0];
    content = content.replace(matched, matched + "\n" + quickFilters);
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
    console.log('Added quick date filters');
} else {
    console.log('Failed to match');
}