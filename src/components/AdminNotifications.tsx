import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, Tag, Clock } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, getDocs, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDistanceToNow } from 'date-fns';

export const AdminNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Listen for new pending orders
    const q1 = query(collection(db, 'orders'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(5));
    // Listen for new domain offers
    const q2 = query(collection(db, 'domain_offers'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(5));
    
    // We'll combine them manually since Firestore onSnapshot on multiple collections is tricky
    // For simplicity, let's just fetch both once and periodically, or just fetch pending items.
    
    const fetchNotifs = async () => {
      try {
        const oSnap = await getDocs(q1);
        const offersSnap = await getDocs(q2);
        
        let items = [];
        oSnap.docs.forEach(d => {
          items.push({
            id: d.id,
            type: 'order',
            title: 'New Order Pending',
            message: `Order #${d.data().documentNumber || d.id.substring(0,6)} requires attention`,
            time: d.data().createdAt,
            icon: Package,
            color: 'text-blue-500 bg-blue-50'
          });
        });
        
        offersSnap.docs.forEach(d => {
          items.push({
            id: d.id,
            type: 'offer',
            title: 'New Domain Offer',
            message: `${d.data().domain} offer for ${d.data().offerAmount}`,
            time: d.data().createdAt,
            icon: Tag,
            color: 'text-green-500 bg-green-50'
          });
        });
        
        // Sort by time descending
        items.sort((a, b) => new Date(b.time) - new Date(a.time));
        setNotifications(items.slice(0, 10));
        setUnreadCount(items.length);
      } catch(e) {
        console.error('Error fetching notifications:', e);
      }
    };
    
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{unreadCount} Pending</span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notif => {
                  const Icon = notif.icon;
                  return (
                    <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{notif.title}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-medium">
                          <Clock size={10} />
                          {notif.time ? formatDistanceToNow(new Date(notif.time), { addSuffix: true }) : 'Recently'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 text-center bg-gray-50">
            <button className="text-xs font-bold text-blue-600 hover:text-blue-800" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


