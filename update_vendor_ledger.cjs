const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/purchase/VendorDueList.tsx', 'utf8');

// 1. Import deleteDoc and Trash2
code = code.replace(/import \{ collection, getDocs, addDoc, doc, updateDoc, query, orderBy \} from 'firebase\/firestore';/, "import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';");
code = code.replace(/import \{ Search, Truck, X, Check \} from 'lucide-react';/, "import { Search, Truck, X, Check, Trash2 } from 'lucide-react';");

// 2. Add handleDeleteTransaction
const deleteFunc = `
  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this transaction? This will alter the ledger balance.")) return;
    try {
      await deleteDoc(doc(db, 'transactions', txId));
      toast.success('Transaction deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };
`;
code = code.replace(/const handlePayVendor = async/, deleteFunc + "\n  const handlePayVendor = async");

// 3. Update table headers in Ledger History
code = code.replace(/<th className="px-6 py-4 text-right">Balance \(?\)<\/th>/, `<th className="px-6 py-4 text-right">Balance (?)</th>
                              <th className="px-6 py-4 text-center w-10">Act</th>`);
                              
// 4. Add Delete button in table rows
const tdBalanceStr = '<td className="px-6 py-3 text-right font-mono font-bold text-blue-600">\n                              {formatCurrency(Math.max(0, t.runningBalance), settings)}\n                            </td>';
const tdActionStr = `
                            <td className="px-6 py-3 text-center">
                              <button 
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                                title="Delete Transaction"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>`;
code = code.replace(tdBalanceStr, tdBalanceStr + tdActionStr);

fs.writeFileSync('src/pages/admin/tabs/purchase/VendorDueList.tsx', code, 'utf8');
console.log("Updated VendorDueList.tsx");
