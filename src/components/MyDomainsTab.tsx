import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Globe, Server, Save, Loader2, CalendarClock, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiPost } from '../services/apiClient';

export const MyDomainsTab = ({ currentUser }: { currentUser: any }) => {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [managingDomain, setManagingDomain] = useState<any>(null);
  const [nsValues, setNsValues] = useState({ ns0: '', ns1: '' });
  const [savingNs, setSavingNs] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchDomains();
    }
  }, [currentUser]);

  
  const handleRenewDomain = (domainOrder: any) => {
    addToCart({
      id: `renew_${domainOrder.domain}`,
      name: `Domain Renewal - ${domainOrder.domain}`,
      description: '1 Year Renewal',
      price: domainOrder.price || 1200,
      category: 'Hosting & Domains',
      stock: 999,
      images: [],
      createdAt: new Date().toISOString(),
      itemType: 'domain_renewal',
      domain: domainOrder.domain,
      termYears: 1
    } as any);
    toast.success('Renewal added to cart');
    navigate('/hosting-checkout');
  };

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'domainOrders'),
        where('customerId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      const doms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDomains(doms);
    } catch (error) {
      console.error("Error fetching domains:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNameServers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingDomain) return;
    if (!nsValues.ns0 || !nsValues.ns1) {
      toast.error('At least two nameservers are required');
      return;
    }

    setSavingNs(true);
    try {
      const response = await apiPost<{ success: boolean; data?: any; error?: string }>('/api/domain/manage', {
        command: 'set_ns',
        domain: managingDomain.domain,
        extraParams: {
          ns0: nsValues.ns0,
          ns1: nsValues.ns1
        }
      });

      if (response.success) {
        toast.success('NameServers updated successfully! It may take 24-48 hours to propagate.');
        await updateDoc(doc(db, 'domainOrders', managingDomain.id), {
          nameservers: nsValues
        });
        fetchDomains();
        setManagingDomain(null);
      } else {
        toast.error(response.error || 'Failed to update NameServers. Check your Dynadot API settings.');
      }
    } catch (error: any) {
      console.error('NS Update Error:', error);
      toast.error(error.message || 'Error communicating with server');
    } finally {
      setSavingNs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Globe size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Domains Found</h3>
        <p className="text-gray-500">You haven't registered any domains yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {domains.map((domainOrder) => (
        <div key={domainOrder.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Globe className="text-blue-600" size={24} />
                <h3 className="text-xl font-bold text-gray-900">{domainOrder.domain}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold \${
                  domainOrder.status === 'active' ? 'bg-green-100 text-green-700' : 
                  domainOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {domainOrder.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <CalendarClock size={14} /> Registered on: {new Date(domainOrder.createdAt?.seconds * 1000).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setManagingDomain(domainOrder);
                  setNsValues(domainOrder.nameservers || { ns0: '', ns1: '' });
                }}
                className="px-4 py-2 border border-gray-200 hover:border-blue-500 hover:text-blue-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Server size={16} /> Manage DNS
              </button>
            </div>
          </div>

          {managingDomain?.id === domainOrder.id && (
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Settings size={18} /> Update NameServers
              </h4>
              <form onSubmit={handleUpdateNameServers} className="max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nameserver 1</label>
                    <input 
                      type="text" 
                      required
                      value={nsValues.ns0}
                      onChange={(e) => setNsValues({...nsValues, ns0: e.target.value})}
                      placeholder="e.g. ns1.yourhost.com"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nameserver 2</label>
                    <input 
                      type="text" 
                      required
                      value={nsValues.ns1}
                      onChange={(e) => setNsValues({...nsValues, ns1: e.target.value})}
                      placeholder="e.g. ns2.yourhost.com"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={savingNs}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingNs ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save NameServers
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setManagingDomain(null)}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

