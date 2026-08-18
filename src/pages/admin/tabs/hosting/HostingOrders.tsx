import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { Server, Search, Eye, X, Globe, Download, Loader2, FileText } from 'lucide-react';
import { HostingOrder, DomainOrder, HostingAccount } from '../../../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSettings } from '../../../../context/SettingsContext';
import { sendServiceActivationEmail, getEmailLogsForOrder, EmailLog } from '../../../../services/emailService';

export default function HostingOrders() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<HostingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<HostingOrder | null>(null);
  const [domainOrders, setDomainOrders] = useState<DomainOrder[]>([]);
  const [hostingAccounts, setHostingAccounts] = useState<HostingAccount[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  const [showEmailLogs, setShowEmailLogs] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'hostingOrders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetchedOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HostingOrder[];
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching hosting orders:', error);
      toast.error('Failed to load hosting orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setLoadingDetails(true);
    try {
      const domainQ = query(collection(db, 'domainOrders'), where('orderId', '==', orderId));
      const domainSnap = await getDocs(domainQ);
      setDomainOrders(domainSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DomainOrder[]);

      const hostingQ = query(collection(db, 'hostingAccounts'), where('orderId', '==', orderId));
      const hostingSnap = await getDocs(hostingQ);
      setHostingAccounts(hostingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HostingAccount[]);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewOrder = (order: HostingOrder) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.id);
  };

  const handleViewEmailLogs = async () => {
    if (!selectedOrder) return;
    setShowEmailLogs(true);
    setLoadingEmailLogs(true);
    const logs = await getEmailLogsForOrder(selectedOrder.id);
    setEmailLogs(logs);
    setLoadingEmailLogs(false);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setDomainOrders([]);
    setHostingAccounts([]);
    setShowEmailLogs(false);
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setStatusUpdating(true);
    try {
      await updateDoc(doc(db, 'hostingOrders', selectedOrder.id), {
        status: newStatus
      });
      toast.success('Order status updated');
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus as any } : o));
      setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const updateServiceStatus = async (collectionName: 'domainOrders' | 'hostingAccounts', documentId: string, newStatus: string, updates: any = {}) => {
    try {
      await updateDoc(doc(db, collectionName, documentId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...updates
      });
      toast.success(`${collectionName === 'domainOrders' ? 'Domain' : 'Hosting account'} updated!`);
      if (collectionName === 'domainOrders') {
        setDomainOrders(prev => prev.map(d => d.id === documentId ? { ...d, status: newStatus, ...updates } : d));
      } else {
        setHostingAccounts(prev => prev.map(h => h.id === documentId ? { ...h, status: newStatus, ...updates } : h));
      }

      if (newStatus === 'active') {
        const wantsEmail = window.confirm("Service is now Active! Do you want to send the Service Activation Email to the customer?");
        if (wantsEmail && selectedOrder) {
          const serviceName = collectionName === 'domainOrders' 
            ? domainOrders.find(d => d.id === documentId)?.domain 
            : hostingAccounts.find(h => h.id === documentId)?.planId;
          
          let serverIp = updates.serverIp || hostingAccounts.find(h => h.id === documentId)?.serverIp;
          let controlPanelUrl = updates.controlPanelUrl || hostingAccounts.find(h => h.id === documentId)?.controlPanelUrl;

          toast.loading("Sending email...", { id: 'emailSend' });
          const success = await sendServiceActivationEmail(selectedOrder.id, selectedOrder.customerEmail, {
            domain: serviceName,
            serverIp,
            controlPanelUrl
          });
          if (success) {
            toast.success("Email sent & logged successfully!", { id: 'emailSend' });
          } else {
            toast.error("Failed to send email.", { id: 'emailSend' });
          }
        }
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('Failed to update service status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const generateInvoice = (order: HostingOrder) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let currentY = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.companyName || 'Hosting Provider', 14, currentY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    currentY += 6;
    doc.text(settings?.contactEmail || '', 14, currentY);
    currentY += 5;
    doc.text(settings?.contactPhone || '', 14, currentY);
    
    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.text('INVOICE', pageWidth - 14, 20, { align: 'right' });

    currentY += 15;
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 5;
    doc.text(order.customerName, 14, currentY);
    currentY += 5;
    doc.text(order.customerEmail, 14, currentY);
    currentY += 5;
    doc.text(order.customerPhone, 14, currentY);
    
    let detailsY = currentY - 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details:', pageWidth - 60, detailsY);
    doc.setFont('helvetica', 'normal');
    detailsY += 5;
    doc.text(`Invoice No: ${order.documentNumber || order.id.slice(0, 8)}`, pageWidth - 60, detailsY);
    detailsY += 5;
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, pageWidth - 60, detailsY);
    detailsY += 5;
    doc.text(`Status: ${order.status.toUpperCase()}`, pageWidth - 60, detailsY);

    currentY += 15;

    const tableBody = (order.items || []).map(item => [
      item.name,
      item.itemType === 'domain' ? `${item.termYears || 1} Year(s)` : (item.billingCycle || 'Monthly'),
      formatCurrency(item.price),
      formatCurrency(item.price)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Term/Cycle', 'Price', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [10, 22, 40] },
      styles: { fontSize: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    const totalX = pageWidth - 60;
    doc.text('Subtotal:', totalX, currentY);
    doc.text(formatCurrency(order.total), pageWidth - 14, currentY, { align: 'right' });
    
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', totalX, currentY);
    doc.text(formatCurrency(order.total), pageWidth - 14, currentY, { align: 'right' });

    doc.save(`Invoice_${order.documentNumber || order.id.slice(0, 8)}.pdf`);
    toast.success('Invoice generated successfully!');
  };

  const filteredOrders = orders.filter(o => 
    o.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Server className="w-6 h-6 text-blue-600" />
          Hosting & Domain Orders
        </h2>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Order ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Total</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hosting orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.documentNumber || order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(order.status))}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order {selectedOrder.documentNumber || selectedOrder.id}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleViewEmailLogs}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                >
                  Email History
                </button>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Customer Details</h4>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p><span className="font-medium text-gray-900">Name:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-medium text-gray-900">Email:</span> {selectedOrder.customerEmail}</p>
                    <p><span className="font-medium text-gray-900">Phone:</span> {selectedOrder.customerPhone}</p>
                    {selectedOrder.company && <p><span className="font-medium text-gray-900">Company:</span> {selectedOrder.company}</p>}
                    <p><span className="font-medium text-gray-900">Address:</span> {selectedOrder.shippingAddress}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Order Summary</h4>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p><span className="font-medium text-gray-900">Payment Method:</span> <span className="uppercase">{selectedOrder.paymentMethod}</span></p>
                    <p><span className="font-medium text-gray-900">Shipping:</span> {formatCurrency(selectedOrder.shippingCost)}</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">Total: {formatCurrency(selectedOrder.total)}</p>
                    
                    <div className="mt-4 flex items-center gap-3">
                      <span className="font-medium text-gray-900">Status:</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateOrderStatus(e.target.value)}
                        disabled={statusUpdating}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed / Active</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {statusUpdating && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                    </div>
                  </div>
                </div>
              </div>

              {loadingDetails ? (
                <div className="py-8 text-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading provisioning details...
                </div>
              ) : (
                <div className="space-y-6">
                  {domainOrders.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        Domain Registrations
                      </h4>
                      <div className="grid gap-3">
                        {domainOrders.map(domain => (
                          <div key={domain.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-gray-900 text-lg">{domain.domain}</p>
                                <p className="text-xs text-gray-500">{domain.years} Year(s) &bull; {formatCurrency(domain.price)}</p>
                              </div>
                              <select
                                value={domain.status}
                                onChange={(e) => updateServiceStatus('domainOrders', domain.id, e.target.value)}
                                className={cn("px-2 py-1 rounded text-xs font-medium uppercase border-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer", domain.status === 'active' || domain.status === 'registered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}
                              >
                                <option value="pending">Pending</option>
                                <option value="registered">Registered</option>
                                <option value="active">Active</option>
                                <option value="expiring">Expiring</option>
                                <option value="expired">Expired</option>
                                <option value="suspended">Suspended</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hostingAccounts.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-600" />
                        Hosting Accounts
                      </h4>
                      <div className="grid gap-3">
                        {hostingAccounts.map(hosting => (
                          <div key={hosting.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-gray-900 uppercase">{hosting.planId}</p>
                                <p className="text-xs text-gray-500">Billing: <span className="capitalize">{hosting.billingCycle}</span></p>
                              </div>
                              <select
                                value={hosting.status}
                                onChange={(e) => updateServiceStatus('hostingAccounts', hosting.id, e.target.value)}
                                className={cn("px-2 py-1 rounded text-xs font-medium uppercase border-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer", hosting.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}
                              >
                                <option value="pending">Pending</option>
                                <option value="provisioning">Provisioning</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="terminated">Terminated</option>
                              </select>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Server IP</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 192.168.1.1" 
                                  className="w-full text-sm border-gray-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-1 px-2 border"
                                  defaultValue={hosting.serverIp || ''}
                                  onBlur={(e) => {
                                    if(e.target.value !== hosting.serverIp) {
                                      updateServiceStatus('hostingAccounts', hosting.id, hosting.status, { serverIp: e.target.value });
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">cPanel URL</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. https://cpanel.domain.com" 
                                  className="w-full text-sm border-gray-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-1 px-2 border"
                                  defaultValue={hosting.controlPanelUrl || ''}
                                  onBlur={(e) => {
                                    if(e.target.value !== hosting.controlPanelUrl) {
                                      updateServiceStatus('hostingAccounts', hosting.id, hosting.status, { controlPanelUrl: e.target.value });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <button 
                onClick={() => generateInvoice(selectedOrder)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Download Invoice
              </button>
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailLogs && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Email History for {selectedOrder.customerName}</h3>
              <button
                onClick={() => setShowEmailLogs(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingEmailLogs ? (
                <div className="py-8 text-center text-gray-500">Loading emails...</div>
              ) : emailLogs.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No emails have been sent for this order yet.</div>
              ) : (
                <div className="space-y-4">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900">{log.subject}</h4>
                        <span className={cn("px-2 py-1 text-xs font-semibold rounded-full", log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Sent on {new Date(log.sentAt).toLocaleString()} to <span className="font-medium text-gray-700">{log.customerEmail}</span>
                      </p>
                      <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm whitespace-pre-wrap font-mono text-gray-800">
                        {log.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
