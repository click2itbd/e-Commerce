import React, { useState, useEffect } from 'react';
import { X, Send, Phone, User, FileText, Zap, Gamepad2, Video, Briefcase, Code, Wallet } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface CustomBuildRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomBuildRequestModal: React.FC<CustomBuildRequestModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    details: '',
    budget: '',
    useCase: 'Gaming'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || '',
        phone: prev.phone || user.phoneNumber || '',
      }));
    }
  }, [user]);

  if (!isOpen) return null;

  const useCases = [
    { id: 'Gaming', icon: Gamepad2 },
    { id: 'Editing', icon: Video },
    { id: 'Coding / AI', icon: Code },
    { id: 'Office / Study', icon: Briefcase }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.details.trim()) {
      toast.error('Please fill in your name, phone, and requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalDetails = `Use Case: ${formData.useCase}\nTarget Budget: ${formData.budget || 'Not specified'}\n\nRequirements:\n${formData.details}`;

      await addDoc(collection(db, 'buildRequests'), {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        budget: formData.budget || null,
        useCase: formData.useCase,
        details: finalDetails,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      toast.success('Your build request was submitted! Our PC specialist will contact you soon.');
      setFormData({ name: '', phone: '', details: '', budget: '', useCase: 'Gaming' });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <Zap size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Request Custom PC Build</h3>
              <p className="text-xs text-slate-500 font-medium">Tell us what you need and our experts will configure it for you</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 overflow-y-auto max-h-[80vh] custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Your Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-sm font-medium transition-all"
                  placeholder="e.g. Tanvir Hasan"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-sm font-medium transition-all"
                  placeholder="017XXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Use Case */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Primary Purpose</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {useCases.map(uc => {
                const Icon = uc.icon;
                const isActive = formData.useCase === uc.id;
                return (
                  <button
                    type="button"
                    key={uc.id}
                    onClick={() => setFormData({ ...formData, useCase: uc.id })}
                    className={cn(
                      'flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all',
                      isActive
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    <Icon size={14} />
                    <span>{uc.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Budget (Optional)</label>
            <div className="relative">
              <Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-sm font-medium transition-all"
                placeholder="e.g. ৳85,000"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Specific Requirements & Preferences *</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <textarea 
                required
                rows={3}
                value={formData.details}
                onChange={e => setFormData({ ...formData, details: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-sm font-medium resize-none transition-all custom-scrollbar"
                placeholder="Mention any specific parts, brands, or color themes (e.g. Core i5, RTX 4060, White theme, 1TB NVMe SSD...)"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-slate-900 hover:bg-violet-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] shadow-md shadow-slate-900/10"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Custom Build Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
