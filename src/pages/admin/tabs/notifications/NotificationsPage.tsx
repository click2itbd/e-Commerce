import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { formatDistanceToNow } from 'date-fns';
import { Package, Globe, LifeBuoy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

export const NotificationsPage = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => {
  const { isAdmin, isManager, isStaff, hasPermission } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'orders' | 'hosting' | 'support' | 'stock'>('all');
  
  useEffect(() => {
    const itemsMap = new Map<string, any>();
    const rebuild = () => {
      const arr = Array.from(itemsMap.values());
      arr.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(arr);
    };

    // Orders
    if (isAdmin || isManager || hasPermission('orders')) {
      const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.status === 'pending') {
            itemsMap.set(`order-${d.id}`, {
              id: `order-${d.id}`, docId: d.id, category: 'orders', targetTab: 'orders',
              title: 'New Store Order', badgeText: 'PENDING',
              badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
              message: `Order #${data.documentNumber || d.id.substring(0, 7)} — ৳${Number(data.total || 0).toLocaleString()}`,
              time: data.createdAt || new Date().toISOString(),
              icon: Package, iconBg: 'bg-blue-500 text-white'
            });
          } else itemsMap.delete(`order-${d.id}`);
        });
        rebuild();
      });
    }

    // Domain Offers
    if (isAdmin || isManager) {
      const unsub = onSnapshot(collection(db, 'domain_offers'), (snap) => {
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.status === 'pending' || !data.status) {
            itemsMap.set(`offer-${d.id}`, {
              id: `offer-${d.id}`, docId: d.id, category: 'hosting', targetTab: 'domainOffers',
              title: 'Domain Buy Offer', badgeText: 'OFFER',
              badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              message: `${data.domain || 'Domain'} offer: ৳${Number(data.amount || data.offerAmount || 0).toLocaleString()}`,
              time: data.createdAt || new Date().toISOString(),
              icon: Globe, iconBg: 'bg-emerald-500 text-white'
            });
          } else itemsMap.delete(`offer-${d.id}`);
        });
        rebuild();
      });
    }

    // Support Tickets
    if (isAdmin || isManager || isStaff) {
      const unsub = onSnapshot(collection(db, 'support_tickets'), (snap) => {
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.status === 'open' || data.status === 'in_progress') {
            itemsMap.set(`ticket-${d.id}`, {
              id: `ticket-${d.id}`, docId: d.id, category: 'support', targetTab: 'support_tickets',
              title: 'Support Ticket', badgeText: data.status.toUpperCase(),
              badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
              message: `${data.title || 'Support Request'} from ${data.customerName || 'Customer'}`,
              time: data.createdAt || new Date().toISOString(),
              icon: LifeBuoy, iconBg: 'bg-purple-500 text-white'
            });
          } else itemsMap.delete(`ticket-${d.id}`);
        });
        rebuild();
      });
    }

    // Products Low Stock
    if (isAdmin || isManager || hasPermission('inventory')) {
      const unsub = onSnapshot(collection(db, 'products'), (snap) => {
        snap.docs.forEach(d => {
          const data = d.data();
          if (typeof data.stock === 'number' && data.stock <= 5 && data.stock >= 0) {
            itemsMap.set(`stock-${d.id}`, {
              id: `stock-${d.id}`, docId: d.id, category: 'stock', targetTab: 'inventory',
              title: 'Low Stock Warning', badgeText: `${data.stock} LEFT`,
              badgeColor: data.stock === 0 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-orange-100 text-orange-800 border-orange-200',
              message: `${data.name} is running low on stock.`,
              time: data.createdAt || new Date().toISOString(),
              icon: AlertTriangle, iconBg: data.stock === 0 ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
            });
          } else itemsMap.delete(`stock-${d.id}`);
        });
        rebuild();
      });
    }
  }, [isAdmin, isManager, isStaff, hasPermission]);

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.category === filter);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">All Notifications</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and view all system alerts</p>
        </div>
        
        <div className="flex gap-2">
          {['all', 'orders', 'hosting', 'support', 'stock'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 h-full p-4 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400 mb-3" />
            <p className="text-gray-500 text-lg">All caught up! No new notifications.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(notif => {
              const Icon = notif.icon;
              return (
                <div 
                  key={notif.id}
                  onClick={() => setActiveTab(notif.targetTab)}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-100 transition-all cursor-pointer group"
                >
                  <div className={`p-3 rounded-full shrink-0 ${notif.iconBg}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {notif.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {notif.time ? formatDistanceToNow(new Date(notif.time), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 truncate">
                      {notif.message}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${notif.badgeColor}`}>
                      {notif.badgeText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
