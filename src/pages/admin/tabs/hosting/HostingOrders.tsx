import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, where, limit } from 'firebase/firestore';
import { formatCurrency, cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { Server, Search, Eye, X, Globe, Download, Loader2, FileText, CheckCircle, Wallet, AlertTriangle, Clock } from 'lucide-react';
import { HostingOrder, DomainOrder, HostingAccount } from '../../../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSettings } from '../../../../context/SettingsContext';
import { sendServiceActivationEmail, getEmailLogsForOrder, EmailLog } from '../../../../services/emailService';
import { getApiUrl } from '../../../../services/apiClient';
import { Pagination } from '../../../../components/common/Pagination';

export default function HostingOrders() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<HostingOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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
      const response = await fetch(getApiUrl(`/api/orders/admin/${selectedOrder.id}/payment/verify`), {
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
        const fulfillmentStatus = data.fulfillmentResult?.status;
        const updatedOrder = {
          ...selectedOrder,
          paymentStatus: paymentAction === 'accept' ? 'verified' : 'rejected',
          paymentVerificationStatus: paymentAction === 'accept' ? 'verified' : 'rejected',
          status: fulfillmentStatus === 'pending' ? 'fulfillment_pending' : fulfillmentStatus || selectedOrder.status,
          providerStatus: fulfillmentStatus || (paymentAction === 'accept' ? 'processing' : 'cancelled'),
        } as HostingOrder;
        setSelectedOrder(updatedOrder);
        setOrders(prev => prev.map(order => order.id === updatedOrder.id ? updatedOrder : order));
        setShowPaymentConfirm(false);
        setPaymentAction(null);
        setRejectionReason('');
      } else if (data.alreadyVerified) {
        toast.success('Payment has already been verified.');
        const fulfillmentStatus = data.fulfillmentResult?.status;
        const updatedOrder = {
          ...selectedOrder,
          paymentStatus: 'verified',
          paymentVerificationStatus: 'verified',
          status: fulfillmentStatus === 'pending' ? 'fulfillment_pending' : fulfillmentStatus || selectedOrder.status,
          providerStatus: fulfillmentStatus || selectedOrder.providerStatus,
        } as HostingOrder;
        setSelectedOrder(updatedOrder);
        setOrders(prev => prev.map(order => order.id === updatedOrder.id ? updatedOrder : order));
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

  const handleProvisionCloudLinux = async (order: HostingOrder) => {
    const ip = prompt("Enter Server IP Address to provision CloudLinux License:");
    if (!ip) return;

    let licenseType = 1; // Default
    const clItem = order.items?.find((i: any) => i.itemType === 'license' && i.name.toLowerCase().includes('cloudlinux'));
    if (clItem) {
      if (clItem.id?.includes('solo')) licenseType = 2; // Solo
      if (clItem.id?.includes('admin')) licenseType = 41; // Admin
      if (clItem.id?.includes('shared')) licenseType = 1; // Shared
    }

    setStatusUpdating(true);
    const toastId = toast.loading('Provisioning CloudLinux License...');
    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      
      const response = await fetch(getApiUrl('/api/hosting/cloudlinux/license'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip, type: licenseType })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`CloudLinux License successfully provisioned for ${ip}`, { id: toastId });
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'completed',
          providerStatus: 'active',
          updatedAt: new Date().toISOString(),
          cloudLinuxIp: ip,
        });
        await updateDoc(doc(db, 'hostingOrders', order.id), {
          status: 'active',
          updatedAt: new Date().toISOString(),
          cloudLinuxIp: ip,
        });
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'active' as any } : o));
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(prev => prev ? { ...prev, status: 'active' as any } : null);
        }
      } else {
        throw new Error(data.error || 'Failed to provision license');
      }
    } catch (e: any) {
      toast.error('CloudLinux Error: ' + e.message, { id: toastId });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAcceptOrder = async (order: HostingOrder) => {
    setStatusUpdating(true);
    const toastId = toast.loading('Accepting order and initiating WHM provisioning...');
    try {
      // 1. Optimistic status update in UI (backend updates Firestore via Admin SDK)
      try {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'provisioning',
          providerStatus: 'processing',
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        // Direct write might be restricted by Firestore rules; backend handles it
      }
      try {
        await updateDoc(doc(db, 'hostingOrders', order.id), {
          status: 'provisioning',
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {}

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'provisioning' as any } : o));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'provisioning' as any } : null);
      }

      // 2. Call backend fulfillment / payment verify
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const response = await fetch(getApiUrl(`/api/orders/admin/${order.id}/payment/verify`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'WHM account provisioning requested successfully!', { id: toastId });
        if (data.fulfillmentError) {
          toast.error('Provisioning notice: ' + data.fulfillmentError, { duration: 6000 });
        }
      } else {
        const errorMsg = data.error || data.message || 'WHM provisioning call failed';
        try {
          await updateDoc(doc(db, 'orders', order.id), {
            status: 'failed',
            provisioningError: errorMsg,
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {}
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'failed' as any, provisioningError: errorMsg } : o));
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(prev => prev ? { ...prev, status: 'failed' as any, provisioningError: errorMsg } : null);
        }
        toast.error('Provisioning error: ' + errorMsg, { id: toastId });
      }
    } catch (error: any) {
      console.error('Accept order error:', error);
      toast.error('Error: ' + error.message, { id: toastId });
    } finally {
      setStatusUpdating(false);
      fetchOrders();
      if (selectedOrder) {
        fetchOrderDetails(selectedOrder.id);
      }
    }
  };

  const handleMarkCompletedOrder = async (order: HostingOrder) => {
    setStatusUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'completed',
        providerStatus: 'completed',
        updatedAt: new Date().toISOString(),
      });
      try {
        await updateDoc(doc(db, 'hostingOrders', order.id), {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {}

      // Update linked hosting accounts & domain orders to active
      const hostingQ = query(collection(db, 'hostingAccounts'), where('orderId', '==', order.id));
      const hostingSnap = await getDocs(hostingQ);
      for (const hDoc of hostingSnap.docs) {
        await updateDoc(doc(db, 'hostingAccounts', hDoc.id), {
          status: 'active',
          provisioningStatus: 'completed',
          updatedAt: new Date().toISOString(),
        });
      }

      const domainQ = query(collection(db, 'domainOrders'), where('orderId', '==', order.id));
      const domainSnap = await getDocs(domainQ);
      for (const dDoc of domainSnap.docs) {
        await updateDoc(doc(db, 'domainOrders', dDoc.id), {
          status: 'active',
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success('Order marked as Completed! Account is live.');
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed' as any } : o));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'completed' as any } : null);
      }

      const wantsEmail = window.confirm("Service is now Live & Completed! Do you want to send the Service Activation Email to the customer?");
      if (wantsEmail) {
        const firstAccount = hostingSnap.docs[0]?.data();
        await sendServiceActivationEmail(order.id, order.customerEmail, {
          domain: firstAccount?.domain || order.items?.find(i => i.domain)?.domain || 'Hosting Service',
          serverIp: firstAccount?.serverIp || 'Assigned Server',
          controlPanelUrl: firstAccount?.controlPanelUrl || 'https://cpanel.click2itbd.com'
        });
        toast.success("Activation email sent successfully!");
      }
    } catch (error: any) {
      console.error('Mark completed error:', error);
      toast.error('Error: ' + error.message);
    } finally {
      setStatusUpdating(false);
      fetchOrders();
      if (selectedOrder) {
        fetchOrderDetails(selectedOrder.id);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'provisioning': return 'bg-purple-100 text-purple-800 border border-purple-200 animate-pulse';
      case 'processing': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'fulfillment_pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'failed': return 'bg-red-100 text-red-800 border border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
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
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Order ID & Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Order Items</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-900">Payment</th>
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-base font-semibold text-gray-600">No hosting orders found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{order.documentNumber || order.id.slice(0, 8)}</div>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerEmail}</div>
                      {order.customerPhone && <div className="text-xs text-gray-500">{order.customerPhone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded w-fit max-w-[200px] truncate">
                            {item.targetType === 'domain' ? '🌐 ' : '📦 '}{item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {`BDT ${order.total.toLocaleString()}`}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn("text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                          (order as any).paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                          {(order as any).paymentStatus || 'Unpaid'}
                        </span>
                        <span className="text-xs font-medium text-gray-500 capitalize">
                          • {order.paymentMethod || 'Manual'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize flex items-center gap-1.5 w-fit shadow-sm", getStatusColor(order.status))}>
                        {order.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                        {order.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {order.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {order.status === 'fulfillment_pending' ? 'Awaiting Registrar' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleAcceptOrder(order)}
                            disabled={statusUpdating}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-200 transition"
                            title="Accept and provision account"
                          >
                            Accept
                          </button>
                        )}
                        {(order.status === 'provisioning' || order.status === 'processing') && (
                          <button
                            onClick={() => handleMarkCompletedOrder(order)}
                            disabled={statusUpdating}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm shadow-emerald-200 transition"
                            title="Mark completed once live"
                          >
                            Complete
                          </button>
                        )}
                        {order.status === 'failed' && (
                          <button
                            onClick={() => handleAcceptOrder(order)}
                            disabled={statusUpdating}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm shadow-amber-200 transition"
                            title="Retry provisioning"
                          >
                            Retry
                          </button>
                        )}
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-lg text-xs font-bold transition-colors border border-gray-200 hover:border-blue-200 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                            {item.itemType === 'domain_transfer' && item.eppCode && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <span className="font-bold text-yellow-800">EPP / Auth Code: </span>
                                <code className="bg-white px-1 py-0.5 rounded border border-yellow-100 text-yellow-900 select-all">{item.eppCode}</code>
                              </div>
                            )}
                          </div>
                          <p className="font-bold text-blue-600">BDT {item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Workflow</h4>
                  <div className="text-sm space-y-2 text-gray-600">
                    <p><span className="font-medium text-gray-900">Payment Method:</span> <span className="uppercase font-semibold">{selectedOrder.paymentMethod}</span></p>
                    <p><span className="font-medium text-gray-900">Shipping:</span> {`BDT ${selectedOrder.shippingCost.toLocaleString()}`}</p>
                    <p className="text-lg font-bold text-gray-900">Total: {`BDT ${selectedOrder.total.toLocaleString()}`}</p>
                    
                    <div className="pt-2 flex items-center gap-3">
                      <span className="font-medium text-gray-900">Order Status:</span>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", getStatusColor(selectedOrder.status))}>
                        {selectedOrder.status === 'fulfillment_pending' ? 'Awaiting Registrar' : selectedOrder.status}
                      </span>
                    </div>

                    {/* Workflow Quick Action Buttons */}
                    <div className="pt-2">
                      {(() => {
                                                  const hasDomain = selectedOrder.items?.some((i: any) => i.itemType === 'domain' || i.itemType === 'domain_renewal' || i.itemType === 'domain_transfer') || domainOrders.length > 0;
                          const hasHosting = selectedOrder.items?.some((i: any) => i.itemType === 'hosting') || hostingAccounts.length > 0;
                          const hasCloudLinux = selectedOrder.items?.some((i: any) => i.itemType === 'license' && i.name.toLowerCase().includes('cloudlinux'));
                          
                          let acceptLabel = 'Accept & Process Order';
                          let retryLabel = 'Retry Processing';
                          let ActionIcon = CheckCircle;

                          if (hasCloudLinux) {
                            acceptLabel = 'Accept & Provision CloudLinux';
                            retryLabel = 'Retry CloudLinux Provisioning';
                            ActionIcon = Server;
                          } else if (hasDomain && hasHosting) {
                            acceptLabel = 'Accept & Provision Order (Domain + WHM)';
                            retryLabel = 'Retry Provisioning (Domain + WHM)';
                          } else if (hasDomain) {
                            acceptLabel = 'Accept & Provision Domain';
                            retryLabel = 'Retry Domain Registration';
                            ActionIcon = Globe;
                          } else if (hasHosting) {
                            acceptLabel = 'Accept & Provision WHM Account';
                            retryLabel = 'Retry WHM Provisioning';
                            ActionIcon = Server;
                          }

                        return (
                          <>
                            {selectedOrder.status === 'pending' && (
                                                              <button
                                  onClick={() => hasCloudLinux ? handleProvisionCloudLinux(selectedOrder) : handleAcceptOrder(selectedOrder)}
                                  disabled={statusUpdating}
                                  className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                <ActionIcon className="w-4 h-4" />
                                {acceptLabel}
                              </button>
                            )}

                            {(selectedOrder.status === 'provisioning' || selectedOrder.status === 'processing') && (
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleMarkCompletedOrder(selectedOrder)}
                                  disabled={statusUpdating}
                                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Mark Completed (Live)
                                </button>
                                <p className="text-xs text-purple-600 font-medium text-center animate-pulse">
                                  Provisioning in progress. Click Complete once verified.
                                </p>
                              </div>
                            )}

                            {selectedOrder.status === 'failed' && (
                              <div className="space-y-2">
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                  <p className="font-bold">Provisioning Status:</p>
                                  <p>{(selectedOrder as any).provisioningError || (hasDomain ? 'Domain registration pending Openprovider balance or provider approval.' : 'WHM provisioning failed or server timed out.')}</p>
                                </div>
                                                                  <button
                                    onClick={() => hasCloudLinux ? handleProvisionCloudLinux(selectedOrder) : handleAcceptOrder(selectedOrder)}
                                    disabled={statusUpdating}
                                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                                  >
                                  <ActionIcon className="w-4 h-4" />
                                  {retryLabel}
                                </button>
                              </div>
                            )}
                            {selectedOrder.status === 'fulfillment_pending' && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                Openprovider accepted the domain request. Registration is not active yet; this order will not be submitted again automatically.
                              </div>
                            )}
                            {selectedOrder.status === 'manual_review' && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                A provider result needs manual verification. Check the Openprovider panel and domain request details before retrying to avoid duplicate registration or transfer.
                              </div>
                            )}
                          </>
                        );
                      })()}
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
                                disabled={Boolean(domain.registrationId && ['REQ', 'UNKNOWN'].includes((domain.providerStatus || '').toUpperCase()))}
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
                            {(domain.registrationId || domain.providerCode || domain.providerHttpStatus || domain.providerRequestStartedAt || domain.fulfillmentError) && (
                              <div className="mt-2 space-y-1 text-xs text-gray-600">
                                <p>
                                  Openprovider status: {domain.providerStatus || 'not returned'}
                                  {domain.registrationId && ` · Registration ID: ${domain.registrationId}`}
                                </p>
                                {(domain.providerCode || domain.providerHttpStatus) && (
                                  <p>
                                    API code: {domain.providerCode || '-'} · HTTP: {domain.providerHttpStatus || '-'}
                                  </p>
                                )}
                                <p>
                                  Request sent: {domain.providerRequestStartedAt ? new Date(domain.providerRequestStartedAt).toLocaleString() : 'Not recorded'}
                                  {' · '}
                                  Response received: {domain.providerResponseReceivedAt ? new Date(domain.providerResponseReceivedAt).toLocaleString() : 'Not recorded'}
                                </p>
                              </div>
                            )}
                            {domain.fulfillmentError && (
                              <p className="mt-1 text-xs text-amber-700">{domain.fulfillmentError}</p>
                            )}
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
