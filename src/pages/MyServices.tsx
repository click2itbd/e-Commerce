import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { getHostingUsage, HostingUsageStats } from '../services/hostingApi';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, HardDrive, Wifi, RotateCcw, Server } from 'lucide-react';

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
  createdAt: string;
  updatedAt: string;
}

export const MyServices: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [domains, setDomains] = useState<DomainOrder[]>([]);
  const [hosting, setHosting] = useState<HostingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainLoading, setDomainLoading] = useState<string | null>(null);
  const [hostingLoading, setHostingLoading] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<Record<string, HostingUsageStats>>({});
  const [usageLoading, setUsageLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const qDomains = query(collection(db, 'domainOrders'), where('userId', '==', user.uid));
    const unsubDomains = onSnapshot(qDomains, (snap) => {
      setDomains(snap.docs.map(d => ({ id: d.id, ...d.data() } as DomainOrder)));
      setLoading(false);
    }, (err) => {
      console.error('Error loading domains:', err);
      setLoading(false);
    });

    const qHosting = query(collection(db, 'hostingAccounts'), where('userId', '==', user.uid));
    const unsubHosting = onSnapshot(qHosting, (snap) => {
      setHosting(snap.docs.map(d => ({ id: d.id, ...d.data() } as HostingAccount)));
      setLoading(false);
    }, (err) => {
      console.error('Error loading hosting:', err);
      setLoading(false);
    });

    return () => {
      unsubDomains();
      unsubHosting();
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
      const res = await fetch('/api/domain/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.domain, years: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        const renewalProduct = {
          id: `domain_renew_${domain.domain}`,
          name: `Domain Renewal — ${domain.domain}`,
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
        navigate('/checkout');
      } else {
        toast.error(data.error || 'Renewal failed');
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
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRenew(domain)}
                          disabled={domainLoading === domain.id}
                          className="bg-[#081621] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#EF4444] transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto"
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
                          <span className="text-xs text-gray-500">{account.billingCycle?.toUpperCase() || 'MONTHLY'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(account.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {account.status === 'active' && account.serverIp ? account.serverIp : '-'}
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
      </div>
    </Layout>
  );
};
