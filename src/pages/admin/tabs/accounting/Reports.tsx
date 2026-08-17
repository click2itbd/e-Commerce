import React, { useState } from 'react';
import { Order, SiteSettings } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Download,
  ShoppingBag,
} from 'lucide-react';

interface ReportsProps {
  orders: Order[];
  settings: SiteSettings;
  hasPermission: (permission: string) => boolean;
  formatCurrency: (amount: number, settings: SiteSettings) => string;
  cn: (...classes: string[]) => string;
  toast: typeof toast;
}

const Reports: React.FC<ReportsProps> = ({
  orders,
  settings,
  hasPermission,
  formatCurrency,
  cn,
  toast,
}) => {
  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportSearch, setReportSearch] = useState('');
  const [reportSortConfig, setReportSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const getSalesReportData = () => {
    const aggregatedData: { [key: string]: { date: string, productName: string, quantity: number, total: number } } = {};

    orders.forEach(order => {
      const orderDate = order.createdAt.split('T')[0];
      if (orderDate >= reportStartDate && orderDate <= reportEndDate) {
        order.items.forEach(item => {
          const key = `${orderDate}_${item.id}`;
          if (aggregatedData[key]) {
            aggregatedData[key].quantity += item.quantity;
            aggregatedData[key].total += item.price * item.quantity;
          } else {
            aggregatedData[key] = {
              date: orderDate,
              productName: item.name,
              quantity: item.quantity,
              total: item.price * item.quantity
            };
          }
        });
      }
    });

    let reportArray = Object.values(aggregatedData);

    if (reportSearch) {
      reportArray = reportArray.filter(item => 
        item.productName.toLowerCase().includes(reportSearch.toLowerCase()) ||
        item.date.includes(reportSearch)
      );
    }

    reportArray.sort((a, b) => {
      const valA = a[reportSortConfig.key as keyof typeof a];
      const valB = b[reportSortConfig.key as keyof typeof b];
      if (valA < valB) return reportSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return reportSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return reportArray;
  };

  const exportToCSV = () => {
    const data = getSalesReportData();
    const headers = ['Date', 'Product Name', 'Quantity', 'Total Amount'];
    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        `"${row.productName}"`,
        row.quantity,
        row.total
      ].join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${reportStartDate}_to_${reportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasPermission('manage_reports')) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="text-[#EF4444]" /> Sales Report
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">From</label>
            <input
              type="date"
              value={reportStartDate}
              onChange={e => setReportStartDate(e.target.value)}
              className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">To</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={e => setReportEndDate(e.target.value)}
              className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition-all font-bold text-sm"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by product name or date..."
            value={reportSearch}
            onChange={e => setReportSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
          />
          <ShoppingBag className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th 
                className="px-6 py-4 cursor-pointer hover:text-[#EF4444] transition-colors"
                onClick={() => setReportSortConfig({ key: 'date', direction: reportSortConfig.key === 'date' && reportSortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              >
                Date {reportSortConfig.key === 'date' && (reportSortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:text-[#EF4444] transition-colors"
                onClick={() => setReportSortConfig({ key: 'productName', direction: reportSortConfig.key === 'productName' && reportSortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              >
                Product Name {reportSortConfig.key === 'productName' && (reportSortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:text-[#EF4444] transition-colors text-right"
                onClick={() => setReportSortConfig({ key: 'quantity', direction: reportSortConfig.key === 'quantity' && reportSortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              >
                Quantity {reportSortConfig.key === 'quantity' && (reportSortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:text-[#EF4444] transition-colors text-right"
                onClick={() => setReportSortConfig({ key: 'total', direction: reportSortConfig.key === 'total' && reportSortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              >
                Total Amount {reportSortConfig.key === 'total' && (reportSortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {getSalesReportData().map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(row.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-sm">{row.productName}</td>
                <td className="px-6 py-4 text-right text-sm">{row.quantity}</td>
                <td className="px-6 py-4 text-right font-bold text-[#EF4444]">{formatCurrency(row.total, settings)}</td>
              </tr>
            ))}
            {getSalesReportData().length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No sales data found for the selected period.</td>
              </tr>
            )}
          </tbody>
          {getSalesReportData().length > 0 && (
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-right uppercase text-xs text-gray-500 tracking-wider">Total</td>
                <td className="px-6 py-4 text-right">{getSalesReportData().reduce((sum, row) => sum + row.quantity, 0)}</td>
                <td className="px-6 py-4 text-right text-[#EF4444]">{formatCurrency(getSalesReportData().reduce((sum, row) => sum + row.total, 0), settings)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default Reports;
