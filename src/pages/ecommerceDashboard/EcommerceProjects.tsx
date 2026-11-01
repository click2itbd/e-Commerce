import React, { useState, useEffect, useMemo } from 'react';
import { db, storage } from '../../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  Camera,
  Briefcase,
  Monitor,
  Server,
  Shield,
  Home,
  Cpu,
  Wifi,
  Building2,
  Award,
  Trash2,
  Plus,
  Edit2,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Save,
  X,
  Search,
  Filter,
  ExternalLink,
  Upload,
  Star,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MessageCircle,
  Copy,
  Download,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../context/AuthContext';
import { logAudit } from '../../lib/audit';

const PROJECT_CATEGORIES = [
  'CCTV & Surveillance',
  'Corporate Networking',
  'Workstation & PC Build',
  'Server & Data Center',
  'Access Control & Security',
  'Smart Home & Office',
  'Enterprise IT Setup',
];

const AVAILABLE_ICONS: { name: string; label: string; icon: any }[] = [
  { name: 'Camera', label: 'CCTV / Camera', icon: Camera },
  { name: 'Briefcase', label: 'Corporate', icon: Briefcase },
  { name: 'Monitor', label: 'Workstation', icon: Monitor },
  { name: 'Server', label: 'Server / Rack', icon: Server },
  { name: 'Shield', label: 'Security', icon: Shield },
  { name: 'Home', label: 'Smart Home', icon: Home },
  { name: 'Cpu', label: 'Hardware / PC', icon: Cpu },
  { name: 'Wifi', label: 'Networking', icon: Wifi },
  { name: 'Building2', label: 'Enterprise', icon: Building2 },
  { name: 'Award', label: 'Flagship', icon: Award },
];

const QUICK_FEATURE_SUGGESTIONS = [
  '24/7 IP Surveillance',
  'Cat6 Structured Cabling',
  'Biometric Access Control',
  'NVR & Cloud Backup',
  'MikroTik Load Balancing',
  'Online UPS Power Backup',
  '1 Year On-Site Warranty',
  'Zero Downtime Deployment',
];

const SAMPLE_PROJECTS = [
  {
    title: '3-Story Corporate Headquarter Network & Wi-Fi 6 Deployment',
    category: 'Corporate Networking',
    client: 'Simpletree Attalika Corporate Office',
    location: 'Gulshan-2, Dhaka',
    completedDate: '2026-09',
    projectValue: 485000,
    duration: '10 Days',
    description:
      'Complete enterprise networking overhaul featuring Gigabit PoE switches, seamless roaming Wi-Fi 6 access points, rack management, and redundant fiber load-balancing for 150+ concurrent workstations.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80',
    gallery: [],
    iconName: 'Wifi',
    features: [
      'Cat6 Structured Cabling',
      '16-Port Gigabit PoE Switches',
      'Seamless Wi-Fi 6 Roaming',
      'Server Rack Dressing',
      '1 Year On-Site Support',
    ],
    testimonial: 'Click2IT BD delivered our entire 3-story office network ahead of schedule with zero downtime.',
    isFeatured: true,
    isActive: true,
  },
  {
    title: '32-Channel AI IP CCTV & Biometric Access Control System',
    category: 'CCTV & Surveillance',
    client: 'Volumezero Logistics & Warehouse',
    location: 'Uttara, Dhaka',
    completedDate: '2026-10',
    projectValue: 320000,
    duration: '7 Days',
    description:
      'End-to-end security surveillance setup with 32 night-vision IP cameras, 32-channel NVR with 16TB surveillance HDD storage, ZKTeco Face Recognition terminals, and remote mobile monitoring.',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1000&q=80',
    gallery: [],
    iconName: 'Camera',
    features: [
      '32x ColorVu IP Cameras',
      '16TB WD Purple Storage',
      'ZKTeco Face Access Control',
      'Mobile Live Monitoring',
      'Online UPS Backup',
    ],
    testimonial: 'Crystal clear video feeds and reliable access control. Very professional engineering team.',
    isFeatured: true,
    isActive: true,
  },
  {
    title: '25x High-Performance Design & Rendering Workstation Setup',
    category: 'Workstation & PC Build',
    client: 'Spacezero Creative Studio',
    location: 'Banani, Dhaka',
    completedDate: '2026-08',
    projectValue: 1850000,
    duration: '5 Days',
    description:
      'Custom-built high-end workstations powered by Intel Core i7 processors, 32GB DDR5 RAM, NVMe Gen4 SSDs, and ProArt color-calibrated 2K monitors for 3D rendering and architectural visualization.',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80',
    gallery: [],
    iconName: 'Monitor',
    features: [
      '25x Custom Workstations',
      'ASUS ProArt 27" QHD Monitors',
      'NVMe Gen4 High-Speed Storage',
      'Full Cable Management',
      '3 Years Priority Warranty',
    ],
    testimonial: 'Our rendering times dropped by 60%. Fantastic build quality and after-sales service.',
    isFeatured: false,
    isActive: true,
  },
];

export const EcommerceProjects = () => {
  const { confirm } = useConfirm();
  const { user, profile } = useAuth();
  const operatorName = profile?.displayName || profile?.email || user?.email || 'Admin';

  const [activeTab, setActiveTab] = useState<'showcase' | 'quotes'>('showcase');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Showcase Projects
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'featured' | 'active' | 'hidden'>('all');

  // Filters for Quote Requests
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [quoteAdminNotes, setQuoteAdminNotes] = useState('');
  const [quoteEstimatedAmount, setQuoteEstimatedAmount] = useState('');
  const [savingQuoteNote, setSavingQuoteNote] = useState(false);

  // Form State for Showcase Projects
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  const initialFormState = {
    title: '',
    category: 'CCTV & Surveillance',
    client: '',
    location: '',
    completedDate: new Date().toISOString().slice(0, 7),
    projectValue: '',
    duration: '',
    description: '',
    image: '',
    gallery: [] as string[],
    featuresList: [] as string[],
    testimonial: '',
    iconName: 'Camera',
    isFeatured: false,
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qQuotes = query(collection(db, 'quote_requests'), orderBy('createdAt', 'desc'));
      const snapQuotes = await getDocs(qQuotes);
      setQuotes(snapQuotes.docs.map(d => ({ id: d.id, ...d.data() })));

      const qProjects = query(collection(db, 'showcase_projects'), orderBy('createdAt', 'desc'));
      const snapProjects = await getDocs(qProjects);
      setProjects(snapProjects.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load projects & quotes');
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (name: string, props: any = {}) => {
    const found = AVAILABLE_ICONS.find(i => i.name === name);
    const IconComponent = found ? found.icon : Briefcase;
    return <IconComponent {...props} />;
  };

  // Upload Cover or Gallery Image to Firebase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (target === 'cover') {
      const file = files[0];
      setIsUploadingCover(true);
      const toastId = toast.loading('Uploading project cover image...');
      try {
        const storageRef = ref(storage, `showcase_projects/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        const url = await getDownloadURL(uploadTask.ref);
        setFormData(prev => ({ ...prev, image: url }));
        toast.success('Cover image uploaded!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload image', { id: toastId });
      } finally {
        setIsUploadingCover(false);
      }
    } else {
      setIsUploadingGallery(true);
      const toastId = toast.loading(`Uploading ${files.length} gallery image(s)...`);
      try {
        const uploadedUrls: string[] = [];
        for (const file of Array.from(files)) {
          const storageRef = ref(storage, `showcase_projects/gallery_${Date.now()}_${file.name}`);
          const uploadTask = await uploadBytesResumable(storageRef, file);
          const url = await getDownloadURL(uploadTask.ref);
          uploadedUrls.push(url);
        }
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...uploadedUrls] }));
        toast.success('Gallery images uploaded!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload gallery images', { id: toastId });
      } finally {
        setIsUploadingGallery(false);
      }
    }
  };

  // Add feature tag
  const handleAddFeature = (text?: string) => {
    const raw = (text !== undefined ? text : featureInput).trim();
    if (!raw) return;
    // Support comma-separated paste
    const parts = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    setFormData(prev => {
      const next = [...prev.featuresList];
      parts.forEach(p => {
        if (!next.includes(p)) next.push(p);
      });
      return { ...prev, featuresList: next };
    });
    if (text === undefined) setFeatureInput('');
  };

  const handleRemoveFeature = (feat: string) => {
    setFormData(prev => ({
      ...prev,
      featuresList: prev.featuresList.filter(f => f !== feat),
    }));
  };

  // Open Edit Modal
  const handleEditProject = (p: any) => {
    setFormData({
      title: p.title || '',
      category: p.category || 'CCTV & Surveillance',
      client: p.client || '',
      location: p.location || '',
      completedDate: p.completedDate || '',
      projectValue: p.projectValue ? String(p.projectValue) : '',
      duration: p.duration || '',
      description: p.description || '',
      image: p.image || '',
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      featuresList: Array.isArray(p.features) ? p.features : [],
      testimonial: p.testimonial || '',
      iconName: p.iconName || 'Briefcase',
      isFeatured: Boolean(p.isFeatured),
      isActive: p.isActive !== false,
    });
    setEditId(p.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Showcase Project
  const handleSaveProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    if (!formData.image.trim()) {
      toast.error('Please upload or paste a cover image URL');
      return;
    }

    const finalFeatures = [...formData.featuresList];
    if (featureInput.trim()) {
      featureInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .forEach(p => {
          if (!finalFeatures.includes(p)) finalFeatures.push(p);
        });
    }

    const payload: any = {
      title: formData.title.trim(),
      category: formData.category.trim() || 'Enterprise IT Setup',
      client: formData.client.trim() || 'Corporate Client',
      location: formData.location.trim(),
      completedDate: formData.completedDate,
      projectValue: formData.projectValue ? Number(formData.projectValue) : 0,
      duration: formData.duration.trim(),
      description: formData.description.trim(),
      image: formData.image.trim(),
      gallery: formData.gallery,
      iconName: formData.iconName,
      features: finalFeatures,
      testimonial: formData.testimonial.trim(),
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editId) {
        const oldProject = projects.find(p => p.id === editId);
        await updateDoc(doc(db, 'showcase_projects', editId), payload);
        await logAudit(
          'EDIT',
          'Showcase Project',
          `Updated showcase project "${payload.title}" (Client: ${payload.client})`,
          operatorName,
          { entityId: editId, previousState: oldProject, newState: payload }
        );
        toast.success('Project updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'showcase_projects'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        await logAudit(
          'CREATE',
          'Showcase Project',
          `Created showcase project "${payload.title}" (Client: ${payload.client})`,
          operatorName,
          { entityId: docRef.id, newState: payload }
        );
        toast.success('Project published to showcase!');
      }
      setIsAdding(false);
      setEditId(null);
      setFormData(initialFormState);
      setFeatureInput('');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save project');
    }
  };

  // Toggle Featured or Active directly on card
  const handleToggleProjectFlag = async (project: any, field: 'isFeatured' | 'isActive') => {
    const nextVal = field === 'isActive' ? project.isActive === false : !project[field];
    try {
      await updateDoc(doc(db, 'showcase_projects', project.id), { [field]: nextVal });
      setProjects(prev => prev.map(p => (p.id === project.id ? { ...p, [field]: nextVal } : p)));
      toast.success(
        field === 'isFeatured'
          ? nextVal
            ? 'Marked as Featured ⭐'
            : 'Removed from Featured'
          : nextVal
          ? 'Project is now visible on website'
          : 'Project hidden from website'
      );
    } catch (err) {
      toast.error('Failed to update project');
    }
  };

  // Duplicate Project
  const handleDuplicateProject = async (project: any) => {
    try {
      const { id, createdAt, ...rest } = project;
      const copyPayload = {
        ...rest,
        title: `${project.title} (Copy)`,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'showcase_projects'), copyPayload);
      toast.success('Project duplicated!');
      fetchData();
    } catch (err) {
      toast.error('Failed to duplicate project');
    }
  };

  // Delete Project
  const handleDeleteProject = async (id: string, title?: string) => {
    if (
      !(await confirm({
        title: 'Delete Showcase Project',
        message: `Are you sure you want to permanently delete "${title || 'this project'}"?`,
        isDestructive: true,
      }))
    )
      return;
    try {
      await deleteDoc(doc(db, 'showcase_projects', id));
      await logAudit('DELETE', 'Showcase Project', `Deleted showcase project "${title || id}"`, operatorName, {
        entityId: id,
      });
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  // Load Sample Projects
  const handleLoadSamples = async () => {
    if (
      !(await confirm({
        title: 'Load Sample Showcase Projects',
        message: 'This will add 3 sample corporate projects (Networking, CCTV, Workstations) that you can edit anytime. Continue?',
        isDestructive: false,
      }))
    )
      return;
    const toastId = toast.loading('Adding sample projects...');
    try {
      for (const sp of SAMPLE_PROJECTS) {
        await addDoc(collection(db, 'showcase_projects'), {
          ...sp,
          createdAt: serverTimestamp(),
        });
      }
      toast.success('3 sample projects added!', { id: toastId });
      fetchData();
    } catch (err) {
      toast.error('Failed to load samples', { id: toastId });
    }
  };

  // Quote Request Actions
  const handleUpdateQuoteStatus = async (id: string, status: string) => {
    try {
      const targetQuote = quotes.find(q => q.id === id);
      await updateDoc(doc(db, 'quote_requests', id), {
        status,
        updatedAt: new Date().toISOString(),
      });
      setQuotes(prev => prev.map(q => (q.id === id ? { ...q, status } : q)));
      if (selectedQuote?.id === id) {
        setSelectedQuote((prev: any) => (prev ? { ...prev, status } : null));
      }
      await logAudit(
        'STATUS_CHANGE',
        'Quote Request',
        `Updated quote status for "${targetQuote?.name || id}" (${targetQuote?.projectType || ''}) to ${status.toUpperCase()}`,
        operatorName,
        { entityId: id }
      );
      toast.success(`Quote status updated to ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveQuoteDetails = async () => {
    if (!selectedQuote) return;
    setSavingQuoteNote(true);
    try {
      const updates = {
        adminNotes: quoteAdminNotes.trim(),
        estimatedAmount: quoteEstimatedAmount ? Number(quoteEstimatedAmount) : 0,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'quote_requests', selectedQuote.id), updates);
      setQuotes(prev => prev.map(q => (q.id === selectedQuote.id ? { ...q, ...updates } : q)));
      setSelectedQuote((prev: any) => (prev ? { ...prev, ...updates } : null));
      toast.success('Quote notes & estimate saved!');
    } catch (err) {
      toast.error('Failed to save quote details');
    } finally {
      setSavingQuoteNote(false);
    }
  };

  const handleDeleteQuote = async (id: string, clientName?: string) => {
    if (
      !(await confirm({
        title: 'Delete Quote Request',
        message: `Are you sure you want to delete the quote request from "${clientName || 'this client'}"?`,
        isDestructive: true,
      }))
    )
      return;
    try {
      await deleteDoc(doc(db, 'quote_requests', id));
      setQuotes(prev => prev.filter(q => q.id !== id));
      if (selectedQuote?.id === id) setSelectedQuote(null);
      toast.success('Quote request deleted');
    } catch (err) {
      toast.error('Failed to delete quote request');
    }
  };

  const handleWhatsAppQuoteReply = (q: any) => {
    let cleanPhone = (q.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
      cleanPhone = '88' + cleanPhone;
    }
    const msg =
      `Hello *${q.name || 'Sir/Madam'}*,\n\n` +
      `Thank you for requesting a project quotation from *Click2IT BD*!\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Project Type:* ${q.projectType || 'IT Solution'}\n` +
      (q.company ? `🏢 *Organization:* ${q.company}\n` : '') +
      (q.estimatedAmount ? `💰 *Estimated Quote:* ৳${Number(q.estimatedAmount).toLocaleString()}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `Our engineering team has reviewed your requirements and would love to discuss the next steps with you.`;
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleExportQuotesCSV = () => {
    if (quotes.length === 0) {
      toast.error('No quote requests to export');
      return;
    }
    const headers = ['Date', 'Client Name', 'Company', 'Phone', 'Email', 'Project Type', 'Status', 'Estimated Amount', 'Details'];
    const rows = quotes.map(q => [
      q.createdAt?.toDate ? q.createdAt.toDate().toLocaleDateString() : 'N/A',
      `"${(q.name || '').replace(/"/g, '""')}"`,
      `"${(q.company || '').replace(/"/g, '""')}"`,
      `"${q.phone || ''}"`,
      `"${q.email || ''}"`,
      `"${q.projectType || ''}"`,
      q.status || 'pending',
      q.estimatedAmount || 0,
      `"${(q.details || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Project_Quotes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Quotes exported to CSV');
  };

  // Computed Metrics
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const featuredProjects = projects.filter(p => p.isFeatured).length;
    const activeProjects = projects.filter(p => p.isActive !== false).length;
    const totalPortfolioValue = projects.reduce((sum, p) => sum + (Number(p.projectValue) || 0), 0);

    const totalQuotes = quotes.length;
    const pendingQuotes = quotes.filter(q => !q.status || q.status === 'pending').length;
    const completedQuotes = quotes.filter(q => q.status === 'completed').length;

    return {
      totalProjects,
      featuredProjects,
      activeProjects,
      totalPortfolioValue,
      totalQuotes,
      pendingQuotes,
      completedQuotes,
    };
  }, [projects, quotes]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        if (projectSearch.trim()) {
          const q = projectSearch.toLowerCase();
          const matchTitle = (p.title || '').toLowerCase().includes(q);
          const matchClient = (p.client || '').toLowerCase().includes(q);
          const matchCat = (p.category || '').toLowerCase().includes(q);
          const matchLoc = (p.location || '').toLowerCase().includes(q);
          if (!matchTitle && !matchClient && !matchCat && !matchLoc) return false;
        }
        if (projectCategoryFilter !== 'all' && p.category !== projectCategoryFilter) return false;
        if (projectStatusFilter === 'featured' && !p.isFeatured) return false;
        if (projectStatusFilter === 'active' && p.isActive === false) return false;
        if (projectStatusFilter === 'hidden' && p.isActive !== false) return false;
        return true;
      })
      .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }, [projects, projectSearch, projectCategoryFilter, projectStatusFilter]);

  // Filtered Quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      if (quoteSearch.trim()) {
        const s = quoteSearch.toLowerCase();
        const matchName = (q.name || '').toLowerCase().includes(s);
        const matchComp = (q.company || '').toLowerCase().includes(s);
        const matchPhone = (q.phone || '').toLowerCase().includes(s);
        const matchType = (q.projectType || '').toLowerCase().includes(s);
        if (!matchName && !matchComp && !matchPhone && !matchType) return false;
      }
      if (quoteStatusFilter !== 'all' && (q.status || 'pending') !== quoteStatusFilter) return false;
      return true;
    });
  }, [quotes, quoteSearch, quoteStatusFilter]);

  const allCategoriesInUse = useMemo(() => {
    const set = new Set<string>(PROJECT_CATEGORIES);
    projects.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-16">
      {/* 1. EXECUTIVE HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Sparkles size={13} className="text-indigo-400" />
            <span>Enterprise Portfolio & B2B Quotations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Projects & B2B Quote Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Showcase completed corporate installations, manage B2B client inquiries, and convert quote requests into high-value deployments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <ExternalLink size={14} /> View Live Page
          </a>

          {activeTab === 'quotes' && (
            <button
              onClick={handleExportQuotesCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download size={14} /> Export CSV
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('showcase');
              setIsAdding(true);
              setEditId(null);
              setFormData(initialFormState);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <Plus size={16} /> Add Showcase Project
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('showcase')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Showcase Projects
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{stats.totalProjects}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {stats.activeProjects} Active • {stats.featuredProjects} Featured ⭐
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase size={22} />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('quotes')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                Pending Quotes
              </span>
              {stats.pendingQuotes > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
            </div>
            <span className="text-2xl font-black text-amber-600 mt-0.5 block">{stats.pendingQuotes}</span>
            <span className="text-[11px] text-slate-500 font-medium">Awaiting engineering response</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('quotes')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
              Total B2B Inquiries
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{stats.totalQuotes}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {stats.completedQuotes} Completed Deals
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageSquare size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
              Portfolio Value
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              ৳{stats.totalPortfolioValue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Total delivered project value</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* 3. TAB SWITCHER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('showcase')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'showcase'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase size={15} />
            <span>Showcase Projects ({projects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'quotes'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={15} />
            <span>Quote Requests ({quotes.length})</span>
            {stats.pendingQuotes > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500 text-white font-black">
                {stats.pendingQuotes} New
              </span>
            )}
          </button>
        </div>

        {activeTab === 'showcase' && projects.length === 0 && !isAdding && (
          <button
            onClick={handleLoadSamples}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles size={14} /> Load 3 Sample Corporate Projects
          </button>
        )}
      </div>

      {/* ================================================================= */}
      {/* TAB A: SHOWCASE PROJECTS                                          */}
      {/* ================================================================= */}
      {activeTab === 'showcase' && (
        <div className="space-y-6">
          {/* PROJECT EDITOR DRAWER / FORM WITH LIVE PREVIEW */}
          {isAdding && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Briefcase size={18} className="text-indigo-400" />
                  <h3 className="text-base font-black">
                    {editId ? 'Edit Showcase Project' : 'Create New Showcase Project'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditId(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* LEFT 7 COLUMNS: FORM INPUTS */}
                <form onSubmit={handleSaveProject} className="lg:col-span-7 p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 32-Channel IP CCTV & Access Control Setup"
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Category *
                      </label>
                      <input
                        type="text"
                        list="project-category-presets"
                        placeholder="Select or type category..."
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      />
                      <datalist id="project-category-presets">
                        {PROJECT_CATEGORIES.map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Client / Organization Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Simpletree Attalika Ltd."
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.client}
                        onChange={e => setFormData({ ...formData, client: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Project Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gulshan-2, Dhaka"
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Completion Month / Date
                      </label>
                      <input
                        type="month"
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.completedDate}
                        onChange={e => setFormData({ ...formData, completedDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Project Value / Budget (৳)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 350000"
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.projectValue}
                        onChange={e => setFormData({ ...formData, projectValue: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Deployment Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 7 Days"
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.duration}
                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Cover Image Upload + URL */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                      Cover Image (Upload or Paste URL) *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                      />
                      <label className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                        {isUploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        <span>{isUploadingCover ? 'Uploading...' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleImageUpload(e, 'cover')}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Additional Gallery Photos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                        Additional Gallery Photos ({formData.gallery.length})
                      </label>
                      <label className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                        {isUploadingGallery ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        <span>Add Gallery Photos</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={e => handleImageUpload(e, 'gallery')}
                        />
                      </label>
                    </div>
                    {formData.gallery.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {formData.gallery.map((gUrl, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={gUrl} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setFormData(prev => ({
                                  ...prev,
                                  gallery: prev.gallery.filter((_, i) => i !== idx),
                                }))
                              }
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category Icon Selector */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                      Category Badge Icon
                    </label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {AVAILABLE_ICONS.map(item => (
                        <button
                          key={item.name}
                          type="button"
                          title={item.label}
                          onClick={() => setFormData({ ...formData, iconName: item.name })}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            formData.iconName === item.name
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {renderIcon(item.name, { size: 18 })}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Key Features Builder */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                      Key Highlights / Features ({formData.featuresList.length})
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a highlight (or comma-separated list) and press Add..."
                        className="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                        value={featureInput}
                        onChange={e => setFeatureInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddFeature()}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_FEATURE_SUGGESTIONS.map(sug => {
                        const added = formData.featuresList.includes(sug);
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => (added ? handleRemoveFeature(sug) : handleAddFeature(sug))}
                            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-colors cursor-pointer ${
                              added
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {added ? '✓ ' : '+ '}
                            {sug}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Features List */}
                    {formData.featuresList.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.featuresList.map(feat => (
                          <span
                            key={feat}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold"
                          >
                            {feat}
                            <X
                              size={13}
                              className="cursor-pointer hover:text-rose-600"
                              onClick={() => handleRemoveFeature(feat)}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description & Testimonial */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Project Description & Scope *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Describe the hardware deployed, engineering challenges solved, and business impact..."
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                        Client Testimonial / Feedback (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 'Delivered our entire 3-story office setup ahead of schedule!'"
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.testimonial}
                        onChange={e => setFormData({ ...formData, testimonial: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Status Toggles */}
                  <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Star size={14} className="text-amber-500 fill-amber-500" /> Mark as Featured Project
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800">Published on Storefront</span>
                    </label>
                  </div>

                  {/* Form Submit Footer */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setEditId(null);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <Save size={16} />
                      <span>{editId ? 'Update Project' : 'Publish Project'}</span>
                    </button>
                  </div>
                </form>

                {/* RIGHT 5 COLUMNS: LIVE STOREFRONT PREVIEW */}
                <div className="lg:col-span-5 bg-slate-50/70 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Live Storefront Card Preview
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Real-Time
                      </span>
                    </div>

                    <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-200 flex flex-col">
                      <div className="relative h-52 bg-slate-200 overflow-hidden">
                        {formData.image ? (
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                            <ImageIcon size={32} />
                            <span className="text-xs font-bold">Cover Image Preview</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-xs">
                          {renderIcon(formData.iconName, { size: 13, className: 'text-blue-600' })}
                          <span>{formData.category || 'Category'}</span>
                        </div>
                        {formData.isFeatured && (
                          <div className="absolute top-3.5 right-3.5 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-xs">
                            <Star size={11} className="fill-slate-950" /> FEATURED
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                          <span>Client: {formData.client || 'Client Name'}</span>
                          {formData.location && (
                            <span className="text-slate-400 font-semibold flex items-center gap-1">
                              <MapPin size={11} /> {formData.location}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2 leading-snug">
                          {formData.title || 'Your Project Title Will Appear Here'}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                          {formData.description ||
                            'Describe the project scope, deployed hardware, and client outcome...'}
                        </p>

                        {formData.featuresList.length > 0 && (
                          <div className="border-t border-slate-100 pt-3.5 mt-auto">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                              Key Highlights
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {formData.featuresList.slice(0, 6).map((f, i) => (
                                <div key={i} className="text-[11px] text-slate-700 font-medium flex items-center gap-1.5 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                  <span className="truncate">{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center mt-4">
                    Published projects appear immediately on the public <strong>/projects</strong> page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH & FILTER BAR FOR SHOWCASE PROJECTS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by title, client, category, or location..."
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
              {projectSearch && (
                <button
                  onClick={() => setProjectSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={projectCategoryFilter}
                onChange={e => setProjectCategoryFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {allCategoriesInUse.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={projectStatusFilter}
                onChange={e => setProjectStatusFilter(e.target.value as any)}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="featured">⭐ Featured Only</option>
                <option value="active">🟢 Published</option>
                <option value="hidden">⚪ Hidden</option>
              </select>
            </div>
          </div>

          {/* SHOWCASE PROJECTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map(p => {
              const isPublished = p.isActive !== false;
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col group ${
                    p.isFeatured ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-slate-200'
                  } ${!isPublished ? 'opacity-65' : ''}`}
                >
                  <div className="h-48 overflow-hidden relative bg-slate-100">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Top Left Category Pill */}
                    <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-xs">
                      {renderIcon(p.iconName, { size: 13, className: 'text-blue-600' })}
                      <span>{p.category}</span>
                    </div>

                    {/* Top Right Quick Action Buttons */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleProjectFlag(p, 'isFeatured')}
                        title={p.isFeatured ? 'Remove Featured' : 'Mark as Featured'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-xs ${
                          p.isFeatured
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-white/90 text-slate-500 hover:text-amber-500'
                        }`}
                      >
                        <Star size={14} className={p.isFeatured ? 'fill-slate-950' : ''} />
                      </button>

                      <button
                        onClick={() => handleToggleProjectFlag(p, 'isActive')}
                        title={isPublished ? 'Published (Click to hide)' : 'Hidden (Click to publish)'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-xs ${
                          isPublished
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/90 text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      <button
                        onClick={() => handleEditProject(p)}
                        title="Edit Project"
                        className="w-8 h-8 bg-white/90 hover:bg-white text-blue-600 rounded-full flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => handleDuplicateProject(p)}
                        title="Duplicate Project"
                        className="w-8 h-8 bg-white/90 hover:bg-white text-slate-700 rounded-full flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Copy size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteProject(p.id, p.title)}
                        title="Delete Project"
                        className="w-8 h-8 bg-white/90 hover:bg-white text-rose-600 rounded-full flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Bottom Meta inside Image */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-[11px] font-semibold">
                      <span className="truncate">{p.client}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.location && (
                          <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
                            <MapPin size={10} /> {p.location}
                          </span>
                        )}
                        {p.projectValue > 0 && (
                          <span className="bg-blue-600/90 px-2 py-0.5 rounded-full font-bold">
                            ৳{Number(p.projectValue).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h4 className="font-black text-base text-slate-900 mb-1.5 line-clamp-2 leading-snug">
                      {p.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">{p.description}</p>

                    {Array.isArray(p.features) && p.features.length > 0 && (
                      <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {p.features.slice(0, 4).map((f: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                          >
                            {f}
                          </span>
                        ))}
                        {p.features.length > 4 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">
                            +{p.features.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="col-span-full text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Briefcase size={26} />
                </div>
                <h4 className="text-base font-black text-slate-900">No Showcase Projects Found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  Add your completed corporate CCTV, networking, and workstation installations to build trust with B2B clients.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setIsAdding(true);
                      setEditId(null);
                      setFormData(initialFormState);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={15} /> Add First Project
                  </button>
                  {projects.length === 0 && (
                    <button
                      onClick={handleLoadSamples}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={15} /> Load 3 Sample Projects
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB B: QUOTE REQUESTS CRM                                         */}
      {/* ================================================================= */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          {/* QUOTE SEARCH & STATUS FILTER */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search quotes by client, company, phone, or project type..."
                value={quoteSearch}
                onChange={e => setQuoteSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'pending', 'contacted', 'quoted', 'completed', 'cancelled'].map(st => (
                <button
                  key={st}
                  onClick={() => setQuoteStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                    quoteStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider font-black border-b border-slate-200">
                    <th className="p-4">Date</th>
                    <th className="p-4">Client & Organization</th>
                    <th className="p-4">Project Type</th>
                    <th className="p-4">Requirements</th>
                    <th className="p-4">Estimate / Notes</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {filteredQuotes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                        No matching quote requests found.
                      </td>
                    </tr>
                  )}
                  {filteredQuotes.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 text-xs text-slate-500 font-semibold whitespace-nowrap">
                        {q.createdAt?.toDate ? q.createdAt.toDate().toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="p-4">
                        <p className="font-black text-slate-900 text-sm">{q.name}</p>
                        {q.company && (
                          <p className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                            <Building2 size={11} /> {q.company}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {q.phone && (
                            <a href={`tel:${q.phone}`} className="text-blue-600 hover:underline font-semibold">
                              {q.phone}
                            </a>
                          )}
                          {q.email && <span>{q.email}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                          {q.projectType || 'General Setup'}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{q.details}</p>
                      </td>
                      <td className="p-4">
                        {q.estimatedAmount > 0 ? (
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 block w-fit">
                            ৳{Number(q.estimatedAmount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No estimate set</span>
                        )}
                        {q.adminNotes && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">📝 {q.adminNotes}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={q.status || 'pending'}
                          onChange={e => handleUpdateQuoteStatus(q.id, e.target.value)}
                          className={`text-xs font-black px-3 py-1.5 rounded-full border outline-none cursor-pointer ${
                            q.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.status === 'quoted'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : q.status === 'contacted'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : q.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="quoted">Quoted</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleWhatsAppQuoteReply(q)}
                            title="Reply on WhatsApp"
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedQuote(q);
                              setQuoteAdminNotes(q.adminNotes || '');
                              setQuoteEstimatedAmount(q.estimatedAmount ? String(q.estimatedAmount) : '');
                            }}
                            title="View Details & Add Estimate"
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(q.id, q.name)}
                            title="Delete Quote"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUOTE DETAIL & ESTIMATE MODAL */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-black">Quote Request Details</h3>
                <p className="text-[11px] text-slate-300">{selectedQuote.projectType || 'Enterprise Inquiry'}</p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Client Name:</span>
                  <span className="font-black text-slate-900">{selectedQuote.name}</span>
                </div>
                {selectedQuote.company && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Company:</span>
                    <span className="font-bold text-slate-800">{selectedQuote.company}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Phone:</span>
                  <a href={`tel:${selectedQuote.phone}`} className="font-bold text-blue-600 hover:underline">
                    {selectedQuote.phone}
                  </a>
                </div>
                {selectedQuote.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Email:</span>
                    <a href={`mailto:${selectedQuote.email}`} className="font-bold text-blue-600 hover:underline">
                      {selectedQuote.email}
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Client Requirements
                </label>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedQuote.details || 'No additional details provided.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Estimated Quote (৳)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250000"
                    value={quoteEstimatedAmount}
                    onChange={e => setQuoteEstimatedAmount(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Status
                  </label>
                  <select
                    value={selectedQuote.status || 'pending'}
                    onChange={e => handleUpdateQuoteStatus(selectedQuote.id, e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Internal Engineering / Follow-up Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record site survey date, hardware list, or client feedback..."
                  value={quoteAdminNotes}
                  onChange={e => setQuoteAdminNotes(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleWhatsAppQuoteReply(selectedQuote)}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle size={14} /> Send Quote via WhatsApp
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuote(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={savingQuoteNote}
                    onClick={handleSaveQuoteDetails}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    {savingQuoteNote ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
