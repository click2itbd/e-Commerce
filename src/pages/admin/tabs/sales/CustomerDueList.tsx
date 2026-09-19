import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'react-hot-toast';
import { useSettings } from '../../../../context/SettingsContext';
import { formatCurrency } from '../../../../lib/utils';
import { Search, CreditCard, X, Check } from 'lucide-react';
import { generatePDF } from '../../../../lib/pdf';
import { Customer, Transaction, PaymentAccount } from '../../../../types';

export default function CustomerDueList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string, name: string, due: number } | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<{ id: string, name: string } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { settings } = useSettings();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custSnap, txSnap, accSnap] = await Promise.all([
        getDocs(collection(db, 'customers')),
        getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc'))),
        getDocs(collection(db, 'payment_accounts'))
      ]);

      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
      
      const allAccs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
      setPaymentAccounts(allAccs);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate dues
  // A positive balance indicates the customer owes us money (Due)
  const calculateDues = () => {
    const balances: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.entityType === 'customer' && t.entityId) {
        if (!balances[t.entityId]) balances[t.entityId] = 0;
        
        if (t.type === 'sale') {
          balances[t.entityId] += Number(t.amount);
        } else if (t.type === 'payment_received' || t.type === 'return') {
          balances[t.entityId] -= Number(t.amount);
        }
      }
    });

    const dueList = customers
      .map(c => ({
        ...c,
        due: balances[c.id] || 0
      }))
      .filter(c => c.due > 0)
      .sort((a, b) => b.due - a.due);

    return dueList;
  };

  const dueCustomers = calculateDues().filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  const totalOverallDue = dueCustomers.reduce((acc, curr) => acc + curr.due, 0);

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!paymentAccountId) {
      toast.error('Select a payment account');
      return;
    }

    try {
      setSubmitting(true);
      const acc = paymentAccounts.find(a => a.id === paymentAccountId);
      
      const txData = {
        type: 'payment_received',
        amount: Number(paymentAmount),
        date: new Date().toISOString(),
        description: paymentNotes || 'Received customer due payment',
        entityId: selectedCustomer.id,
        entityName: selectedCustomer.name,
        entityType: 'customer',
        paymentAccountId: paymentAccountId,
        paymentMethod: acc?.type || 'cash',
        createdAt: new Date().toISOString(),
        previousDue: selectedCustomer.due,
        currentBalance: selectedCustomer.due - Number(paymentAmount)
      };

      const txRef = await addDoc(collection(db, 'transactions'), txData);
      
      // Generate PDF receipt immediately
      const savedTx = { id: txRef.id, referenceId: `REC-${Date.now().toString().slice(-6)}`, ...txData, _autoPrint: true };
      try {
        generatePDF(savedTx as any, 'receipt', settings);
      } catch (err) {
        console.error('Failed to generate receipt PDF', err);
      }

      toast.success('Payment received successfully & Receipt generated');
      setSelectedCustomer(null);
      setPaymentAmount('');
      setPaymentAccountId('');
      setPaymentNotes('');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="text-blue-600" /> Customer Due List
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage and collect outstanding payments from customers</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 flex flex-col items-end">
              <span className="text-xs font-bold uppercase">Total Due</span>
              <span className="text-lg font-black">{formatCurrency(totalOverallDue, settings)}</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4 text-right">Due Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Loading due list...
                    </div>
                  </td>
                </tr>
              ) : dueCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <Check className="mx-auto text-green-500 mb-2" size={24} />
                    No pending dues found.
                  </td>
                </tr>
              ) : (
                dueCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4">{customer.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-right font-black text-red-600">
                      {formatCurrency(customer.due, settings)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setHistoryCustomer({ id: customer.id, name: customer.name })}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          History
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer({ id: customer.id, name: customer.name, due: customer.due });
                            setPaymentAmount(customer.due);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          Receive Payment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Receive Due Payment</h3>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReceivePayment} className="p-6 overflow-y-auto space-y-4">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100 mb-2">
                <div className="text-xs font-bold uppercase text-blue-600 mb-1">Customer</div>
                <div className="font-black text-lg">{selectedCustomer.name}</div>
                <div className="text-sm mt-1 flex justify-between">
                  <span>Current Due:</span>
                  <span className="font-bold text-red-600">{formatCurrency(selectedCustomer.due, settings)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Payment Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={selectedCustomer.due}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg p-3 font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Receive In Account
                </label>
                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">-- Select Account --</option>
                  {paymentAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Notes / Reference (Optional)
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g., Paid via Bkash / Cash memo #..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !paymentAmount || !paymentAccountId}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? 'Processing...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyCustomer && (() => {
        let runningBalance = 0;
        let totalDebit = 0;
        let totalCredit = 0;
        
        // Reverse so oldest is first for running balance calculation
        const customerTx = [...transactions]
          .filter(t => t.entityId === historyCustomer.id)
          .reverse()
          .map(t => {
            const isDebit = t.type === 'sale';
            const isCredit = t.type === 'payment_received' || t.type === 'deposit';
            const amt = Number(t.amount) || 0;
            
            if (isDebit) {
              runningBalance += amt;
              totalDebit += amt;
            }
            if (isCredit) {
              runningBalance -= amt;
              totalCredit += amt;
            }
            
            return { ...t, runningBalance, isDebit, isCredit, amt };
          });

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gray-50">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Ledger History</h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">{historyCustomer.name}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex gap-4 text-sm font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-red-600">
                      <span className="text-gray-400 block text-[10px] uppercase">Total Purchases</span>
                      {formatCurrency(totalDebit, settings)}
                    </div>
                    <div className="text-green-600">
                      <span className="text-gray-400 block text-[10px] uppercase">Total Paid</span>
                      {formatCurrency(totalCredit, settings)}
                    </div>
                    <div className="text-blue-600">
                      <span className="text-gray-400 block text-[10px] uppercase">Current Due</span>
                      {formatCurrency(Math.max(0, runningBalance), settings)}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setHistoryCustomer(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-0 overflow-y-auto bg-gray-50 flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-gray-200 sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-3 font-bold text-gray-600">Date</th>
                      <th className="px-6 py-3 font-bold text-gray-600">Description</th>
                      <th className="px-6 py-3 font-bold text-gray-600 text-right">Debit (Sale)</th>
                      <th className="px-6 py-3 font-bold text-gray-600 text-right">Credit (Paid)</th>
                      <th className="px-6 py-3 font-bold text-gray-600 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerTx.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No history found.</td>
                      </tr>
                    ) : (
                      // Reverse back so newest is at the top for viewing, but balance makes sense
                      [...customerTx].reverse().map(t => (
                        <tr key={t.id} className="hover:bg-white transition-colors">
                          <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                            {new Date(t.date).toLocaleDateString()}
                            <span className="text-xs text-gray-400 block">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="px-6 py-3 text-gray-900 font-medium">
                            {t.description}
                            {t.documentNumber && <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">#{t.documentNumber}</span>}
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-red-600">
                            {t.isDebit ? formatCurrency(t.amt, settings) : '-'}
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-green-600">
                            {t.isCredit ? formatCurrency(t.amt, settings) : '-'}
                          </td>
                          <td className="px-6 py-3 text-right font-mono font-bold text-blue-600">
                            {formatCurrency(Math.max(0, t.runningBalance), settings)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t bg-white flex justify-end gap-3">
                <button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    
                    const html = `
                      <html>
                        <head>
                          <title>Ledger - ${historyCustomer.name}</title>
                          <style>
                            body { font-family: sans-serif; padding: 20px; color: #333; }
                            h1 { font-size: 20px; margin-bottom: 5px; }
                            .summary { display: flex; gap: 20px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                            .summary div { font-size: 14px; }
                            table { width: 100%; border-collapse: collapse; font-size: 12px; }
                            th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
                            th { background-color: #f9fafb; font-weight: bold; }
                            .text-right { text-align: right; }
                            .text-red { color: #dc2626; }
                            .text-green { color: #16a34a; }
                            .text-blue { color: #2563eb; }
                            .text-gray { color: #6b7280; }
                          </style>
                        </head>
                        <body>
                          <h1>Ledger History: ${historyCustomer.name}</h1>
                          <div class="summary">
                            <div><strong>Total Purchases:</strong> <span class="text-red">${formatCurrency(totalDebit, settings)}</span></div>
                            <div><strong>Total Paid:</strong> <span class="text-green">${formatCurrency(totalCredit, settings)}</span></div>
                            <div><strong>Current Due:</strong> <span class="text-blue">${formatCurrency(Math.max(0, runningBalance), settings)}</span></div>
                          </div>
                          <table>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th class="text-right">Debit (Sale)</th>
                                <th class="text-right">Credit (Paid)</th>
                                <th class="text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${[...customerTx].reverse().map(t => `
                                <tr>
                                  <td>${new Date(t.date).toLocaleDateString()} ${new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                  <td>${t.description} ${t.documentNumber ? `(#${t.documentNumber})` : ''}</td>
                                  <td class="text-right text-red">${t.isDebit ? formatCurrency(t.amt, settings) : '-'}</td>
                                  <td class="text-right text-green">${t.isCredit ? formatCurrency(t.amt, settings) : '-'}</td>
                                  <td class="text-right font-bold text-blue">${formatCurrency(Math.max(0, t.runningBalance), settings)}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <div style="margin-top: 30px; font-size: 10px; text-align: center; color: #888;">
                            Generated on ${new Date().toLocaleString()}
                          </div>
                          <script>
                            window.onload = function() { window.print(); window.close(); }
                          </script>
                        </body>
                      </html>
                    `;
                    printWindow.document.write(html);
                    printWindow.document.close();
                  }}
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Print Ledger
                </button>
                <button 
                  onClick={() => setHistoryCustomer(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
