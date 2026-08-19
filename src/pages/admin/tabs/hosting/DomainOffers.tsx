import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Phone, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '../../../../lib/utils';

interface DomainOffer {
  id: string;
  domain: string;
  amount: number;
  email: string;
  phone: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function DomainOffers() {
  const [offers, setOffers] = useState<DomainOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const q = query(collection(db, 'domain_offers'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DomainOffer));
      setOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load domain offers');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'domain_offers', id), { status: newStatus });
      setOffers(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
      toast.success(`Offer marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteOffer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await deleteDoc(doc(db, 'domain_offers', id));
      setOffers(prev => prev.filter(o => o.id !== id));
      toast.success('Offer deleted');
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Domain Broker Offers</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Offer Amount</th>
                <th className="px-4 py-3">Customer Info</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No domain offers found.
                  </td>
                </tr>
              ) : offers.map(offer => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{offer.domain}</td>
                  <td className="px-4 py-3 font-bold text-green-600">৳{offer.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <a href={`mailto:${offer.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Mail size={12} /> {offer.email}
                      </a>
                      <a href={`tel:${offer.phone}`} className="flex items-center gap-1 text-gray-600 hover:underline">
                        <Phone size={12} /> {offer.phone}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                      offer.status === 'pending' && "bg-yellow-100 text-yellow-700",
                      offer.status === 'accepted' && "bg-green-100 text-green-700",
                      offer.status === 'rejected' && "bg-red-100 text-red-700"
                    )}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {offer.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(offer.id, 'accepted')} title="Accept" className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => updateStatus(offer.id, 'rejected')} title="Reject" className="p-1.5 text-orange-600 hover:bg-orange-50 rounded">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => deleteOffer(offer.id)} title="Delete" className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
