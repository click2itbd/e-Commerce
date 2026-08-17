const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add sort config state
const sortStateCode = `  const [paymentAccountSort, setPaymentAccountSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });\n`;
content = content.replace("  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);", sortStateCode + "  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);");

// 2. Replace paymentAccounts.map with sortedPaymentAccounts.map and add header onClick
const replaceTableStart = `<thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 cursor-pointer select-none">Account Name</th>
                      <th className="px-6 py-3 cursor-pointer select-none">Account Type</th>
                      <th className="px-6 py-3 cursor-pointer select-none">Description</th>
                      <th className="px-6 py-3 cursor-pointer select-none text-right">Balance</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {paymentAccounts.map((account, idx) => (`;
                    
const newTableStart = `<thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'name', direction: paymentAccountSort.key === 'name' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Account Name {paymentAccountSort.key === 'name' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'type', direction: paymentAccountSort.key === 'type' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Account Type {paymentAccountSort.key === 'type' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'description', direction: paymentAccountSort.key === 'description' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Description {paymentAccountSort.key === 'description' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none text-right hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'balance', direction: paymentAccountSort.key === 'balance' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Balance {paymentAccountSort.key === 'balance' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-center cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'status', direction: paymentAccountSort.key === 'status' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Status {paymentAccountSort.key === 'status' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {[...paymentAccounts].sort((a,b) => {
                      let valA = a[paymentAccountSort.key === 'balance' ? 'openingBalance' : paymentAccountSort.key];
                      let valB = b[paymentAccountSort.key === 'balance' ? 'openingBalance' : paymentAccountSort.key];
                      
                      if (typeof valA === 'string') valA = valA.toLowerCase();
                      if (typeof valB === 'string') valB = valB.toLowerCase();
                      
                      if (valA < valB) return paymentAccountSort.direction === 'asc' ? -1 : 1;
                      if (valA > valB) return paymentAccountSort.direction === 'asc' ? 1 : -1;
                      return 0;
                    }).map((account, idx) => (`;

content = content.replace(replaceTableStart, newTableStart);

if (content.includes("paymentAccountSort")) {
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully added sorting for payment accounts');
} else {
  console.log('Failed to add sorting for payment accounts');
}
