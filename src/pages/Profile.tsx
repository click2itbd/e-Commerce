import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Building, Save } from 'lucide-react';
import { SEO } from '../components/SEO';

interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  company: string;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    company: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
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
            company: data.company || ''
          });
        } else {
          setFormData(prev => ({
            ...prev,
            name: user.displayName || '',
            email: user.email || ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        company: formData.company,
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
          <div className="h-8 w-8 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="My Profile" />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#081621] px-8 py-10 text-white flex items-center gap-6">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{formData.name || 'Your Profile'}</h1>
              <p className="text-gray-300 mt-1 flex items-center gap-2">
                <Mail size={16} /> {formData.email}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-[#EF4444]" /> Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/20 focus:border-[#EF4444] transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Mail size={16} className="text-[#EF4444]" /> Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400">Email address cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Phone size={16} className="text-[#EF4444]" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/20 focus:border-[#EF4444] transition-all"
                  placeholder="+880 1..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Building size={16} className="text-[#EF4444]" /> Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/20 focus:border-[#EF4444] transition-all"
                  placeholder="Your Company Ltd."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <MapPin size={16} className="text-[#EF4444]" /> Address
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/20 focus:border-[#EF4444] transition-all resize-none"
                  placeholder="House, Street, Area..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">City / Region</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/20 focus:border-[#EF4444] transition-all"
                  placeholder="Dhaka"
                />
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#EF4444] text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};
