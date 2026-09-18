import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { getHostingUsage, HostingUsageStats } from '../services/hostingApi';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, HardDrive, Wifi, Server, Globe, Receipt, Download, ExternalLink, ChevronRight, LayoutDashboard, Ticket } from 'lucide-react';
import { HostingOrder } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../lib/utils';
import { SupportTicketsClient } from '../components/hosting/SupportTicketsClient';
import { NameserverModal } from '../components/hosting/NameserverModal';
import { HostingUpgradeModal } from '../components/hosting/HostingUpgradeModal';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'hosting' | 'billing' | 'support'>('overview');
  
  const [managingNsDomain, setManagingNsDomain] = useState<DomainOrder | null>(null);
  const [upgradingHosting, setUpgradingHosting] = useState<HostingAccount | null>(null);

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

    const qOrders = query(collection(db, 'orders'), where('userId', '==', user.uid), limit(100));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const hostingRelatedOrders = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as HostingOrder))
        .filter(o => o.items && o.items.some(i => i.itemType === 'hosting' || i.itemType === 'domain' || i.category === 'Hosting & Domains'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(hostingRelatedOrders);
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
    const isHosting = type === 'hosting';
    const collName = isHosting ? 'hostingAccounts' : 'domainOrders';
    const currentVal = !!record.autoRenew;
    try {
      await updateDoc(doc(db, collName, record.id), {
        autoRenew: !currentVal,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Auto-renew ` + (!currentVal ? 'enabled' : 'disabled'));
    } catch (err: any) {
      toast.error('Failed to update auto-renew: ' + err.message);
    }
  };

  const handleRenewDomain = async (domain: DomainOrder) => {
    setDomainLoading(domain.id);
    try {
      const token = await user?.getIdToken();
      const res = await apiPost('/api/domain/renew', {
        domain: domain.domain,
        years: 1,
      }, token);
      
      if ((res as any).success) {
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
        toast.error((res as any).error || (res as any).message || 'Renewal failed');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to renew domain');
    } finally {
      setDomainLoading(null);
    }
  };

  const handleFetchUsage = async (account: HostingAccount) => {
    if (!account.providerAccountId) {
      toast.error('Hosting account not fully provisioned yet.');
      return;
    }
    
    setUsageLoading(account.id);
    try {
      const res = await getHostingUsage(account.providerAccountId);
      if (res) {
        setUsageData(prev => ({
          ...prev,
          [account.id]: res
        }));
      } else {
        toast.error('Failed to fetch usage data');
      }
    } catch (err) {
      toast.error('Error fetching usage data');
    } finally {
      setUsageLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      suspended: 'bg-orange-100 text-orange-800 border-orange-300',
      terminated: 'bg-red-100 text-red-800 border-red-300',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${styles[status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
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
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${percent}%` }} />
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
      formatCurrency(item.price, settings as any),
      formatCurrency(item.price, settings as any)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Term/Cycle', 'Price', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [8, 22, 33] },
      styles: { fontSize: 9 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${formatCurrency(order.total, settings as any)}`, pageWidth - 14, finalY, { align: 'right' });

    doc.save(`Invoice_${order.documentNumber || order.id.slice(0,8)}.pdf`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E2A47]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen pb-12">
        {/* Header Section */}
        <div className="bg-[#0E2A47] text-white pt-8 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Client Portal</h1>
            <p className="text-blue-200">Manage your hosting services, domains, and billing in one place.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                <nav className="flex flex-col">
                  <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-3 px-4 py-4 text-left font-medium transition-colors border-l-4 ${activeTab === 'overview' ? 'border-[#0E2A47] bg-blue-50 text-[#0E2A47]' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#0E2A47]'}`}
                  >
                    <LayoutDashboard size={20} /> Dashboard Overview
                  </button>
                  <button 
                    onClick={() => setActiveTab('domains')}
                    className={`flex items-center gap-3 px-4 py-4 text-left font-medium transition-colors border-l-4 ${activeTab === 'domains' ? 'border-[#0E2A47] bg-blue-50 text-[#0E2A47]' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#0E2A47]'}`}
                  >
                    <Globe size={20} /> My Domains <span className="ml-auto bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{domains.length}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('hosting')}
                    className={`flex items-center gap-3 px-4 py-4 text-left font-medium transition-colors border-l-4 ${activeTab === 'hosting' ? 'border-[#0E2A47] bg-blue-50 text-[#0E2A47]' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#0E2A47]'}`}
                  >
                    <Server size={20} /> My Hosting <span className="ml-auto bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{hosting.length}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-3 px-4 py-4 text-left font-medium transition-colors border-l-4 ${activeTab === 'billing' ? 'border-[#0E2A47] bg-blue-50 text-[#0E2A47]' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#0E2A47]'}`}
                  >
                    <Receipt size={20} /> Billing & Invoices
                  </button>
                  <button 
                    onClick={() => setActiveTab('support')}
                    className={`flex items-center gap-3 px-4 py-4 text-left font-medium transition-colors border-l-4 ${activeTab === 'support' ? 'border-[#0E2A47] bg-blue-50 text-[#0E2A47]' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#0E2A47]'}`}
                  >
                    <Ticket size={20} /> Support Tickets
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-6">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('domains')}>
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
                      <Globe size={28} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Active Domains</p>
                      <h3 className="text-2xl font-bold text-gray-900">{domains.filter(d => d.status === 'active').length}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('hosting')}>
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Server size={28} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Active Hosting</p>
                      <h3 className="text-2xl font-bold text-gray-900">{hosting.filter(h => h.status === 'active').length}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('billing')}>
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-lg">
                      <Receipt size={28} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Invoices</p>
                      <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
                    </div>
                  </div>

                  {/* Empty States if nothing exists */}
                  {domains.length === 0 && hosting.length === 0 && (
                    <div className="col-span-1 md:col-span-3 bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                      <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Globe className="text-gray-300" size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">No Services Found</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        It looks like you don't have any active domains or hosting plans with us yet. When you purchase a service, it will appear here.
                      </p>
                      <button onClick={() => navigate('/hosting')} className="bg-[#0E2A47] text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-900 transition-colors">
                        Browse Services
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Domains Tab */}
              {activeTab === 'domains' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Globe size={20} className="text-[#0E2A47]" /> My Domains</h2>
                  </div>
                  {domains.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 mb-4">You have not registered any domains yet.</p>
                      <button onClick={() => navigate('/domain')} className="text-[#0E2A47] font-bold hover:underline">Register a new domain</button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Domain</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Expires</th>
                            <th className="px-6 py-4 font-semibold">Auto-Renew</th>
                            <th className="px-6 py-4 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {domains.map(domain => (
                            <tr key={domain.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-[#0E2A47]">{domain.domain}</td>
                              <td className="px-6 py-4">{getStatusBadge(domain.status)}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {domain.expiresAt ? new Date(domain.expiresAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" checked={!!domain.autoRenew} onChange={() => handleToggleAutoRenew('domain', domain)} className="sr-only peer" />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setManagingNsDomain(domain)} className="text-gray-600 hover:text-[#0E2A47] bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-xs font-bold transition-colors">
                                    Nameservers
                                  </button>
                                  <button onClick={() => handleRenewDomain(domain)} disabled={domainLoading === domain.id} className="bg-[#0E2A47] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-800 transition-colors disabled:opacity-50">
                                    {domainLoading === domain.id ? 'Loading...' : 'Renew'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Hosting Tab */}
              {activeTab === 'hosting' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Server size={20} className="text-[#0E2A47]" /> My Hosting Services</h2>
                  </div>
                  {hosting.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 mb-4">You do not have any active hosting plans.</p>
                      <button onClick={() => navigate('/hosting')} className="text-[#0E2A47] font-bold hover:underline">Browse hosting plans</button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Service Details</th>
                            <th className="px-6 py-4 font-semibold">Status / IP</th>
                            <th className="px-6 py-4 font-semibold">Usage</th>
                            <th className="px-6 py-4 font-semibold">Billing</th>
                            <th className="px-6 py-4 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {hosting.map(account => (
                            <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900">{account.planId || 'Standard Plan'}</span>
                                  {account.domain && <span className="text-sm text-[#0E2A47] font-medium">{account.domain}</span>}
                                  {account.status === 'active' && account.controlPanelUrl && (
                                    <a href={account.controlPanelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 hover:text-blue-800">
                                      Login to cPanel <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-2">
                                  <div>{getStatusBadge(account.status)}</div>
                                  <span className="text-xs text-gray-500 font-mono">{account.status === 'active' && account.serverIp ? account.serverIp : 'N/A'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {usageData[account.id] ? (
                                  <div className="space-y-3 min-w-[150px]">
                                    <ProgressBar value={usageData[account.id].diskUsageMB / 1024} max={usageData[account.id].diskLimitMB / 1024} label="Disk" />
                                    <ProgressBar value={usageData[account.id].bandwidthUsageMB / 1024} max={usageData[account.id].bandwidthLimitMB / 1024} label="Bandwidth" />
                                  </div>
                                ) : (
                                  <button onClick={() => handleFetchUsage(account)} disabled={usageLoading === account.id} className="text-xs text-[#0E2A47] bg-blue-50 px-3 py-1.5 rounded border border-blue-100 hover:bg-blue-100 flex items-center gap-1 font-medium transition-colors">
                                    <RefreshCw size={12} className={usageLoading === account.id ? 'animate-spin' : ''} />
                                    {usageLoading === account.id ? 'Loading...' : 'Check Usage'}
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                  <span>{account.billingCycle?.toUpperCase() || 'MONTHLY'}</span>
                                  <span className="text-xs">Expires: {account.expiresAt ? new Date(account.expiresAt).toLocaleDateString() : '-'}</span>
                                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                                    <input type="checkbox" checked={!!account.autoRenew} onChange={() => handleToggleAutoRenew('hosting', account)} className="sr-only peer" />
                                    <div className="w-7 h-4 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-2 text-xs font-medium text-gray-500">Auto-Renew</span>
                                  </label>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => setUpgradingHosting(account)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                  Upgrade Plan
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <Receipt size={20} className="text-[#0E2A47]" />
                    <h2 className="text-lg font-bold text-gray-900">Billing History & Invoices</h2>
                  </div>
                  {orders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No billing history found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Invoice No</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Total</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 text-right font-semibold">Download</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-sm text-[#0E2A47]">
                                #{order.documentNumber || order.id.slice(0, 8).toUpperCase()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                {formatCurrency(order.total, settings as any)}
                              </td>
                              <td className="px-6 py-4">
                                {getStatusBadge(order.status)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => generateInvoice(order)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
                                  <Download size={14} /> PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Support Tab */}
              {activeTab === 'support' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <SupportTicketsClient />
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Modals */}
        {managingNsDomain && (
          <NameserverModal domain={managingNsDomain as any} onClose={() => setManagingNsDomain(null)} onUpdate={() => {}} />
        )}
        {upgradingHosting && (
          <HostingUpgradeModal account={upgradingHosting as any} onClose={() => setUpgradingHosting(null)} />
        )}
      </div>
    </Layout>
  );
};
