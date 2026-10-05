import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
export type OrderStatus = string;
export const DEFAULT_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
import { Phone, Mail, MapPin,  Eye, ChevronDown, ChevronRight, Copy, Receipt, Search, Download, Filter, Printer, ShieldAlert, FileText, ArrowLeftRight, Trash2, Globe, Server, Cpu, ShoppingBag, Layers, Truck, X , ShieldCheck } from 'lucide-react';
import EditOrderModal from '../../modals/EditOrderModal';
import { Edit2 } from 'lucide-react';
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
  const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedOrderIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedOrderIds(newSet);
  };
  const { settings } = useSettings();
  const activeStatuses = (settings as any)?.customOrderStatuses || DEFAULT_ORDER_STATUSES;

  const actualOrders = orders.filter(o => o.type !== 'quotation');
  
  const categoryCounts = {
    all: actualOrders.length,
    ecommerce: actualOrders.filter(o => getOrderCategory(o) === 'ecommerce').length,
    pc_build: actualOrders.filter(o => getOrderCategory(o) === 'pc_build').length,
    domain: actualOrders.filter(o => getOrderCategory(o) === 'domain').length,
    hosting: actualOrders.filter(o => getOrderCategory(o) === 'hosting').length,
  };

  const processedOrders = actualOrders.filter(order => {
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
      const getNum = (obj) => {
        const str = obj.documentNumber || obj.id || '';
        const match = str.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };

      if (orderSort === 'date_desc') {
        return getNum(b) - getNum(a);
      }
      if (orderSort === 'date_asc') {
        return getNum(a) - getNum(b);
      }
      if (orderSort === 'total_desc') return (b.total || 0) - (a.total || 0);
      if (orderSort === 'total_asc') return (a.total || 0) - (b.total || 0);
      return 0;
    });

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Category Tabs Header */}
        <div className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-[#EF4444]" /> Order Management
            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full ml-2">
              {processedOrders.length} of {actualOrders.length} Orders
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
      <div className="px-6 mt-4 flex items-center justify-between flex-wrap gap-4 flex-shrink-0">
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
              {activeStatuses.map((s: string) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
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
          <button
            onClick={handleExportFilteredOrders}
            className="bg-[#081621] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm shadow-sm"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Quick Date Presets */}
      <div className="px-6 mt-3 flex items-center gap-2 overflow-x-auto pb-2 shrink-0">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mr-2">Quick Dates:</span>
        <button onClick={() => {
          const d = new Date().toISOString().split('T')[0];
          setOrderStartDate(d); setOrderEndDate(d); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">Today</button>
        <button onClick={() => {
          const d = new Date(); d.setDate(d.getDate() - 1);
          const ds = d.toISOString().split('T')[0];
          setOrderStartDate(ds); setOrderEndDate(ds); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">Yesterday</button>
        <button onClick={() => {
          const end = new Date().toISOString().split('T')[0];
          const d = new Date(); d.setDate(d.getDate() - 7);
          const start = d.toISOString().split('T')[0];
          setOrderStartDate(start); setOrderEndDate(end); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">Last 7 Days</button>
        <button onClick={() => {
          const d = new Date();
          const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
          setOrderStartDate(start); setOrderEndDate(end); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">This Month</button>
        <button onClick={() => {
          setOrderStartDate(''); setOrderEndDate(''); setCurrentPage(1);
        }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-[10px] font-bold uppercase rounded-md transition-colors shadow-sm">Clear</button>
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
                        {activeStatuses.map((s: string) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
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

            <div className="overflow-x-auto rounded-xl border border-gray-200 mx-6 mb-6 mt-4 shadow-sm flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#081621] text-xs font-bold text-white uppercase tracking-wider">
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
                        }).length && actualOrders.length > 0}
                        onChange={(e) => {
                          const filteredOrders = actualOrders.filter(o => {
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
                    
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total & Payment</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Prepared By</th>
                    <th className="px-6 py-4 text-right">Generate Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentOrders.map(order => {
                    const cat = getOrderCategory(order);
                    return (
                      <React.Fragment key={order.id}>
                      <tr className={cn(
                        "hover:bg-gray-50 transition-colors cursor-pointer",
                        selectedOrderIds.includes(order.id) ? "bg-red-50/50" : (expandedOrderIds.has(order.id) ? "bg-blue-50/30" : "")
                      )} onClick={() => toggleRow(order.id)}>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                            <div className="flex items-center gap-2">
                            {expandedOrderIds.has(order.id) ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            #{order.documentNumber || order.id.slice(0, 8)}
                            {order.saleSource === 'online' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                                ONLINE
                              </span>
                            )}
                            </div>
                          </td>
                        
                        <td className="px-6 py-4 text-xs text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <button
                              onClick={(e) => { e.stopPropagation(); const customer = customers.find(c => c.name === order.customerName);
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
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-gray-900">{formatCurrency(order.total, settings)}</span>
                                {order.paymentStatus === 'paid' && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200">Paid</span>}
                                {order.paymentStatus === 'partial' && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-200">Partial</span>}
                                {(order.paymentStatus === 'unpaid' || !order.paymentStatus) && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider border border-red-200">Due</span>}
                              </div>
                              <div className="text-[10.5px] text-gray-500 font-bold -mt-0.5">
                                Paid: <span className="text-gray-700">{formatCurrency(order.paidAmount || 0, settings)}</span>
                              </div>
                              {order.paymentMethod && (
                                <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase bg-gray-100 text-gray-600 inline-block w-fit mt-0.5">
                                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                   order.paymentMethod === 'bkash' ? 'bKash' : 
                                   order.paymentMethod === 'nagad' ? 'Nagad' : 
                                   order.paymentMethod === 'rocket' ? 'Rocket' : 
                                   order.paymentMethod === 'bank' ? 'Bank Transfer' : 
                                   order.paymentMethod === 'pos' ? 'POS' : 'Other Gateway'}
                                </span>
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
                              onClick={(e)=>e.stopPropagation()} onBlur={(e) => {
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
                            onClick={(e)=>e.stopPropagation()} onChange={e => updateOrderStatus && updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            disabled={!hasPermission('manage_orders')}
                            className="w-full text-xs border-gray-200 rounded-md focus:ring-[#EF4444] disabled:bg-gray-50 disabled:text-gray-500 font-semibold"
                          >
                            {activeStatuses.map((s: string) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">{order.createdBy || "Admin"}</td>
                          <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            
                              <button
                                 onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }}
                                 className="p-1.5 px-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold border border-gray-200 bg-white shadow-sm"
                                 title="Edit Order"
                               >
                                 <Edit2 size={14} /> Edit
                               </button>
                              <button
                               onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }}
                               className="p-1.5 px-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold border border-gray-200 bg-white shadow-sm"
                               title="View Order"
                             >
                               <Eye size={14} /> View
                             </button>
                            {(order.status === 'shipped' || order.status === 'delivered' || order.courierName) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setShippingModalOrder(order); }}
                                className="p-1.5 px-3 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all flex items-center gap-1 text-xs font-bold shadow-sm"
                                title="Shipping Details"
                              >
                                <Truck size={14} /> Shipping
                              </button>
                            )}
                            {generatePDF && (
                              <div className="relative group">
                                <button onClick={(e)=>e.stopPropagation()} className="p-1.5 px-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold border border-gray-200 bg-white">
                                  <Download size={14} /> Docs ▾
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col overflow-hidden py-1">
                                  <button onClick={(e) => { e.stopPropagation(); generatePDF(order, 'invoice'); }} className="text-left px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-red-50 hover:text-[#EF4444] transition-colors">Invoice</button>
                                  <button onClick={(e) => { e.stopPropagation(); generatePDF(order, 'challan'); }} className="text-left px-4 py-2 text-[11px] font-bold text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors">Challan</button>
                                </div>
                              </div>
                            )}
                            {handleDeleteOrder && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order); }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all flex items-center justify-center"
                                title="Delete Sale"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedOrderIds.has(order.id) && (
                        <tr className="bg-gray-50/30 border-b-2 border-gray-100">
                          <td colSpan={7} className="p-0">
                            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner bg-white/60 m-2 rounded-xl border border-gray-200">
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><ShoppingBag size={14}/> Ordered Items</h4>
                                <ul className="space-y-2">
                                  {order.items?.map((item: any, i: number) => (
                                    <li key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                      <span className="font-medium text-gray-700">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                                      <span className="font-bold text-gray-900">{formatCurrency((item.price || 0) * (item.quantity || 1), settings)}</span>
                                    </li>
                                  ))}
                                  {order.discountAmount > 0 && (
                                    <li className="flex justify-between items-center text-sm pt-1">
                                      <span className="font-medium text-[#EF4444]">Discount</span>
                                      <span className="font-bold text-[#EF4444]">- {formatCurrency(order.discountAmount, settings)}</span>
                                    </li>
                                  )}
                                  <li className="flex justify-between items-center text-sm pt-2 font-black text-lg">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">{formatCurrency(order.total, settings)}</span>
                                  </li>
                                </ul>
                              </div>
                              <div className="space-y-4">
                                <div>
                                   <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Truck size={14}/> Shipping & Tracking</h4>
                                   {order.shippingAddress ? <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md mb-3 border border-gray-200">{order.shippingAddress}</p> : <p className="text-sm text-gray-400 italic mb-2">No shipping address provided</p>}
                                   
                                   <form className="flex flex-col sm:flex-row gap-2" onSubmit={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const form = e.target as HTMLFormElement;
                                      const courierName = (form.elements.namedItem('courierName') as HTMLInputElement).value;
                                      const trackingNumber = (form.elements.namedItem('trackingNumber') as HTMLInputElement).value;
                                      try {
                                        await updateDoc(doc(db, 'orders', order.id), { courierName, trackingNumber });
                                        toast.success('Tracking details updated!');
                                      } catch (err) {
                                        toast.error('Failed to update tracking details');
                                      }
                                   }}>
                                     <input type="text" name="courierName" defaultValue={order.courierName || ''} placeholder="Courier (e.g. Pathao)" onClick={(e)=>e.stopPropagation()} className="flex-1 text-sm font-semibold px-3 py-2 border border-gray-200 rounded focus:border-[#EF4444] focus:ring-[#EF4444]" />
                                     <input type="text" name="trackingNumber" defaultValue={order.trackingNumber || ''} placeholder="Tracking Number" onClick={(e)=>e.stopPropagation()} className="flex-1 text-sm font-semibold px-3 py-2 border border-gray-200 rounded focus:border-[#EF4444] focus:ring-[#EF4444]" />
                                     <button type="submit" onClick={(e)=>e.stopPropagation()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors shadow-sm">Save</button>
                                   </form>
                                   {order.courierName && (
                                     <div className="mt-2 text-xs font-medium text-gray-500">
                                       Currently shipped via <span className="font-bold text-gray-900">{order.courierName}</span> {order.trackingNumber && <span>(Tracking: {order.trackingNumber})</span>}
                                     </div>
                                   )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>

                    );
                  })}
                  {processedOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                        No orders found matching the selected category and filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
        </div>

        <div className="mt-auto border-t border-gray-100 flex-shrink-0">
          <Pagination
            currentPage={currentPage}
            totalItems={processedOrders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

      {/* Shipping Details Modal */}
      
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSuccess={() => {
            setEditingOrder(null);
            fetchData();
          }}
        />
      )}
      {shippingModalOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShippingModalOrder(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
              <h3 className="font-bold flex items-center gap-2 text-blue-900">
                <Truck className="text-blue-600" size={18} /> 
                Shipping Logistics
              </h3>
              <button onClick={() => setShippingModalOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const courierName = (form.elements.namedItem('courierName') as HTMLInputElement).value;
                const trackingNumber = (form.elements.namedItem('trackingNumber') as HTMLInputElement).value;
                
                try {
                  await updateDoc(doc(db, 'orders', shippingModalOrder.id), { courierName, trackingNumber });
                  toast.success('Shipping details updated');
                  if (fetchData) fetchData();
                  setShippingModalOrder(null);
                } catch (err) {
                  toast.error('Failed to update shipping details');
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="mb-2">
                <div className="text-xs font-bold text-gray-500 mb-1">Order Number</div>
                <div className="text-sm font-semibold text-gray-900">#{shippingModalOrder.documentNumber || shippingModalOrder.id.slice(0, 8)}</div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Courier Service Name</label>
                <input 
                  type="text" 
                  name="courierName"
                  defaultValue={shippingModalOrder.courierName || ''}
                  placeholder="e.g. Steadfast, Pathao, RedX" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!hasPermission('manage_orders')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tracking Number</label>
                <input 
                  type="text" 
                  name="trackingNumber"
                  defaultValue={shippingModalOrder.trackingNumber || ''}
                  placeholder="Enter parcel tracking number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!hasPermission('manage_orders')}
                />
              </div>

              {hasPermission('manage_orders') && (
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setShippingModalOrder(null)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">
                    Save Details
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      {/* Viewing Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 ring-1 ring-black/5">
            {/* Premium Header */}
            <div className="p-5 md:px-8 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/10 text-white rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-wide uppercase">
                    {viewingOrder.type === 'quotation' ? 'Quotation' : (viewingOrder.type === 'challan' ? 'Challan' : 'Invoice')}
                  </h2>
                  <p className="text-sm text-slate-300 font-medium tracking-wider">#{viewingOrder.documentNumber || viewingOrder.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { generatePDF(viewingOrder, viewingOrder.type || 'invoice'); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm">
                  <Download size={16}/> Download PDF
                </button>
                <button onClick={() => setViewingOrder(null)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <X size={24}/>
                </button>
              </div>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white">
              <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex-1 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Billed To</h3>
                  <div className="text-slate-900 font-black text-xl mb-3">{viewingOrder.customerName || 'Walk-in Customer'}</div>
                  <div className="space-y-1.5">
                    {viewingOrder.customerPhone && <div className="text-sm text-slate-600 flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {viewingOrder.customerPhone}</div>}
                    {viewingOrder.customerEmail && <div className="text-sm text-slate-600 flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {viewingOrder.customerEmail}</div>}
                    {viewingOrder.customerAddress && <div className="text-sm text-slate-600 flex items-start gap-2"><MapPin size={14} className="text-slate-400 shrink-0 mt-0.5"/> <span className="max-w-[250px] leading-snug">{viewingOrder.customerAddress}</span></div>}
                  </div>
                </div>
                
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex-1 md:max-w-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500 rounded-r-2xl"></div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Document Details</h3>
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="text-sm font-semibold text-slate-500">Date:</div>
                    <div className="text-sm font-bold text-slate-900 text-right">{new Date(viewingOrder.createdAt).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'})}</div>
                    
                    <div className="text-sm font-semibold text-slate-500">Status:</div>
                    <div className="text-right flex justify-end">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border",
                        viewingOrder.status === 'delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        viewingOrder.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {viewingOrder.status}
                      </span>
                    </div>
                    
                    <div className="text-sm font-semibold text-slate-500">Prepared By:</div>
                    <div className="text-sm font-bold text-slate-900 text-right">{viewingOrder.userId || 'Admin'}</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="py-4 px-4 w-12 text-center">#</th>
                      <th className="py-4 px-4">Item Description</th>
                      <th className="py-4 px-4 text-center">Qty</th>
                      <th className="py-4 px-4 text-right">Price</th>
                      <th className="py-4 px-5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {viewingOrder.items?.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 text-center text-slate-400 font-bold">{i + 1}</td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.selectedSerials?.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-1">
                              {item.selectedSerials.map((s: string) => (
                                <span key={s} className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm font-medium">{s}</span>
                              ))}
                            </div>
                          )}
                          {item.warrantyMonths > 0 && (
                            <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold mt-2 border border-emerald-100">
                              <ShieldCheck size={10}/> Warranty: {item.warrantyMonths} Mos
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-700">
                          <span className="text-base">{item.quantity}</span>
                          <span className="text-[10px] text-slate-400 ml-1 uppercase">{item.unit || 'pcs'}</span>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-slate-600">{formatCurrency(item.price, settings)}</td>
                        <td className="py-4 px-5 text-right font-black text-slate-900">{formatCurrency(item.price * item.quantity, settings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1 space-y-4">
                  {viewingOrder.notes && (
                    <div className="bg-amber-50/60 border border-amber-200/60 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                      <h4 className="text-[10px] font-black text-amber-800/60 uppercase tracking-widest mb-2">Order Notes</h4>
                      <p className="text-sm font-medium text-amber-900/80 whitespace-pre-wrap leading-relaxed">{viewingOrder.notes}</p>
                    </div>
                  )}
                  {viewingOrder.courierName && (
                    <div className="bg-indigo-50/60 border border-indigo-200/60 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <h4 className="text-[10px] font-black text-indigo-800/60 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Truck size={12}/> Shipping Details</h4>
                      <div className="text-sm font-medium text-indigo-900/80 space-y-1">
                        <div><span className="text-indigo-800/60 font-bold uppercase text-[10px] tracking-wider w-16 inline-block">Courier:</span> {viewingOrder.courierName}</div>
                        {viewingOrder.trackingNumber && <div><span className="text-indigo-800/60 font-bold uppercase text-[10px] tracking-wider w-16 inline-block">Tracking:</span> {viewingOrder.trackingNumber}</div>}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-[340px] bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Subtotal</span>
                      <span className="text-slate-900">{formatCurrency((viewingOrder.total || 0) + (viewingOrder.discount || 0), settings)}</span>
                    </div>
                    {(viewingOrder.discount > 0) && (
                      <div className="flex justify-between font-bold text-red-500 bg-red-50 px-2 py-1 -mx-2 rounded-lg">
                        <span>Discount</span>
                        <span>-{formatCurrency(viewingOrder.discount, settings)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-slate-900 text-lg pt-4 border-t border-slate-100">
                      <span>Net Total</span>
                      <span>{formatCurrency(viewingOrder.total || 0, settings)}</span>
                    </div>
                    {viewingOrder.type !== 'quotation' && (
                      <div className="pt-2 space-y-2">
                        <div className="flex justify-between text-emerald-600 bg-emerald-50 px-3 py-2 -mx-3 rounded-xl border border-emerald-100">
                          <span className="font-bold text-xs uppercase tracking-wider self-center">Paid</span>
                          <span className="font-black text-base">{formatCurrency(viewingOrder.amountPaid || 0, settings)}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 bg-rose-50 px-3 py-2 -mx-3 rounded-xl border border-rose-100">
                          <span className="font-bold text-xs uppercase tracking-wider self-center">Due</span>
                          <span className="font-black text-base">{formatCurrency(Math.max(0, (viewingOrder.total || 0) - (viewingOrder.amountPaid || 0)), settings)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrdersTab;
