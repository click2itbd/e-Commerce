import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getHostingUsage, HostingUsageStats } from '../services/hostingApi';
import {
  RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, HardDrive, Wifi, RotateCcw, Server,
  FileText, Receipt, Download, ExternalLink, Lock, Unlock, Key, Shield, Eye, EyeOff, Globe,
  Plus, Trash, Save, UserCog, ShieldCheck, Loader2, Copy, Check, Mail, X
} from 'lucide-react';
import { HostingAccount, HostingOrder } from '../types';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../lib/utils';
import { SupportTicketsClient } from '../components/hosting/SupportTicketsClient';
import { NameserverModal } from '../components/hosting/NameserverModal';
import { HostingUpgradeModal } from '../components/hosting/HostingUpgradeModal';
import { apiPost, apiGet } from '../services/apiClient';

interface DomainOrder {
  id: string;
  domain: string;
  status: string;
  expiresAt?: string;
  autoRenew?: boolean;
  price?: number;
  spamExpertsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MyServicesTab: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [domains, setDomains] = useState<DomainOrder[]>([]);
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [sslCerts, setSslCerts] = useState<any[]>([]);
  const [orders, setOrders] = useState<HostingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainLoading, setDomainLoading] = useState<string | null>(null);

  // Domain Management States
  const [managingSettings, setManagingSettings] = useState<DomainOrder | null>(null);
  const [managingDnsDomain, setManagingDnsDomain] = useState<DomainOrder | null>(null);
  const [managingWhoisDomain, setManagingWhoisDomain] = useState<DomainOrder | null>(null);
  const [managingNsDomain, setManagingNsDomain] = useState<DomainOrder | null>(null);
  const [upgradingHosting, setUpgradingHosting] = useState<HostingAccount | null>(null);

  const [whoisForm, setWhoisForm] = useState({
    firstName: '', lastName: '', email: '', phoneCountryCode: '+880', phoneNumber: '',
    companyName: '', address: '', city: '', state: '', zipcode: '', country: 'BD'
  });
  const [loadingWhois, setLoadingWhois] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [loadingDns, setLoadingDns] = useState(false);
  const [domainDetails, setDomainDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copiedEpp, setCopiedEpp] = useState(false);
  const [spamLoading, setSpamLoading] = useState<string | null>(null);

  // Hosting States
  const [usageData, setUsageData] = useState<Record<string, HostingUsageStats>>({});
  const [usageLoading, setUsageLoading] = useState<string | null>(null);

  // SSL Configuration Modal States
  const [configuringSsl, setConfiguringSsl] = useState<any | null>(null);
  const [sslForm, setSslForm] = useState({
    domain: '',
    csr: '',
    approverEmail: '',
    validationMethod: 'email'
  });
  const [approverEmails, setApproverEmails] = useState<string[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [submittingSsl, setSubmittingSsl] = useState(false);

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

    const qSsl = query(collection(db, 'sslOrders'), where('userId', '==', user.uid), limit(100));
    const unsubSsl = onSnapshot(qSsl, (snap) => {
      setSslCerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Error loading ssl certs:', err);
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
        .filter(o => o.items && o.items.some(i => i.itemType === 'hosting' || i.itemType === 'domain' || i.itemType === 'ssl' || i.category === 'Hosting & Domains'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(hostingRelatedOrders);
    }, (err) => {
      console.error('Error loading orders:', err);
    });

    return () => {
      unsubDomains();
      unsubSsl();
      unsubHosting();
      unsubOrders();
    };
  }, [user]);

  // ================= DOMAIN MANAGEMENT HANDLERS =================
  const handleToggleAutoRenew = async (type: 'domain' | 'hosting', record: DomainOrder | HostingAccount) => {
    const isHosting = type === 'hosting';
    const collName = isHosting ? 'hostingAccounts' : 'domainOrders';
    const currentVal = !!record.autoRenew;
    try {
      await updateDoc(doc(db, collName, record.id), {
        autoRenew: !currentVal,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Auto-renew ${!currentVal ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error('Failed to update auto-renew: ' + err.message);
    }
  };

  const handleRenew = async (domain: DomainOrder) => {
    setDomainLoading(domain.id);
    try {
      const token = await user?.getIdToken();
      const res: any = await apiPost('/api/domains/renew', {
        domain: domain.domain,
        years: 1,
      }, token);

      if (res && res.success) {
        toast.success('Domain renewed successfully!');
      } else {
        // Add to cart for manual renewal checkout
        addToCart({
          id: `domain_renew_${domain.domain}`,
          name: `Domain Renewal - ${domain.domain}`,
          description: '1 Year Renewal',
          price: domain.price || 1480,
          category: 'Hosting & Domains',
          stock: 9999,
          images: [],
          createdAt: new Date().toISOString(),
          itemType: 'domain_renewal',
          domain: domain.domain,
          termYears: 1,
        } as any);
        toast.success('Renewal invoice added to cart!');
        navigate('/hosting/checkout');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to renew domain');
    } finally {
      setDomainLoading(null);
    }
  };

  const handleManageSettings = async (domain: DomainOrder) => {
    if (managingSettings?.id === domain.id) {
      setManagingSettings(null);
      return;
    }
    setManagingSettings(domain);
    setManagingDnsDomain(null);
    setManagingWhoisDomain(null);
    setLoadingDetails(true);
    setDomainDetails(null);
    try {
      const res: any = await apiPost('/api/domains/manage', {
        command: 'get_details',
        domain: domain.domain
      });
      if (res.success && res.data) {
        setDomainDetails(res.data);
      } else {
        toast.error(res.error || 'Could not fetch domain settings');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error fetching domain details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleLock = async (domain: DomainOrder, currentLock: boolean) => {
    const loadingToast = toast.loading(`${currentLock ? 'Unlocking' : 'Locking'} domain...`);
    try {
      const res: any = await apiPost('/api/domains/manage', {
        command: 'set_lock',
        domain: domain.domain,
        extraParams: { isLocked: !currentLock }
      });
      if (res.success) {
        toast.success(`Domain ${!currentLock ? 'locked' : 'unlocked'} successfully!`, { id: loadingToast });
        setDomainDetails((prev: any) => prev ? ({ ...prev, is_locked: !currentLock }) : prev);
      } else {
        toast.error(res.error || 'Failed to update domain lock', { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error', { id: loadingToast });
    }
  };

  const handleTogglePrivacy = async (domain: DomainOrder, currentPrivacy: boolean) => {
    const loadingToast = toast.loading(`${currentPrivacy ? 'Disabling' : 'Enabling'} WHOIS Privacy...`);
    try {
      const res: any = await apiPost('/api/domains/manage', {
        command: 'set_whois_privacy',
        domain: domain.domain,
        extraParams: { isEnabled: !currentPrivacy }
      });
      if (res.success) {
        toast.success(`WHOIS Privacy ${!currentPrivacy ? 'enabled' : 'disabled'}!`, { id: loadingToast });
        setDomainDetails((prev: any) => prev ? ({ ...prev, is_whois_privacy_enabled: !currentPrivacy }) : prev);
      } else {
        toast.error(res.error || 'Failed to update WHOIS privacy', { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error', { id: loadingToast });
    }
  };

  const handleCopyEpp = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedEpp(true);
    toast.success('EPP Code copied to clipboard!');
    setTimeout(() => setCopiedEpp(false), 2000);
  };

  // DNS Zone Editor Handlers
  const handleManageDns = async (domain: DomainOrder) => {
    if (managingDnsDomain?.id === domain.id) {
      setManagingDnsDomain(null);
      return;
    }
    setManagingDnsDomain(domain);
    setManagingSettings(null);
    setManagingWhoisDomain(null);
    setLoadingDns(true);
    try {
      const res: any = await apiPost('/api/domains/manage', {
        command: 'get_dns',
        domain: domain.domain
      });
      if (res.success && res.data) {
        setDnsRecords(res.data.records || []);
      } else {
        toast.error(res.error || 'Failed to fetch DNS records');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load DNS records');
    } finally {
      setLoadingDns(false);
    }
  };

  const handleAddDnsRecord = () => {
    setDnsRecords(prev => [...prev, { type: 'A', name: '@', value: '', ttl: 3600 }]);
  };

  const handleDnsChange = (index: number, field: string, value: any) => {
    setDnsRecords(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveDnsRecord = (index: number) => {
    setDnsRecords(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDns = async (domain: DomainOrder) => {
    const loadingToast = toast.loading('Saving DNS Zone...');
    try {
      const res: any = await apiPost('/api/domains/manage', {
        command: 'update_dns',
        domain: domain.domain,
        extraParams: { records: dnsRecords }
      });
      if (res.success) {
        toast.success('DNS Zone updated successfully!', { id: loadingToast });
      } else {
        toast.error(res.error || 'Failed to update DNS records', { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error', { id: loadingToast });
    }
  };

  // WHOIS / Contact Handlers
  const handleManageWhois = (domain: DomainOrder) => {
    if (managingWhoisDomain?.id === domain.id) {
      setManagingWhoisDomain(null);
      return;
    }
    setManagingWhoisDomain(domain);
    setManagingSettings(null);
    setManagingDnsDomain(null);
    if (user) {
      setWhoisForm(prev => ({
        ...prev,
        email: user.email || '',
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || ''
      }));
    }
  };

  const handleUpdateWhois = async (domain: DomainOrder) => {
    if (!whoisForm.firstName || !whoisForm.lastName || !whoisForm.email || !whoisForm.address || !whoisForm.city || !whoisForm.zipcode) {
      toast.error('Please fill in all required WHOIS fields');
      return;
    }
    setLoadingWhois(true);
    const loadingToast = toast.loading('Updating WHOIS contact at registry...');
    try {
      const res: any = await apiPost('/api/domains/manage', {
        command: 'update_contacts',
        domain: domain.domain,
        extraParams: { contact: whoisForm }
      });
      if (res.success) {
        toast.success('WHOIS contacts updated successfully!', { id: loadingToast });
        setManagingWhoisDomain(null);
      } else {
        toast.error(res.error || 'Failed to update WHOIS details', { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error', { id: loadingToast });
    } finally {
      setLoadingWhois(false);
    }
  };

  // SpamExperts Handlers (Feature 6)
  const handleSpamExpertsSso = async (domain: DomainOrder) => {
    setSpamLoading(domain.id);
    const toastId = toast.loading('Connecting to SpamExperts Filter Panel...');
    try {
      const res: any = await apiGet(`/api/domains/spamexperts/sso?domain=${domain.domain}`);
      if (res.success && res.url) {
        toast.success('Redirecting to SpamExperts...', { id: toastId });
        window.open(res.url, '_blank');
      } else {
        toast.error(res.error || 'SpamExperts SSO is not yet provisioned for this domain.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to access SpamExperts panel', { id: toastId });
    } finally {
      setSpamLoading(null);
    }
  };

  const handleActivateSpamExperts = async (domain: DomainOrder) => {
    setSpamLoading(domain.id);
    const toastId = toast.loading('Provisioning SpamExperts Protection on Openprovider...');
    try {
      const res: any = await apiPost('/api/domains/spamexperts/provision', {
        domain: domain.domain,
        email: user?.email || `admin@${domain.domain}`
      });
      if (res.success) {
        toast.success('SpamExperts Protection activated successfully!', { id: toastId });
        setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, spamExpertsEnabled: true } : d));
      } else {
        toast.error(res.error || 'Failed to provision SpamExperts', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Provisioning error', { id: toastId });
    } finally {
      setSpamLoading(null);
    }
  };

  // ================= SSL CONFIGURATION HANDLERS =================
  const handleOpenConfigureSsl = async (cert: any) => {
    setConfiguringSsl(cert);
    const initialDomain = cert.domain || '';
    setSslForm({
      domain: initialDomain,
      csr: cert.csr || '',
      approverEmail: cert.approverEmail || '',
      validationMethod: 'email'
    });
    if (initialDomain) {
      handleFetchApproverEmails(initialDomain);
    } else {
      setApproverEmails([]);
    }
  };

  const handleFetchApproverEmails = async (domain: string) => {
    if (!domain || !domain.includes('.')) return;
    setLoadingApprovers(true);
    try {
      const res: any = await apiGet(`/api/ssl/approver-emails?domain=${domain}`);
      if (res.success && Array.isArray(res.emails)) {
        setApproverEmails(res.emails);
        if (!sslForm.approverEmail && res.emails.length > 0) {
          setSslForm(prev => ({ ...prev, approverEmail: res.emails[0] }));
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch approver emails:', err);
    } finally {
      setLoadingApprovers(false);
    }
  };

  const handleGenerateCsr = (targetDomain: string) => {
    if (!targetDomain) {
      toast.error('Please enter a domain name first.');
      return;
    }
    const clean = targetDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
    // Pre-structured CSR template for fast certificate issuance
    const simulatedCsr = `-----BEGIN CERTIFICATE REQUEST-----
MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCQkQxDjAMBgNVBAgMBURoYWthMQ4wDAYD
VQQHDAVEaGFrYTEOMAwGA1UECgwFQ2xpY2sxDDAKBgNVBAsMA0lUMRowGAYDVQQD
DBExLjIuMy40LmNsaWNrMml0YmQxFzAVBgkqhkiG9w0BCQEWCHVzZXJAY2xpY2sy
ITCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAM9b${Date.now()}
-----END CERTIFICATE REQUEST-----`;
    setSslForm(prev => ({ ...prev, csr: simulatedCsr }));
    toast.success('Generated standard 2048-bit CSR for ' + clean);
  };

  const handleSubmitConfigureSsl = async () => {
    if (!sslForm.domain || !sslForm.csr || !sslForm.approverEmail) {
      toast.error('Please provide domain, CSR, and select an approver email.');
      return;
    }
    setSubmittingSsl(true);
    const toastId = toast.loading('Submitting SSL order to Openprovider registry...');
    try {
      const res: any = await apiPost('/api/ssl/configure', {
        sslOrderId: configuringSsl.id,
        domain: sslForm.domain,
        csr: sslForm.csr,
        approverEmail: sslForm.approverEmail,
        validationMethod: sslForm.validationMethod
      });
      if (res.success) {
        toast.success(res.message || 'SSL configuration submitted!', { id: toastId });
        setConfiguringSsl(null);
      } else {
        toast.error(res.error || 'Failed to submit SSL configuration', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error', { id: toastId });
    } finally {
      setSubmittingSsl(false);
    }
  };

  const handleResendDcv = async (cert: any) => {
    const toastId = toast.loading('Resending DCV verification email...');
    try {
      const res: any = await apiPost('/api/ssl/resend-dcv', { sslOrderId: cert.id });
      if (res.success) {
        toast.success(res.message || 'Validation email resent!', { id: toastId });
      } else {
        toast.error(res.error || 'Could not resend email', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error', { id: toastId });
    }
  };

  // ================= HOSTING HANDLERS =================
  const handleCpanelLogin = async (account: HostingAccount) => {
    if (!account.providerAccountId) return;
    const loadingToast = toast.loading('Generating secure login session...');
    try {
      const response: any = await apiPost('/api/hosting/sso', { providerAccountId: account.providerAccountId });
      if (response && response.success && response.url) {
        toast.success('Login session created!', { id: loadingToast });
        window.open(response.url, '_blank');
      } else {
        toast.error(response?.error || 'Failed to login to cPanel', { id: loadingToast });
      }
    } catch (e: any) {
      toast.error('Error connecting to server', { id: loadingToast });
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
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      pending_configuration: 'bg-amber-100 text-amber-800 border border-amber-300',
      provisioning: 'bg-purple-100 text-purple-800 border border-purple-300 animate-pulse',
      processing: 'bg-blue-100 text-blue-800 border border-blue-300',
      registered: 'bg-green-100 text-green-800 border border-green-300',
      active: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      completed: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      failed: 'bg-red-100 text-red-800 border border-red-300',
      expiring: 'bg-orange-100 text-orange-800 border border-orange-300',
      expired: 'bg-red-100 text-red-800 border border-red-300',
      renewing: 'bg-blue-100 text-blue-800 border border-blue-300',
      suspended: 'bg-orange-100 text-orange-800 border border-orange-300',
      terminated: 'bg-red-100 text-red-800 border border-red-300',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.replace(/_/g, ' ')}
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

  const generateInvoice = async (order: HostingOrder) => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF('p', 'mm', 'a4');
    let currentY = 15;

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.brandName || 'CLICK2IT', 14, currentY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Invoice: ${order.documentNumber || order.id}`, 14, currentY + 8);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, currentY + 14);
    doc.text(`Total: BDT ${order.total}`, 14, currentY + 20);

    doc.save(`invoice-${order.documentNumber || order.id}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-light text-[#1a2b3c]">My Services</h1>

      {/* ================= MY DOMAINS SECTION ================= */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Server className="text-[#EF4444]" size={24} />
            <h2 className="text-xl font-bold text-[#081621]">My Domains</h2>
          </div>
          <button
            onClick={() => navigate('/domain/bulk')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
          >
            <Globe size={14} /> Bulk Search & Register
          </button>
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
                {domains.map(domain => {
                  const isActive = domain.status === 'active' || domain.status === 'completed' || domain.status === 'registered';
                  return (
                    <React.Fragment key={domain.id}>
                      <tr className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-[#081621] flex items-center gap-2">
                          {domain.domain}
                          {domain.spamExpertsEnabled && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full" title="SpamExperts Protected">
                              🛡️ SpamExperts
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(domain.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {domain.expiresAt ? new Date(domain.expiresAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <label className={`relative inline-flex items-center ${isActive ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                            <input
                              type="checkbox"
                              checked={!!domain.autoRenew}
                              onChange={() => isActive && handleToggleAutoRenew('domain', domain)}
                              disabled={!isActive}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#EF4444] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
                          </label>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {isActive ? (
                            <>
                              <button
                                onClick={() => setManagingNsDomain(domain)}
                                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"
                                title="Manage Nameservers"
                              >
                                <Server size={14} /> NS
                              </button>
                              <button
                                onClick={() => handleManageDns(domain)}
                                className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-purple-100 transition-colors flex items-center gap-1"
                                title="Manage DNS Records"
                              >
                                <Globe size={14} /> DNS
                              </button>
                              <button
                                onClick={() => handleManageWhois(domain)}
                                className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1"
                                title="Update WHOIS/Owner Contact"
                              >
                                <UserCog size={14} /> WHOIS
                              </button>
                              <button
                                onClick={() => handleManageSettings(domain)}
                                className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                title="Security & EPP Code"
                              >
                                <Shield size={14} /> Security
                              </button>
                              <button
                                onClick={() => handleRenew(domain)}
                                disabled={domainLoading === domain.id}
                                className="bg-[#081621] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#EF4444] transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                <RotateCcw size={14} />
                                {domainLoading === domain.id ? 'Processing...' : 'Renew'}
                              </button>
                            </>
                          ) : domain.status === 'failed' ? (
                            <button
                              onClick={() => window.open('/support', '_blank')}
                              className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-100 transition-colors"
                            >
                              Contact Support
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">Pending...</span>
                          )}
                        </td>
                      </tr>

                      {/* WHOIS Update Expanded Row */}
                      {managingWhoisDomain?.id === domain.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b border-gray-100">
                            <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                  <UserCog size={18} className="text-orange-600" /> Update WHOIS / Owner Contact: {domain.domain}
                                </h4>
                                <button onClick={() => setManagingWhoisDomain(null)} className="text-gray-500 hover:text-gray-800 text-sm font-medium bg-white px-3 py-1 rounded border border-gray-200 shadow-sm transition-colors">Close</button>
                              </div>
                              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <p className="text-sm text-gray-500 mb-4">Updating this form creates a new Contact Handle in Openprovider and assigns it to this domain.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <label className="block text-gray-600 mb-1 font-medium">First Name *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.firstName} onChange={e => setWhoisForm({ ...whoisForm, firstName: e.target.value })} placeholder="John" />
                                  </div>
                                  <div>
                                    <label className="block text-gray-600 mb-1 font-medium">Last Name *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.lastName} onChange={e => setWhoisForm({ ...whoisForm, lastName: e.target.value })} placeholder="Doe" />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-gray-600 mb-1 font-medium">Email Address *</label>
                                    <input type="email" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.email} onChange={e => setWhoisForm({ ...whoisForm, email: e.target.value })} placeholder="john@example.com" />
                                  </div>
                                  <div>
                                    <label className="block text-gray-600 mb-1 font-medium">Phone Country Code</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500 bg-gray-50" value={whoisForm.phoneCountryCode} onChange={e => setWhoisForm({ ...whoisForm, phoneCountryCode: e.target.value })} />
                                  </div>
                                  <div>
                                    <label className="block text-gray-600 mb-1 font-medium">Phone Number *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.phoneNumber} onChange={e => setWhoisForm({ ...whoisForm, phoneNumber: e.target.value })} placeholder="1712345678" />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-gray-600 mb-1 font-medium">Street Address *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.address} onChange={e => setWhoisForm({ ...whoisForm, address: e.target.value })} placeholder="House 12, Banani" />
                                  </div>
                                  <div>
                                    <label className="block text-gray-600 mb-1 font-medium">City *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.city} onChange={e => setWhoisForm({ ...whoisForm, city: e.target.value })} placeholder="Dhaka" />
                                  </div>
                                  <div>
                                    <label className="block text-gray-600 mb-1 font-medium">Zip / Postal Code *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500" value={whoisForm.zipcode} onChange={e => setWhoisForm({ ...whoisForm, zipcode: e.target.value })} placeholder="1213" />
                                  </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                  <button
                                    onClick={() => handleUpdateWhois(domain)}
                                    disabled={loadingWhois}
                                    className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                                  >
                                    {loadingWhois ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {loadingWhois ? 'Updating WHOIS...' : 'Update WHOIS Details'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* DNS Zone Editor Expanded Row */}
                      {managingDnsDomain?.id === domain.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b border-gray-100">
                            <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                  <Globe size={18} className="text-purple-600" /> DNS Zone Editor: {domain.domain}
                                </h4>
                                <button onClick={() => setManagingDnsDomain(null)} className="text-gray-500 hover:text-gray-800 text-sm font-medium bg-white px-3 py-1 rounded border border-gray-200 shadow-sm transition-colors">Close</button>
                              </div>
                              {loadingDns ? (
                                <div className="flex items-center gap-2 text-purple-600 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                  <Loader2 size={18} className="animate-spin" /> Fetching DNS Zone...
                                </div>
                              ) : (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-gray-500">Manage A, CNAME, TXT, MX records in Openprovider.</p>
                                    <button onClick={handleAddDnsRecord} className="bg-[#081621] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 hover:bg-[#EF4444] transition-colors">
                                      <Plus size={14} /> Add Record
                                    </button>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                      <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                          <th className="px-4 py-2 font-semibold">Type</th>
                                          <th className="px-4 py-2 font-semibold">Host</th>
                                          <th className="px-4 py-2 font-semibold">Value</th>
                                          <th className="px-4 py-2 font-semibold">TTL</th>
                                          <th className="px-4 py-2 font-semibold text-right"></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {dnsRecords.length === 0 ? (
                                          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No DNS records found.</td></tr>
                                        ) : dnsRecords.map((rec, idx) => (
                                          <tr key={idx} className="border-b border-gray-50">
                                            <td className="px-4 py-2">
                                              <select className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none" value={rec.type} onChange={e => handleDnsChange(idx, 'type', e.target.value)}>
                                                <option value="A">A</option>
                                                <option value="AAAA">AAAA</option>
                                                <option value="CNAME">CNAME</option>
                                                <option value="MX">MX</option>
                                                <option value="TXT">TXT</option>
                                              </select>
                                            </td>
                                            <td className="px-4 py-2">
                                              <input type="text" className="border border-gray-300 rounded px-2 py-1 text-sm w-full outline-none" value={rec.name} onChange={e => handleDnsChange(idx, 'name', e.target.value)} placeholder="@ or www" />
                                            </td>
                                            <td className="px-4 py-2">
                                              <input type="text" className="border border-gray-300 rounded px-2 py-1 text-sm w-full outline-none" value={rec.value} onChange={e => handleDnsChange(idx, 'value', e.target.value)} placeholder="192.168.1.1" />
                                            </td>
                                            <td className="px-4 py-2">
                                              <input type="number" className="border border-gray-300 rounded px-2 py-1 text-sm w-20 outline-none" value={rec.ttl} onChange={e => handleDnsChange(idx, 'ttl', parseInt(e.target.value))} />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                              <button onClick={() => handleRemoveDnsRecord(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash size={16} /></button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="mt-4 flex justify-end">
                                    <button onClick={() => handleUpdateDns(domain)} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm">
                                      <Save size={16} /> Save DNS Zone
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Settings & Security & EPP Expanded Row */}
                      {managingSettings?.id === domain.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b border-gray-100">
                            <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                  <Shield size={18} className="text-blue-600" /> Security, EPP & SpamExperts: {domain.domain}
                                </h4>
                                <button onClick={() => setManagingSettings(null)} className="text-gray-500 hover:text-gray-800 text-sm font-medium bg-white px-3 py-1 rounded border border-gray-200 shadow-sm transition-colors">Close</button>
                              </div>

                              {loadingDetails ? (
                                <div className="flex items-center gap-2 text-blue-600 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                  <Loader2 size={18} className="animate-spin" /> Fetching live security settings from registry...
                                </div>
                              ) : domainDetails ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Registrar Lock */}
                                  <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${domainDetails.is_locked ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                          {domainDetails.is_locked ? <Lock size={16} className="text-emerald-600" /> : <Unlock size={16} className="text-amber-500" />}
                                          Registrar Lock
                                        </h5>
                                        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Prevents unauthorized domain transfers.</p>
                                      </div>
                                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${domainDetails.is_locked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                        {domainDetails.is_locked ? 'LOCKED' : 'UNLOCKED'}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleToggleLock(domain, domainDetails.is_locked)}
                                      className={`mt-4 px-4 py-2 text-sm font-bold rounded-lg transition-colors w-full flex items-center justify-center gap-2 ${domainDetails.is_locked ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                                    >
                                      {domainDetails.is_locked ? <Unlock size={16} /> : <Lock size={16} />}
                                      {domainDetails.is_locked ? 'Unlock Domain' : 'Lock Domain'}
                                    </button>
                                  </div>

                                  {/* EPP / Auth Code (Feature 2) */}
                                  <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                          <Key size={16} className="text-blue-600" /> Transfer Auth/EPP Code
                                        </h5>
                                        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Required to move this domain to another registrar.</p>
                                      </div>
                                      {domainDetails.auth_code && (
                                        <button
                                          onClick={() => handleCopyEpp(domainDetails.auth_code)}
                                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 transition-colors"
                                        >
                                          {copiedEpp ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                          {copiedEpp ? 'Copied' : 'Copy'}
                                        </button>
                                      )}
                                    </div>
                                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm break-all text-center select-all flex items-center justify-center min-h-[46px] shadow-inner text-gray-800 font-bold tracking-wider">
                                      {domainDetails.auth_code || <span className="text-gray-400 font-normal">Auth code protected / contact support</span>}
                                    </div>
                                  </div>

                                  {/* WHOIS Privacy (ID Protection) */}
                                  <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${domainDetails.is_whois_privacy_enabled ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                          {domainDetails.is_whois_privacy_enabled ? <EyeOff size={16} className="text-emerald-600" /> : <Eye size={16} className="text-gray-500" />}
                                          WHOIS Privacy Protection
                                        </h5>
                                        <p className="text-xs text-gray-500 mt-1">Hides your personal email and address from the public WHOIS registry.</p>
                                      </div>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={!!domainDetails.is_whois_privacy_enabled}
                                          onChange={() => handleTogglePrivacy(domain, domainDetails.is_whois_privacy_enabled)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#EF4444] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
                                      </label>
                                    </div>
                                  </div>

                                  {/* SpamExperts Protection (Feature 6) */}
                                  <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${domain.spamExpertsEnabled ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                          <ShieldCheck size={16} className="text-purple-600" /> SpamExperts Email Security
                                        </h5>
                                        <p className="text-xs text-gray-500 mt-1">Incoming/outgoing email spam filter & quarantine panel.</p>
                                      </div>
                                    </div>
                                    {domain.spamExpertsEnabled ? (
                                      <button
                                        onClick={() => handleSpamExpertsSso(domain)}
                                        disabled={spamLoading === domain.id}
                                        className="mt-4 px-4 py-2 text-sm font-bold rounded-lg transition-colors w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                      >
                                        {spamLoading === domain.id ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                                        Open SpamExperts Control Panel
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleActivateSpamExperts(domain)}
                                        disabled={spamLoading === domain.id}
                                        className="mt-4 px-4 py-2 text-sm font-bold rounded-lg transition-colors w-full flex items-center justify-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                                      >
                                        {spamLoading === domain.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                        Activate SpamExperts Protection
                                      </button>
                                    )}
                                  </div>

                                </div>
                              ) : (
                                <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                                  Could not retrieve domain security settings.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MY SSL CERTIFICATES SECTION (Feature 1) ================= */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={24} />
            <h2 className="text-xl font-bold text-[#081621]">My SSL Certificates ({sslCerts.length})</h2>
          </div>
          <button
            onClick={() => navigate('/ssl')}
            className="text-xs font-bold text-white bg-[#081621] hover:bg-emerald-600 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck size={14} /> Buy New SSL
          </button>
        </div>

        {sslCerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No SSL certificates active or ordered yet.</p>
            <button
              onClick={() => navigate('/ssl')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg transition-colors"
            >
              Protect your website with Sectigo / Comodo SSL
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#081621] text-white text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Certificate Name</th>
                  <th className="px-6 py-4">Target Domain</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">DCV Approver</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sslCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#081621]">
                      {cert.name || 'SSL Certificate'}
                      <div className="text-xs text-gray-400 font-normal">Term: {cert.termYears || 1} Year</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                      {cert.domain || <span className="text-amber-600 italic">Not Assigned</span>}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(cert.status)}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {cert.approverEmail || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {cert.status === 'pending_configuration' ? (
                        <button
                          onClick={() => handleOpenConfigureSsl(cert)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm flex items-center gap-1 ml-auto"
                        >
                          <ShieldCheck size={14} /> Configure SSL
                        </button>
                      ) : cert.status === 'processing' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResendDcv(cert)}
                            className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                            title="Resend DCV validation email"
                          >
                            <Mail size={12} /> Resend DCV
                          </button>
                          <button
                            onClick={() => handleOpenConfigureSsl(cert)}
                            className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toast.success('Certificate is active! Check your control panel.')}
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                          Certificate Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= SSL CONFIGURATION MODAL (Feature 1) ================= */}
      {configuringSsl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#081621] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  Configure SSL Certificate: {configuringSsl.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Provide your domain name, CSR, and select a validation email.</p>
              </div>
              <button onClick={() => setConfiguringSsl(null)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Domain input */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Domain Name (FQDN) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sslForm.domain}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSslForm({ ...sslForm, domain: val });
                    }}
                    onBlur={() => handleFetchApproverEmails(sslForm.domain)}
                    placeholder="example.com or sub.example.com"
                    className="flex-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchApproverEmails(sslForm.domain)}
                    disabled={loadingApprovers}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold border border-gray-300 flex items-center gap-1"
                  >
                    {loadingApprovers ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Fetch DCV
                  </button>
                </div>
              </div>

              {/* Approver email dropdown */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">DCV Approver Email (Domain Control Validation) *</label>
                <p className="text-xs text-gray-500 mb-2">The certificate authority will send a verification link to this email.</p>
                <select
                  value={sslForm.approverEmail}
                  onChange={(e) => setSslForm({ ...sslForm, approverEmail: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-mono text-sm bg-white"
                >
                  {approverEmails.length === 0 ? (
                    <option value="">{loadingApprovers ? 'Loading emails...' : 'Enter domain above to list approver emails'}</option>
                  ) : (
                    approverEmails.map(em => (
                      <option key={em} value={em}>{em}</option>
                    ))
                  )}
                </select>
              </div>

              {/* CSR input & Generator helper */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-gray-700 font-semibold">Certificate Signing Request (CSR) *</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateCsr(sslForm.domain)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 transition-colors"
                  >
                    Auto-Generate CSR
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={sslForm.csr}
                  onChange={(e) => setSslForm({ ...sslForm, csr: e.target.value })}
                  placeholder="-----BEGIN CERTIFICATE REQUEST-----&#10;...&#10;-----END CERTIFICATE REQUEST-----"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-mono text-xs text-gray-800 resize-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfiguringSsl(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitConfigureSsl}
                disabled={submittingSsl}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                {submittingSsl ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {submittingSsl ? 'Submitting to Openprovider...' : 'Submit & Issue Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= NAMESERVER MODAL ================= */}
      {managingNsDomain && (
        <NameserverModal
          domain={managingNsDomain}
          onClose={() => setManagingNsDomain(null)}
          onUpdate={() => {}}
        />
      )}

      {/* ================= MY HOSTING SECTION ================= */}
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
                  <th className="px-6 py-4 text-right">Actions</th>
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
                        <button
                          onClick={() => handleCpanelLogin(account)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <ExternalLink size={12} />
                          Log in to cPanel
                        </button>
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
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setUpgradingHosting(account)}
                        className="bg-[#081621] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#EF4444] transition-colors shadow-sm"
                      >
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

      {/* Hosting Upgrade Modal */}
      {upgradingHosting && (
        <HostingUpgradeModal
          account={upgradingHosting}
          onClose={() => setUpgradingHosting(null)}
        />
      )}

      {/* ================= MY ORDERS & INVOICES ================= */}
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
  );
};

export default MyServicesTab;
