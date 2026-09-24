import React, { useMemo, useState } from 'react';
import { Order, Customer } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { Search, Filter, Download, ExternalLink, Printer, Edit2, Trash2, Eye, X, Database } from 'lucide-react';
import { generatePDF } from '../../lib/pdf';
import { getOrderCategory } from '../admin/tabs/sales/Orders'; // Reuse classification logic
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

interface EcommerceOrdersProps {
  orders: Order[];
  customers: Customer[];
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
  handleDeleteOrder: (id: string) => Promise<void>;
}

export const EcommerceOrders: React.FC<EcommerceOrdersProps> = ({
  orders,
  customers,
  updateOrderStatus,
  handleDeleteOrder
}) => {
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [seeding, setSeeding] = useState(false);

  const handleLoadDummyData = async () => {
    setSeeding(true);
    const toastId = toast.loading('Adding dummy orders...');
    try {
      const dummyOrders = [
        {
          customerId: "dummy-cust-1",
          customerName: "Jane Doe",
          customerPhone: "01711000001",
          type: "invoice",
          status: "pending",
          saleSource: "ecommerce",
          items: [
            { productId: "dummy-prod-1", name: "Sony PlayStation 5 Pro", quantity: 1, sellingPrice: 50000, purchasePrice: 45000, discount: 0, tax: 0, subtotal: 50000 }
          ],
          subtotal: 50000,
          discount: 0,
          tax: 0,
          total: 50000,
          paidAmount: 0,
          paymentStatus: "unpaid",
          shippingAddress: "Banani, Dhaka",
          shippingCity: "Dhaka",
          shippingPhone: "01711000001",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          customerId: "dummy-cust-2",
          customerName: "Rafi Ahmed",
          customerPhone: "01811000002",
          type: "invoice",
          status: "processing",
          saleSource: "ecommerce",
          items: [
            { productId: "dummy-prod-2", name: "Apple iPhone 16 Pro Max", quantity: 1, sellingPrice: 150000, purchasePrice: 140000, discount: 0, tax: 0, subtotal: 150000 }
          ],
          subtotal: 150000,
          discount: 0,
          tax: 0,
          total: 150000,
          paidAmount: 150000,
          paymentStatus: "paid",
          paymentMethod: "bKash",
          shippingAddress: "Dhanmondi, Dhaka",
          shippingCity: "Dhaka",
          shippingPhone: "01811000002",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        }
      ];

      for (const item of dummyOrders) {
        await addDoc(collection(db, 'orders'), item);
      }
      toast.success('Dummy orders added successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add dummy orders', { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  // Filter ONLY e-commerce and pc-build orders
  const storeOrders = useMemo(() => {
    return orders.filter(o => {
      const cat = getOrderCategory(o);
      const isERP = o.saleSource === 'in_store' || o.type === 'quotation' || o.type === 'challan';
      return (cat === 'ecommerce' || cat === 'pc_build') && !isERP;
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return storeOrders.filter(order => {
      const matchesSearch = (order.documentNumber || order.id).toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (order.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (order.customerPhone || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || getOrderCategory(order) === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [storeOrders, searchQuery, statusFilter, categoryFilter]);

  const handlePrint = (order: Order) => {
    try {
      const pdfDoc = generatePDF(order as any, 'invoice', settings);
      pdfDoc.autoPrint();
      window.open(pdfDoc.output('bloburl'), '_blank');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleUpdateTracking = async (orderId: string, trackingNumber: string, courier: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { trackingNumber, courier });
      toast.success('Tracking information updated!');
      setViewingOrder(prev => prev ? { ...prev, trackingNumber, courier } : null);
    } catch (err) {
      toast.error('Failed to update tracking');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Store Orders</h2>
          <p className="text-gray-500 text-sm mt-1">Manage e-commerce and PC build orders.</p>
        </div>
        <button 
          onClick={handleLoadDummyData} 
          disabled={seeding}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {seeding ? <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div> : <Database size={16} />}
          Load Dummy Orders
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search orders by ID, Customer or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <select 
          value={categoryFilter} 
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <option value="all">All Store Orders</option>
          <option value="ecommerce">E-Commerce Only</option>
          <option value="pc_build">PC Builds Only</option>
        </select>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => {
                const cat = getOrderCategory(order);
                return (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{order.documentNumber || order.id.substring(0,8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
                        <span className="text-xs text-gray-500">{order.customerPhone || order.customerEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cat === 'pc_build' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cat === 'pc_build' ? 'PC Build' : 'E-Commerce'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded w-fit uppercase border-none focus:ring-0 cursor-pointer ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <option value="pending">PENDING</option>
                          <option value="processing">PROCESSING</option>
                          <option value="shipped">SHIPPED</option>
                          <option value="delivered">DELIVERED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                        
                        <select 
                          value={order.paymentStatus}
                          onChange={async (e) => {
                            const newPaymentStatus = e.target.value;
                            try {
                              await updateDoc(doc(db, 'orders', order.id), { paymentStatus: newPaymentStatus });
                              toast.success('Payment status updated!');
                              // This will not auto-refresh local state in EcommerceDashboard because we don't have setOrders here
                              // But wait, I can just reload the page or rely on the user to reload since I don't have the updateOrderPaymentStatus prop
                              setTimeout(() => window.location.reload(), 1000);
                            } catch (err: any) {
                              toast.error(`Error: ${err.message}`);
                            }
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit uppercase border-none focus:ring-0 cursor-pointer ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          <option value="unpaid">UNPAID</option>
                          <option value="paid">PAID</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total || 0, settings)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-colors">
                        <button onClick={() => setViewingOrder(order)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handlePrint(order)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print Invoice">
                          <Printer size={16} />
                        </button>
                        <button onClick={() => { if(window.confirm('Are you sure you want to delete this order?')) handleDeleteOrder(order.id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Order">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No orders found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setViewingOrder(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Order #{viewingOrder.documentNumber || viewingOrder.id.substring(0,8)}</h3>
              <button onClick={() => setViewingOrder(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Customer Details</p>
                  <p className="font-medium text-gray-900">{viewingOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{viewingOrder.customerPhone}</p>
                  <p className="text-sm text-gray-600">{viewingOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Shipping Address</p>
                  <p className="text-sm text-gray-700">{viewingOrder.shippingAddress || 'No address provided'}</p>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-gray-600">Item</th>
                      <th className="px-4 py-2 text-right text-gray-600">Qty</th>
                      <th className="px-4 py-2 text-right text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewingOrder.items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency((item.price || item.sellingPrice || 0) * (item.quantity || 1), settings)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-right text-gray-900">Total:</td>
                      <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(viewingOrder.total || 0, settings)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tracking Info Form */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase mb-3">Courier Tracking Info</p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateTracking(viewingOrder.id, formData.get('trackingNumber') as string, formData.get('courier') as string);
                }} className="flex flex-col sm:flex-row gap-3">
                  <input type="text" name="courier" defaultValue={viewingOrder.courier || ''} placeholder="Courier Name (e.g. Steadfast)" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500" required />
                  <input type="text" name="trackingNumber" defaultValue={viewingOrder.trackingNumber || ''} placeholder="Tracking Number" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500" required />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Update</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
