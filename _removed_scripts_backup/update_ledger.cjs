const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state for Ledger
const ledgerStateStr = `
  // Ledger State
  const [ledgerFilterType, setLedgerFilterType] = useState<'daily' | 'monthly'>('daily');
  const [ledgerStartDate, setLedgerStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [ledgerEndDate, setLedgerEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Make sure we have a function to get ledger data
  const getLedgerData = () => {
    const data: { [key: string]: { date: string, income: number, expense: number, balance: number, details: any[] } } = {};
    
    transactions.forEach(tx => {
      const txDateStr = new Date(tx.date).toISOString().split('T')[0];
      if (txDateStr >= ledgerStartDate && txDateStr <= ledgerEndDate) {
        // format key based on type
        const key = ledgerFilterType === 'monthly' ? txDateStr.substring(0, 7) : txDateStr;
        const displayDate = ledgerFilterType === 'monthly' ? new Date(tx.date).toLocaleString('default', { month: 'long', year: 'numeric' }) : txDateStr;
        
        if (!data[key]) {
          data[key] = { date: displayDate, income: 0, expense: 0, balance: 0, details: [] };
        }
        
        const isIncome = ['sale', 'payment_received', 'money_receipt'].includes(tx.type);
        if (isIncome) {
          data[key].income += tx.amount;
        } else {
          data[key].expense += tx.amount;
        }
        
        data[key].balance = data[key].income - data[key].expense;
        data[key].details.push(tx);
      }
    });
    
    // Convert to array and sort by date desc
    return Object.keys(data).sort((a, b) => b.localeCompare(a)).map(k => data[k]);
  };
`;

if (!content.includes('const [ledgerFilterType')) {
  // Find "const [reportStartDate" and inject before it
  content = content.replace(
    /(\/\/ Report State\s*const \[reportStartDate)/,
    ledgerStateStr + '\n  $1'
  );
}

// 2. Add the Ledger Tab UI
const ledgerUIStr = `
        ) : activeTab === 'ledger' && (isAdmin || isManager) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Book className="text-[#EF4444]" /> General Ledger
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setLedgerFilterType('daily')}
                    className={cn("px-3 py-1 rounded text-sm font-bold transition-all", ledgerFilterType === 'daily' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setLedgerFilterType('monthly')}
                    className={cn("px-3 py-1 rounded text-sm font-bold transition-all", ledgerFilterType === 'monthly' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >
                    Monthly
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">From</label>
                  <input
                    type="date"
                    value={ledgerStartDate}
                    onChange={e => setLedgerStartDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">To</label>
                  <input
                    type="date"
                    value={ledgerEndDate}
                    onChange={e => setLedgerEndDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 border-b border-gray-100">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100 flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Total Income</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.income, 0))}
                </span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Total Expenditure</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.expense, 0))}
                </span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Net Balance</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.balance, 0))}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date / Period</th>
                    <th className="px-6 py-4 text-right">Income (Credit)</th>
                    <th className="px-6 py-4 text-right">Expenditure (Debit)</th>
                    <th className="px-6 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getLedgerData().map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{row.date}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(row.income)}</td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">{formatCurrency(row.expense)}</td>
                      <td className={cn("px-6 py-4 text-right font-bold", row.balance >= 0 ? "text-blue-600" : "text-red-600")}>
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))}
                  {getLedgerData().length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No ledger records found for the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
`;

if (!content.includes("activeTab === 'ledger' && (isAdmin || isManager)")) {
  // Find where reports tab is rendered
  const targetRegex = /\)\s*:\s*activeTab === 'reports' && \(isAdmin \|\| isManager\) \? \(/;
  content = content.replace(
    targetRegex,
    ledgerUIStr + '\n        ) : activeTab === \'reports\' && (isAdmin || isManager) ? ('
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated AdminDashboard.tsx for Ledger view.');
