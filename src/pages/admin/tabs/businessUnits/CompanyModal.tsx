import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Check, 
  Palette, 
  Smile, 
  Tag, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Sparkles
} from 'lucide-react';
import { BusinessCompany } from '../../../../types';
import { 
  AVAILABLE_COMPANY_COLORS, 
  AVAILABLE_COMPANY_ICONS, 
  getCompanyTheme, 
  getCompanyIcon 
} from '../../../../hooks/useBusinessUnits';
import { cn } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: BusinessCompany | null;
  companies?: BusinessCompany[];
  onSave: (companyData: any) => Promise<void>;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  initialData,
  companies = [],
  onSave
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('purple');
  const [iconName, setIconName] = useState('Building2');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [tagline, setTagline] = useState('');
  const [parentCompany, setParentCompany] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSlug(initialData.id || '');
      setCode(initialData.code || '');
      setColor(initialData.color || 'purple');
      setIconName(initialData.iconName || 'Building2');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setTagline((initialData as any).tagline || '');
      setParentCompany(initialData.parentCompany || '');
    } else {
      setName('');
      setSlug('');
      setCode('');
      setColor('indigo');
      setIconName('Building2');
      setPhone('');
      setEmail('');
      setAddress('');
      setTagline('');
      setParentCompany('');
    }
  }, [initialData, isOpen]);

  // Auto-generate slug when name changes for new company
  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialData) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generated);

      // Simple short code generator (e.g., Space Zero -> SZ)
      const parts = val.trim().split(/\s+/);
      if (parts.length > 1) {
        setCode(parts.map(p => p[0]).join('').toUpperCase().slice(0, 4));
      } else if (val.trim().length >= 2) {
        setCode(val.trim().slice(0, 3).toUpperCase());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a company name');
      return;
    }
    const cleanId = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '');

    if (!cleanId) {
      toast.error('Invalid company ID/Slug');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        id: cleanId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        color,
        iconName,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        tagline: tagline.trim(),
        parentCompany: parentCompany ? parentCompany : undefined
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save company');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentTheme = getCompanyTheme(color);
  const CurrentIcon = getCompanyIcon(iconName);

  return (
    <div 
      className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#081621] p-6 text-white relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-tr", currentTheme.gradient)}>
                <CurrentIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black">
                  {initialData ? 'Edit Sister Concern' : 'Add New Sister Concern'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Configure company identity, branding color, and directory info.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Live Preview Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Live Badge & Card Preview
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-2xs", currentTheme.badgeBg)}>
                  <CurrentIcon size={13} /> {name.trim() || 'Company Name'}
                </span>
                {code && (
                  <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    Code: {code.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className={cn("px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-2", currentTheme.lightBg, currentTheme.activeBorder)}>
              <span className={cn("w-2 h-2 rounded-full", currentTheme.dotColor)} />
              <span className={currentTheme.textColor}>Filter Active State</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Innovations, GreenTree"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>

            {/* Slug / ID */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Unique ID / Slug</span>
                <span className="text-[10px] text-slate-400 font-semibold lowercase">lowercase, no space</span>
              </label>
              <input
                type="text"
                required
                disabled={Boolean(initialData?.isDefault)}
                placeholder="e.g. apex, greentree"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs disabled:opacity-60"
              />
            </div>

            {/* Short Code */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Short Code (Optional)
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. APX, SZ, VZ"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Phone (Optional)
              </label>
              <input
                type="text"
                placeholder="+880 1XXX-XXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>

            {/* Corporate Parent Group */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Corporate Parent Group (Hierarchy)
              </label>
              <select
                value={parentCompany}
                onChange={e => setParentCompany(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
              >
                <option value="">Independent / Top-Level Corporate Group</option>
                {(() => {
                  const parentOptions = companies.filter(c => c.id !== 'main' && !c.parentCompany && (!initialData || c.id !== initialData.id));
                  if (parentOptions.length === 0) {
                    return <option value="volumezero">Volumezero (অঙ্গ প্রতিষ্ঠান / Subsidiary of Volumezero)</option>;
                  }
                  return parentOptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (অঙ্গ প্রতিষ্ঠান / Subsidiary of {p.name})
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          {/* Theme Color Picker */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette size={13} className="text-indigo-500" />
              <span>Brand Theme Color</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVAILABLE_COMPANY_COLORS.map(c => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all text-left",
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span className={cn("w-3.5 h-3.5 rounded-full shrink-0 shadow-xs", c.bg)} />
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Smile size={13} className="text-indigo-500" />
              <span>Select Icon</span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {AVAILABLE_COMPANY_ICONS.map(i => {
                const IconComponent = i.icon;
                const isSelected = iconName === i.name;
                return (
                  <button
                    key={i.name}
                    type="button"
                    onClick={() => setIconName(i.name)}
                    className={cn(
                      "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-400 font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    title={i.name}
                  >
                    <IconComponent size={18} />
                    <span className="text-[9px] truncate max-w-full font-semibold">{i.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="info@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Tagline / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Interior Design & Architectural Studio"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Office Address (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Suite 402, Block D, Banani, Dhaka"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-2xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{initialData ? 'Update Company' : 'Save Company'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
