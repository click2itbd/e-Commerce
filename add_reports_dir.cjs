const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const reportsList = [
  'Register Report', 'Z Report', 'Daily Summary Report', 'Sale Report',
  'Due Sale Report', 'Final Invoice Due Report', 'Service Sale Report',
  'Combo Service Report', 'Stock Report', 'Low Stock Report', 'Expire Soon Report',
  'Employee Sale Report', 'Customer Receive Report', 'Attendance Report',
  'Product Profit Report', 'Supplier Ledger Report', 'Supplier Balance Report',
  'Customer Ledger Report', 'Customer Balance Report', 'Servicing Report',
  'Product Sale Report', 'Tax Report', 'GST Reports', 'Detailed Sale Report',
  'Profit Loss Report', 'Purchase Report', 'Expense Report', 'Income Report',
  'Salary Report', 'Purchase Return Report', 'Sale Return Report', 'Damage Report',
  'Installment Collection Report', 'Installment Due Report', 'Item Tracking Report',
  'Price History Report', 'Cash Flow Report', 'Available Loyalty Point Report',
  'Usage Loyalty Point Repo'
];

// Add UI view for `all_reports`
const reportsDirUIStr = `
        ) : activeTab === 'all_reports' && (isAdmin || isManager) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <FileText className="text-[#EF4444]" /> Reports Directory
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  ${reportsList.map(r => `'${r}'`).join(', ')}
                ].map((reportName, idx) => {
                  let customAction = () => toast.success('Opening ' + reportName + '...');
                  if (reportName === 'Sale Report') { customAction = () => setActiveTab('reports'); }
                  if (reportName === 'Stock Report' || reportName === 'Low Stock Report') { customAction = () => setActiveTab('inventory'); }
                  if (reportName === 'Supplier Ledger Report' || reportName === 'Customer Ledger Report') { customAction = () => setActiveTab('ledger'); }
                  if (reportName === 'Income Report') { customAction = () => setActiveTab('manual_income'); }
                  if (reportName === 'Expense Report') { customAction = () => setActiveTab('manual_expense'); }
                  
                  return (
                    <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:border-red-200 hover:shadow-sm transition-all cursor-pointer group flex flex-col items-start gap-2 bg-gray-50 hover:bg-white" onClick={customAction}>
                      <div className="bg-white p-2 text-[#EF4444] rounded border border-gray-100 group-hover:bg-red-50">
                        <FileText size={20} />
                      </div>
                      <span className="font-bold text-sm text-gray-700">{reportName}</span>
                      <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Standard Report</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
`;

if (!content.includes("activeTab === 'all_reports' && (isAdmin || isManager) ? (")) {
  content = content.replace(
    ") : activeTab === 'tx_categories' && (isAdmin || isManager) ? (",
    reportsDirUIStr + "\\n        ) : activeTab === 'tx_categories' && (isAdmin || isManager) ? ("
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully added all_reports.');
