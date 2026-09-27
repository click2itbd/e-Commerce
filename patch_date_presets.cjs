const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

// Inject date helper buttons
const filterEndRegex = /<button[\s\S]*?onClick=\{handleExportFilteredOrders\}[\s\S]*?<\/button>\n        <\/div>\n      <\/div>/;

const quickFilters = `
      {/* Quick Date Presets */}
      <div className="px-6 mt-2 flex items-center gap-2 overflow-x-auto pb-2 shrink-0">
        <span className="text-xs font-bold text-gray-400 uppercase mr-2">Quick Dates:</span>
        <button onClick={() => {
          const d = new Date().toISOString().split('T')[0];
          setOrderStartDate(d); setOrderEndDate(d); setCurrentPage(1);
        }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors">Today</button>
        <button onClick={() => {
          const d = new Date(); d.setDate(d.getDate() - 1);
          const ds = d.toISOString().split('T')[0];
          setOrderStartDate(ds); setOrderEndDate(ds); setCurrentPage(1);
        }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors">Yesterday</button>
        <button onClick={() => {
          const end = new Date().toISOString().split('T')[0];
          const d = new Date(); d.setDate(d.getDate() - 7);
          const start = d.toISOString().split('T')[0];
          setOrderStartDate(start); setOrderEndDate(end); setCurrentPage(1);
        }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors">Last 7 Days</button>
        <button onClick={() => {
          const d = new Date();
          const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
          setOrderStartDate(start); setOrderEndDate(end); setCurrentPage(1);
        }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors">This Month</button>
        <button onClick={() => {
          setOrderStartDate(''); setOrderEndDate(''); setCurrentPage(1);
        }} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-md transition-colors">Clear</button>
      </div>
`;

if (content.match(filterEndRegex)) {
    const matched = content.match(filterEndRegex)[0];
    content = content.replace(matched, matched + "\n" + quickFilters);
    fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
    console.log('Added quick date filters');
} else {
    console.log('Failed to find filter end');
}