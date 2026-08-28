const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add hosting_support_tickets to the union type
content = content.replace(`'tasks' | 'support_tickets'>`, `'tasks' | 'support_tickets' | 'hosting_support_tickets'>`);

// Add the button
const targetBtn = `                  <button
                    onClick={() => setActiveTab('support_tickets')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      activeTab === 'support_tickets' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <LifeBuoy size={16} className={activeTab === 'support_tickets' ? "text-blue-600" : "text-gray-400"} />
                    <span>Support Tickets</span>
                  </button>`;

const newBtn = `                  <button
                    onClick={() => setActiveTab('support_tickets')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      activeTab === 'support_tickets' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <LifeBuoy size={16} className={activeTab === 'support_tickets' ? "text-blue-600" : "text-gray-400"} />
                    <span>Store Support Tickets</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('hosting_support_tickets')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      activeTab === 'hosting_support_tickets' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <LifeBuoy size={16} className={activeTab === 'hosting_support_tickets' ? "text-blue-600" : "text-gray-400"} />
                    <span>Hosting Support Tickets</span>
                  </button>`;

content = content.replace(targetBtn, newBtn);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed hosting support ticket button');
