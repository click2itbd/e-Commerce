import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { FileText, ShoppingBag, Receipt, Database, CheckCircle, Clock, Plus } from 'lucide-react';

interface AllReportsTabProps { setActiveTab: (v: string) => void; }

const AllReportsTab: React.FC<AllReportsTabProps> = ({ setActiveTab }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <FileText className="text-[#EF4444]" /> Reports Directory
              </h2>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    const reports = document.querySelectorAll('.report-item');
                    reports.forEach((report: any) => {
                      const name = report.querySelector('span').innerText.toLowerCase();
                      report.style.display = name.includes(search) ? 'flex' : 'none';
                    });
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  'Register Report', 'Z Report', 'Daily Summary Report', 'Sale Report', 'Due Sale Report', 'Final Invoice Due Report', 'Service Sale Report', 'Combo Service Report', 'Stock Report', 'Low Stock Report', 'Expire Soon Report', 'Employee Sale Report', 'Customer Receive Report', 'Attendance Report', 'Product Profit Report', 'Supplier Ledger Report', 'Supplier Balance Report', 'Customer Ledger Report', 'Customer Balance Report', 'Servicing Report', 'Product Sale Report', 'Tax Report', 'GST Reports', 'Detailed Sale Report', 'Profit Loss Report', 'Purchase Report', 'Expense Report', 'Income Report', 'Salary Report', 'Purchase Return Report', 'Sale Return Report', 'Damage Report', 'Installment Collection Report', 'Installment Due Report', 'Item Tracking Report', 'Price History Report', 'Cash Flow Report', 'Available Loyalty Point Report', 'Usage Loyalty Point Report'
                ].map((reportName, idx) => {
                  let customAction = () => toast.success('Opening ' + reportName + '...');
                  if (reportName === 'Sale Report') { customAction = () => setActiveTab('reports'); }
                  if (reportName === 'Customer Receive Report') { customAction = () => setActiveTab('customer_receive_report'); }
                  if (reportName === 'Stock Report' || reportName === 'Low Stock Report') { customAction = () => setActiveTab('inventory'); }
                  if (reportName === 'Supplier Ledger Report' || reportName === 'Customer Ledger Report') { customAction = () => setActiveTab('ledger'); }
                  if (reportName === 'Income Report') { customAction = () => setActiveTab('manual_income'); }
                  if (reportName === 'Expense Report') { customAction = () => setActiveTab('manual_expense'); }
                  
                  return (
                    <div key={idx} className="report-item border border-gray-100 rounded-lg p-4 hover:border-red-200 hover:shadow-sm transition-all cursor-pointer group flex flex-col items-start gap-2 bg-gray-50 hover:bg-white" onClick={customAction}>
                      <div className="bg-white p-2 text-[#EF4444] rounded border border-gray-100 group-hover:bg-red-50">
                        <FileText size={20} />
                      </div>
                      <span className="font-bold text-sm text-gray-700">{reportName}</span>
                      <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Standard Report</span>
                    </div>
                  );
                })}
                <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 transition-all cursor-pointer">
                  <Plus size={24} className="mb-2" />
                  <span className="font-bold text-xs uppercase">Add New Report</span>
                </div>
              </div>
            </div>
          </div>
  );
};

export default AllReportsTab;
