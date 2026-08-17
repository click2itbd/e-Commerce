import React, { useState } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
import { Receipt, Search, Download, Filter, Eye, Printer, ShieldAlert, FileText, ArrowLeftRight, Trash2 } from 'lucide-react';

interface OrdersTabProps { orders: any[]; customers: any[]; orderSearchQuery: string; setOrderSearchQuery: (v: string) => void; orderStatusFilter: string; setOrderStatusFilter: (v: string) => void; orderStartDate: string; setOrderStartDate: (v: string) => void; orderEndDate: string; setOrderEndDate: (v: string) => void; orderSort: any; setOrderSort: (v: any) => void; selectedOrderIds: string[]; setSelectedOrderIds: (v: string[]) => void; handleExportFilteredOrders: () => void; handleBulkUpdateOrderStatus: (s: string) => void; handleBulkReturnOrders: () => void; handleBulkExportOrders: () => void; handleBulkDeleteOrders: () => void; setSelectedLedgerEntity: (v: any) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; updateOrderDiscount?: (id: string, v: number) => void; updateOrderStatus?: (id: string, s: OrderStatus) => void; generatePDF?: (order: any, type: string) => void; }

const OrdersTab: React.FC<OrdersTabProps> = ({ orders, customers, orderSearchQuery, setOrderSearchQuery, orderStatusFilter, setOrderStatusFilter, orderStartDate, setOrderStartDate, orderEndDate, setOrderEndDate, orderSort, setOrderSort, selectedOrderIds, setSelectedOrderIds, handleExportFilteredOrders, handleBulkUpdateOrderStatus, handleBulkReturnOrders, handleBulkExportOrders, handleBulkDeleteOrders, setSelectedLedgerEntity, setActiveTab, fetchData, updateOrderDiscount, updateOrderStatus, generatePDF }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-[#EF4444]" /> Order Management
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-2">
                  {orders.filter(order => {
                    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
                    const matchesSearch = order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                                        order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                        order.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
                    const orderDate = order.createdAt.split('T')[0];
                    const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
                    const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
                    return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
                  }).length} Orders
                </span>
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by ID, Name or Phone..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Status:</label>
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value as OrderStatus | 'all')}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
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
                    onChange={e => setOrderStartDate(e.target.value)}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">To:</label>
                  <input
                    type="date"
                    value={orderEndDate}
                    onChange={e => setOrderEndDate(e.target.value)}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Sort:</label>
                  <select
                    value={orderSort}
                    onChange={e => setOrderSort(e.target.value as any)}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
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
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total & Payment</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Generate Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders
                    .filter(order => {
                      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
                      const matchesSearch = order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                                          order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                          order.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
                      const orderDate = order.createdAt.split('T')[0];
                      const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
                      const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
                      return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
                    })
                    .sort((a, b) => {
                      if (orderSort === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      if (orderSort === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      if (orderSort === 'total_desc') return b.total - a.total;
                      if (orderSort === 'total_asc') return a.total - b.total;
                      return 0;
                    })
                    .map(order => (
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
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
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
                            {order.customerName}
                          </button>
                          <span className="text-xs text-gray-500">{order.customerPhone}</span>
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
                            {order.discountAmount && order.discountAmount > 0 ? (
                              <div className="text-[10px] text-gray-400 line-through">
                                {formatCurrency(order.items.reduce((acc, item) => acc + item.price * item.quantity, 0), settings)}
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
                                if (!isNaN(val) && val !== (order.discountAmount || 0)) {
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
                          onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          disabled={!hasPermission('manage_orders')}
                          className="text-xs border-gray-200 rounded-md focus:ring-[#EF4444] disabled:bg-gray-50 disabled:text-gray-500"
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
  );
};

export default OrdersTab;
