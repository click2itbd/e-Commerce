import { useState, useEffect } from 'react';
import { 
  Building2, 
  Sparkles, 
  Box, 
  Trees, 
  Store, 
  Briefcase, 
  Factory, 
  Rocket, 
  Globe, 
  Award, 
  Layers, 
  Tag,
  Laptop,
  Cpu,
  ShieldCheck,
  LucideIcon
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BusinessCompany } from '../types';
export type { BusinessCompany };
import { toast } from 'react-hot-toast';

export const DEFAULT_COMPANIES: BusinessCompany[] = [
  { 
    id: 'spacezero', 
    name: 'Spacezero', 
    code: 'SZ',
    color: 'purple',
    iconName: 'Sparkles',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  { 
    id: 'volumezero', 
    name: 'Volumezero', 
    code: 'VZ',
    color: 'blue',
    iconName: 'Box',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  { 
    id: 'simpletree', 
    name: 'Simpletree', 
    code: 'ST',
    color: 'emerald',
    iconName: 'Trees',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  { 
    id: 'main', 
    name: 'Click2IT (Main)', 
    code: 'C2IT',
    color: 'slate',
    iconName: 'Store',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
];

export const AVAILABLE_COMPANY_COLORS = [
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-500' },
  { id: 'violet', label: 'Violet', bg: 'bg-violet-500' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-500' },
  { id: 'red', label: 'Red', bg: 'bg-red-500' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-700' },
];

export const AVAILABLE_COMPANY_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Building2', icon: Building2 },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Box', icon: Box },
  { name: 'Trees', icon: Trees },
  { name: 'Store', icon: Store },
  { name: 'Factory', icon: Factory },
  { name: 'Rocket', icon: Rocket },
  { name: 'Globe', icon: Globe },
  { name: 'Award', icon: Award },
  { name: 'Layers', icon: Layers },
  { name: 'Laptop', icon: Laptop },
  { name: 'Cpu', icon: Cpu },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Tag', icon: Tag },
];

export function getCompanyTheme(color?: string) {
  switch (color) {
    case 'purple':
      return {
        gradient: 'from-purple-600 to-indigo-700',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        activeBorder: 'border-purple-500 ring-2 ring-purple-400',
        dotColor: 'bg-purple-500',
        lightBg: 'bg-purple-50/40',
        textColor: 'text-purple-700',
      };
    case 'blue':
      return {
        gradient: 'from-blue-600 to-cyan-700',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        activeBorder: 'border-blue-500 ring-2 ring-blue-400',
        dotColor: 'bg-blue-500',
        lightBg: 'bg-blue-50/40',
        textColor: 'text-blue-700',
      };
    case 'emerald':
      return {
        gradient: 'from-emerald-600 to-teal-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        activeBorder: 'border-emerald-500 ring-2 ring-emerald-400',
        dotColor: 'bg-emerald-500',
        lightBg: 'bg-emerald-50/40',
        textColor: 'text-emerald-700',
      };
    case 'amber':
      return {
        gradient: 'from-amber-500 to-orange-600',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        activeBorder: 'border-amber-500 ring-2 ring-amber-400',
        dotColor: 'bg-amber-500',
        lightBg: 'bg-amber-50/40',
        textColor: 'text-amber-700',
      };
    case 'rose':
      return {
        gradient: 'from-rose-500 to-pink-600',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        activeBorder: 'border-rose-500 ring-2 ring-rose-400',
        dotColor: 'bg-rose-500',
        lightBg: 'bg-rose-50/40',
        textColor: 'text-rose-700',
      };
    case 'cyan':
      return {
        gradient: 'from-cyan-600 to-blue-700',
        badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        activeBorder: 'border-cyan-500 ring-2 ring-cyan-400',
        dotColor: 'bg-cyan-500',
        lightBg: 'bg-cyan-50/40',
        textColor: 'text-cyan-700',
      };
    case 'indigo':
      return {
        gradient: 'from-indigo-600 to-purple-700',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        activeBorder: 'border-indigo-500 ring-2 ring-indigo-400',
        dotColor: 'bg-indigo-500',
        lightBg: 'bg-indigo-50/40',
        textColor: 'text-indigo-700',
      };
    case 'teal':
      return {
        gradient: 'from-teal-600 to-emerald-700',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
        activeBorder: 'border-teal-500 ring-2 ring-teal-400',
        dotColor: 'bg-teal-500',
        lightBg: 'bg-teal-50/40',
        textColor: 'text-teal-700',
      };
    case 'violet':
      return {
        gradient: 'from-violet-600 to-fuchsia-700',
        badgeBg: 'bg-violet-100 text-violet-800 border-violet-200',
        activeBorder: 'border-violet-500 ring-2 ring-violet-400',
        dotColor: 'bg-violet-500',
        lightBg: 'bg-violet-50/40',
        textColor: 'text-violet-700',
      };
    case 'orange':
      return {
        gradient: 'from-orange-500 to-red-600',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
        activeBorder: 'border-orange-500 ring-2 ring-orange-400',
        dotColor: 'bg-orange-500',
        lightBg: 'bg-orange-50/40',
        textColor: 'text-orange-700',
      };
    case 'red':
      return {
        gradient: 'from-red-600 to-rose-700',
        badgeBg: 'bg-red-100 text-red-800 border-red-200',
        activeBorder: 'border-red-500 ring-2 ring-red-400',
        dotColor: 'bg-red-500',
        lightBg: 'bg-red-50/40',
        textColor: 'text-red-700',
      };
    case 'slate':
    default:
      return {
        gradient: 'from-slate-700 to-slate-900',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
        activeBorder: 'border-slate-600 ring-2 ring-slate-400',
        dotColor: 'bg-slate-700',
        lightBg: 'bg-slate-50/40',
        textColor: 'text-slate-700',
      };
  }
}

export function getCompanyIcon(iconName?: string): LucideIcon {
  const match = AVAILABLE_COMPANY_ICONS.find(i => i.name === iconName);
  return match ? match.icon : Building2;
}

const STORAGE_KEY = 'click2it_business_units_cache';

export function useBusinessUnits() {
  const [companies, setCompanies] = useState<BusinessCompany[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_COMPANIES;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'business_units'),
      (docSnap) => {
        setLoading(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const list: BusinessCompany[] = Array.isArray(data?.list) ? data.list : [];
          
          // Ensure all default companies exist in list if not already present
          const existingIds = new Set(list.map(c => c.id.toLowerCase()));
          const merged: BusinessCompany[] = [...list];
          
          DEFAULT_COMPANIES.forEach(def => {
            if (!existingIds.has(def.id.toLowerCase())) {
              merged.push(def);
            }
          });

          setCompanies(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch (err) {}
        } else {
          // Document does not exist yet: initialize with DEFAULT_COMPANIES
          setDoc(
            doc(db, 'settings', 'business_units'), 
            { list: DEFAULT_COMPANIES, updatedAt: new Date().toISOString() }, 
            { merge: true }
          ).catch(() => {});
          setCompanies(DEFAULT_COMPANIES);
        }
      },
      (err) => {
        console.warn('Could not subscribe to business_units:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const saveList = async (updatedList: BusinessCompany[]) => {
    await setDoc(
      doc(db, 'settings', 'business_units'),
      { list: updatedList, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    setCompanies(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {}
  };

  const addCompany = async (newComp: Omit<BusinessCompany, 'isDefault' | 'createdAt'>) => {
    const id = newComp.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!id) throw new Error('Invalid company code or ID');

    if (companies.some(c => c.id.toLowerCase() === id)) {
      throw new Error(`A company with ID "${id}" already exists`);
    }

    const created: BusinessCompany = {
      ...newComp,
      id,
      name: newComp.name.trim(),
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    const nextList = [...companies, created];
    await saveList(nextList);
    toast.success(`Company "${created.name}" added successfully!`);
    return created;
  };

  const updateCompany = async (id: string, updates: Partial<BusinessCompany>) => {
    const targetId = id.toLowerCase();
    const nextList = companies.map(c => {
      if (c.id.toLowerCase() === targetId) {
        return { ...c, ...updates };
      }
      return c;
    });
    await saveList(nextList);
    toast.success('Company updated successfully!');
  };

  const deleteCompany = async (id: string) => {
    const target = companies.find(c => c.id.toLowerCase() === id.toLowerCase());
    if (target?.isDefault) {
      throw new Error('Default system companies cannot be deleted.');
    }
    const nextList = companies.filter(c => c.id.toLowerCase() !== id.toLowerCase());
    await saveList(nextList);
    toast.success(`Company "${target?.name || id}" removed.`);
  };

  return {
    companies,
    loading,
    addCompany,
    updateCompany,
    deleteCompany
  };
}
