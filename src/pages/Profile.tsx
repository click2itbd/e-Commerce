import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Building, Save, Camera, Loader2, ShoppingBag, Package, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { formatCurrency } from '../lib/utils';

interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  company: string;
  photoURL: string;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    company: '',
    photoURL: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      // DEV MODE: Use dummy data
      if (import.meta.env.DEV) {
        setFormData({
          name: 'Local Admin',
          email: 'admin@local.test',
          phone: '+880 1700000000',
          address: '123 Test Street',
          city: 'Dhaka',
          company: 'Click2IT (Dev)',
          photoURL: ''
        });
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || user.displayName || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            company: data.company || '',
            photoURL: data.photoURL || user.photoURL || ''
          });
        } else {
          setFormData(prev => ({
            ...prev,
            name: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab !== 'orders' || !user) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [activeTab, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    // DEV MODE: Simulate save
    if (import.meta.env.DEV) {
      await new Promise(r => setTimeout(r, 800));
      toast.success('[DEV] Profile updated! (Simulated)');
      setSaving(false);
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        company: formData.company,
        photoURL: formData.photoURL,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoURL: url }));
      
      // Auto save the photo to Firestore right away for better UX
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { photoURL: url, updatedAt: new Date().toISOString() });
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <Layout>
      <SEO title="My Profile" />

      {/* Hero Header - matching home page style */}
      <div style={{ background: 'linear-gradient(160deg, #020b2e 0%, #050f3a 55%, #0b1a5c 100%)' }} className="py-16 px-4 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(56,100,240,0.15) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative">

          {/* Avatar with upload */}
          <div className="relative group flex-shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-blue-500/40 overflow-hidden bg-blue-900/30 flex items-center justify-center shadow-2xl shadow-blue-900/50">
              {formData.photoURL ? (
                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={52} className="text-blue-300/60" />
              )}
            </div>
            <label className="absolute bottom-1 right-1 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full cursor-pointer transition-all shadow-lg shadow-orange-500/30">
              {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>

          {/* Name & Email */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/10 rounded-full px-4 py-1 mb-3 text-xs text-blue-300 font-semibold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              My Account
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{formData.name || 'Your Profile'}</h1>
            <p className="text-blue-300 flex items-center justify-center md:justify-start gap-2 text-sm">
              <Mail size={15} /> {formData.email}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'orders', label: 'My Orders', icon: ShoppingBag },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                <User size={18} className="text-blue-600" /> Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <User size={15} className="text-blue-500" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
                    placeholder="Your Full Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Mail size={15} className="text-blue-500" /> Email Address
                  </label>
                  <input type="email" value={formData.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" />
                  <p className="text-[10px] text-gray-400">Email address cannot be changed.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Phone size={15} className="text-blue-500" /> Phone Number
                  </label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50" placeholder="+880 1..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Building size={15} className="text-blue-500" /> Company Name (Optional)
                  </label>
                  <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50" placeholder="Your Company Ltd." />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <MapPin size={15} className="text-blue-500" /> Address
                  </label>
                  <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-gray-50/50" placeholder="House, Street, Area..." />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">City / Region</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50" placeholder="Dhaka" />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button type="submit" disabled={saving} style={!saving ? { background: 'linear-gradient(135deg, #f97316, #ea6100)' } : {}} className="text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed bg-gray-400">
                  {saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><Save size={18} />Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Orders Yet</h3>
                <p className="text-gray-400 mb-6">You haven't placed any orders yet.</p>
                <a href="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                  Browse Services <ChevronRight size={16} />
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const isPaid = order.paymentStatus === 'paid';
                  const isFailed = order.paymentStatus === 'failed';
                  const isPending = !isPaid && !isFailed;
                  const isExpanded = expandedOrderId === order.id;
                  const date = new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">

                      {/* Clickable Order Header */}
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="w-full text-left px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isPaid ? 'bg-green-100' : isFailed ? 'bg-red-100' : 'bg-yellow-100'
                          }`}>
                            {isPaid ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : isFailed ? <XCircle className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-yellow-600" />}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">Order #{order.documentNumber || order.id.slice(-8).toUpperCase()}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            isPaid ? 'bg-green-100 text-green-700' : isFailed ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {isPaid ? '✓ Paid' : isFailed ? '✗ Failed' : '⏳ Pending'}
                          </span>
                          <span className="font-black text-gray-900 text-lg">{formatCurrency(order.total)}</span>
                          <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Expanded Detail View */}
                      {isExpanded && (
                        <div className="border-t border-gray-100">

                          {/* Items */}
                          <div className="px-6 py-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Order Items</h4>
                            <div className="space-y-2">
                              {(order.items || []).map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                      <Package size={15} className="text-blue-500" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-800">{item.name || item.productName || item.title || 'Product'}</div>
                                      <div className="text-xs text-gray-400">Qty: {item.quantity || 1} {item.category ? `• ${item.category}` : ''}</div>
                                    </div>
                                  </div>
                                  <div className="text-sm font-bold text-gray-800">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Summary grid */}
                          <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Payment Method</div>
                              <div className="text-sm font-bold text-gray-800 capitalize">{order.paymentMethod || 'N/A'}</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Order Status</div>
                              <div className="text-sm font-bold text-gray-800 capitalize">{order.status || 'pending'}</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Subtotal</div>
                              <div className="text-sm font-bold text-gray-800">{formatCurrency(order.total || 0)}</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Payment Status</div>
                              <div className={`text-sm font-bold capitalize ${
                                isPaid ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-yellow-600'
                              }`}>{order.paymentStatus || 'pending'}</div>
                            </div>
                          </div>

                          {/* Shipping address if exists */}
                          {order.shippingAddress && (
                            <div className="px-6 pb-4">
                              <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Delivery Address</div>
                                <div className="text-sm text-gray-700">{order.shippingAddress}</div>
                              </div>
                            </div>
                          )}

                          {/* Order ID for reference */}
                          <div className="px-6 pb-4">
                            <div className="text-[10px] text-gray-400">Order ID: <span className="font-mono text-gray-600">{order.id}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

