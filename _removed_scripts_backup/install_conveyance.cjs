const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const strState = `  const [conveyances, setConveyances] = useState<{id: string, date: string, description: string, amount: number, employee: string}[]>([]);
  const [isAddingConveyance, setIsAddingConveyance] = useState(false);
  const [newConveyance, setNewConveyance] = useState({date: new Date().toISOString().split('T')[0], description: '', amount: 0, employee: ''});`;

if (!content.includes('const [conveyances, setConveyances] = useState')) {
  content = content.replace(
    "const [users, setUsers] = useState<UserProfile[]>([]);",
    strState + "\n  const [users, setUsers] = useState<UserProfile[]>([]);"
  );
}

const strFunc = `
  const handleSaveConveyance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConveyance.description || newConveyance.amount <= 0) return;
    const c = { id: Date.now().toString(), ...newConveyance };
    const updated = [...conveyances, c];
    setConveyances(updated);
    setIsAddingConveyance(false);
    toast.success('Conveyance added successfully');
  };
`;

if (!content.includes('handleSaveConveyance')) {
  // append after a known function
  content = content.replace(
    "const handleSaveManualTransaction = (e: React.FormEvent) => {",
    strFunc + "\n  const handleSaveManualTransaction = (e: React.FormEvent) => {"
  );
}

const conveyanceUI = `
        ) : activeTab === 'conveyance' && isAdmin ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck className="text-[#EF4444]" /> Employee Transport Conveyance
              </h2>
              <button
                onClick={() => setIsAddingConveyance(true)}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Add Conveyance
              </button>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {conveyances.length > 0 ? (
                    conveyances.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{c.date}</td>
                        <td className="px-6 py-4 text-sm font-bold">{c.employee || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{c.description}</td>
                        <td className="px-6 py-4 text-sm font-bold text-right">{formatCurrency(c.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No conveyance records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
`;

// Replace the old dummy conveyance UI
content = content.replace(
  /\) : activeTab === 'conveyance' && isAdmin \? \([\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  conveyanceUI.trim()
);

const conveyanceModal = `
      {/* Conveyance Modal */}
      {isAddingConveyance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add Conveyance</h2>
              <button onClick={() => setIsAddingConveyance(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveConveyance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newConveyance.date}
                  onChange={e => setNewConveyance({ ...newConveyance, date: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={newConveyance.employee}
                  onChange={e => setNewConveyance({ ...newConveyance, employee: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                  placeholder="Employee Name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={newConveyance.description}
                  onChange={e => setNewConveyance({ ...newConveyance, description: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                  placeholder="Transport from A to B"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={newConveyance.amount}
                  onChange={e => setNewConveyance({ ...newConveyance, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingConveyance(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

if (!content.includes('isAddingConveyance && (')) {
  // append in modals region
  content = content.replace(
    "{/* Add User Modal */}",
    conveyanceModal + "\n      {/* Add User Modal */}"
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully completed conveyance implementation');
