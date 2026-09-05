import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { ShieldCheck, Search, Filter, Wrench, Printer, RefreshCw, X, Plus, Settings, FileText, Download, Edit2, Truck } from 'lucide-react';

interface ServiceRecord {
  id: string;
  serialNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  issueDescription: string;
  isWarranty: boolean;
  serviceCharge: number;
  status: string;
  receivedAt: string;
  equipmentType?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  
  // RMA Fields
  serviceType?: 'in_house' | 'rma';
  vendorId?: string;
  rmaStatus?: 'Pending Vendor' | 'Sent to Vendor' | 'Received from Vendor' | 'Delivered';
  newSerialNumber?: string;
}

interface SoldSerial {
  id: string;
  serial: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  warrantyEndDate: string;
  soldAt: string;
  orderId: string;
}

const Services: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();

  const [soldSerials, setSoldSerials] = useState<SoldSerial[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [vendors, setVendors] = useState<{id: string; name: string}[]>([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  
  const defaultFormData = {
    serialNumber: '',
    customerName: '',
    customerPhone: '',
    productName: '',
    issueDescription: '',
    isWarranty: false,
    serviceCharge: 0,
    status: 'received',
    equipmentType: 'Laptop',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    serviceType: 'in_house' as 'in_house' | 'rma',
    vendorId: '',
    rmaStatus: 'Pending Vendor' as any,
    newSerialNumber: '',
  };
  
  const [serviceFormData, setServiceFormData] = useState(defaultFormData);
  const [ledgerView, setLedgerView] = useState<'ledger' | 'products'>('products');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      // 1. Query sold_serials directly
      const serialsSnap = await getDocs(query(collection(db, 'sold_serials'), orderBy('soldAt', 'desc')));
      const serials: SoldSerial[] = serialsSnap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          serial: data.serial || '',
          productName: data.productName || 'Product',
          customerName: data.customerName || 'Walk-in Customer',
          customerPhone: data.customerPhone || '',
          warrantyEndDate: data.warrantyEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          soldAt: data.soldAt || new Date().toISOString(),
          orderId: data.orderId || data.orderDocumentNumber || docSnap.id,
        };
      });

      // 2. Also check recent orders for any items with selectedSerials
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)));
      ordersSnap.forEach(orderDoc => {
        const orderData = orderDoc.data();
        if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items.forEach((itm: any) => {
            if (itm.selectedSerials && Array.isArray(itm.selectedSerials)) {
              itm.selectedSerials.forEach((ser: string) => {
                if (!serials.some(s => s.serial.toLowerCase() === ser.toLowerCase())) {
                  const months = itm.warrantyMonths || 12;
                  const soldDate = orderData.createdAt || new Date().toISOString();
                  const endD = new Date(new Date(soldDate).getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
                  serials.push({
                    id: `${orderDoc.id}-${ser}`,
                    serial: ser,
                    productName: itm.name || 'Product',
                    customerName: orderData.customerName || 'Customer',
                    customerPhone: orderData.customerPhone || '',
                    warrantyEndDate: endD,
                    soldAt: soldDate,
                    orderId: orderData.documentNumber || orderDoc.id,
                  });
                }
              });
            }
          });
        }
      });

        setSoldSerials(serials);
  
        // 3. Fetch Service Records
        const servicesSnap = await getDocs(query(collection(db, 'services'), orderBy('receivedAt', 'desc')));
        setServiceRecords(servicesSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            serviceType: data.serviceType || 'in_house',
            vendorId: data.vendorId || '',
            rmaStatus: data.rmaStatus || 'Pending Vendor',
            newSerialNumber: data.newSerialNumber || '',
          } as ServiceRecord;
        }));
        
        // 4. Fetch Vendors
        const vendorsSnap = await getDocs(query(collection(db, 'vendors'), orderBy('name')));
        setVendors(vendorsSnap.docs.map(v => ({ id: v.id, name: v.data().name })));

      } catch (err) {
        console.error(err);
        toast.error('Failed to load service data');
      }
    };
  
    useEffect(() => {
    fetchData();
  }, []);

  const printServiceReceipt = (record: ServiceRecord) => {
    toast.success('Print receipt triggered');
  };

  const printServiceBill = (record: ServiceRecord) => {
    toast.success('Print bill triggered');
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serviceData = {
        ...serviceFormData,
        receivedAt: new Date().toISOString(),
      };

      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), serviceData);
        toast.success('Service updated successfully');
      } else {
        await addDoc(collection(db, 'services'), serviceData);
        toast.success('Service added successfully');
      }

      setIsAddingService(false);
      setEditingService(null);
      setServiceFormData({
        serialNumber: '',
        customerName: '',
        customerPhone: '',
        productName: '',
        issueDescription: '',
        isWarranty: false,
        serviceCharge: 0,
        status: 'received',
        equipmentType: 'Laptop',
        paymentMethod: 'cash',
        paymentStatus: 'pending',
      });
      fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const updateRmaStatus = async (record: ServiceRecord, newStatus: string, newSerial?: string) => {
    try {
      const updates: any = { rmaStatus: newStatus };
      if (newSerial) {
        updates.newSerialNumber = newSerial;
      }
      if (newStatus === 'Delivered') {
        updates.status = 'delivered'; // Also update the generic status
      }
      await updateDoc(doc(db, 'services', record.id), updates);
      toast.success(`RMA Status updated to ${newStatus}`);
      fetchData();
    } catch (error) {
      console.error('Error updating RMA status:', error);
      toast.error('Failed to update status');
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
            setServiceFormData(defaultFormData);
            setEditingService(null);
            setIsAddingService(true);
            if (ledgerView !== 'products') setLedgerView('products');
          }}
          className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Receive Product for Service
        </button>
      </div>

      {isAddingService && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-100 font-bold text-lg">
              {editingService ? 'Edit Service Record' : 'Add New Service Record'}
            </div>
            <form onSubmit={handleSaveService} className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
              {/* Service Type Selection */}
              <div className="flex items-center gap-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="font-bold text-gray-700">Service Type:</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="serviceType" value="in_house" checked={serviceFormData.serviceType === 'in_house'} onChange={() => setServiceFormData({...serviceFormData, serviceType: 'in_house'})} className="text-[#EF4444] focus:ring-[#EF4444]" />
                  <span>In-House Repair</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="serviceType" value="rma" checked={serviceFormData.serviceType === 'rma'} onChange={() => setServiceFormData({...serviceFormData, serviceType: 'rma'})} className="text-[#EF4444] focus:ring-[#EF4444]" />
                  <span>Warranty / RMA (Vendor)</span>
                </label>
              </div>

              {serviceFormData.serviceType === 'rma' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Select Supplier / Vendor</label>
                  <select
                    value={serviceFormData.vendorId}
                    onChange={e => setServiceFormData({ ...serviceFormData, vendorId: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required={serviceFormData.serviceType === 'rma'}
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serial Number</label>
                  <input
                    type="text"
                    required
                    value={serviceFormData.serialNumber}
                    onChange={e => setServiceFormData({ ...serviceFormData, serialNumber: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={serviceFormData.customerName}
                    onChange={e => setServiceFormData({ ...serviceFormData, customerName: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={serviceFormData.productName}
                    onChange={e => setServiceFormData({ ...serviceFormData, productName: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Description</label>
                  <textarea
                    required
                    value={serviceFormData.issueDescription}
                    onChange={e => setServiceFormData({ ...serviceFormData, issueDescription: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    rows={3}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    value={serviceFormData.customerPhone}
                    onChange={e => setServiceFormData({ ...serviceFormData, customerPhone: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Charge</label>
                  <input
                    type="number"
                    value={serviceFormData.serviceCharge}
                    onChange={e => setServiceFormData({ ...serviceFormData, serviceCharge: Number(e.target.value) || 0 })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#EF4444] text-white py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                  >
                    {editingService ? 'Update Service' : 'Save Service'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingService(false); setEditingService(null); }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
                        <div className="flex justify-between items-start mb-4">
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
                                equipmentType: 'Laptop',
                                paymentMethod: 'cash',
                                paymentStatus: 'pending',
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
                      <div className="text-xs font-mono text-gray-500">
                        {record.serialNumber}
                        {record.newSerialNumber && (
                          <span className="text-green-600 block mt-0.5">
                            ↳ Replaced: {record.newSerialNumber}
                          </span>
                        )}
                      </div>
                      {record.equipmentType && <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">{record.equipmentType}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {record.serviceType === 'rma' ? (
                          <>
                            <span className="px-2 py-1 rounded text-[10px] font-bold w-fit bg-indigo-100 text-indigo-800 flex items-center gap-1 border border-indigo-200">
                              <ShieldCheck size={12} /> VENDOR RMA
                            </span>
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold w-fit",
                              record.rmaStatus === 'Pending Vendor' ? "bg-amber-100 text-amber-800" :
                              record.rmaStatus === 'Sent to Vendor' ? "bg-blue-100 text-blue-800" :
                              record.rmaStatus === 'Received from Vendor' ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {record.rmaStatus?.toUpperCase()}
                            </span>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
                       {record.serviceType === 'rma' && (
                         <>
                           {record.rmaStatus === 'Pending Vendor' && (
                             <button onClick={() => updateRmaStatus(record, 'Sent to Vendor')} className="text-orange-500 hover:text-orange-700 mx-1 bg-orange-50 p-1.5 rounded" title="Send to Vendor">
                               <Truck size={16} />
                             </button>
                           )}
                           {record.rmaStatus === 'Sent to Vendor' && (
                             <button onClick={() => {
                               const newSerial = prompt('Enter new Serial Number if replaced (or leave blank if same):');
                               if (newSerial !== null) {
                                 updateRmaStatus(record, 'Received from Vendor', newSerial);
                               }
                             }} className="text-blue-500 hover:text-blue-700 mx-1 bg-blue-50 p-1.5 rounded" title="Receive from Vendor">
                               <RefreshCw size={16} />
                             </button>
                           )}
                           {record.rmaStatus === 'Received from Vendor' && (
                             <button onClick={() => updateRmaStatus(record, 'Delivered')} className="text-green-600 hover:text-green-800 mx-1 bg-green-50 p-1.5 rounded" title="Deliver to Customer">
                               <ShieldCheck size={16} />
                             </button>
                           )}
                         </>
                       )}
                       <button onClick={() => printServiceReceipt(record)} className="text-gray-500 hover:text-gray-900 mx-1" title="Print Receipt">
                         <FileText size={16} />
                       </button>
                       {!record.isWarranty && record.serviceCharge > 0 && (
                         <button onClick={() => printServiceBill(record)} className="text-green-600 hover:text-green-800 mx-1" title="Print Bill">
                           <Download size={16} />
                         </button>
                       )}
                       <button onClick={() => { setEditingService(record); setServiceFormData({...record, serviceType: record.serviceType || 'in_house', vendorId: record.vendorId || '', rmaStatus: record.rmaStatus || 'Pending Vendor', equipmentType: record.equipmentType || 'Laptop', paymentMethod: record.paymentMethod || 'cash', paymentStatus: record.paymentStatus || 'pending', medeaPayment: (record as any).medeaPayment || ''}); setIsAddingService(true); }} className="text-blue-500 hover:text-blue-700 mx-1" title="Edit Service/Payment">
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
    </div>
  );
};

export default Services;
