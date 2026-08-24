import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { getHostingUsage, HostingUsageStats } from '../services/hostingApi';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, HardDrive, Wifi, RotateCcw, Server, FileText, Receipt, Download, ExternalLink } from 'lucide-react';
import { HostingOrder } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../lib/utils';
import { SupportTicketsClient } from '../components/hosting/SupportTicketsClient';
import { NameserverModal } from '../components/hosting/NameserverModal';
import { apiPost } from '../services/apiClient';

interface DomainOrder {
  id: string;
  domain: string;
  status: string;
  expiresAt?: string;
  autoRenew?: boolean;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

interface HostingAccount {
  id: string;
  planId?: string;
  providerAccountId?: string;
  status: string;
  serverIp?: string;
  controlPanelUrl?: string;
  diskUsageGb?: number;
  bandwidthUsageGb?: number;
  expiresAt?: string;
  autoRenew?: boolean;
  billingCycle?: string;
  domain?: string;
  createdAt: string;
  updatedAt: string;
}

export const MyServices: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [domains, setDomains] = useState<DomainOrder[]>([]);
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [orders, setOrders] = useState<HostingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainLoading, setDomainLoading] = useState<string | null>(null);
  const [hostingLoading, setHostingLoading] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<Record<string, HostingUsageStats>>({});
  const [usageLoading, setUsageLoading] = useState<string | null>(null);
  
  const [managingNsDomain, setManagingNsDomain] = useState<DomainOrder | null>(null);

  useEffect(() => {
    if (!user) return;

    const qDomains = query(collection(db, 'domainOrders'), where('userId', '==', user.uid), limit(100));
    const unsubDomains = onSnapshot(qDomains, (snap) => {
      setDomains(snap.docs.map(d => ({ id: d.id, ...d.data() } as DomainOrder)));
      setLoading(false);
    }, (err) => {
      console.error('Error loading domains:', err);
      setLoading(false);
    });

    const qHosting = query(collection(db, 'hostingAccounts'), where('userId', '==', user.uid), limit(100));
    const unsubHosting = onSnapshot(qHosting, (snap) => {
      setHosting(snap.docs.map(d => ({ id: d.id, ...d.data() } as HostingAccount)));
      setLoading(false);
    }, (err) => {
      console.error('Error loading hosting:', err);
      setLoading(false);
    });

    const qOrders = query(collection(db, 'hostingOrders'), where('userId', '==', user.uid), limit(100));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as HostingOrder)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      console.error('Error loading orders:', err);
    });

    return () => {
      unsubDomains();
      unsubHosting();
      unsubOrders();
    };
  }, [user]);

  const handleToggleAutoRenew = async (type: 'domain' | 'hosting', record: DomainOrder | HostingAccount) => {
    try {
      const newVal = !record.autoRenew;
      await updateDoc(doc(db, type === 'domain' ? 'domainOrders' : 'hostingAccounts', record.id), {
        autoRenew: newVal,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Auto-renew ${newVal ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating auto-renew:', error);
      toast.error('Failed to update auto-renew');
    }
  };

  const handleRenew = async (domain: DomainOrder) => {
    setDomainLoading(domain.id);
    try {
      const res = await apiPost<{ success: boolean; message?: string; error?: string }>('/api/domains/renew', {
        domain: domain.domain,
        years: 1,
      });
      
      if (res.success) {
        const renewalProduct = {
          id: `domain_renew_${domain.domain}`,
          name: `Domain Renewal - ${domain.domain}`,
          description: '1 Year Renewal',
          price: domain.price || 1000,
          category: 'Hosting & Domains',
          stock: 9999,
          images: [],
          createdAt: new Date().toISOString(),
          itemType: 'domain' as const,
          domainTld: domain.domain.split('.').pop() || '',
          termYears: 1,
        };
        addToCart(renewalProduct as any);
        navigate('/hosting/checkout');
      } else {
        toast.error(res.error || res.message || 'Renewal failed');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to renew domain');
    } finally {
      setDomainLoading(null);
    }
  };

  const handleFetchUsage = async (account: HostingAccount) => {
    setUsageLoading(account.id);
    setUsageData(prev => ({ ...prev, [account.id]: null as any }));
    try {
      const data = await getHostingUsage(account.providerAccountId || '');
      setUsageData(prev => ({ ...prev, [account.id]: data }));
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch usage');
    } finally {
      setUsageLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      registered: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      expiring: 'bg-orange-100 text-orange-700',
      expired: 'bg-red-100 text-red-700',
      renewing: 'bg-blue-100 text-blue-700',
      provisioning: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-orange-100 text-orange-700',
      terminated: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const ProgressBar = ({ value, max, label }: { value: number; max: number; label: string }) => {
    const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{value.toFixed(1)} / {max.toFixed(1)} GB</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#EF4444] rounded-full transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  const generateInvoice = (order: HostingOrder) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let currentY = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
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
    
    // INVOICE text
    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.text('INVOICE', pageWidth - 14, 20, { align: 'right' });

    currentY += 15;
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 10;

    // Customer Info
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
    
    // Invoice details
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

    // Table
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

    // Totals
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-light text-[#1a2b3c]">My Services</h1>

        {/* My Domains */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Server className="text-[#EF4444]" size={24} />
            <h2 className="text-xl font-bold text-[#081621]">My Domains</h2>
          </div>

          {domains.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No domains found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#081621] text-white text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Domain</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Expires</th>
                    <th className="px-6 py-4">Auto-Renew</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {domains.map(domain => (
                    <tr key={domain.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold">{domain.domain}</td>
                      <td className="px-6 py-4">{getStatusBadge(domain.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {domain.expiresAt ? new Date(domain.expiresAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!domain.autoRenew}
                            onChange={() => handleToggleAutoRenew('domain', domain)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#EF4444] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
                        </label>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => setManagingNsDomain(domain)}
                          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
                        >
                          Nameservers
                        </button>
                        <button
                          onClick={() => handleRenew(domain)}
                          disabled={domainLoading === domain.id}
                          className="bg-[#081621] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#EF4444] transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <RotateCcw size={14} />
                          {domainLoading === domain.id ? 'Processing...' : 'Renew Now'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nameserver Modal */}
        {managingNsDomain && (
          <NameserverModal
            domain={managingNsDomain}
            onClose={() => setManagingNsDomain(null)}
            onUpdate={() => {}}
          />
        )}

        {/* My Hosting */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <HardDrive className="text-[#EF4444]" size={24} />
            <h2 className="text-xl font-bold text-[#081621]">My Hosting</h2>
          </div>

          {hosting.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hosting accounts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#081621] text-white text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Server IP</th>
                    <th className="px-6 py-4">cPanel</th>
                    <th className="px-6 py-4">Usage</th>
                    <th className="px-6 py-4">Expires</th>
                    <th className="px-6 py-4">Auto-Renew</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hosting.map(account => (
                    <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold">{account.planId || '-'}</span>
                          {account.domain && <span className="text-xs text-blue-600">{account.domain}</span>}
                          <span className="text-xs text-gray-500">{account.billingCycle?.toUpperCase() || 'MONTHLY'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(account.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {account.status === 'active' && account.serverIp ? account.serverIp : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {account.status === 'active' && account.controlPanelUrl ? (
                          <a
                            href={account.controlPanelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink size={12} />
                            cPanel
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {usageData[account.id] ? (
                          <div className="space-y-2 min-w-[200px]">
                            <ProgressBar
                              value={usageData[account.id].diskUsageMB / 1024}
                              max={usageData[account.id].diskLimitMB / 1024}
                              label="Disk"
                            />
                            <ProgressBar
                              value={usageData[account.id].bandwidthUsageMB / 1024}
                              max={usageData[account.id].bandwidthLimitMB / 1024}
                              label="Bandwidth"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleFetchUsage(account)}
                            disabled={usageLoading === account.id}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <RefreshCw size={12} className={usageLoading === account.id ? 'animate-spin' : ''} />
                            {usageLoading === account.id ? 'Loading...' : 'Show Usage'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {account.expiresAt ? new Date(account.expiresAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!account.autoRenew}
                            onChange={() => handleToggleAutoRenew('hosting', account)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#EF4444] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Orders & Invoices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Receipt className="text-[#EF4444]" size={24} />
            <h2 className="text-xl font-bold text-[#081621]">My Orders & Invoices</h2>
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#081621] text-white text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Order ID / No</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm">
                        {order.documentNumber || order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => generateInvoice(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Support Tickets */}
        <SupportTicketsClient />

      </div>
    </Layout>
  );
};
