import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Trash2,
  Search,
  RefreshCw,
  ShoppingCart,
  ShoppingBag,
  Package,
  FileText,
  ArrowLeftRight,
  Users,
  DollarSign,
  Layers,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Calendar,
  User,
  Hash,
  CheckSquare,
  Square,
  Sparkles,
  ArchiveRestore,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import {
  TrashItem,
  TrashModuleCategory,
  fetchTrashItems,
  restoreTrashItem,
  dismissTrashItem,
} from '../../../../lib/trash';

interface RestoreCenterProps {
  fetchData?: () => Promise<void> | void;
}

type CategoryFilter = 'all' | TrashModuleCategory;
type StatusFilter = 'pending' | 'restored' | 'all';

const CATEGORY_TABS: {
  id: CategoryFilter;
  label: string;
  banglaLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: 'all',
    label: 'All Deleted Data',
    banglaLabel: 'সকল ডাটা',
    icon: ArchiveRestore,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  {
    id: 'sales',
    label: 'Sales & Orders',
    banglaLabel: 'সেলস ও ইনভয়েস',
    icon: ShoppingCart,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'purchases',
    label: 'Purchases',
    banglaLabel: 'পারচেজ ও বিল',
    icon: ShoppingBag,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    id: 'products',
    label: 'Products',
    banglaLabel: 'প্রোডাক্ট ও স্টক',
    icon: Package,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 'quotations',
    label: 'Quotations',
    banglaLabel: 'কোটেশন',
    icon: FileText,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    id: 'returns',
    label: 'Returns',
    banglaLabel: 'সেল ও পারচেজ রিটার্ন',
    icon: ArrowLeftRight,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  {
    id: 'contacts',
    label: 'Customers & Suppliers',
    banglaLabel: 'কাস্টমার ও সাপ্লায়ার',
    icon: Users,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    id: 'accounting',
    label: 'Accounts & Expense',
    banglaLabel: 'একাউন্টস ও আয়-ব্যয়',
    icon: DollarSign,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    id: 'others',
    label: 'Others & Services',
    banglaLabel: 'সার্ভিস ও অন্যান্য',
    icon: Layers,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
  },
];

export const RestoreCenter: React.FC<RestoreCenterProps> = ({ fetchData }) => {
  const { profile, user } = useAuth();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [bulkRestoring, setBulkRestoring] = useState<boolean>(false);

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [adjustInventoryAndAccounts, setAdjustInventoryAndAccounts] = useState<boolean>(true);

  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([]);
  const [inspectItem, setInspectItem] = useState<TrashItem | null>(null);

  const operatorName =
    profile?.displayName || profile?.email || user?.email || 'Admin';

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchTrashItems(600);
      setItems(data);
    } catch (err) {
      console.error('Error loading trash items:', err);
      toast.error('ডিলিট হওয়া ডাটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Category counts (respecting current statusFilter so badges are accurate)
  const categoryStats = useMemo(() => {
    const counts: Record<CategoryFilter, { count: number; totalValue: number }> = {
      all: { count: 0, totalValue: 0 },
      sales: { count: 0, totalValue: 0 },
      purchases: { count: 0, totalValue: 0 },
      products: { count: 0, totalValue: 0 },
      quotations: { count: 0, totalValue: 0 },
      returns: { count: 0, totalValue: 0 },
      contacts: { count: 0, totalValue: 0 },
      accounting: { count: 0, totalValue: 0 },
      others: { count: 0, totalValue: 0 },
    };

    for (const item of items) {
      if (statusFilter === 'pending' && item.isRestored) continue;
      if (statusFilter === 'restored' && !item.isRestored) continue;

      const amt = Number(item.amount || 0);
      counts.all.count += 1;
      counts.all.totalValue += amt;

      if (counts[item.category]) {
        counts[item.category].count += 1;
        counts[item.category].totalValue += amt;
      }
    }

    return counts;
  }, [items, statusFilter]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (statusFilter === 'pending' && item.isRestored) return false;
      if (statusFilter === 'restored' && !item.isRestored) return false;

      if (startDate || endDate) {
        const dStr = (item.deletedAt || '').split('T')[0];
        if (startDate && dStr < startDate) return false;
        if (endDate && dStr > endDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchSub = (item.subtitle || '').toLowerCase().includes(q);
        const matchId = (item.entityId || '').toLowerCase().includes(q);
        const matchBy = (item.deletedBy || '').toLowerCase().includes(q);
        const matchDetails = (item.details || '').toLowerCase().includes(q);
        const matchSubCat = (item.subCategory || '').toLowerCase().includes(q);
        return matchTitle || matchSub || matchId || matchBy || matchDetails || matchSubCat;
      }

      return true;
    });
  }, [items, activeCategory, statusFilter, startDate, endDate, searchQuery]);

  const restorableFilteredItems = useMemo(
    () => filteredItems.filter((i) => i.canRestore && !i.isRestored),
    [filteredItems]
  );

  const handleRestoreSingle = async (item: TrashItem) => {
    if (!item.canRestore) {
      toast.error(
        'এই পুরানো রেকর্ডটিতে সম্পূর্ণ ডাটা স্ন্যাপশট সংরক্ষিত নেই, তাই এটি স্বয়ংক্রিয়ভাবে রিস্টোর করা যাবে না।'
      );
      return;
    }

    setRestoringId(item.trashId);
    try {
      await restoreTrashItem(item, operatorName, {
        adjustInventoryAndAccounts,
      });
      toast.success(`"${item.title}" সফলভাবে রিস্টোর করা হয়েছে!`);
      setItems((prev) =>
        prev.map((it) =>
          it.trashId === item.trashId || it.entityId === item.entityId
            ? {
                ...it,
                isRestored: true,
                restoredAt: new Date().toISOString(),
                restoredBy: operatorName,
              }
            : it
        )
      );
      setSelectedTrashIds((prev) => prev.filter((id) => id !== item.trashId));
      if (inspectItem?.trashId === item.trashId) {
        setInspectItem((prev) =>
          prev
            ? {
                ...prev,
                isRestored: true,
                restoredAt: new Date().toISOString(),
                restoredBy: operatorName,
              }
            : null
        );
      }
      if (fetchData) {
        await fetchData();
      }
    } catch (err: any) {
      console.error('Error restoring item:', err);
      toast.error(err?.message || 'ডাটা রিস্টোর করতে সমস্যা হয়েছে');
    } finally {
      setRestoringId(null);
    }
  };

  const handleBulkRestore = async () => {
    const targets = filteredItems.filter(
      (it) => selectedTrashIds.includes(it.trashId) && it.canRestore && !it.isRestored
    );
    if (targets.length === 0) {
      toast.error('রিস্টোর করার মতো কোনো আইটেম সিলেক্ট করা হয়নি');
      return;
    }

    setBulkRestoring(true);
    let successCount = 0;
    try {
      for (const item of targets) {
        try {
          await restoreTrashItem(item, operatorName, {
            adjustInventoryAndAccounts,
          });
          successCount++;
        } catch (e) {
          console.error('Failed to restore item in bulk:', item.title, e);
        }
      }
      toast.success(`${successCount}টি ডাটা সফলভাবে রিস্টোর করা হয়েছে!`);
      setSelectedTrashIds([]);
      await loadItems();
      if (fetchData) {
        await fetchData();
      }
    } finally {
      setBulkRestoring(false);
    }
  };

  const handleDismiss = async (item: TrashItem) => {
    try {
      await dismissTrashItem(item.trashId, operatorName);
      setItems((prev) => prev.filter((it) => it.trashId !== item.trashId));
      setSelectedTrashIds((prev) => prev.filter((id) => id !== item.trashId));
      if (inspectItem?.trashId === item.trashId) {
        setInspectItem(null);
      }
      toast.success('রিসাইকেল বিন তালিকা থেকে সরানো হয়েছে');
    } catch (err) {
      toast.error('সরাতে সমস্যা হয়েছে');
    }
  };

  const toggleSelectOne = (trashId: string) => {
    setSelectedTrashIds((prev) =>
      prev.includes(trashId) ? prev.filter((id) => id !== trashId) : [...prev, trashId]
    );
  };

  const toggleSelectAll = () => {
    if (
      restorableFilteredItems.length > 0 &&
      restorableFilteredItems.every((i) => selectedTrashIds.includes(i.trashId))
    ) {
      setSelectedTrashIds([]);
    } else {
      setSelectedTrashIds(restorableFilteredItems.map((i) => i.trashId));
    }
  };

  const getCategoryMeta = (cat: TrashModuleCategory) => {
    return CATEGORY_TABS.find((t) => t.id === cat) || CATEGORY_TABS[0];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-100 shrink-0">
              <RotateCcw size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">
                  Restore Center / Recycle Bin
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  ডিলিট হওয়া ডাটা রিস্টোর সেন্টার
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                সেলস, পারচেজ, প্রোডাক্ট, কোটেশন, রিটার্ন, কাস্টমার এবং একাউন্টিং সহ ডিলিট হওয়া সকল ডাটা এখানে বিভাগ অনুযায়ী সংরক্ষিত থাকে। যেকোনো সময় বিস্তারিত দেখে এক ক্লিকে রিস্টোর করতে পারবেন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <button
              onClick={loadItems}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
              রিফ্রেশ করুন
            </button>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2.5 mt-6">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const stat = categoryStats[tab.id] || { count: 0, totalValue: 0 };
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setSelectedTrashIds([]);
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 scale-[1.01]'
                    : 'bg-gray-50/70 hover:bg-white text-gray-700 border-gray-200/80 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : `${tab.bg} ${tab.color}`
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : stat.count > 0
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {stat.count}
                  </span>
                </div>
                <div
                  className={`text-xs font-bold leading-tight truncate w-full ${
                    isActive ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {tab.label}
                </div>
                <div
                  className={`text-[11px] truncate w-full mt-0.5 ${
                    isActive ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {tab.banglaLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Bulk Actions Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ইনভয়েস নং, প্রোডাক্ট, কাস্টমার, সাপ্লায়ার বা আইডি দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Date & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Pills */}
            <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                রিস্টোর বাকি (Trash)
              </button>
              <button
                onClick={() => setStatusFilter('restored')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'restored'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                রিস্টোর হয়েছে
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                সবগুলো
              </button>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-none text-gray-700"
                title="শুরুর তারিখ"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent focus:outline-none text-gray-700"
                title="শেষের তারিখ"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-gray-400 hover:text-red-500 ml-1"
                  title="তারিখ ফিল্টার মুছুন"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Option Row: Stock Sync Toggle & Bulk Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-xs text-gray-700">
            <input
              type="checkbox"
              checked={adjustInventoryAndAccounts}
              onChange={(e) => setAdjustInventoryAndAccounts(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">
              সেলস / পারচেজ / রিটার্ন রিস্টোর করার সময় <strong>প্রোডাক্ট স্টক (Stock), সিরিয়াল ও একাউন্ট ট্রানজেকশন</strong> স্বয়ংক্রিয়ভাবে সমন্বয় করুন
            </span>
          </label>

          {selectedTrashIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                {selectedTrashIds.length}টি সিলেক্ট করা হয়েছে
              </span>
              <button
                onClick={handleBulkRestore}
                disabled={bulkRestoring}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                <RotateCcw size={14} className={bulkRestoring ? 'animate-spin' : ''} />
                {bulkRestoring ? 'রিস্টোর হচ্ছে...' : 'সিলেক্টেড সবগুলো রিস্টোর করুন'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-800 text-sm">
              {CATEGORY_TABS.find((c) => c.id === activeCategory)?.label} (
              {CATEGORY_TABS.find((c) => c.id === activeCategory)?.banglaLabel})
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {filteredItems.length} টি রেকর্ড
            </span>
          </div>
          {categoryStats[activeCategory]?.totalValue > 0 && (
            <div className="text-xs font-semibold text-gray-600">
              মোট মূল্যমান:{' '}
              <span className="text-gray-900 font-bold">
                ৳{categoryStats[activeCategory].totalValue.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">ডিলিট হওয়া ডাটা লোড হচ্ছে...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-4">
              <ArchiveRestore size={32} />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              এই বিভাগে কোনো ডিলিট হওয়া ডাটা পাওয়া যায়নি
            </h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              যখনই কোনো সেলস, পারচেজ, প্রোডাক্ট, কাস্টমার বা অন্য কোনো ডাটা ডিলিট করা হবে, সেটি সাথে সাথে এখানে জমা থাকবে এবং ভবিষ্যতে রিস্টোর করা যাবে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-gray-400 hover:text-blue-600"
                      title="সবগুলো সিলেক্ট করুন"
                    >
                      {restorableFilteredItems.length > 0 &&
                      restorableFilteredItems.every((i) =>
                        selectedTrashIds.includes(i.trashId)
                      ) ? (
                        <CheckSquare size={16} className="text-blue-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">বিভাগ (Category)</th>
                  <th className="py-3.5 px-4">ডাটার বিবরণ (Record Details)</th>
                  <th className="py-3.5 px-4 text-right">মূল্য / পরিমাণ (Amount)</th>
                  <th className="py-3.5 px-4">ডিলিট করেছেন ও সময়</th>
                  <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">অ্যাকশন (Restore / View)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredItems.map((item) => {
                  const catMeta = getCategoryMeta(item.category);
                  const CatIcon = catMeta.icon;
                  const isSelected = selectedTrashIds.includes(item.trashId);
                  const isCurrentlyRestoring = restoringId === item.trashId;

                  return (
                    <tr
                      key={item.trashId}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        {item.canRestore && !item.isRestored ? (
                          <button
                            onClick={() => toggleSelectOne(item.trashId)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        ) : (
                          <span className="inline-block w-4" />
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold bg-white border-gray-200">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center ${catMeta.bg} ${catMeta.color}`}
                          >
                            <CatIcon size={14} />
                          </span>
                          <div>
                            <div className="text-gray-800 leading-none">{item.subCategory}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {catMeta.banglaLabel}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-gray-900 truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                          <span className="inline-flex items-center gap-0.5 font-mono">
                            <Hash size={11} />
                            {item.entityId}
                          </span>
                          {item.relatedData?.transactions &&
                            item.relatedData.transactions.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 font-medium">
                                +{item.relatedData.transactions.length} Linked Tx
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.amount !== undefined && item.amount !== null ? (
                          <span className="font-bold text-gray-900">
                            ৳{Number(item.amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Deleted By & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                          <User size={13} className="text-gray-400" />
                          {item.deletedBy}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                          <Clock size={11} />
                          {new Date(item.deletedAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.isRestored ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={13} />
                            Restored
                          </span>
                        ) : item.canRestore ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={13} />
                            রিস্টোর যোগ্য
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
                            title="এই পুরানো লগটিতে সম্পূর্ণ ডাটা স্ন্যাপশট নেই"
                          >
                            <AlertCircle size={13} />
                            শুধু লগ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye size={14} />
                            দেখুন
                          </button>

                          {!item.isRestored && item.canRestore && (
                            <button
                              onClick={() => handleRestoreSingle(item)}
                              disabled={isCurrentlyRestoring}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                            >
                              <RotateCcw
                                size={14}
                                className={isCurrentlyRestoring ? 'animate-spin' : ''}
                              />
                              {isCurrentlyRestoring ? 'রিস্টোর হচ্ছে...' : 'Restore'}
                            </button>
                          )}

                          {item.isRestored && item.canRestore && (
                            <button
                              onClick={() => handleRestoreSingle(item)}
                              disabled={isCurrentlyRestoring}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-all"
                              title="পুনরায় রিস্টোর করুন"
                            >
                              <RotateCcw size={13} />
                              পুনরায় রিস্টোর
                            </button>
                          )}

                          <button
                            onClick={() => handleDismiss(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="তালিকা থেকে সরিয়ে ফেলুন"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Eye size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{inspectItem.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">
                      {inspectItem.subCategory}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ডিলিট করেছেন: <strong>{inspectItem.deletedBy}</strong> • সময়:{' '}
                    {new Date(inspectItem.deletedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {!inspectItem.data ? (
                <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <p className="font-bold mb-1">সম্পূর্ণ ডাটা স্ন্যাপশট নেই</p>
                  <p className="text-xs">
                    লগ বিবরণ: {inspectItem.details || 'N/A'} (ID: {inspectItem.entityId})
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-[11px] text-gray-400 font-medium">কালেকশন / টেবিল</div>
                      <div className="text-xs font-bold text-gray-800 mt-0.5 font-mono">
                        {inspectItem.collectionName || 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-[11px] text-gray-400 font-medium">রেকর্ড আইডি</div>
                      <div className="text-xs font-bold text-gray-800 mt-0.5 font-mono truncate">
                        {inspectItem.entityId}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-[11px] text-gray-400 font-medium">মোট পরিমাণ / মূল্য</div>
                      <div className="text-sm font-bold text-blue-600 mt-0.5">
                        {inspectItem.amount !== undefined
                          ? `৳${Number(inspectItem.amount).toLocaleString()}`
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-[11px] text-gray-400 font-medium">রিস্টোর স্ট্যাটাস</div>
                      <div className="text-xs font-bold mt-0.5">
                        {inspectItem.isRestored ? (
                          <span className="text-emerald-600">
                            রিস্টোর হয়েছে ({inspectItem.restoredBy})
                          </span>
                        ) : (
                          <span className="text-amber-600">রিস্টোর করার অপেক্ষায়</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table if Order / Purchase / Quotation / Return */}
                  {Array.isArray(inspectItem.data.items) &&
                    inspectItem.data.items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          আইটেম তালিকা ({inspectItem.data.items.length} টি প্রোডাক্ট)
                        </h4>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                              <tr>
                                <th className="py-2.5 px-3">প্রোডাক্টের নাম</th>
                                <th className="py-2.5 px-3 text-center">পরিমাণ (Qty)</th>
                                <th className="py-2.5 px-3 text-right">দর (Rate)</th>
                                <th className="py-2.5 px-3 text-right">মোট (Subtotal)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {inspectItem.data.items.map((line: any, idx: number) => {
                                const qty = Number(
                                  line.quantity ?? line.returnQty ?? line.qty ?? 1
                                );
                                const rate = Number(
                                  line.price ??
                                    line.unitPrice ??
                                    line.purchasePrice ??
                                    line.costPrice ??
                                    0
                                );
                                const lineTotal = Number(line.total ?? qty * rate);
                                const serials =
                                  line.selectedSerials ||
                                  line.newSerials ||
                                  line.returnedSerials ||
                                  [];
                                return (
                                  <tr key={idx}>
                                    <td className="py-2 px-3">
                                      <div className="font-semibold text-gray-800">
                                        {line.name || line.productName || `Item #${idx + 1}`}
                                      </div>
                                      {Array.isArray(serials) && serials.length > 0 && (
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                          SN: {serials.join(', ')}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-center font-semibold">
                                      {qty}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      ৳{rate.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold">
                                      ৳{lineTotal.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  {/* Key Details Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      সংরক্ষিত ডাটা ফিল্ডসমূহ
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                      {Object.entries(inspectItem.data)
                        .filter(
                          ([key, val]) =>
                            key !== 'items' &&
                            val !== undefined &&
                            val !== null &&
                            val !== '' &&
                            typeof val !== 'object'
                        )
                        .map(([key, val]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between py-1 border-b border-gray-200/60 last:border-0 gap-2"
                          >
                            <span className="text-gray-500 font-medium">{key}:</span>
                            <span className="font-semibold text-gray-800 truncate max-w-[220px]">
                              {String(val)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700"
              >
                বন্ধ করুন
              </button>

              {inspectItem.canRestore && (
                <button
                  onClick={() => handleRestoreSingle(inspectItem)}
                  disabled={restoringId === inspectItem.trashId}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-100 transition-all disabled:opacity-50"
                >
                  <RotateCcw
                    size={15}
                    className={restoringId === inspectItem.trashId ? 'animate-spin' : ''}
                  />
                  {inspectItem.isRestored
                    ? 'পুনরায় রিস্টোর করুন'
                    : 'এখনই রিস্টোর করুন (Restore Data)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestoreCenter;
