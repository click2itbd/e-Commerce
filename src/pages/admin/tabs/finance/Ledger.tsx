import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { Book, Calendar, Filter, X, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LedgerTabProps { generalLedgerFilterType: string; setGeneralLedgerFilterType: (v: string) => void; generalLedgerStartDate: string; setGeneralLedgerStartDate: (v: string) => void; generalLedgerEndDate: string; setGeneralLedgerEndDate: (v: string) => void; getLedgerData: () => any[]; showLedgerReportModal: boolean; setShowLedgerReportModal: (v: boolean) => void; ledgerReportModalData: any[]; setLedgerReportModalData: (v: any[]) => void; ledgerReportType: string | null; setLedgerReportType: (v: string | null) => void; }

const LedgerTab: React.FC<LedgerTabProps> = ({ generalLedgerFilterType, setGeneralLedgerFilterType, generalLedgerStartDate, setGeneralLedgerStartDate, generalLedgerEndDate, setGeneralLedgerEndDate, getLedgerData, showLedgerReportModal, setShowLedgerReportModal, ledgerReportModalData, setLedgerReportModalData, ledgerReportType, setLedgerReportType }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Book className="text-[#EF4444]" /> General Ledger
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setGeneralLedgerFilterType('daily')}
                    className={cn("px-3 py-1 rounded text-sm font-bold transition-all", generalLedgerFilterType === 'daily' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setGeneralLedgerFilterType('monthly')}
                    className={cn("px-3 py-1 rounded text-sm font-bold transition-all", generalLedgerFilterType === 'monthly' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >
                    Monthly
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">From</label>
                  <input
                    type="date"
                    value={generalLedgerStartDate}
                    onChange={e => setGeneralLedgerStartDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">To</label>
                  <input
                    type="date"
                    value={generalLedgerEndDate}
                    onChange={e => setGeneralLedgerEndDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 border-b border-gray-100">
              <button 
                onClick={() => {
                  const allDetails = getLedgerData().flatMap(item => item.details);
                  setLedgerReportModalData(allDetails.filter(tx => ['sale', 'payment_received', 'money_receipt', 'income'].includes(tx.type)));
                  setLedgerReportType('income');
                  setShowLedgerReportModal(true);
                }}
                className="bg-white p-4 rounded-lg shadow-sm border border-green-100 flex flex-col hover:shadow-md transition-shadow text-left"
              >
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Total Income</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.income, 0), settings)}
                </span>
              </button>
              <button 
                onClick={() => {
                  const allDetails = getLedgerData().flatMap(item => item.details);
                  setLedgerReportModalData(allDetails.filter(tx => !['sale', 'payment_received', 'money_receipt', 'income'].includes(tx.type)));
                  setLedgerReportType('expense');
                  setShowLedgerReportModal(true);
                }}
                className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex flex-col hover:shadow-md transition-shadow text-left"
              >
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Total Expenditure</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.expense, 0), settings)}
                </span>
              </button>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Net Balance</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.balance, 0), settings)}
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
                      <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(row.income, settings)}</td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">{formatCurrency(row.expense, settings)}</td>
                      <td className={cn("px-6 py-4 text-right font-bold", row.balance >= 0 ? "text-blue-600" : "text-red-600")}>
                        {formatCurrency(row.balance, settings)}
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
              {showLedgerReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900 capitalize">{ledgerReportType} Report</h2>
                      <button onClick={() => setShowLedgerReportModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                      </button>
                    </div>
                    <div className="overflow-y-auto p-6">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {ledgerReportModalData.map((tx, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4">{tx.description}</td>
                              <td className="px-6 py-4 capitalize">{tx.type}</td>
                              <td className="px-6 py-4 text-right">{formatCurrency(tx.amount, settings)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end">
                      <button onClick={() => setShowLedgerReportModal(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-bold text-sm">Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
  );
};

export default LedgerTab;
