import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { toast } from 'react-hot-toast';
import { 
  Server, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  HardDrive, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Mail, 
  ArrowUpDown, 
  Key, 
  AlertTriangle,
  X,
  Clock,
  Layers
} from 'lucide-react';
import { cn, formatCurrency } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { 
  getHostingUsage, 
  suspendHostingAccount, 
  unsuspendHostingAccount, 
  terminateHostingAccount, 
  changeHostingPlan,
  provisionHostingAccount,
  HostingUsageStats 
} from '../../../../services/hostingApi';
import { sendServiceActivationEmail } from '../../../../services/emailService';

export interface HostingAccountItem {
  id: string;
  domain: string;
  planId: string;
  userId?: string;
  orderId?: string;
  providerAccountId?: string;
  username?: string;
  status: 'active' | 'suspended' | 'pending' | 'terminated' | string;
  provisioningStatus?: string;
  cPanelUrl?: string;
  controlPanelUrl?: string;
  serverIp?: string;
  nameservers?: string[];
  billingCycle?: 'monthly' | 'annually' | string;
  autoRenew?: boolean;
  customerName?: string;
  customerEmail?: string;
  createdAt?: string;
  expiresAt?: string;
  updatedAt?: string;
}

export const ActiveHostingAccounts: React.FC = () => {
  const { isAdmin } = useAuth();
  const [accounts, setAccounts] = useState<HostingAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending' | 'terminated'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  
  // Usage tracking state: accountId -> stats
  const [usageStats, setUsageStats] = useState<Record<string, HostingUsageStats>>({});
  const [loadingUsage, setLoadingUsage] = useState<Record<string, boolean>>({});
  const [refreshingAll, setRefreshingAll] = useState(false);

  // Modals state
  const [selectedAccount, setSelectedAccount] = useState<HostingAccountItem | null>(null);
  const [changePackageModal, setChangePackageModal] = useState<HostingAccountItem | null>(null);
  const [newPlanCode, setNewPlanCode] = useState('standard');
  const [updatingPackage, setUpdatingPackage] = useState(false);

  const [isAddingModal, setIsAddingModal] = useState(false);
  const [savingNewAccount, setSavingNewAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    domain: '',
    customerEmail: '',
    customerName: '',
    planId: 'starter',
    billingCycle: 'monthly',
    username: '',
    serverIp: '103.145.118.50',
    controlPanelUrl: 'https://cpanel.click2itbd.com',
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'hostingAccounts'), orderBy('createdAt', 'desc')));
      const items: HostingAccountItem[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as HostingAccountItem));
      setAccounts(items);
    } catch (error: any) {
      console.error('Error fetching hosting accounts:', error);
      toast.error('Failed to load hosting accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleFetchUsage = async (account: HostingAccountItem) => {
    const accId = account.providerAccountId || account.username || account.id;
    if (!accId) return;

    setLoadingUsage(prev => ({ ...prev, [account.id]: true }));
    try {
      const usage = await getHostingUsage(accId);
      setUsageStats(prev => ({ ...prev, [account.id]: usage }));
      toast.success(`Usage updated for ${account.domain || account.id}`);
    } catch (error: any) {
      console.error('Usage fetch error:', error);
      toast.error(`Usage error for ${account.domain}: ` + (error.message || 'Check server connection'));
    } finally {
      setLoadingUsage(prev => ({ ...prev, [account.id]: false }));
    }
  };

  const handleRefreshAllUsage = async () => {
    setRefreshingAll(true);
    const activeAccounts = accounts.filter(a => a.status === 'active');
    let updatedCount = 0;
    for (const acc of activeAccounts) {
      try {
        const accId = acc.providerAccountId || acc.username || acc.id;
        if (accId) {
          const usage = await getHostingUsage(accId);
          setUsageStats(prev => ({ ...prev, [acc.id]: usage }));
          updatedCount++;
        }
      } catch (err) {
        // continue
      }
    }
    setRefreshingAll(false);
    toast.success(`Refreshed live usage for ${updatedCount} active accounts`);
  };

  const handleToggleSuspend = async (account: HostingAccountItem) => {
    const isCurrentlySuspended = account.status === 'suspended';
    const actionText = isCurrentlySuspended ? 'unsuspend' : 'suspend';
    
    if (!window.confirm(`Are you sure you want to ${actionText.toUpperCase()} hosting for ${account.domain}?`)) {
      return;
    }

    const toastId = toast.loading(`${actionText === 'suspend' ? 'Suspending' : 'Unsuspending'} cPanel account...`);
    try {
      const accId = account.providerAccountId || account.username || account.id;
      if (isCurrentlySuspended) {
        await unsuspendHostingAccount(accId);
      } else {
        await suspendHostingAccount(accId);
      }

      const newStatus = isCurrentlySuspended ? 'active' : 'suspended';
      await updateDoc(doc(db, 'hostingAccounts', account.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: newStatus } : a));
      toast.success(`Account successfully ${newStatus}!`, { id: toastId });
    } catch (error: any) {
      console.error('Suspend/Unsuspend error:', error);
      toast.error(`Failed to ${actionText}: ` + error.message, { id: toastId });
    }
  };

  const handleTerminate = async (account: HostingAccountItem) => {
    const domainConfirm = window.prompt(
      `⚠️ DANGER: This will PERMANENTLY delete the cPanel account, databases, and emails for ${account.domain} on the server.\n\nType the domain "${account.domain}" to confirm:`
    );

    if (domainConfirm !== account.domain) {
      toast.error('Termination cancelled: Domain did not match.');
      return;
    }

    const toastId = toast.loading(`Terminating ${account.domain} on WHM server...`);
    try {
      const accId = account.providerAccountId || account.username || account.id;
      await terminateHostingAccount(accId);

      await updateDoc(doc(db, 'hostingAccounts', account.id), {
        status: 'terminated',
        updatedAt: new Date().toISOString(),
      });

      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: 'terminated' } : a));
      toast.success(`Account for ${account.domain} has been terminated.`, { id: toastId });
    } catch (error: any) {
      console.error('Termination error:', error);
      toast.error('Failed to terminate account: ' + error.message, { id: toastId });
    }
  };

  const handleChangePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePackageModal) return;

    setUpdatingPackage(true);
    const toastId = toast.loading(`Upgrading/Changing package to ${newPlanCode.toUpperCase()}...`);
    try {
      const accId = changePackageModal.providerAccountId || changePackageModal.username || changePackageModal.id;
      await changeHostingPlan(accId, newPlanCode);

      await updateDoc(doc(db, 'hostingAccounts', changePackageModal.id), {
        planId: newPlanCode,
        updatedAt: new Date().toISOString(),
      });

      setAccounts(prev => prev.map(a => a.id === changePackageModal.id ? { ...a, planId: newPlanCode } : a));
      toast.success(`Package changed to ${newPlanCode.toUpperCase()} successfully!`, { id: toastId });
      setChangePackageModal(null);
    } catch (error: any) {
      console.error('Change package error:', error);
      toast.error('Failed to change package: ' + error.message, { id: toastId });
    } finally {
      setUpdatingPackage(false);
    }
  };

  const handleResendCredentials = async (account: HostingAccountItem) => {
    if (!account.customerEmail) {
      const email = window.prompt(`Enter customer email to send credentials for ${account.domain}:`);
      if (!email) return;
      account.customerEmail = email;
    }

    const toastId = toast.loading(`Sending activation email for ${account.domain}...`);
    try {
      const success = await sendServiceActivationEmail(account.orderId || account.id, account.customerEmail, {
        domain: account.domain,
        serverIp: account.serverIp || '103.145.118.50',
        controlPanelUrl: account.cPanelUrl || account.controlPanelUrl || 'https://cpanel.click2itbd.com',
      });

      if (success) {
        toast.success(`Activation credentials sent to ${account.customerEmail}`, { id: toastId });
      } else {
        toast.error('Failed to send email. Please check SMTP settings.', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Email error: ' + err.message, { id: toastId });
    }
  };

  const handleCreateNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountData.domain) {
      toast.error('Please enter a valid domain name');
      return;
    }

    setSavingNewAccount(true);
    const toastId = toast.loading(`Provisioning cPanel account for ${newAccountData.domain}...`);
    try {
      // 1. Hit WHM provision endpoint
      const result = await provisionHostingAccount({
        domain: newAccountData.domain.trim(),
        contactEmail: newAccountData.customerEmail.trim() || 'admin@click2itbd.com',
        billingCycle: newAccountData.billingCycle,
        planCode: newAccountData.planId,
      });

      const newDocRef = await addDoc(collection(db, 'hostingAccounts'), {
        domain: newAccountData.domain.trim(),
        planId: newAccountData.planId,
        billingCycle: newAccountData.billingCycle,
        customerName: newAccountData.customerName.trim() || 'Direct Client',
        customerEmail: newAccountData.customerEmail.trim() || '',
        username: newAccountData.username.trim() || newAccountData.domain.split('.')[0].slice(0, 8),
        providerAccountId: result.data?.providerAccountId || newAccountData.username || newAccountData.domain.split('.')[0],
        status: result.success ? 'active' : 'pending',
        provisioningStatus: result.success ? 'completed' : 'pending',
        serverIp: newAccountData.serverIp,
        controlPanelUrl: result.data?.cPanelUrl || newAccountData.controlPanelUrl,
        cPanelUrl: result.data?.cPanelUrl || newAccountData.controlPanelUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success(`Hosting account for ${newAccountData.domain} created!`, { id: toastId });
      setIsAddingModal(false);
      setNewAccountData({
        domain: '',
        customerEmail: '',
        customerName: '',
        planId: 'starter',
        billingCycle: 'monthly',
        username: '',
        serverIp: '103.145.118.50',
        controlPanelUrl: 'https://cpanel.click2itbd.com',
      });
      fetchAccounts();
    } catch (error: any) {
      console.error('Provision error:', error);
      toast.error('Provisioning failed: ' + error.message, { id: toastId });
    } finally {
      setSavingNewAccount(false);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      acc.domain?.toLowerCase().includes(q) ||
      acc.customerName?.toLowerCase().includes(q) ||
      acc.customerEmail?.toLowerCase().includes(q) ||
      acc.username?.toLowerCase().includes(q) ||
      acc.planId?.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || acc.status === statusFilter;
    const matchPlan = planFilter === 'all' || acc.planId?.toLowerCase() === planFilter.toLowerCase();

    return matchQuery && matchStatus && matchPlan;
  });

  // Calculate metrics
  const totalCount = accounts.length;
  const activeCount = accounts.filter(a => a.status === 'active').length;
  const suspendedCount = accounts.filter(a => a.status === 'suspended').length;
  const pendingCount = accounts.filter(a => a.status === 'pending' || a.status === 'provisioning').length;

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Active Hosting Accounts</h2>
              <p className="text-xs text-gray-500 mt-0.5">Live cPanel & CloudLinux Accounts on Maidhome / WHM Server</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRefreshAllUsage}
            disabled={refreshingAll || loading}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshingAll ? 'animate-spin' : ''} />
            {refreshingAll ? 'Polling Usage...' : 'Refresh All Usage'}
          </button>

          <button
            onClick={() => setIsAddingModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
          >
            <Plus size={16} />
            Provision / Link Account
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Accounts</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Live</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suspended</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{suspendedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Provision</p>
            <p className="text-2xl font-black text-purple-600 mt-0.5">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search domain, username, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
            <option value="terminated">Terminated</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Packages</option>
            <option value="starter">Starter (5 GB)</option>
            <option value="standard">Standard (10 GB)</option>
            <option value="professional">Professional (20 GB)</option>
            <option value="premium">Premium (50 GB)</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="py-4 px-6">Domain & Server</th>
                <th className="py-4 px-6">Package / Tier</th>
                <th className="py-4 px-6 min-w-[180px]">Disk Usage</th>
                <th className="py-4 px-6 min-w-[180px]">Bandwidth Usage</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading hosting accounts...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No hosting accounts match the criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const usage = usageStats[account.id];
                  const isLoadingThis = loadingUsage[account.id];
                  const cPanelLoginUrl = account.cPanelUrl || account.controlPanelUrl || `https://${account.domain}:2083`;
                  
                  // Disk usage math
                  const diskUsedGB = usage ? (usage.diskUsageMB / 1024) : 0;
                  const diskLimitGB = usage ? (usage.diskLimitMB / 1024) : (
                    account.planId === 'starter' ? 5 :
                    account.planId === 'standard' ? 10 :
                    account.planId === 'professional' ? 20 :
                    account.planId === 'premium' ? 50 : 10
                  );
                  const diskPercent = diskLimitGB > 0 ? Math.min((diskUsedGB / diskLimitGB) * 100, 100) : 0;

                  // Bandwidth usage math
                  const bwUsedGB = usage ? (usage.bandwidthUsageMB / 1024) : 0;
                  const bwLimitGB = usage ? (usage.bandwidthLimitMB / 1024) : 100;
                  const bwPercent = bwLimitGB > 0 ? Math.min((bwUsedGB / bwLimitGB) * 100, 100) : 0;

                  return (
                    <tr key={account.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            <Server size={15} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              {account.domain}
                              <a
                                href={cPanelLoginUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-blue-600 transition"
                                title="Open cPanel login"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                            <div className="text-xs text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                              <span>User: {account.username || account.providerAccountId || 'cpanel'}</span>
                              <span>•</span>
                              <span>IP: {account.serverIp || '103.145.118.50'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
                            {account.planId || 'Starter'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1 capitalize font-medium">
                            {account.billingCycle || 'Monthly'} Cycle
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {usage ? (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-gray-700">
                              <span>{diskUsedGB.toFixed(2)} GB</span>
                              <span>{diskLimitGB} GB ({diskPercent.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  diskPercent > 85 ? "bg-red-500" : diskPercent > 60 ? "bg-amber-500" : "bg-blue-600"
                                )}
                                style={{ width: `${diskPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleFetchUsage(account)}
                            disabled={isLoadingThis}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg transition"
                          >
                            <RefreshCw size={11} className={isLoadingThis ? 'animate-spin' : ''} />
                            {isLoadingThis ? 'Checking...' : 'Check Live Disk'}
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {usage ? (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-gray-700">
                              <span>{bwUsedGB.toFixed(2)} GB</span>
                              <span>{bwLimitGB > 9000 ? 'Unmetered' : `${bwLimitGB} GB`}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${bwPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1",
                          account.status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          account.status === 'suspended' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          account.status === 'terminated' ? "bg-red-50 text-red-700 border border-red-200" :
                          "bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse"
                        )}>
                          {account.status === 'active' && <CheckCircle size={11} />}
                          {account.status === 'suspended' && <ShieldAlert size={11} />}
                          {account.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={cPanelLoginUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm inline-flex items-center gap-1"
                            title="Direct cPanel login"
                          >
                            <ExternalLink size={12} />
                            cPanel
                          </a>

                          <button
                            onClick={() => {
                              setChangePackageModal(account);
                              setNewPlanCode(account.planId || 'standard');
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Change / Upgrade Package"
                          >
                            <ArrowUpDown size={15} />
                          </button>

                          <button
                            onClick={() => handleResendCredentials(account)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Resend Activation Credentials Email"
                          >
                            <Mail size={15} />
                          </button>

                          <button
                            onClick={() => handleToggleSuspend(account)}
                            className={cn(
                              "p-1.5 rounded-lg transition",
                              account.status === 'suspended' ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"
                            )}
                            title={account.status === 'suspended' ? "Unsuspend Account" : "Suspend Account"}
                          >
                            {account.status === 'suspended' ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
                          </button>

                          <button
                            onClick={() => handleTerminate(account)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Terminate Account (Permanent)"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Package Modal */}
      {changePackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-lg">Change Hosting Package</h3>
              </div>
              <button onClick={() => setChangePackageModal(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePackageSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">Domain:</p>
                <p className="text-base font-bold text-gray-900 font-mono">{changePackageModal.domain}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select New Tier:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'starter', name: 'Starter', space: '5 GB NVMe', price: '৳150/mo' },
                    { id: 'standard', name: 'Standard', space: '10 GB NVMe', price: '৳350/mo' },
                    { id: 'professional', name: 'Professional', space: '20 GB NVMe', price: '৳650/mo' },
                    { id: 'premium', name: 'Premium', space: '50 GB NVMe', price: '৳1,200/mo' },
                  ].map(pkg => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setNewPlanCode(pkg.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        newPlanCode === pkg.id 
                          ? "border-blue-600 bg-blue-50/70 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <p className="font-bold text-sm text-gray-900">{pkg.name}</p>
                      <p className="text-xs text-gray-500">{pkg.space}</p>
                      <p className="text-xs font-semibold text-blue-600 mt-1">{pkg.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setChangePackageModal(null)}
                  className="flex-1 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPackage}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition flex items-center justify-center gap-2"
                >
                  {updatingPackage ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Apply Upgrade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision / Link Manual Account Modal */}
      {isAddingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-lg">Provision / Link Hosting Account</h3>
              </div>
              <button onClick={() => setIsAddingModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewAccount} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Domain Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. clientdomain.com"
                    value={newAccountData.domain}
                    onChange={(e) => setNewAccountData({ ...newAccountData, domain: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    cPanel Username (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. clientdom"
                    value={newAccountData.username}
                    onChange={(e) => setNewAccountData({ ...newAccountData, username: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={newAccountData.customerEmail}
                    onChange={(e) => setNewAccountData({ ...newAccountData, customerEmail: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={newAccountData.customerName}
                    onChange={(e) => setNewAccountData({ ...newAccountData, customerName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Package Tier
                  </label>
                  <select
                    value={newAccountData.planId}
                    onChange={(e) => setNewAccountData({ ...newAccountData, planId: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="starter">Starter (5 GB NVMe - ৳150/mo)</option>
                    <option value="standard">Standard (10 GB NVMe - ৳350/mo)</option>
                    <option value="professional">Professional (20 GB NVMe - ৳650/mo)</option>
                    <option value="premium">Premium (50 GB NVMe - ৳1,200/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={newAccountData.billingCycle}
                    onChange={(e) => setNewAccountData({ ...newAccountData, billingCycle: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annually">Yearly / Annually</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingModal(false)}
                  className="flex-1 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewAccount}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition flex items-center justify-center gap-2"
                >
                  {savingNewAccount ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ActiveHostingAccounts;
