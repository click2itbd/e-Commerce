const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const btnToRemove = `<button onClick={() => setActiveTab('internal_notes')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'internal_notes' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                  <MessageSquare size={16} className={activeTab === 'internal_notes' ? "text-blue-600" : "text-gray-400"} /> Staff Notes
                </button>\n                `;

content = content.replace(btnToRemove, '');

const targetToInsert = `<div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Accounting</div>`;

const btnToInsert = `<div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Accounting</div>
              <button onClick={() => setActiveTab('internal_notes')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'internal_notes' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                <MessageSquare size={16} className={activeTab === 'internal_notes' ? "text-blue-600" : "text-gray-400"} /> Staff Notes
              </button>`;

content = content.replace(targetToInsert, btnToInsert);

fs.writeFileSync(file, content, 'utf8');
console.log('Moved Staff Notes to Accounting');
