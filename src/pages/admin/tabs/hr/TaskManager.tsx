import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Task, UserProfile } from '../../../../types';
import { useAuth } from '../../../../context/AuthContext';
import { logAudit } from '../../../../lib/audit';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  PlayCircle,
  X,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckSquare,
  Square,
  ArrowRight,
  Download,
  Printer,
  LayoutGrid,
  List,
  User as UserIcon,
  Tag as TagIcon,
  Sparkles,
  Flame,
  Check,
  Undo2,
  MoreVertical,
  MessageCircle,
  Copy,
  Share2,
  BellRing,
} from 'lucide-react';

const PRESET_TAGS = [
  { name: 'General', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { name: 'Inventory & Stock', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Accounts & Billing', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { name: 'Customer Support', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Technical / Bug', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { name: 'Courier & Delivery', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { name: 'Urgent', color: 'bg-red-100 text-red-800 border-red-300 font-bold' },
];

export default function TaskManager() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // View & Filter states
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'due_asc' | 'due_desc' | 'priority_high' | 'newest'>('newest');

  // Quick Inline Add state for each column
  const [quickAddColumn, setQuickAddColumn] = useState<Task['status'] | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    tag: 'General',
    checklist: [] as { id: string; text: string; done: boolean }[],
  });

  const [newChecklistText, setNewChecklistText] = useState('');

  // Audio completion chime
  const playCompletionChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  useEffect(() => {
    // 1. Fetch Users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const uData = docSnap.data() as UserProfile;
        usersList.push({ ...uData, uid: uData.uid || docSnap.id });
      });
      setUsers(usersList);
    });

    // 2. Fetch Tasks (real-time stream)
    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasksList: Task[] = [];
        snapshot.forEach((docSnap) => {
          tasksList.push({ id: docSnap.id, ...docSnap.data() } as Task);
        });
        setTasks(tasksList);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
        toast.error('Failed to stream tasks');
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
    };
  }, []);

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    const u = users.find(u => u.uid === userId || (u as any)?.id === userId || u.email === userId);
    return u?.displayName || (u as any)?.name || u?.email || userId || 'Unassigned';
  };

  const getUserObj = (userId?: string) => {
    if (!userId) return null;
    return users.find(u => u.uid === userId || (u as any)?.id === userId || u.email === userId) || null;
  };

  // Internal staff roles only (excludes customer, user, client)
  const STAFF_ROLES = ['admin', 'staff', 'employee', 'manager', 'moderator', 'support'];

  const staffMembers = useMemo(() => {
    return users.filter(u => {
      const role = (u.role || '').toLowerCase().trim();
      if (role === 'customer' || role === 'user' || role === 'client' || !role) {
        return false;
      }
      return STAFF_ROLES.includes(role);
    }).sort((a, b) => {
      const nameA = a.displayName || (a as any)?.name || a.email || '';
      const nameB = b.displayName || (b as any)?.name || b.email || '';
      return nameA.localeCompare(nameB);
    });
  }, [users]);

  // Tasks assigned to logged in user
  const myTasks = useMemo(() => {
    if (!user?.uid && !user?.email) return [];
    return tasks.filter(t => (t.assignedTo === user?.uid || t.assignedTo === user?.email));
  }, [tasks, user]);

  const myActiveTasksCount = useMemo(() => {
    return myTasks.filter(t => t.status !== 'completed').length;
  }, [myTasks]);

  // Format WhatsApp Link
  const getWhatsAppUrl = (task: Task | typeof formData, assigneeUser?: UserProfile | null) => {
    const phone = (assigneeUser as any)?.phoneNumber || (assigneeUser as any)?.phone || '';
    let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
      cleanPhone = '88' + cleanPhone;
    }

    const checklistText = task.checklist && task.checklist.length > 0
      ? `\n📋 *Checklist:*\n` + task.checklist.map((c, i) => `  ${i + 1}. [${c.done ? '✓' : ' '}] ${c.text}`).join('\n')
      : '';

    const message = `📋 *NEW TASK ASSIGNED*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Task:* ${task.title}\n` +
      `⚡ *Priority:* ${(task.priority || 'medium').toUpperCase()}\n` +
      `🏷️ *Category:* ${task.tag || 'General'}\n` +
      `📅 *Due Date:* ${task.dueDate || 'No due date'}\n` +
      (task.description ? `📝 *Details:* ${task.description}\n` : '') +
      checklistText +
      `\n━━━━━━━━━━━━━━━━━━━\n` +
      `👉 *Open Task Manager:* ${typeof window !== 'undefined' ? window.location.origin : ''}/admin?tab=tasks`;

    const encoded = encodeURIComponent(message);
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encoded}`;
    }
    return `https://api.whatsapp.com/send?text=${encoded}`;
  };

  const handleSendWhatsApp = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const assignee = getUserObj(task.assignedTo);
    const url = getWhatsAppUrl(task, assignee);
    window.open(url, '_blank');
    toast.success('Opening WhatsApp with task details...');
  };

  const handleCopyTask = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const checklistText = task.checklist && task.checklist.length > 0
      ? `\nChecklist:\n` + task.checklist.map((c, i) => `  ${i + 1}. [${c.done ? '✓' : ' '}] ${c.text}`).join('\n')
      : '';
    const text = `📋 Task: ${task.title}\nPriority: ${(task.priority || 'medium').toUpperCase()}\nAssignee: ${getUserName(task.assignedTo)}\nDue Date: ${task.dueDate || 'N/A'}${task.description ? `\nDetails: ${task.description}` : ''}${checklistText}`;
    navigator.clipboard.writeText(text);
    toast.success('Task details copied to clipboard!');
  };

  const isOverdue = (task: Task) => {
    if (task.status === 'completed' || !task.dueDate) return false;
    const due = new Date(task.dueDate);
    due.setHours(23, 59, 59, 999);
    return due.getTime() < Date.now();
  };

  const isDueToday = (task: Task) => {
    if (task.status === 'completed' || !task.dueDate) return false;
    const due = new Date(task.dueDate).toDateString();
    const today = new Date().toDateString();
    return due === today;
  };

  // Open & Close Modal
  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo || '',
        priority: (task.priority as any) || 'medium',
        dueDate: task.dueDate || '',
        tag: task.tag || 'General',
        checklist: task.checklist || [],
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        assignedTo: user?.uid || '',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        tag: 'General',
        checklist: [],
      });
    }
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setNewChecklistText('');
  };

  // Add / Remove Checklist Item in Modal
  const handleAddChecklist = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChecklistText.trim()) return;
    setFormData(prev => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        { id: Date.now().toString(), text: newChecklistText.trim(), done: false },
      ],
    }));
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id),
    }));
  };

  // Toggle checklist item directly on card
  const handleToggleChecklistOnCard = async (task: Task, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.id || !task.checklist) return;

    const updatedChecklist = task.checklist.map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    // Auto-complete task if all checklist items are checked
    const allChecked = updatedChecklist.length > 0 && updatedChecklist.every(i => i.done);

    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        checklist: updatedChecklist,
        ...(allChecked && task.status !== 'completed' ? { status: 'completed', completedAt: new Date().toISOString() } : {}),
      });

      if (allChecked && task.status !== 'completed') {
        playCompletionChime();
        toast.success(`All items completed! Task marked done.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update checklist');
    }
  };

  // Submit Modal Task
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const operatorName = profile?.displayName || profile?.email || user?.email || 'Admin';

      if (editingTask && editingTask.id) {
        await updateDoc(doc(db, 'tasks', editingTask.id), {
          ...formData,
          updatedAt: new Date().toISOString(),
        });

        await logAudit(
          'EDIT',
          'Task',
          `Updated task "${formData.title}" assigned to ${getUserName(formData.assignedTo)} (Priority: ${formData.priority})`,
          operatorName
        );

        toast.success('Task updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'tasks'), {
          ...formData,
          status: 'pending',
          assignedBy: user?.uid || 'Admin',
          createdAt: new Date().toISOString(),
        });

        await logAudit(
          'CREATE',
          'Task',
          `Created task "${formData.title}" assigned to ${getUserName(formData.assignedTo)} (Priority: ${formData.priority})`,
          operatorName,
          { entityId: docRef.id }
        );

        toast.success('Task created successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
  };

  // Quick Inline Add in Column
  const handleQuickAdd = async (status: Task['status']) => {
    if (!quickAddTitle.trim()) {
      setQuickAddColumn(null);
      return;
    }

    try {
      const operatorName = profile?.displayName || profile?.email || user?.email || 'Admin';
      await addDoc(collection(db, 'tasks'), {
        title: quickAddTitle.trim(),
        description: '',
        status,
        priority: 'medium',
        assignedTo: user?.uid || '',
        assignedBy: user?.uid || 'Admin',
        tag: 'General',
        dueDate: new Date().toISOString().split('T')[0],
        checklist: [],
        createdAt: new Date().toISOString(),
      });

      await logAudit('CREATE', 'Task', `Quick added task "${quickAddTitle.trim()}" in ${status}`, operatorName);
      setQuickAddTitle('');
      setQuickAddColumn(null);
      toast.success('Task added');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add quick task');
    }
  };

  // Delete Task
  const handleDelete = async (id: string, title?: string) => {
    if (window.confirm(`Are you sure you want to delete "${title || 'this task'}"?`)) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        const operatorName = profile?.displayName || profile?.email || user?.email || 'Admin';
        await logAudit('DELETE', 'Task', `Deleted task "${title || id}"`, operatorName, { entityId: id });
        toast.success('Task deleted');
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
      }
    }
  };

  // Change Status
  const handleStatusChange = async (id: string, newStatus: Task['status'], taskTitle?: string) => {
    try {
      const isFinishing = newStatus === 'completed';
      await updateDoc(doc(db, 'tasks', id), {
        status: newStatus,
        ...(isFinishing ? { completedAt: new Date().toISOString() } : {}),
      });

      if (isFinishing) {
        playCompletionChime();
        toast.success('Task marked as completed! 🎉');
      } else {
        toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      }

      const operatorName = profile?.displayName || profile?.email || user?.email || 'Admin';
      await logAudit(
        'STATUS_CHANGE',
        'Task',
        `Moved task "${taskTitle || id}" to ${newStatus.toUpperCase()}`,
        operatorName,
        { entityId: id }
      );
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update status');
    }
  };

  // Export Tasks to CSV
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      toast.error('No tasks to export');
      return;
    }

    const headers = ['Task ID', 'Title', 'Status', 'Priority', 'Tag', 'Assigned To', 'Due Date', 'Created At'];
    const rows = tasks.map(t => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority || 'medium',
      t.tag || 'General',
      `"${getUserName(t.assignedTo)}"`,
      t.dueDate || 'N/A',
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tasks_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Tasks exported to CSV');
  };

  // Print Task Sheet
  const handlePrint = () => {
    window.print();
  };

  // Colors & Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: string = 'medium') => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Flame size={12} className="text-rose-500" /> High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Low
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200">
            Medium
          </span>
        );
    }
  };

  const getTagBadge = (tag?: string) => {
    if (!tag) return null;
    const found = PRESET_TAGS.find(t => t.name.toLowerCase() === tag.toLowerCase());
    const colorClass = found ? found.color : 'bg-slate-100 text-slate-700 border-slate-200';
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold border ${colorClass}`}>
        <TagIcon size={10} /> {tag}
      </span>
    );
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => isOverdue(t)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, inProgress, completed, overdue, completionRate };
  }, [tasks]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (t.title || '').toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesAssignee = getUserName(t.assignedTo).toLowerCase().includes(q);
        const matchesTag = (t.tag || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesTag) return false;
      }

      // Staff filter
      if (selectedStaff !== 'all' && t.assignedTo !== selectedStaff) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && (t.priority || 'medium') !== selectedPriority) {
        return false;
      }

      // Tag filter
      if (selectedTag !== 'all' && (t.tag || 'General') !== selectedTag) {
        return false;
      }

      // Timeline filter
      if (selectedTimeFilter === 'overdue' && !isOverdue(t)) return false;
      if (selectedTimeFilter === 'today' && !isDueToday(t)) return false;
      if (selectedTimeFilter === 'upcoming') {
        if (!t.dueDate || isOverdue(t) || isDueToday(t)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      }
      if (sortBy === 'due_asc') {
        const dA = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
        const dB = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
        return dA - dB;
      }
      if (sortBy === 'due_desc') {
        const dA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dB - dA;
      }
      if (sortBy === 'priority_high') {
        const pOrder = { high: 3, medium: 2, low: 1 };
        return (pOrder[b.priority || 'medium'] || 2) - (pOrder[a.priority || 'medium'] || 2);
      }
      return 0;
    });
  }, [tasks, searchQuery, selectedStaff, selectedPriority, selectedTag, selectedTimeFilter, sortBy]);

  const columns: { id: Task['status']; title: string; icon: React.ReactNode; bg: string; border: string; accent: string }[] = [
    {
      id: 'pending',
      title: 'Pending',
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-50/40',
      border: 'border-amber-200/80',
      accent: 'text-amber-800',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: <PlayCircle className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50/40',
      border: 'border-blue-200/80',
      accent: 'text-blue-800',
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50/40',
      border: 'border-emerald-200/80',
      accent: 'text-emerald-800',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Workflow & Task Automation Engine</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Task Manager & Team Workflows
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Assign duties, track daily milestones, automate operational to-dos, and monitor real-time completion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="bg-slate-800/80 border border-slate-700 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <List size={14} /> List View
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Export tasks to CSV"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Print task sheet"
          >
            <Printer size={14} /> Print
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={16} /> Add New Task
          </button>
        </div>
      </div>

      {/* 2. ANALYTICS & STATUS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Tasks</span>
            <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
            <CheckSquare size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">Pending</span>
            <span className="text-2xl font-black text-amber-600">{metrics.pending}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">In Progress</span>
            <span className="text-2xl font-black text-blue-600">{metrics.inProgress}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
            <PlayCircle size={20} />
          </div>
        </div>

        <div className={`bg-white p-4 rounded-xl border shadow-xs flex items-center justify-between ${
          metrics.overdue > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">Overdue</span>
              {metrics.overdue > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <span className="text-2xl font-black text-rose-600">{metrics.overdue}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Completion</span>
            <span className="text-xs font-black text-emerald-700">{metrics.completionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1.5">
            {metrics.completed} of {metrics.total} completed
          </span>
        </div>
      </div>

      {/* 2.5 ASSIGNED TO ME ALERT BANNER */}
      {myActiveTasksCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BellRing size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                You have {myActiveTasksCount} active task{myActiveTasksCount > 1 ? 's' : ''} assigned to you!
              </h4>
              <p className="text-xs text-slate-600">
                Operational duties assigned directly to your account. Stay on top of your daily deliverables.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStaff(selectedStaff === user?.uid ? 'all' : (user?.uid || 'all'))}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              selectedStaff === user?.uid
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 shadow-2xs'
            }`}
          >
            {selectedStaff === user?.uid ? '✓ Showing My Tasks (Click to Show All)' : '🎯 Focus On My Tasks'}
          </button>
        </div>
      )}

      {/* 3. FILTER & SEARCH CONTROL TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, description, assignee, or tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Assigned To Me Quick Toggle */}
          {user?.uid && (
            <button
              onClick={() => setSelectedStaff(selectedStaff === user.uid ? 'all' : user.uid)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                selectedStaff === user.uid
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <CheckSquare size={14} />
              <span>Assigned to Me ({myActiveTasksCount})</span>
            </button>
          )}

          {/* Staff Filter */}
          <div className="min-w-[170px]">
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">👥 All Staff Members ({staffMembers.length})</option>
              {staffMembers.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName || (u as any)?.name || u.email || 'Staff'} ({u.role || 'staff'})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="min-w-[130px]">
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">⚡ All Priorities</option>
              <option value="high">🔥 High</option>
              <option value="medium">⚡ Medium</option>
              <option value="low">🌱 Low</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div className="min-w-[140px]">
            <select
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">🏷️ All Tags</option>
              {PRESET_TAGS.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeline filter */}
          <div className="min-w-[130px]">
            <select
              value={selectedTimeFilter}
              onChange={e => setSelectedTimeFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">📅 All Dates</option>
              <option value="overdue">🚨 Overdue Only</option>
              <option value="today">⏳ Due Today</option>
              <option value="upcoming">🗓️ Upcoming</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="min-w-[140px]">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">🕒 Newest First</option>
              <option value="due_asc">📅 Due Date (Earliest)</option>
              <option value="due_desc">📅 Due Date (Latest)</option>
              <option value="priority_high">🔥 Highest Priority</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags Bar */}
        {(searchQuery || selectedStaff !== 'all' || selectedPriority !== 'all' || selectedTag !== 'all' || selectedTimeFilter !== 'all') && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold">Active filters:</span>
              {searchQuery && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                  Search: "{searchQuery}" <X size={12} className="cursor-pointer" onClick={() => setSearchQuery('')} />
                </span>
              )}
              {selectedStaff !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                  Staff: {getUserName(selectedStaff)} <X size={12} className="cursor-pointer" onClick={() => setSelectedStaff('all')} />
                </span>
              )}
              {selectedPriority !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium flex items-center gap-1">
                  Priority: {selectedPriority} <X size={12} className="cursor-pointer" onClick={() => setSelectedPriority('all')} />
                </span>
              )}
              {selectedTag !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium flex items-center gap-1">
                  Tag: {selectedTag} <X size={12} className="cursor-pointer" onClick={() => setSelectedTag('all')} />
                </span>
              )}
              {selectedTimeFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium flex items-center gap-1">
                  Timeline: {selectedTimeFilter} <X size={12} className="cursor-pointer" onClick={() => setSelectedTimeFilter('all')} />
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStaff('all');
                setSelectedPriority('all');
                setSelectedTag('all');
                setSelectedTimeFilter('all');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN VIEW: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => (t.status || 'pending') === col.id);

            return (
              <div
                key={col.id}
                className={`rounded-2xl p-4 border flex flex-col h-[calc(100vh-270px)] min-h-[500px] ${col.bg} ${col.border}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className={`font-black text-sm tracking-tight ${col.accent}`}>{col.title}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                {/* Quick Add Bar in Column */}
                <div className="mb-3">
                  {quickAddColumn === col.id ? (
                    <div className="bg-white p-2.5 rounded-xl border border-blue-400 shadow-sm space-y-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Task title (press Enter to save)..."
                        value={quickAddTitle}
                        onChange={e => setQuickAddTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleQuickAdd(col.id);
                          if (e.key === 'Escape') setQuickAddColumn(null);
                        }}
                        className="w-full text-xs font-bold text-slate-800 outline-none"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickAddColumn(null)}
                          className="px-2 py-1 rounded text-[11px] font-bold text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(col.id)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setQuickAddColumn(col.id);
                        setQuickAddTitle('');
                      }}
                      className="w-full py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-white/70 hover:bg-white text-slate-500 hover:text-blue-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Plus size={14} /> Quick Add Task
                    </button>
                  )}
                </div>

                {/* Task Cards Scrollable Area */}
                <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                  {colTasks.map(task => {
                    const overdue = isOverdue(task);
                    const dueToday = isDueToday(task);
                    const checklistTotal = task.checklist?.length || 0;
                    const checklistDone = task.checklist?.filter(c => c.done).length || 0;
                    const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
                    const assignee = getUserObj(task.assignedTo);

                    return (
                      <div
                        key={task.id}
                        className={`bg-white rounded-xl p-4 shadow-xs border transition-all hover:shadow-md group relative ${
                          overdue ? 'border-rose-400 ring-2 ring-rose-200/50' : 'border-slate-200'
                        }`}
                      >
                        {/* Top Meta: Tag & Priority & Due Warning */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getTagBadge(task.tag)}
                            {getPriorityBadge(task.priority)}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleSendWhatsApp(task, e)}
                              className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Notify Staff on WhatsApp"
                            >
                              <MessageCircle size={13} />
                            </button>
                            <button
                              onClick={(e) => handleCopyTask(task, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Copy task summary"
                            >
                              <Copy size={13} />
                            </button>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenModal(task)}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                                title="Edit task"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => task.id && handleDelete(task.id, task.title)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete task"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Interactive Checklist (If any) */}
                        {checklistTotal > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                              <span>Checklist</span>
                              <span>{checklistDone}/{checklistTotal} ({checklistPct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${checklistPct}%` }}
                              />
                            </div>
                            <div className="space-y-1 mt-1.5 max-h-28 overflow-y-auto">
                              {task.checklist!.map(item => (
                                <div
                                  key={item.id}
                                  onClick={(e) => handleToggleChecklistOnCard(task, item.id, e)}
                                  className="flex items-center gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                                >
                                  {item.done ? (
                                    <CheckSquare size={13} className="text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square size={13} className="text-slate-400 shrink-0" />
                                  )}
                                  <span className={`text-[11px] ${item.done ? 'line-through text-slate-400 font-normal' : 'text-slate-700 font-medium'}`}>
                                    {item.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assignee & Due Date Row */}
                        <div className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-slate-100 text-xs">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5 truncate max-w-[55%]">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
                              {(getUserName(task.assignedTo) || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-700 truncate" title={getUserName(task.assignedTo)}>
                              {getUserName(task.assignedTo)}
                            </span>
                          </div>

                          {/* Due Date Badge */}
                          {task.dueDate && (
                            <div className="shrink-0">
                              {overdue ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-black bg-rose-100 text-rose-800 border border-rose-200">
                                  <AlertCircle size={11} /> Overdue ({new Date(task.dueDate).toLocaleDateString()})
                                </span>
                              ) : dueToday ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-black bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock size={11} /> Today
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                  <Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quick Status Forward / Backward Action Buttons */}
                        <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                          {col.id === 'pending' && (
                            <>
                              <button
                                onClick={() => task.id && handleStatusChange(task.id, 'in_progress', task.title)}
                                className="flex-1 py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                              >
                                <PlayCircle size={13} /> Start Task
                              </button>
                              <button
                                onClick={() => task.id && handleStatusChange(task.id, 'completed', task.title)}
                                className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                title="Mark Completed"
                              >
                                <Check size={13} />
                              </button>
                            </>
                          )}

                          {col.id === 'in_progress' && (
                            <>
                              <button
                                onClick={() => task.id && handleStatusChange(task.id, 'pending', task.title)}
                                className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                                title="Move back to pending"
                              >
                                <Undo2 size={13} />
                              </button>
                              <button
                                onClick={() => task.id && handleStatusChange(task.id, 'completed', task.title)}
                                className="flex-1 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-xs"
                              >
                                <CheckCircle size={13} /> Complete Task
                              </button>
                            </>
                          )}

                          {col.id === 'completed' && (
                            <button
                              onClick={() => task.id && handleStatusChange(task.id, 'in_progress', task.title)}
                              className="w-full py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Undo2 size={13} /> Reopen Task
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="p-8 text-center bg-white/50 rounded-xl border border-dashed border-slate-200/80">
                      <p className="text-xs font-bold text-slate-400">No tasks in this column</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. LIST VIEW (Alternative view mode) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Task Details</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Assignee</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Checklist</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(task => {
                  const overdue = isOverdue(task);
                  const dueToday = isDueToday(task);
                  const checklistTotal = task.checklist?.length || 0;
                  const checklistDone = task.checklist?.filter(c => c.done).length || 0;

                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{task.title}</div>
                        {task.description && (
                          <div className="text-slate-500 text-[11px] line-clamp-1">{task.description}</div>
                        )}
                        <div className="mt-1 flex items-center gap-1.5">{getTagBadge(task.tag)}</div>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={task.status || 'pending'}
                          onChange={e => task.id && handleStatusChange(task.id, e.target.value as any, task.title)}
                          className={`text-[11px] font-black rounded-lg px-2.5 py-1 border outline-none ${getStatusColor(
                            task.status || 'pending'
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">{getPriorityBadge(task.priority)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                            {(getUserName(task.assignedTo) || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span>{getUserName(task.assignedTo)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {task.dueDate ? (
                          overdue ? (
                            <span className="font-bold text-rose-600 flex items-center gap-1">
                              <AlertCircle size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          ) : dueToday ? (
                            <span className="font-bold text-amber-600 flex items-center gap-1">
                              <Clock size={12} /> Today
                            </span>
                          ) : (
                            <span className="text-slate-600">{new Date(task.dueDate).toLocaleDateString()}</span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {checklistTotal > 0 ? (
                          <span className="font-bold text-slate-700">
                            {checklistDone} / {checklistTotal} done
                          </span>
                        ) : (
                          <span className="text-slate-400">0 items</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleSendWhatsApp(task, e)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Notify Staff on WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </button>
                          <button
                            onClick={(e) => handleCopyTask(task, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copy Summary"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(task)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => task.id && handleDelete(task.id, task.title)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      No matching tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ENHANCED CREATE / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <CheckSquare size={20} className="text-indigo-400" />
                <h3 className="text-base font-black">
                  {editingTask ? 'Edit Task Details' : 'Create New Team Task'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Call vendor for shipment tracking..."
                />
              </div>

              {/* Tag & Priority in a grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Category / Tag
                  </label>
                  <select
                    value={formData.tag}
                    onChange={e => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRESET_TAGS.map(t => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">🌱 Low</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="high">🔥 High</option>
                  </select>
                </div>
              </div>

              {/* Assign To & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                      Assign To Staff
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Staff Only ({staffMembers.length})
                    </span>
                  </div>
                  <select
                    value={formData.assignedTo}
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">👤 Unassigned (General Team)</option>
                    {staffMembers.map(u => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName || (u as any)?.name || u.email || 'Staff'} ({u.role || 'staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Detailed Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all h-20 resize-none"
                  placeholder="Additional context, notes, customer links..."
                />
              </div>

              {/* Subtasks / Checklist Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                  Checklist & Subtasks ({formData.checklist.length})
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={e => setNewChecklistText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklist();
                      }
                    }}
                    placeholder="Add a step (e.g. 'Pack package')..."
                    className="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddChecklist()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200"
                  >
                    Add
                  </button>
                </div>

                {formData.checklist.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {formData.checklist.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700 truncate">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklist(item.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const assignee = getUserObj(formData.assignedTo);
                    const url = getWhatsAppUrl(formData, assignee);
                    window.open(url, '_blank');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black border border-emerald-200 flex items-center gap-1.5 transition-colors"
                  title="Notify assigned staff directly on WhatsApp"
                >
                  <MessageCircle size={14} />
                  <span>Notify via WhatsApp</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
