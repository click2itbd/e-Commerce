const fs = require('fs');
const path = require('path');

function updateFile(filePath, isVendor) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Add handleViewInvoice
    if (!content.includes('handleViewInvoice')) {
        const importIndex = content.indexOf('export default function');
        const imports = `import { where } from 'firebase/firestore';\n`;
        content = content.slice(0, importIndex) + imports + content.slice(importIndex);
        
        const invoiceFunc = `
  const handleViewInvoice = async (documentNumber: string) => {
    try {
      const q = query(collection(db, 'orders'), where('documentNumber', '==', documentNumber));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const order = { id: snap.docs[0].id, ...snap.docs[0].data() };
        generatePDF(order as any, 'invoice', settings);
      } else {
        toast.error('Invoice not found');
      }
    } catch (e) {
      toast.error('Failed to view invoice');
    }
  };
`;
        const fetchDataIndex = content.indexOf('const fetchData = async');
        content = content.slice(0, fetchDataIndex) + invoiceFunc + content.slice(fetchDataIndex);
    }

    // 1. Make invoice links clickable
    content = content.replace(
        /\{t\.documentNumber && <span className="ml-2 text-\[10px\] bg-blue-50 text-blue-600 px-2 py-0\.5 rounded-full border border-blue-100">#\{t\.documentNumber\}<\/span>\}/g,
        `{t.documentNumber && <span onClick={(e) => { e.stopPropagation(); handleViewInvoice(t.documentNumber); }} className="ml-2 cursor-pointer hover:bg-blue-100 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">#{t.documentNumber}</span>}`
    );

    // 2. Edit Transactions
    if (!content.includes('editTx')) {
        content = content.replace(
            /const \[paymentAmount, setPaymentAmount\] = useState<number \| ''>\(''\);/,
            `const [paymentAmount, setPaymentAmount] = useState<number | ''>('');\n  const [editTx, setEditTx] = useState<Transaction | null>(null);\n  const [editAmount, setEditAmount] = useState<number | ''>('');\n  const [editDate, setEditDate] = useState('');`
        );
        
        const editFunc = `
  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTx || !editAmount) return;
    try {
      await updateDoc(doc(db, 'transactions', editTx.id), {
        amount: Number(editAmount),
        date: new Date(editDate).toISOString(),
      });
      toast.success('Transaction updated');
      setEditTx(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update transaction');
    }
  };
`;
        content = content.replace(/const handleMakePayment = async/g, editFunc + '\n  const handleMakePayment = async');
        content = content.replace(/const handleReceivePayment = async/g, editFunc + '\n  const handleReceivePayment = async');
        
        // Add Edit/Delete buttons in ledger
        const rowReplacement = `
                          <td className="px-6 py-3 text-right font-mono font-bold text-blue-600 flex items-center justify-end gap-2">
                            {formatCurrency(Math.max(0, t.runningBalance), settings)}
                            {(t.type === 'payment_received' || t.type === 'payment_made') && (
                              <div className="flex gap-1">
                                <button onClick={() => { setEditTx(t); setEditAmount(t.amt); setEditDate(t.date.slice(0, 16)); }} className="text-xs bg-gray-100 hover:bg-gray-200 px-1 py-0.5 rounded text-gray-600">Edit</button>
                                <button onClick={() => handleDeleteTransaction(t.id)} className="text-xs bg-red-100 hover:bg-red-200 px-1 py-0.5 rounded text-red-600">Del</button>
                              </div>
                            )}
                          </td>
`;
        content = content.replace(
            /<td className="px-6 py-3 text-right font-mono font-bold text-blue-600">\s*\{formatCurrency\(Math\.max\(0, t\.runningBalance\), settings\)\}\s*<\/td>/g,
            rowReplacement
        );

        // Edit Modal UI
        const editModalStr = `
      {/* Edit Tx Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Edit Payment</h3>
              <button onClick={() => setEditTx(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                <input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-3" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">Update Payment</button>
            </form>
          </div>
        </div>
      )}
`;
        content = content.replace(/<\/div>\s*<\/div>\s*\);\s*\}\)\(\)\}\s*<\/div>\s*\);\s*\}/, editModalStr + '\n      </div>\n    </div>\n  );\n})()}\n    </div>\n  );\n}');
    }

    // 3. Opening & Closing Balance
    if (!content.includes('fromDate')) {
        content = content.replace(
            /const \[historyVendor, setHistoryVendor\] = useState<\{ id: string, name: string \} \| null>\(null\);/g,
            `const [historyVendor, setHistoryVendor] = useState<{ id: string, name: string } | null>(null);\n  const [fromDate, setFromDate] = useState('');\n  const [toDate, setToDate] = useState('');`
        );
        content = content.replace(
            /const \[historyCustomer, setHistoryCustomer\] = useState<\{ id: string, name: string \} \| null>\(null\);/g,
            `const [historyCustomer, setHistoryCustomer] = useState<{ id: string, name: string } | null>(null);\n  const [fromDate, setFromDate] = useState('');\n  const [toDate, setToDate] = useState('');`
        );
        
        // Let's replace the whole history calculation
        const histVar = isVendor ? 'historyVendor' : 'historyCustomer';
        const calcRegex = new RegExp(`const ${isVendor ? 'vendorTx' : 'customerTx'} = \\[\.\.\.transactions\\][\\s\\S]*?return \\(`);
        
        const newCalc = `
        let runningBalance = 0;
        let totalDebit = 0;
        let totalCredit = 0;
        
        const allEntityTx = [...transactions]
          .filter(t => t.entityId === ${histVar}.id)
          .reverse()
          .map(t => {
            const isDebit = t.type === '${isVendor ? 'purchase' : 'sale'}';
            const isCredit = t.type === '${isVendor ? 'payment_made' : 'payment_received'}' || t.type === 'deposit';
            const amt = Number(t.amount) || 0;
            return { ...t, isDebit, isCredit, amt };
          });

        let openingBalance = 0;
        
        const filteredTx = allEntityTx.filter(t => {
            if (fromDate && new Date(t.date) < new Date(fromDate)) {
                if (t.isDebit) openingBalance += t.amt;
                if (t.isCredit) openingBalance -= t.amt;
                return false;
            }
            if (toDate && new Date(t.date) > new Date(toDate + 'T23:59:59')) {
                return false;
            }
            return true;
        });

        runningBalance = openingBalance;
        
        const ${isVendor ? 'vendorTx' : 'customerTx'} = filteredTx.map(t => {
            if (t.isDebit) {
                runningBalance += t.amt;
                totalDebit += t.amt;
            }
            if (t.isCredit) {
                runningBalance -= t.amt;
                totalCredit += t.amt;
            }
            return { ...t, runningBalance };
        });

        const closingBalance = runningBalance;

        return (
`;
        content = content.replace(calcRegex, newCalc);

        // Add filter inputs
        const filtersUI = `
                  <div className="flex items-center gap-2 mr-4">
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="text-xs border border-gray-200 rounded p-1" />
                    <span className="text-gray-400">to</span>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="text-xs border border-gray-200 rounded p-1" />
                  </div>
`;
        content = content.replace(/<div className="flex items-center gap-4">/, '<div className="flex items-center gap-4">\n' + filtersUI);

        // Display Opening / Closing
        const ocUI = `
                    <div className="text-gray-500">
                      <span className="block text-[10px] uppercase">Opening</span>
                      {formatCurrency(openingBalance, settings)}
                    </div>
                    <div className="text-gray-900 font-bold">
                      <span className="text-gray-400 block text-[10px] uppercase">Closing</span>
                      {formatCurrency(closingBalance, settings)}
                    </div>
`;
        content = content.replace(/<div className="text-blue-600">\s*<span className="text-gray-400 block text-\[10px\] uppercase">Current Due<\/span>\s*\{formatCurrency\(Math.max\(0, runningBalance\), settings\)\}\s*<\/div>/, `<div className="text-blue-600"><span className="text-gray-400 block text-[10px] uppercase">Total Due</span>{formatCurrency(Math.max(0, runningBalance), settings)}</div>\n` + ocUI);

    }

    // 4. WhatsApp share
    if (!content.includes('Share via WhatsApp')) {
        const histVar = isVendor ? 'historyVendor' : 'historyCustomer';
        const waFunc = `
                <button 
                  onClick={() => {
                    const msg = \`Dear \${${histVar}.name}, your current due is \${formatCurrency(closingBalance, settings)}. Please clear the due as soon as possible.\`;
                    window.open(\`https://wa.me/?text=\${encodeURIComponent(msg)}\`, '_blank');
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
                >
                  WhatsApp
                </button>
`;
        content = content.replace(/<button[^>]*>\s*Print Ledger\s*<\/button>/, waFunc + '\n$&');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

updateFile('C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/admin/tabs/sales/CustomerDueList.tsx', false);
updateFile('C:/Users/User/OneDrive/Desktop/e-Commerce/src/pages/admin/tabs/purchase/VendorDueList.tsx', true);

console.log('Done');
