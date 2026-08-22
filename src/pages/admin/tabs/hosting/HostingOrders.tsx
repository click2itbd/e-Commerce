import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, where, limit } from 'firebase/firestore';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { Server, Search, Eye, X, Globe, Download, Loader2, FileText, CheckCircle, Wallet, AlertTriangle } from 'lucide-react';
import { HostingOrder, DomainOrder, HostingAccount } from '../../../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSettings } from '../../../../context/SettingsContext';
import { sendServiceActivationEmail, getEmailLogsForOrder, EmailLog } from '../../../../services/emailService';

export default function HostingOrders() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<HostingOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
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

  const [paymentAction, setPaymentAction] = useState<'accept' | 'reject' | null>(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1000));
      const snap = await getDocs(q);
      let fetchedOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HostingOrder[];
      
      // Filter orders that contain hosting or domain items
      fetchedOrders = fetchedOrders.filter(order => 
        order.items && order.items.some(item => 
          item.itemType === 'domain' || 
          item.itemType === 'hosting' || 
          item.category === 'Hosting & Domains' ||
          item.isDigital
        )
      );
      
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
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: newStatus
      });
      toast.success('Order status updated');
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus as any } : o));
      setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Order Error: ' + error.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleManualPaymentAction = async (action: 'accept' | 'reject') => {
    if (!selectedOrder) return;
    if (action === 'reject') {
      setPaymentAction('reject');
      setRejectionReason('');
      setShowPaymentConfirm(true);
      return;
    }
    setPaymentAction('accept');
    setShowPaymentConfirm(true);
  };

  const confirmPaymentAction = async () => {
    if (!selectedOrder || !paymentAction) return;
    setStatusUpdating(true);
    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const body: any = { action: paymentAction };
      if (paymentAction === 'reject') {
        body.reason = rejectionReason || 'Manual verification failed';
      }
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        setSelectedOrder({
          ...selectedOrder,
          paymentStatus: paymentAction === 'accept' ? 'verified' : 'rejected',
          paymentVerificationStatus: paymentAction === 'accept' ? 'verified' : 'rejected',
          providerStatus: paymentAction === 'accept' ? 'processing' : 'cancelled',
        });
        setShowPaymentConfirm(false);
        setPaymentAction(null);
        setRejectionReason('');
      } else if (data.alreadyVerified) {
        toast.success('Payment has already been verified.');
        setSelectedOrder({
          ...selectedOrder,
          paymentStatus: 'verified',
          paymentVerificationStatus: 'verified',
        });
        setShowPaymentConfirm(false);
        setPaymentAction(null);
      } else {
        toast.error(data.error || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment Error: ' + error.message);
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
      toast.error('Service Error: ' + error.message);
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

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.brandName || 'CLICK2IT', 14, currentY);
    
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
    
    const startY = currentY;
    const nameLines = doc.splitTextToSize(order.customerName || 'N/A', 120);
    doc.text(nameLines, 14, currentY);
    currentY += (nameLines.length * 5);
    
    const emailLines = doc.splitTextToSize(order.customerEmail || 'N/A', 120);
    doc.text(emailLines, 14, currentY);
    currentY += (emailLines.length * 5);
    
    const phoneLines = doc.splitTextToSize(order.customerPhone || 'N/A', 120);
    doc.text(phoneLines, 14, currentY);
    currentY += (phoneLines.length * 5);
    
    let detailsY = startY;
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
      `BDT ${item.price.toLocaleString()}`,
      `BDT ${item.price.toLocaleString()}`
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
    doc.text(`BDT ${order.total.toLocaleString()}`, pageWidth - 14, currentY, { align: 'right' });
    
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', totalX, currentY);
    doc.text(`BDT ${order.total.toLocaleString()}`, pageWidth - 14, currentY, { align: 'right' });

    doc.save(`Invoice_${order.documentNumber || order.id.slice(0, 8)}.pdf`);
    toast.success('Invoice generated successfully!');
  };

  
  const processedOrders = orders.filter(o => 
    o.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


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
              ) : processedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hosting orders found.
                  </td>
                </tr>
              ) : (
                currentOrders.map(order => (
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
                      {`BDT ${order.total.toLocaleString()}`}
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

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedOrders.length)} of {processedOrders.length} hosting orders
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-white border border-gray-300 disabled:opacity-50 text-sm font-medium"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-white border border-gray-300 disabled:opacity-50 text-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                    <p><span className="font-medium text-gray-900">Shipping:</span> {`BDT ${selectedOrder.shippingCost.toLocaleString()}`}</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">Total: {`BDT ${selectedOrder.total.toLocaleString()}`}</p>
                    
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

                {/* Manual bKash Payment Verification */}
                {(selectedOrder.paymentMethod === 'bkash' || selectedOrder.paymentMethod === 'manual_bkash') && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-pink-600" />
                      Manual bKash Payment
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Transaction ID</p>
                        <p className="font-mono font-bold text-gray-900">{selectedOrder.transactionId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Status</p>
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize", 
                          selectedOrder.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                          selectedOrder.paymentStatus === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.paymentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {selectedOrder.paymentStatus || 'pending'}
                        </span>
                      </div>
                      {selectedOrder.paymentVerificationStatus && (
                        <div>
                          <p className="text-gray-500">Verification Status</p>
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                            selectedOrder.paymentVerificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                            selectedOrder.paymentVerificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            selectedOrder.paymentVerificationStatus === 'review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          )}>
                            {selectedOrder.paymentVerificationStatus}
                          </span>
                        </div>
                      )}
                      {(selectedOrder as any).paymentVerifiedAt && (
                        <div>
                          <p className="text-gray-500">Verified At</p>
                          <p className="text-gray-900">{new Date((selectedOrder as any).paymentVerifiedAt).toLocaleString()}</p>
                        </div>
                      )}
                      {(selectedOrder as any).paymentRejectedAt && (
                        <div>
                          <p className="text-gray-500">Rejected At</p>
                          <p className="text-gray-900">{new Date((selectedOrder as any).paymentRejectedAt).toLocaleString()}</p>
                        </div>
                      )}
                      {(selectedOrder as any).paymentRejectionReason && (
                        <div className="md:col-span-2">
                          <p className="text-gray-500">Rejection Reason</p>
                          <p className="text-red-600">{(selectedOrder as any).paymentRejectionReason}</p>
                        </div>
                      )}
                    </div>
                    
                    {(selectedOrder.paymentStatus === 'submitted' || selectedOrder.paymentStatus === 'pending') && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleManualPaymentAction('accept')}
                          disabled={statusUpdating}
                          className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept Payment
                        </button>
                        <button
                          onClick={() => handleManualPaymentAction('reject')}
                          disabled={statusUpdating}
                          className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject Payment
                        </button>
                      </div>
                    )}

                    {selectedOrder.paymentStatus === 'verified' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Payment Verified</span>
                        </div>
                        {(selectedOrder as any).paymentVerifiedAt && (
                          <p className="text-xs mt-1">Verified at: {new Date((selectedOrder as any).paymentVerifiedAt).toLocaleString()}</p>
                        )}
                      </div>
                    )}

                    {selectedOrder.paymentStatus === 'rejected' && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4" />
                          <span className="font-medium">Payment Rejected</span>
                        </div>
                        {(selectedOrder as any).paymentRejectionReason && (
                          <p className="text-xs mt-1">Reason: {(selectedOrder as any).paymentRejectionReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                                <p className="text-xs text-gray-500">{domain.years} Year(s) &bull; {`BDT ${domain.price.toLocaleString()}`}</p>
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
                            
                             <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {showPaymentConfirm && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {paymentAction === 'accept' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
                <h3 className="text-lg font-bold text-gray-900">
                  {paymentAction === 'accept' ? 'Verify this bKash payment?' : 'Reject this payment?'}
                </h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm space-y-2">
                <p><span className="font-medium text-gray-500">Order:</span> <span className="font-bold text-gray-900">{selectedOrder.documentNumber || selectedOrder.id.slice(0, 8)}</span></p>
                <p><span className="font-medium text-gray-500">Transaction ID:</span> <span className="font-mono text-gray-900">{selectedOrder.transactionId}</span></p>
                <p><span className="font-medium text-gray-500">Amount:</span> <span className="font-bold text-gray-900">BDT {selectedOrder.total.toLocaleString()}</span></p>
                {paymentAction === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentConfirm(false);
                    setPaymentAction(null);
                    setRejectionReason('');
                  }}
                  disabled={statusUpdating}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPaymentAction}
                  disabled={statusUpdating}
                  className={cn(
                    "flex-1 py-2.5 px-4 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                    paymentAction === 'accept'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                  )}
                >
                  {statusUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : paymentAction === 'accept' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Accept
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Confirm Reject
                    </>
                  )}
                </button>
              </div>
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



