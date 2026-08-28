import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
import { Receipt, Search, Download, Filter, Eye, Printer, ShieldAlert, FileText, ArrowLeftRight, Trash2, Globe, Server, Cpu, ShoppingBag, Layers } from 'lucide-react';
import { Pagination } from '../../../../components/common/Pagination';

export type OrderCategory = 'all' | 'ecommerce' | 'pc_build' | 'domain' | 'hosting';

interface OrdersTabProps { orders: any[]; customers: any[]; orderSearchQuery: string; setOrderSearchQuery: (v: string) => void; orderStatusFilter: string; setOrderStatusFilter: (v: string) => void; orderStartDate: string; setOrderStartDate: (v: string) => void; orderEndDate: string; setOrderEndDate: (v: string) => void; orderSort: any; setOrderSort: (v: any) => void; selectedOrderIds: string[]; setSelectedOrderIds: (v: string[]) => void; handleExportFilteredOrders: () => void; handleBulkUpdateOrderStatus: (s: string) => void; handleBulkReturnOrders: () => void; handleBulkExportOrders: () => void; handleBulkDeleteOrders: () => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; updateOrderDiscount?: (id: string, v: number) => void; updateOrderStatus?: (id: string, status: OrderStatus) => void; generatePDF?: (order: any, type: 'invoice' | 'challan' | 'quotation') => void; handleDeleteOrder?: (order: any) => void; }

export const getOrderCategory = (order: any): 'ecommerce' | 'pc_build' | 'domain' | 'hosting' => {
  if (
    order.type === 'domain' ||
    order.items?.some((i: any) => i.itemType === 'domain' || i.itemType === 'domain_renewal' || i.itemType === 'domain_transfer') ||
    order.domain
  ) {
    return 'domain';
  }
  if (
    order.type === 'hosting' ||
    order.items?.some((i: any) => i.itemType === 'hosting') ||
    order.hostingServiceId ||
    order.packageId
  ) {
    return 'hosting';
  }
  if (
    order.type === 'pc_build' ||
    order.type === 'pc_builder' ||
    order.isPCBuild === true ||
    order.items?.some((i: any) => i.isPCBuild || i.category === 'pc_builder' || i.category === 'pc_build')
  ) {
    return 'pc_build';
  }
  return 'ecommerce';
};

const OrdersTab: React.FC<OrdersTabProps> = ({ orders, customers, orderSearchQuery, setOrderSearchQuery, orderStatusFilter, setOrderStatusFilter, orderStartDate, setOrderStartDate, orderEndDate, setOrderEndDate, orderSort, setOrderSort, selectedOrderIds, setSelectedOrderIds, handleExportFilteredOrders, handleBulkUpdateOrderStatus, handleBulkReturnOrders, handleBulkExportOrders, handleBulkDeleteOrders, setSelectedLedgerEntity, setActiveTab, fetchData, updateOrderDiscount, updateOrderStatus, generatePDF, handleDeleteOrder }) => {
  const { isAdmin, hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [orderCategoryFilter, setOrderCategoryFilter] = useState<OrderCategory>('all');
  const { settings } = useSettings();

  const categoryCounts = {
    all: orders.length,
    ecommerce: orders.filter(o => getOrderCategory(o) === 'ecommerce').length,
    pc_build: orders.filter(o => getOrderCategory(o) === 'pc_build').length,
    domain: orders.filter(o => getOrderCategory(o) === 'domain').length,
    hosting: orders.filter(o => getOrderCategory(o) === 'hosting').length,
  };

  const processedOrders = orders.filter(order => {
    const matchesCategory = orderCategoryFilter === 'all' || getOrderCategory(order) === orderCategoryFilter;
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    const matchesSearch = (order.documentNumber || order.id || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                          (order.customerName || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                          (order.customerPhone || '').toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                          (order.customerEmail || '').toLowerCase().includes(orderSearchQuery.toLowerCase());
    const orderDate = order.createdAt ? order.createdAt.split('T')[0] : '';
    const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
    const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
    return matchesCategory && matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
  }).sort((a, b) => {
    if (orderSort === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (orderSort === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (orderSort === 'total_desc') return (b.total || 0) - (a.total || 0);
    if (orderSort === 'total_asc') return (a.total || 0) - (b.total || 0);
    return 0;
  });

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden space-y-4">
      {/* Category Tabs Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-[#EF4444]" /> Order Management
            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full ml-2">
              {processedOrders.length} of {orders.length} Orders
            </span>
          </h2>
        </div>

        {/* Category Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-gray-100">
          <button
            onClick={() => { setOrderCategoryFilter('all'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              orderCategoryFilter === 'all'
                ? "bg-[#081621] text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Layers size={14} /> All Orders
            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", orderCategoryFilter === 'all' ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700")}>
              {categoryCounts.all}
            </span>
          </button>

          <button
            onClick={() => { setOrderCategoryFilter('ecommerce'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              orderCategoryFilter === 'ecommerce'
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            <ShoppingBag size={14} /> E-Commerce
            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", orderCategoryFilter === 'ecommerce' ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-800")}>
              {categoryCounts.ecommerce}
            </span>
          </button>

          <button
            onClick={() => { setOrderCategoryFilter('pc_build'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              orderCategoryFilter === 'pc_build'
                ? "bg-purple-600 text-white shadow-md"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            )}
          >
            <Cpu size={14} /> PC Build
            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", orderCategoryFilter === 'pc_build' ? "bg-white/20 text-white" : "bg-purple-200 text-purple-800")}>
              {categoryCounts.pc_build}
            </span>
          </button>

          <button
            onClick={() => { setOrderCategoryFilter('domain'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              orderCategoryFilter === 'domain'
                ? "bg-cyan-600 text-white shadow-md"
                : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
            )}
          >
            <Globe size={14} /> Domain
            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", orderCategoryFilter === 'domain' ? "bg-white/20 text-white" : "bg-cyan-200 text-cyan-800")}>
              {categoryCounts.domain}
            </span>
          </button>

          <button
            onClick={() => { setOrderCategoryFilter('hosting'); setCurrentPage(1); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
              orderCategoryFilter === 'hosting'
                ? "bg-blue-600 text-white shadow-md"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            )}
          >
            <Server size={14} /> Hosting
            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]", orderCategoryFilter === 'hosting' ? "bg-white/20 text-white" : "bg-blue-200 text-blue-800")}>
              {categoryCounts.hosting}
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="px-6 flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by Order ID, Name, Phone or Email..."
            value={orderSearchQuery}
            onChange={(e) => { setOrderSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Status:</label>
            <select
              value={orderStatusFilter}
              onChange={e => { setOrderStatusFilter(e.target.value as OrderStatus | 'all'); setCurrentPage(1); }}
              className="text-sm border-gray-200 rounded-lg focus:ring-[#EF4444] focus:border-[#EF4444]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">From:</label>
            <input
              type="date"
              value={orderStartDate}
              onChange={e => { setOrderStartDate(e.target.value); setCurrentPage(1); }}
              className="text-sm border-gray-200 rounded-lg focus:ring-[#EF4444] focus:border-[#EF4444]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">To:</label>
            <input
              type="date"
              value={orderEndDate}
              onChange={e => { setOrderEndDate(e.target.value); setCurrentPage(1); }}
              className="text-sm border-gray-200 rounded-lg focus:ring-[#EF4444] focus:border-[#EF4444]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Sort:</label>
            <select
              value={orderSort}
              onChange={e => setOrderSort(e.target.value as any)}
              className="text-sm border-gray-200 rounded-lg focus:ring-[#EF4444] focus:border-[#EF4444]"
            >
              <option value="date_desc">Date (Newest)</option>
              <option value="date_asc">Date (Oldest)</option>
              <option value="total_desc">Total (High-Low)</option>
              <option value="total_asc">Total (Low-High)</option>
            </select>
          </div>
        </div>
      </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={handleExportFilteredOrders}
                className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
              >
                <Download size={18} /> Export Filtered CSV
              </button>
            </div>
            {selectedOrderIds.length > 0 && (
              <div className="bg-[#081621] text-white p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">{selectedOrderIds.length} orders selected</span>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase font-bold">Update Status:</span>
                    <select
                      onChange={(e) => handleBulkUpdateOrderStatus(e.target.value as OrderStatus)}
                      className="bg-gray-800 border-gray-700 text-white text-xs rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      defaultValue=""
                    >
                      <option value="" disabled>Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <button
                    onClick={handleBulkReturnOrders}
                    className="flex items-center gap-2 text-sm hover:text-yellow-400 transition-colors font-bold"
                  >
                    <ArrowLeftRight size={16} /> Return Selected
                  </button>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <button
                    onClick={handleBulkExportOrders}
                    className="flex items-center gap-2 text-sm hover:text-[#EF4444] transition-colors font-bold"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button
                    onClick={handleBulkDeleteOrders}
                    className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors font-bold"
                  >
                    <Trash2 size={16} /> Delete Selected
                  </button>
                </div>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="text-xs uppercase tracking-wider font-bold hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.length === orders.filter(o => {
                          const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                          const matchesSearch = o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                                              o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                              o.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
                          const orderDate = o.createdAt.split('T')[0];
                          const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
                          const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
                          return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
                        }).length && orders.length > 0}
                        onChange={(e) => {
                          const filteredOrders = orders.filter(o => {
                            const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                            const matchesSearch = o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                                                o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                                o.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
                            const orderDate = o.createdAt.split('T')[0];
                            const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
                            const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
                            return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
                          });
                          if (e.target.checked) {
                            setSelectedOrderIds(filteredOrders.map(o => o.id));
                          } else {
                            setSelectedOrderIds([]);
                          }
                        }}
                        className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                      />
                    </th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total & Payment</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Generate Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentOrders.map(order => {
                    const cat = getOrderCategory(order);
                    return (
                      <tr key={order.id} className={cn(
                        "hover:bg-gray-50 transition-colors",
                        selectedOrderIds.includes(order.id) && "bg-red-50/50"
                      )}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrderIds([...selectedOrderIds, order.id]);
                              } else {
                                setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                              }
                            }}
                            className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                          />
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                            #{order.documentNumber || order.id.slice(0, 8)}
                            {order.saleSource === 'online' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                                ONLINE
                              </span>
                            )}
                          </td>
                        <td className="px-6 py-4">
                          {cat === 'domain' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                              <Globe size={13} /> Domain
                            </span>
                          )}
                          {cat === 'hosting' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Server size={13} /> Hosting
                            </span>
                          )}
                          {cat === 'pc_build' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Cpu size={13} /> PC Build
                            </span>
                          )}
                          {cat === 'ecommerce' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShoppingBag size={13} /> E-Commerce
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                const customer = customers.find(c => c.name === order.customerName);
                                if (customer) {
                                  setSelectedLedgerEntity({ id: customer.id, name: customer.name, type: 'customer' });
                                } else {
                                  toast.error('Customer details not found');
                                }
                              }}
                              className="text-sm font-bold text-[#EF4444] hover:underline text-left"
                            >
                              {order.customerName || 'N/A'}
                            </button>
                            <span className="text-xs text-gray-500">{order.customerPhone || order.customerEmail || ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-sm font-bold text-[#EF4444]">{formatCurrency(order.total, settings)}</span>
                            {order.paymentMethod && (
                              <div className="flex flex-col gap-0.5">
                                <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase bg-gray-100 text-gray-600 inline-block w-fit">
                                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                   order.paymentMethod === 'bkash' ? 'bKash' : 
                                   order.paymentMethod === 'nagad' ? 'Nagad' : 
                                   order.paymentMethod === 'rocket' ? 'Rocket' : 
                                   order.paymentMethod === 'cellfin' ? 'Cellfin' : 
                                   order.paymentMethod === 'card' ? 'Visa/Mastercard' : 
                                   order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Other Gateway'}
                                </span>
                                {order.paymentReference && (
                                  <span className="text-[10px] text-gray-500 max-w-[120px] truncate" title={order.paymentReference}>
                                    Ref: {order.paymentReference}
                                  </span>
                                )}
                              </div>
                            )}
                            {order.discountAmount && order.discountAmount > 0 && order.items?.length ? (
                              <div className="text-[10px] text-gray-400 line-through">
                                {formatCurrency(order.items.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 1), 0), settings)}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={order.discountAmount || 0}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val !== (order.discountAmount || 0) && updateOrderDiscount) {
                                  updateOrderDiscount(order.id, val);
                                }
                              }}
                              disabled={!hasPermission('manage_orders')}
                              className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444] disabled:bg-gray-50"
                              placeholder="0.00"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus && updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            disabled={!hasPermission('manage_orders')}
                            className="text-xs border-gray-200 rounded-md focus:ring-[#EF4444] disabled:bg-gray-50 disabled:text-gray-500 font-semibold"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="returned">Returned</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {generatePDF && (
                              <>
                                <button
                                  onClick={() => generatePDF(order, 'invoice')}
                                  className="p-2 text-gray-600 hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold"
                                  title="Invoice"
                                >
                                  <Download size={16} /> Invoice
                                </button>
                                <button
                                  onClick={() => generatePDF(order, 'quotation')}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold"
                                  title="Quotation"
                                >
                                  <Download size={16} /> Quotation
                                </button>
                                <button
                                  onClick={() => generatePDF(order, 'challan')}
                                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold"
                                  title="Challan"
                                >
                                  <Download size={16} /> Challan
                                </button>
                              </>
                            )}
                            {handleDeleteOrder && (
                              <button
                                onClick={() => handleDeleteOrder(order)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all flex items-center justify-center"
                                title="Delete Sale"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {processedOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">
                        No orders found matching the selected category and filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={processedOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
  );
};

export default OrdersTab;


