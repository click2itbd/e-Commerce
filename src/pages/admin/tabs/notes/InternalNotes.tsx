import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../../firebase';
import { InternalNote } from '../../../../types';
import { useAuth } from '../../../../context/AuthContext';
import {
  MessageSquare,
  Trash2,
  CheckCircle,
  Clock,
  Pin,
  PinOff,
  Search,
  Filter,
  Users,
  Send,
  AlertTriangle,
  Copy,
  Check,
  Tag,
  Flame,
  CornerDownRight,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Edit2,
  X,
  FileText,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Color themes based on author name for quick visual recognition
const getAuthorColor = (name: string = '') => {
  const colors = [
    {
      gradient: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      borderLeft: 'border-l-blue-600',
      avatarBg: 'bg-blue-600 text-white',
      cardRing: 'hover:border-blue-300',
      accent: 'text-blue-600',
    },
    {
      gradient: 'from-emerald-600 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      borderLeft: 'border-l-emerald-600',
      avatarBg: 'bg-emerald-600 text-white',
      cardRing: 'hover:border-emerald-300',
      accent: 'text-emerald-600',
    },
    {
      gradient: 'from-purple-600 to-violet-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      borderLeft: 'border-l-purple-600',
      avatarBg: 'bg-purple-600 text-white',
      cardRing: 'hover:border-purple-300',
      accent: 'text-purple-600',
    },
    {
      gradient: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      borderLeft: 'border-l-amber-500',
      avatarBg: 'bg-amber-600 text-white',
      cardRing: 'hover:border-amber-300',
      accent: 'text-amber-600',
    },
    {
      gradient: 'from-rose-500 to-pink-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      borderLeft: 'border-l-rose-500',
      avatarBg: 'bg-rose-600 text-white',
      cardRing: 'hover:border-rose-300',
      accent: 'text-rose-600',
    },
    {
      gradient: 'from-cyan-600 to-sky-600',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      borderLeft: 'border-l-cyan-600',
      avatarBg: 'bg-cyan-600 text-white',
      cardRing: 'hover:border-cyan-300',
      accent: 'text-cyan-600',
    },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Compute initials from author name
const getInitials = (name: string = '') => {
  const clean = name.replace(/\([^)]*\)/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Format timestamp cleanly
const formatNoteDate = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

const formatRelativeTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return '';
  } catch {
    return '';
  }
};

const CATEGORIES = [
  { id: 'price_correction', label: 'Price / Delete Request', icon: '💰', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'product_stock', label: 'Product & Stock', icon: '📦', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'purchase_cheque', label: 'Purchase & Cheque', icon: '🧾', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'urgent_issue', label: 'Urgent Issue / Bug', icon: '🚨', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'general', label: 'General Note', icon: '📝', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

export default function InternalNotes() {
  const { user, profile, isAdmin } = useAuth();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('price_correction');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedAuthorFilter, setSelectedAuthorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Interactive states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resolvingNote, setResolvingNote] = useState<InternalNote | null>(null);
  const [resolutionRemark, setResolutionRemark] = useState('');
  const [editingNote, setEditingNote] = useState<InternalNote | null>(null);
  const [editContent, setEditContent] = useState('');

  // Active current user details
  const currentAuthorName = useMemo(() => {
    return profile?.name || profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Staff Member';
  }, [profile, user]);

  const currentAuthorRole = useMemo(() => {
    if (isAdmin) return 'Admin';
    if (profile?.role) {
      return profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
    }
    return 'Staff';
  }, [profile, isAdmin]);

  useEffect(() => {
    const q = query(collection(db, 'internal_notes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InternalNote)));
      },
      (err) => {
        console.error('Error fetching internal notes:', err);
        toast.error('Failed to load notes in real-time');
      }
    );
    return () => unsub();
  }, []);

  // Distinct authors list with note counts
  const authorStats = useMemo(() => {
    const stats: { [name: string]: { count: number; pendingCount: number } } = {};
    notes.forEach((n) => {
      const aName = n.authorName || 'Unknown Staff';
      if (!stats[aName]) {
        stats[aName] = { count: 0, pendingCount: 0 };
      }
      stats[aName].count += 1;
      if (n.status === 'pending') {
        stats[aName].pendingCount += 1;
      }
    });
    return Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  }, [notes]);

  // Overall metric counts
  const totalNotesCount = notes.length;
  const pendingNotesCount = notes.filter((n) => n.status === 'pending').length;
  const resolvedNotesCount = notes.filter((n) => n.status === 'resolved').length;
  const urgentCount = notes.filter((n) => n.priority === 'urgent' && n.status === 'pending').length;

  // Filtered and sorted notes list
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Status filter
        if (statusFilter !== 'all' && note.status !== statusFilter) return false;

        // Author filter
        if (selectedAuthorFilter === 'mine') {
          if (note.createdBy && user?.uid && note.createdBy !== user.uid) return false;
          if (!note.createdBy && note.authorName !== currentAuthorName) return false;
        } else if (selectedAuthorFilter !== 'all') {
          if ((note.authorName || 'Unknown Staff') !== selectedAuthorFilter) return false;
        }

        // Category filter
        if (categoryFilter !== 'all') {
          if ((note.category || 'general') !== categoryFilter) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchContent = (note.content || '').toLowerCase().includes(q);
          const matchAuthor = (note.authorName || '').toLowerCase().includes(q);
          const matchDate = (note.createdAt || '').toLowerCase().includes(q);
          const matchRemark = (note.resolutionNote || '').toLowerCase().includes(q);
          if (!matchContent && !matchAuthor && !matchDate && !matchRemark) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned notes come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // Pending urgent notes come next
        if (a.status === 'pending' && a.priority === 'urgent' && (b.status !== 'pending' || b.priority !== 'urgent')) return -1;
        if (b.status === 'pending' && b.priority === 'urgent' && (a.status !== 'pending' || a.priority !== 'urgent')) return 1;

        // Then pending before resolved
        if (a.status === 'pending' && b.status === 'resolved') return -1;
        if (a.status === 'resolved' && b.status === 'pending') return 1;

        // Finally by creation date
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [notes, statusFilter, selectedAuthorFilter, categoryFilter, searchQuery, user, currentAuthorName]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'internal_notes'), {
        content: newNote.trim(),
        createdBy: user?.uid || 'staff',
        authorName: currentAuthorName,
        authorEmail: user?.email || '',
        authorRole: currentAuthorRole,
        authorAvatar: profile?.avatar || user?.photoURL || '',
        category: selectedCategory,
        priority: priority,
        createdAt: new Date().toISOString(),
        status: 'pending',
        isPinned: false,
      });

      setNewNote('');
      setPriority('normal');
      toast.success('Note posted to board successfully!');
    } catch (err: any) {
      console.error('Failed to add note:', err);
      toast.error(err.message || 'Failed to post note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (note: InternalNote) => {
    try {
      await updateDoc(doc(db, 'internal_notes', note.id), {
        isPinned: !note.isPinned,
      });
      toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned to top');
    } catch (e) {
      toast.error('Failed to update pin status');
    }
  };

  const handleOpenResolveModal = (note: InternalNote) => {
    if (note.status === 'resolved') {
      // Re-open directly
      handleDirectToggleStatus(note);
      return;
    }
    setResolvingNote(note);
    setResolutionRemark('');
  };

  const handleDirectToggleStatus = async (note: InternalNote) => {
    try {
      const nextStatus = note.status === 'pending' ? 'resolved' : 'pending';
      await updateDoc(doc(db, 'internal_notes', note.id), {
        status: nextStatus,
        resolvedAt: nextStatus === 'resolved' ? new Date().toISOString() : null,
        resolvedBy: nextStatus === 'resolved' ? user?.uid || 'admin' : null,
        resolvedByName: nextStatus === 'resolved' ? currentAuthorName : null,
      });
      toast.success(nextStatus === 'resolved' ? 'Marked as resolved' : 'Reopened as pending');
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleConfirmResolveWithRemark = async () => {
    if (!resolvingNote) return;
    try {
      await updateDoc(doc(db, 'internal_notes', resolvingNote.id), {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: user?.uid || 'admin',
        resolvedByName: currentAuthorName,
        resolutionNote: resolutionRemark.trim() || 'Resolved by admin',
      });
      toast.success('Note marked as resolved!');
      setResolvingNote(null);
      setResolutionRemark('');
    } catch (e) {
      toast.error('Failed to resolve note');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingNote || !editContent.trim()) return;
    try {
      await updateDoc(doc(db, 'internal_notes', editingNote.id), {
        content: editContent.trim(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Note updated successfully');
      setEditingNote(null);
      setEditContent('');
    } catch (e) {
      toast.error('Failed to update note');
    }
  };

  const handleDelete = async (note: InternalNote) => {
    const isOwner = note.createdBy === user?.uid;
    if (!isAdmin && !isOwner) {
      toast.error('Only admins or the note creator can delete this note');
      return;
    }
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteDoc(doc(db, 'internal_notes', note.id));
        toast.success('Note deleted');
      } catch (e) {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleCopy = (note: InternalNote) => {
    navigator.clipboard.writeText(note.content);
    setCopiedId(note.id);
    toast.success('Note copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── TOP HEADER & SUMMARY METRICS ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Staff Internal Notes & Request Board
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Live Sync
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                Clearly track who wrote which note, price change requests, stock deletions, and admin alerts.
              </p>
            </div>
          </div>

          {/* Quick Active Staff Count */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 self-start md:self-auto">
            <Users className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-medium text-slate-200">
              <strong className="text-white font-bold">{authorStats.length}</strong> Staff Contributors
            </span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Total Notes</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{totalNotesCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all departments</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">Pending Actions</span>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{pendingNotesCount}</div>
            <div className="text-[11px] text-amber-200/80 mt-0.5">Awaiting admin review</div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{resolvedNotesCount}</div>
            <div className="text-[11px] text-emerald-200/80 mt-0.5">Completed & verified</div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-300">Urgent Pending</span>
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-400 mt-1">{urgentCount}</div>
            <div className="text-[11px] text-red-200/80 mt-0.5">High priority tasks</div>
          </div>
        </div>
      </div>

      {/* ── NOTE COMPOSER (USER FRIENDLY & INTUITIVE) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 transition-all hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Current author avatar pill */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm bg-gradient-to-tr ${
                getAuthorColor(currentAuthorName).gradient
              } text-white`}
            >
              {getInitials(currentAuthorName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Posting note as:</span>
                <span className="text-sm font-bold text-gray-900">{currentAuthorName}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentAuthorRole}
                </span>
              </div>
              <p className="text-xs text-gray-500">Your name will be prominently shown on this note so everyone knows who requested it.</p>
            </div>
          </div>

          {/* Priority switcher */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPriority(priority === 'normal' ? 'urgent' : 'normal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                priority === 'urgent'
                  ? 'bg-red-500 text-white border-red-600 shadow-sm animate-pulse'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${priority === 'urgent' ? 'text-white' : 'text-gray-400'}`} />
              {priority === 'urgent' ? 'URGENT NOTE' : 'Mark as Urgent?'}
            </button>
          </div>
        </div>

        <form onSubmit={handleAddNote} className="space-y-4">
          {/* Note category tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-gray-400 font-semibold whitespace-nowrap flex items-center gap-1 text-[11px]">
              <Tag className="w-3 h-3" /> Topic:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap text-xs border ${
                  selectedCategory === cat.id
                    ? `${cat.color} ring-2 ring-indigo-500/20 shadow-xs scale-102`
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Textarea for note content */}
          <div className="relative">
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleAddNote(e);
                }
              }}
              placeholder="e.g. Value-Top S200i Real 200w Power Supply delete 1250 price, na na 2000 takar price ta delete hobe..."
              className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-mono text-gray-500">
                Ctrl + Enter
              </kbd>
              <span>to quickly submit note</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newNote.trim()}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting Note...' : 'Add Note to Board'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── FILTER BY STAFF ("KE KON NOTE LIKCE TA JENO BUJHA JAI") ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-4">
        {/* Row 1: Author Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" /> Filter by Staff Member (কে কোন নোট লিখেছে):
            </label>
            {selectedAuthorFilter !== 'all' && (
              <button
                onClick={() => setSelectedAuthorFilter('all')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear Staff Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedAuthorFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all whitespace-nowrap text-xs border ${
                selectedAuthorFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>👥 All Staff</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-inherit">
                {notes.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedAuthorFilter('mine')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all whitespace-nowrap text-xs border ${
                selectedAuthorFilter === 'mine'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <span>⭐ My Notes</span>
            </button>

            {authorStats.map(([authorName, stat]) => {
              const theme = getAuthorColor(authorName);
              const isSelected = selectedAuthorFilter === authorName;
              return (
                <button
                  key={authorName}
                  onClick={() => setSelectedAuthorFilter(authorName)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap text-xs border ${
                    isSelected
                      ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md ring-2 ring-indigo-500/20`
                      : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isSelected ? 'bg-white/20 text-white' : theme.avatarBg
                    }`}
                  >
                    {getInitials(authorName)}
                  </span>
                  <span>{authorName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : stat.pendingCount > 0
                        ? 'bg-amber-100 text-amber-800 font-bold'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {stat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Search, Status Tabs & Category Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({pendingNotesCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolved ({resolvedNotesCount})</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 md:justify-end">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter notes by topic"
              className="w-full sm:w-auto text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Topics</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search note or staff..."
                className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── NOTES FEED / CARDS ── */}
      <div className="space-y-4">
        {filteredNotes.map((note) => {
          const authorTheme = getAuthorColor(note.authorName || 'Staff');
          const isOwner = note.createdBy === user?.uid;
          const isResolved = note.status === 'resolved';
          const isUrgent = note.priority === 'urgent';
          const relativeTime = formatRelativeTime(note.createdAt);
          const formattedDate = formatNoteDate(note.createdAt);

          const categoryObj = CATEGORIES.find((c) => c.id === note.category);

          return (
            <div
              key={note.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs transition-all duration-200 hover:shadow-md ${
                note.isPinned
                  ? 'border-amber-300 bg-gradient-to-r from-amber-50/30 to-white ring-1 ring-amber-300'
                  : isResolved
                  ? 'border-gray-200 bg-gray-50/40 opacity-90'
                  : isUrgent
                  ? 'border-red-300 ring-1 ring-red-200'
                  : 'border-gray-200'
              }`}
            >
              {/* Card Header: Author Profile + Badges + Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Distinct Author Avatar */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm bg-gradient-to-br ${
                      authorTheme.gradient
                    } text-white shrink-0`}
                  >
                    {getInitials(note.authorName)}
                  </div>

                  <div>
                    {/* Author Name and Pill */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-gray-950 tracking-tight">
                        {note.authorName || 'Staff Member'}
                      </span>

                      {/* Author Role */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {note.authorRole || 'Staff'}
                      </span>

                      {/* Topic Category */}
                      {categoryObj && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${categoryObj.color}`}
                        >
                          {categoryObj.icon} {categoryObj.label}
                        </span>
                      )}

                      {/* Urgent Flag */}
                      {isUrgent && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                          <Flame className="w-3 h-3" /> URGENT
                        </span>
                      )}

                      {/* Pinned Flag */}
                      {note.isPinned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Pin className="w-3 h-3 text-amber-600 fill-amber-500" /> Pinned
                        </span>
                      )}
                    </div>

                    {/* Timestamp & Relative Time */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-600">{formattedDate}</span>
                      {relativeTime && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400 font-normal">({relativeTime})</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Header: Status Badge & Quick Controls */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Status Indicator */}
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border shadow-2xs ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isResolved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>RESOLVED</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>PENDING</span>
                      </>
                    )}
                  </span>

                  {/* Pin button (Admins only) */}
                  {isAdmin && (
                    <button
                      onClick={() => handleTogglePin(note)}
                      className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                        note.isPinned
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title={note.isPinned ? 'Unpin from top' : 'Pin to top of board'}
                    >
                      <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-500 text-amber-600' : ''}`} />
                    </button>
                  )}

                  {/* Copy note text */}
                  <button
                    onClick={() => handleCopy(note)}
                    className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Copy note text"
                  >
                    {copiedId === note.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Edit note (Owner or Admin) */}
                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => {
                        setEditingNote(note);
                        setEditContent(note.content);
                      }}
                      className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      title="Edit note text"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete note (Owner or Admin) */}
                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleDelete(note)}
                      className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body: Note Text */}
              <div className="py-4">
                <p className="text-gray-900 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-wrap break-words">
                  {note.content}
                </p>
              </div>

              {/* Card Footer: Resolution Info & Action Controls */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Resolution note if exists */}
                {note.resolutionNote ? (
                  <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 flex-1">
                    <CornerDownRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Admin Resolution: </span>
                      <span>{note.resolutionNote}</span>
                      {note.resolvedByName && (
                        <span className="text-emerald-600 ml-1 font-semibold">({note.resolvedByName})</span>
                      )}
                      {note.resolvedAt && (
                        <span className="text-emerald-500 ml-1 font-normal">• {formatNoteDate(note.resolvedAt)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">
                    {isResolved ? `Resolved on ${formatNoteDate(note.resolvedAt)}` : 'Awaiting admin action / reply'}
                  </div>
                )}

                {/* Status Toggle Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {isResolved ? (
                    <button
                      onClick={() => handleDirectToggleStatus(note)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen as Pending</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenResolveModal(note)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Mark as Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No notes found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
              {searchQuery || selectedAuthorFilter !== 'all' || statusFilter !== 'all'
                ? 'No notes match your current search and filter criteria. Try adjusting your filters.'
                : 'There are currently no staff notes on the board. Post one using the form above!'}
            </p>
            {(searchQuery || selectedAuthorFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedAuthorFilter('all');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 border border-indigo-200"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RESOLUTION MODAL WITH REMARK (OPTIONAL) ── */}
      {resolvingNote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">Resolve Staff Note</h3>
              </div>
              <button
                onClick={() => setResolvingNote(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs text-gray-700">
              <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <span>By {resolvingNote.authorName}:</span>
              </div>
              <p className="line-clamp-3 italic text-gray-600">"{resolvingNote.content}"</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Admin Resolution Remark / Action Taken (Optional):
              </label>
              <input
                type="text"
                value={resolutionRemark}
                onChange={(e) => setResolutionRemark(e.target.value)}
                placeholder="e.g. Price updated in POS, Product deleted from database, Cheque deposited..."
                className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingNote(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolveWithRemark}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT NOTE MODAL ── */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Edit Note</h3>
              </div>
              <button
                onClick={() => setEditingNote(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Note Content:</label>
              <textarea
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
