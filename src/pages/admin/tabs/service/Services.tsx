import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { ServiceRecord, SoldSerial, SiteSettings } from '../../../../types';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import {
  Settings,
  Search,
  Plus,
  FileText,
  Download,
  Edit2,
  X,
} from 'lucide-react';

interface ServicesProps {
  serviceRecords: ServiceRecord[];
  soldSerials: SoldSerial[];
  settings: SiteSettings;
  ledgerView: 'ledger' | 'products';
  setLedgerView: (view: 'ledger' | 'products') => void;
  ledgerSearchQuery: string;
  setLedgerSearchQuery: (query: string) => void;
  formatCurrency: (amount: number, settings: SiteSettings) => string;
  cn: (...classes: string[]) => string;
  toast: typeof toast;
  fetchData: () => Promise<void>;
}

const Services: React.FC<ServicesProps> = ({
  serviceRecords,
  soldSerials,
  settings,
  ledgerView,
  setLedgerView,
  ledgerSearchQuery,
  setLedgerSearchQuery,
  formatCurrency,
  cn,
  toast,
  fetchData,
}) => {
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    serialNumber: '',
    customerName: '',
    customerPhone: '',
    productName: '',
    equipmentType: 'Laptop',
    issueDescription: '',
    isWarranty: false,
    serviceCharge: 0,
    paymentStatus: 'pending' as 'pending' | 'paid',
    paymentMethod: 'cash',
    medeaPayment: '',
    status: 'received' as 'received' | 'in_progress' | 'ready' | 'delivered',
  });

  const printServiceReceipt = (record: ServiceRecord) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let currentY = 20;

    const useLetterhead = settings?.documentDesign?.printOnLetterhead;

    if (!useLetterhead) {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(8, 22, 33);
      doc.text(settings?.brandName || 'STAR TECH', 20, currentY);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(settings?.contactPhone || '16793 | startech.com.bd', 20, currentY + 7);
      doc.text(settings?.contactAddress || '123 Main Street, City, Country', 20, currentY + 12);
    } else {
      currentY += 20;
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('SERVICE RECEIPT', 190, currentY, { align: 'right' });

    currentY += 20;
    doc.setDrawColor(239, 68, 68);
    doc.line(20, currentY, 190, currentY);

    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ticket ID: ${record.id.toUpperCase()}`, 20, currentY);
    doc.text(`Date Received: ${new Date(record.receivedAt).toLocaleDateString()}`, 20, currentY + 7);
    doc.text(`Customer: ${record.customerName}`, 140, currentY);
    doc.text(`Phone: ${record.customerPhone}`, 140, currentY + 7);

    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Device Information', 20, currentY);
    doc.setFont('helvetica', 'normal');

    currentY += 10;
    doc.text(`Product Name: ${record.productName}`, 20, currentY);
    doc.text(`Serial Number: ${record.serialNumber}`, 140, currentY);

    currentY += 10;
    doc.text(`Type: ${record.isWarranty ? 'Warranty Claim' : 'Paid Service'}`, 20, currentY);
    if (!record.isWarranty) {
      doc.text(`Estimated/Final Charge: ${formatCurrency(record.serviceCharge || 0, settings)}`, 140, currentY);
    }

    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Issue Description', 20, currentY);
    doc.setFont('helvetica', 'normal');

    currentY += 10;
    const splitDesc = doc.splitTextToSize(record.issueDescription, 170);
    doc.text(splitDesc, 20, currentY);

    currentY += splitDesc.length * 7 + 20;
    doc.setFontSize(10);
    doc.text('Customer Signature', 40, currentY, { align: 'center' });
    doc.line(20, currentY - 5, 60, currentY - 5);

    doc.text('Authorized Signature', 170, currentY, { align: 'center' });
    doc.line(150, currentY - 5, 190, currentY - 5);

    doc.save(`Service_Receipt_${record.id}.pdf`);
  };

  const printServiceBill = (record: ServiceRecord) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let currentY = 20;

    const useLetterhead = settings?.documentDesign?.printOnLetterhead;

    if (!useLetterhead) {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(8, 22, 33);
      doc.text(settings?.brandName || 'STAR TECH', 20, currentY);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(settings?.contactPhone || '16793 | startech.com.bd', 20, currentY + 7);
      doc.text(settings?.contactAddress || '123 Main Street, City, Country', 20, currentY + 12);
    } else {
      currentY += 20;
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('SERVICE BILL / INVOICE', 190, currentY, { align: 'right' });

    currentY += 20;
    doc.setDrawColor(239, 68, 68);
    doc.line(20, currentY, 190, currentY);

    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ticket ID: ${record.id.toUpperCase()}`, 20, currentY);
    doc.text(`Date Received: ${new Date(record.receivedAt).toLocaleDateString()}`, 20, currentY + 7);
    doc.text(`Customer: ${record.customerName}`, 140, currentY);
    doc.text(`Phone: ${record.customerPhone}`, 140, currentY + 7);

    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Service Details', 20, currentY);
    doc.setFont('helvetica', 'normal');

    currentY += 10;
    const splitDesc = doc.splitTextToSize(`Serviced: ${record.productName} (SN: ${record.serialNumber}) - ${record.issueDescription}`, 120);
    doc.text(splitDesc, 20, currentY);

    currentY += Math.max(splitDesc.length * 7, 20) + 10;

    doc.line(20, currentY, 190, currentY);
    currentY += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount Due:', 130, currentY);
    doc.text(formatCurrency(record.serviceCharge || 0, settings), 190, currentY, { align: 'right' });

    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Status: ${record.paymentStatus?.toUpperCase() || 'PENDING'}`, 130, currentY);
    if (record.paymentMethod) {
      currentY += 7;
      doc.text(`Payment Method: ${record.paymentMethod.toUpperCase()}`, 130, currentY);
    }

    currentY += 40;
    doc.setFontSize(10);
    doc.text('Authorized Signature', 170, currentY, { align: 'center' });
    doc.line(140, currentY - 5, 190, currentY - 5);

    doc.save(`Service_Bill_${record.id}.pdf`);
  };

  const handleSaveService = async () => {
    try {
      if (editingService) {
        await updateDoc(doc(db, 'service_records', editingService.id), {
          ...serviceFormData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Service record updated');
      } else {
        const newRecord = {
          ...serviceFormData,
          receivedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'service_records'), newRecord);
        toast.success('Service record created');
        printServiceReceipt({ id: docRef.id, ...newRecord } as ServiceRecord);
      }
      setIsAddingService(false);
      fetchData();
    } catch (e) {
      toast.error('Failed to save service record');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="text-[#EF4444]" /> Warranty & Service
        </h2>
        <div className="flex bg-gray-100 p-1 rounded-md">
          <button
            onClick={() => setLedgerView('ledger')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-sm transition-all",
              ledgerView === 'ledger' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Warranty Check
          </button>
          <button
            onClick={() => setLedgerView('products')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-sm transition-all",
              ledgerView === 'products' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Service Tracking
          </button>
        </div>
        <button
          onClick={() => {
            setServiceFormData({
              serialNumber: '',
              customerName: '',
              customerPhone: '',
              productName: '',
              issueDescription: '',
              isWarranty: false,
              serviceCharge: 0,
              status: 'received',
            });
            setEditingService(null);
            setIsAddingService(true);
            if (ledgerView !== 'products') setLedgerView('products');
          }}
          className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Receive Product for Service
        </button>
      </div>

      {ledgerView === 'ledger' && (
        <div className="p-6">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <h3 className="font-bold text-lg mb-2">Check Warranty Status</h3>
              <p className="text-sm text-gray-500 mb-4">Enter a product serial number to verify its warranty status.</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Scan or enter Serial Number..."
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#EF4444] focus:ring-0 text-lg transition-all"
                />
              </div>
            </div>

            {ledgerSearchQuery && (
              <div className="space-y-4">
                {soldSerials
                  .filter(s => s.serial.toLowerCase().includes(ledgerSearchQuery.toLowerCase()))
                  .map(record => {
                    const wEndDate = new Date(record.warrantyEndDate);
                    const isExpired = wEndDate < new Date();
                    return (
                      <div key={record.id} className="bg-white border rounded-lg p-5 shadow-sm">
                        <div className="flexjustify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg">{record.productName}</h4>
                            <p className="font-mono text-sm text-gray-500">SN: {record.serial}</p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold",
                            isExpired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          )}>
                            {isExpired ? 'Warranty Expired' : 'In Warranty'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-4 border-t pt-4">
                          <div>
                            <span className="text-gray-500 block mb-1">Customer</span>
                            <span className="font-medium">{record.customerName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Sold Date</span>
                            <span className="font-medium">{new Date(record.soldAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Warranty Ends</span>
                            <span className="font-medium">{wEndDate.toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Order Ref</span>
                            <span className="font-medium">{record.orderId}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-end">
                          <button
                            onClick={() => {
                              setServiceFormData({
                                serialNumber: record.serial,
                                customerName: record.customerName,
                                customerPhone: record.customerPhone,
                                productName: record.productName,
                                issueDescription: '',
                                isWarranty: !isExpired,
                                serviceCharge: isExpired ? 500 : 0,
                                status: 'received',
                              });
                              setEditingService(null);
                              setIsAddingService(true);
                              setLedgerView('products');
                            }}
                            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded transition-all"
                          >
                            Receive Product for Service
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {soldSerials.filter(s => s.serial.toLowerCase().includes(ledgerSearchQuery.toLowerCase())).length === 0 && (
                  <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
                    No warranty records found for this serial number.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

       {ledgerView === 'products' && (
        <div>
          <div className="p-4 bg-white border-b border-gray-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by Customer Name or Serial Number..."
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:border-[#EF4444] focus:ring-0 text-sm transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Ticket / Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product / SN</th>
                  <th className="px-6 py-4">Status & Type</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceRecords.filter(r => r.serialNumber?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) || r.customerName?.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((record) => (
                  <tr key={record.id} className="bg-white border-b hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-bold">{record.id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-gray-500">{new Date(record.receivedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{record.customerName}</div>
                      <div className="text-xs text-gray-500">{record.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold line-clamp-1">{record.productName}</div>
                      <div className="text-xs font-mono text-gray-500">{record.serialNumber}</div>
                      {record.equipmentType && <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">{record.equipmentType}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold w-fit",
                          record.status === 'received' ? "bg-amber-100 text-amber-800" :
                          record.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                          record.status === 'ready' ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold w-fit",
                          record.isWarranty ? "bg-purple-100 text-purple-800" : "bg-orange-100 text-orange-800"
                        )}>
                          {record.isWarranty ? "WARRANTY" : `PAID SERVICE`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {!record.isWarranty ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-bold text-sm text-gray-900">{formatCurrency(record.serviceCharge, settings)}</span>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase",
                              record.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {record.paymentStatus || 'pending'}
                            </span>
                            {(record.paymentMethod) && (
                              <span className="text-[9px] text-gray-500 bg-gray-100 py-0.5 px-1.5 rounded-[4px] uppercase">{record.paymentMethod.replace('_', ' ')}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Free (Warranty)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end">
                       <button onClick={() => printServiceReceipt(record)} className="text-gray-500 hover:text-gray-900 mx-1" title="Print Receipt">
                         <FileText size={16} />
                       </button>
                       {!record.isWarranty && record.serviceCharge > 0 && (
                         <button onClick={() => printServiceBill(record)} className="text-green-600 hover:text-green-800 mx-1" title="Print Bill">
                           <Download size={16} />
                         </button>
                       )}
                       <button onClick={() => { setEditingService(record); setServiceFormData({...record, equipmentType: record.equipmentType || 'Laptop', paymentMethod: record.paymentMethod || 'cash', paymentStatus: record.paymentStatus || 'pending', medeaPayment: record.medeaPayment || ''}); setIsAddingService(true); }} className="text-blue-500 hover:text-blue-700 mx-1" title="Edit Service/Payment">
                         <Edit2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Record Modal */}
      {isAddingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingService ? 'Update Service Ticket' : 'New Service Ticket'}</h2>
              <button onClick={() => { setIsAddingService(false); setEditingService(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto w-full">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serial Number</label>
                    <input type="text" value={serviceFormData.serialNumber} onChange={e => setServiceFormData({...serviceFormData, serialNumber: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                    <input type="text" value={serviceFormData.productName} onChange={e => setServiceFormData({...serviceFormData, productName: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Equipment Type</label>
                    <input type="text" placeholder="e.g. Laptop, Desktop, Printer" value={serviceFormData.equipmentType} onChange={e => setServiceFormData({...serviceFormData, equipmentType: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Status</label>
                    <select value={serviceFormData.status} onChange={e => setServiceFormData({...serviceFormData, status: e.target.value as any})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white">
                      <option value="received">Received</option>
                      <option value="in_progress">In Progress</option>
                      <option value="ready">Ready for Pickup</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                    <input type="text" value={serviceFormData.customerName} onChange={e => setServiceFormData({...serviceFormData, customerName: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Phone</label>
                    <input type="text" value={serviceFormData.customerPhone} onChange={e => setServiceFormData({...serviceFormData, customerPhone: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Description</label>
                  <textarea value={serviceFormData.issueDescription} onChange={e => setServiceFormData({...serviceFormData, issueDescription: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" rows={3}></textarea>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                   <div className="md:col-span-1">
                    <label className="flex items-center gap-2 mt-6 cursor-pointer">
                      <input type="checkbox" checked={serviceFormData.isWarranty} onChange={e => setServiceFormData({...serviceFormData, isWarranty: e.target.checked})} className="rounded text-[#EF4444] focus:ring-[#EF4444]" />
                      <span className="text-sm font-bold">In Warranty</span>
                    </label>
                   </div>
                   {!serviceFormData.isWarranty && (
                     <>
                       <div className="md:col-span-1">
                         <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Service Charge</label>
                         <input type="number" value={serviceFormData.serviceCharge} onChange={e => setServiceFormData({...serviceFormData, serviceCharge: Number(e.target.value)})} className="w-full border-gray-200 rounded-md" />
                       </div>
                       <div className="md:col-span-1">
                         <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                         <select value={serviceFormData.paymentMethod} onChange={e => setServiceFormData({...serviceFormData, paymentMethod: e.target.value})} className="w-full border-gray-200 rounded-md">
                           <option value="cash">Cash</option>
                           <option value="card">Card</option>
                           <option value="mfs">MFS (bKash/Nagad)</option>
                           <option value="media_payment">Media Payment</option>
                         </select>
                       </div>
                       <div className="md:col-span-1">
                         <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Payment Status</label>
                         <select value={serviceFormData.paymentStatus} onChange={e => setServiceFormData({...serviceFormData, paymentStatus: e.target.value as any})} className="w-full border-gray-200 rounded-md">
                           <option value="pending">Pending</option>
                           <option value="paid">Paid</option>
                         </select>
                       </div>
                       {(serviceFormData.paymentMethod === 'media_payment' || serviceFormData.paymentMethod === 'mfs') && (
                         <div className="col-span-2 md:col-span-4 mt-2 border-t border-gray-200 pt-3">
                           <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                             {serviceFormData.paymentMethod === 'media_payment' ? 'Media Payment Reference' : 'MFS Reference / Phone'}
                           </label>
                           <input type="text" placeholder="TrxID or Reference" value={serviceFormData.medeaPayment} onChange={e => setServiceFormData({...serviceFormData, medeaPayment: e.target.value})} className="w-full border-gray-200 rounded-md bg-white" />
                         </div>
                       )}
                     </>
                   )}
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={() => { setIsAddingService(false); setEditingService(null); }} className="px-6 py-2 border border-gray-200 rounded-md text-gray-600 font-bold hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSaveService} className="px-6 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600">Save Service Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
