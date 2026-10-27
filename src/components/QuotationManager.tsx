import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { Order, Product, Customer, CartItem } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Plus, X, Trash2, FileText, Search, Edit3, Eye, Printer, Download, 
  CheckCircle, ArrowLeft, Mail, FileSignature, Share2, ShoppingCart, 
  Copy, Clock, AlertCircle, CheckCircle2, TrendingUp, RefreshCw, 
  ChevronDown, Building2, User, Phone, ExternalLink, ArrowRightCircle, 
  Sparkles, Check, CheckSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logAudit } from '../lib/audit';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { generateDocumentNumber } from '../lib/numbering';
import { generatePDF } from '../lib/pdf';
import { sendEmail } from '../services/emailService';
import { Pagination } from './common/Pagination';
import { PreparedBySelect } from './common/PreparedBySelect';

export const QuotationManager: React.FC<{ users?: any[] }> = ({ users = [] }) => {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'last_30_days'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_value' | 'lowest_value' | 'expiring_soon'>('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState<string | null>(null);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  // Direct convert to sale order modal
  const [convertingQuote, setConvertingQuote] = useState<Order | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertPaymentStatus, setConvertPaymentStatus] = useState<'pending' | 'paid' | 'partial'>('pending');

  const initialFormState = {
    documentNumber: '',
    workOrderNumber: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    items: [] as CartItem[],
    discountAmount: 0,
    termsAndConditions: '',
    status: 'pending' as Order['status'],
    createdAt: '',
    validUntil: '',
    preparedBy: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [productSearch, setProductSearch] = useState('');

  // Custom item modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({
    name: '',
    description: '',
    quantity: 1,
    unit: 'pcs',
    price: 0,
    discount: 0,
    brand: '',
    warrantyValue: '1',
    warrantyUnit: 'Years'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const qSnap = await getDocs(query(collection(db, 'orders'), where('type', '==', 'quotation'), orderBy('createdAt', 'desc'), limit(300)));
      const pSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500)));
      const cSnap = await getDocs(query(collection(db, 'customers'), orderBy('createdAt', 'desc'), limit(300)));

      setQuotations(qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
      setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Customer[]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = quotations.length;
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    let activeCount = 0;
    let activeTotal = 0;
    let convertedCount = 0;
    let convertedTotal = 0;
    let expiringSoonCount = 0;

    quotations.forEach(q => {
      const isWon = q.status === 'accepted' || (q.status as any) === 'converted' || q.status === 'completed';
      const isCancelled = q.status === 'cancelled' || (q.status as any) === 'rejected';
      const isExpired = q.validUntil && new Date(q.validUntil).getTime() < now && !isWon;
      const qVal = Number(q.total || 0);

      if (isWon) {
        convertedCount++;
        convertedTotal += qVal;
      } else if (!isCancelled && !isExpired) {
        activeCount++;
        activeTotal += qVal;

        if (q.validUntil) {
          const expTime = new Date(q.validUntil).getTime();
          if (expTime > now && expTime <= now + threeDaysMs) {
            expiringSoonCount++;
          }
        }
      }
    });

    const winRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

    return {
      total,
      activeCount,
      activeTotal,
      convertedCount,
      convertedTotal,
      winRate,
      expiringSoonCount
    };
  }, [quotations]);

  // Filtering and Sorting
  const filteredQuotations = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    return quotations
      .filter(q => {
        // Status filter
        if (statusFilter !== 'all') {
          const isExpired = q.validUntil && new Date(q.validUntil).getTime() < Date.now() && (q.status as any) !== 'converted' && q.status !== 'accepted';
          if (statusFilter === 'expired') {
            if (!isExpired) return false;
          } else if (statusFilter === 'converted') {
            if ((q.status as any) !== 'converted' && q.status !== 'completed') return false;
          } else if (statusFilter === 'accepted') {
            if (q.status !== 'accepted') return false;
          } else if (statusFilter === 'rejected') {
            if ((q.status as any) !== 'rejected' && q.status !== 'cancelled') return false;
          } else if (statusFilter === 'pending') {
            if (q.status !== 'pending' && q.status) return false;
            if (isExpired) return false;
          } else if ((q.status as any) !== statusFilter) {
            return false;
          }
        }

        // Date filter
        if (dateFilter === 'today') {
          if (!q.createdAt || q.createdAt.split('T')[0] !== todayStr) return false;
        } else if (dateFilter === 'this_week') {
          if (!q.createdAt || q.createdAt < sevenDaysAgo) return false;
        } else if (dateFilter === 'this_month') {
          if (!q.createdAt || q.createdAt < thisMonthStart) return false;
        } else if (dateFilter === 'last_30_days') {
          if (!q.createdAt || q.createdAt < thirtyDaysAgo) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const s = searchQuery.toLowerCase().trim();
          const matchDoc = (q.documentNumber || q.id || '').toLowerCase().includes(s);
          const matchCust = (q.customerName || '').toLowerCase().includes(s);
          const matchPhone = (q.customerPhone || '').toLowerCase().includes(s);
          const matchEmail = (q.customerEmail || '').toLowerCase().includes(s);
          const matchWO = (q.workOrderNumber || '').toLowerCase().includes(s);
          const matchItem = q.items?.some(it => (it.name || '').toLowerCase().includes(s) || (it.brand || '').toLowerCase().includes(s));
          if (!matchDoc && !matchCust && !matchPhone && !matchEmail && !matchWO && !matchItem) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === 'highest_value') {
          return (Number(b.total) || 0) - (Number(a.total) || 0);
        }
        if (sortBy === 'lowest_value') {
          return (Number(a.total) || 0) - (Number(b.total) || 0);
        }
        if (sortBy === 'expiring_soon') {
          const aTime = a.validUntil ? new Date(a.validUntil).getTime() : Infinity;
          const bTime = b.validUntil ? new Date(b.validUntil).getTime() : Infinity;
          return aTime - bTime;
        }
        return 0;
      });
  }, [quotations, statusFilter, dateFilter, searchQuery, sortBy]);

  // Paginated quotations
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(start, start + itemsPerPage);
  }, [filteredQuotations, currentPage, itemsPerPage]);

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    if (!formData.customerName) {
      toast.error('Please enter customer name');
      return;
    }

    try {
      const subtotal = formData.items.reduce((sum, item) => sum + ((item.price * item.quantity) - (item.discount || 0)), 0);
      const finalTotal = Math.max(0, subtotal - formData.discountAmount);

      if (viewMode === 'edit' && editingId) {
        const updateData = {
          customerName: formData.customerName,
          workOrderNumber: formData.workOrderNumber,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          shippingAddress: formData.shippingAddress,
          items: formData.items,
          total: finalTotal,
          discountAmount: formData.discountAmount,
          termsAndConditions: formData.termsAndConditions,
          status: formData.status,
          validUntil: formData.validUntil,
          preparedBy: (formData as any).preparedBy || ''
        };
        await updateDoc(doc(db, 'orders', editingId), updateData);
        await logAudit('EDIT', 'Quotation', `Edited quotation #${formData.documentNumber || editingId}`, profile?.displayName || profile?.email || 'Admin');
        setQuotations(quotations.map(q => q.id === editingId ? { ...q, ...updateData } : q));
        toast.success('Quotation updated successfully!');
      } else {
        const docNumber = await generateDocumentNumber('QUO');
        const newQuotation: Omit<Order, 'id'> = {
          userId: profile?.uid || 'admin',
          type: 'quotation',
          status: 'pending',
          documentNumber: docNumber,
          workOrderNumber: formData.workOrderNumber,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          shippingAddress: formData.shippingAddress,
          items: formData.items,
          total: finalTotal,
          discountAmount: formData.discountAmount,
          termsAndConditions: formData.termsAndConditions,
          createdAt: new Date().toISOString(),
          validUntil: formData.validUntil,
          preparedBy: (formData as any).preparedBy || ''
        } as any;
        const docRef = await addDoc(collection(db, 'orders'), newQuotation);
        setQuotations([{ id: docRef.id, ...newQuotation } as Order, ...quotations]);
        toast.success(`Quotation #${docNumber} created!`);
        await logAudit('CREATE', 'Quotation', `Created quotation #${docNumber}`, profile?.displayName || profile?.email || 'Admin');
      }

      setViewMode('list');
      setFormData(initialFormState);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save quotation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quotation permanently?')) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      const deletedQuote = quotations.find(q => q.id === id);
      await logAudit('DELETE', 'Quotation', `Deleted quotation #${deletedQuote?.documentNumber || id}`, profile?.displayName || profile?.email || 'Admin');
      setQuotations(quotations.filter(q => q.id !== id));
      if (editingId === id && viewMode !== 'list') {
        setViewMode('list');
      }
      toast.success('Quotation deleted permanently');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete quotation');
    }
  };

  // Quick Status changer
  const handleQuickStatusChange = async (quotationId: string, newStatus: string) => {
    try {
      setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: newStatus as any } : q));
      await updateDoc(doc(db, 'orders', quotationId), { status: newStatus });
      setActiveStatusDropdownId(null);
      toast.success(`Marked as ${newStatus.toUpperCase()}`);
      await logAudit('STATUS_CHANGE', 'Quotation', `Updated status of #${quotationId} to ${newStatus}`, profile?.displayName || 'Admin');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  // Duplicate quotation
  const handleDuplicate = (q: Order) => {
    setFormData({
      documentNumber: '',
      workOrderNumber: q.workOrderNumber || '',
      customerName: q.customerName || '',
      customerPhone: q.customerPhone || '',
      customerEmail: q.customerEmail || '',
      shippingAddress: q.shippingAddress || '',
      items: (q.items || []).map(it => ({ ...it })),
      discountAmount: q.discountAmount || 0,
      termsAndConditions: q.termsAndConditions || '',
      status: 'pending',
      createdAt: '',
      validUntil: q.validUntil || '',
      preparedBy: (q as any).preparedBy || ''
    });
    setEditingId(null);
    setViewMode('create');
    toast.success(`Items duplicated from #${q.documentNumber || q.id.slice(0, 8)}. Ready to review & save.`);
  };

  // 1-Click WhatsApp Share
  const handleShareWhatsApp = (q: Order) => {
    const cleanPhone = (q.customerPhone || '').replace(/[^0-9]/g, '');
    const validUntilStr = q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : '7 Days';
    const itemsText = (q.items || [])
      .slice(0, 5)
      .map((it, idx) => `• ${it.name} (${it.quantity} ${(it as any).unit || 'pcs'} x BDT ${Number(it.price).toLocaleString()})`)
      .join('\n');
    const moreCount = (q.items?.length || 0) > 5 ? `\n...and ${(q.items?.length || 0) - 5} more items` : '';

    const message = `*COMMERCIAL QUOTATION*\n` +
      `Click2IT BD\n` +
      `--------------------------------\n` +
      `*Quote No:* ${q.documentNumber || q.id}\n` +
      `*Customer:* ${q.customerName || 'Valued Customer'}\n` +
      (q.workOrderNumber ? `*Ref / WO:* ${q.workOrderNumber}\n` : '') +
      `*Date:* ${new Date(q.createdAt || Date.now()).toLocaleDateString('en-GB')}\n` +
      `*Validity:* ${validUntilStr}\n` +
      `--------------------------------\n` +
      `*Quoted Items:*\n${itemsText}${moreCount}\n` +
      `--------------------------------\n` +
      (q.discountAmount ? `*Discount:* BDT ${Number(q.discountAmount).toLocaleString()}\n` : '') +
      `*Grand Total: BDT ${Number(q.total || 0).toLocaleString()}*\n\n` +
      `Thank you for trusting Click2IT BD!\n` +
      `Direct Contact: +880 1882-888805 | info@click2itbd.com`;

    const encoded = encodeURIComponent(message);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone.startsWith('88') ? cleanPhone : '88' + cleanPhone}?text=${encoded}` 
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  // Push to POS Cart
  const handlePushToPOS = (q: Order) => {
    const matchedCust = customers.find(c => 
      c.name?.toLowerCase().trim() === q.customerName?.toLowerCase().trim() || 
      (q.customerPhone && c.phone && c.phone.replace(/[^0-9]/g, '') === q.customerPhone.replace(/[^0-9]/g, ''))
    );

    const quoteData = {
      documentNumber: q.documentNumber || q.id,
      customerName: q.customerName,
      customer: matchedCust || {
        id: q.customerId || `cust-${Date.now()}`,
        name: q.customerName,
        phone: q.customerPhone,
        email: q.customerEmail,
        address: q.shippingAddress,
      },
      items: q.items || [],
      discountAmount: q.discountAmount || 0,
      total: q.total || 0,
    };
    localStorage.setItem('pos_pending_quotation', JSON.stringify(quoteData));
    toast.success(`Quotation #${q.documentNumber || q.id.slice(0, 8)} pushed to POS Cart! Redirecting...`);
    navigate('/pos');
  };

  // Direct convert to sale order execution
  const handleConfirmConvert = async () => {
    if (!convertingQuote) return;
    setIsConverting(true);
    try {
      const invNumber = await generateDocumentNumber('INV');
      const orderData: any = {
        userId: profile?.uid || 'admin',
        type: 'sale',
        status: 'delivered',
        paymentStatus: convertPaymentStatus,
        documentNumber: invNumber,
        workOrderNumber: convertingQuote.workOrderNumber || '',
        customerName: convertingQuote.customerName,
        customerPhone: convertingQuote.customerPhone,
        customerEmail: convertingQuote.customerEmail,
        shippingAddress: convertingQuote.shippingAddress,
        items: convertingQuote.items || [],
        total: convertingQuote.total || 0,
        paidAmount: convertPaymentStatus === 'paid' ? convertingQuote.total : 0,
        amountPaid: convertPaymentStatus === 'paid' ? convertingQuote.total : 0,
        discountAmount: convertingQuote.discountAmount || 0,
        termsAndConditions: convertingQuote.termsAndConditions || '',
        notes: `Converted from Quotation #${convertingQuote.documentNumber || convertingQuote.id}`,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      await updateDoc(doc(db, 'orders', convertingQuote.id), { status: 'converted' });

      setQuotations(prev => prev.map(q => q.id === convertingQuote.id ? { ...q, status: 'converted' } : q));
      toast.success(`Successfully converted to Sales Invoice #${invNumber}!`);
      await logAudit('CONVERT', 'Quotation', `Converted Quote #${convertingQuote.documentNumber} to Invoice #${invNumber}`, profile?.displayName || 'Admin');
      setConvertingQuote(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert quotation to order');
    } finally {
      setIsConverting(false);
    }
  };

  const addItem = (product: Product) => {
    if (formData.items.find(i => i.id === product.id)) {
      toast.error('Item already added');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, { ...product, quantity: 1, discount: 0 }]
    });
    setProductSearch('');
  };

  const addCustomItem = () => {
    if (!customItemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    const newItem: any = {
      id: `custom-${Date.now()}`,
      productId: `custom-${Date.now()}`,
      name: customItemForm.name.trim(),
      description: customItemForm.description.trim(),
      brand: customItemForm.brand.trim() || '',
      warranty: customItemForm.warrantyUnit === 'Life Time' 
        ? 'Life Time' 
        : (customItemForm.warrantyValue ? `${customItemForm.warrantyValue} ${customItemForm.warrantyUnit}` : ''),
      price: Number(customItemForm.price) || 0,
      quantity: Number(customItemForm.quantity) || 1,
      unit: customItemForm.unit || 'pcs',
      discount: Number(customItemForm.discount) || 0,
      isCustomService: true,
      category: 'Custom'
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
    setShowCustomModal(false);
    setCustomItemForm({
      name: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      price: 0,
      discount: 0,
      brand: '',
      warrantyValue: '1',
      warrantyUnit: 'Years'
    });
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === 'quantity' && value < 1) value = 1;
    if (field === 'discount' && value < 0) value = 0;
    if (field === 'price' && value < 0) value = 0;

    (newItems[idx] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (idx: number) => {
    const newItems = [...formData.items];
    newItems.splice(idx, 1);
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + ((item.price * item.quantity) - (item.discount || 0)), 0);
  };

  const handleDownloadPDF = async (q: Order, action: 'download' | 'print' = 'download') => {
    await generatePDF(q, 'quotation', settings, action === 'print' ? 'doc' : 'download');
  };

  const openEdit = (q: Order) => {
    setFormData({
      documentNumber: q.documentNumber || '',
      workOrderNumber: q.workOrderNumber || '',
      customerName: q.customerName || '',
      customerPhone: q.customerPhone || '',
      customerEmail: q.customerEmail || '',
      shippingAddress: q.shippingAddress || '',
      items: q.items || [],
      discountAmount: q.discountAmount || 0,
      termsAndConditions: q.termsAndConditions || '',
      status: q.status || 'pending',
      createdAt: q.createdAt || '',
      validUntil: q.validUntil || '',
      preparedBy: (q as any).preparedBy || ''
    });
    setEditingId(q.id);
    setViewMode('edit');
  };

  const openView = (q: Order) => {
    setFormData({
      documentNumber: q.documentNumber || '',
      workOrderNumber: q.workOrderNumber || '',
      customerName: q.customerName || '',
      customerPhone: q.customerPhone || '',
      customerEmail: q.customerEmail || '',
      shippingAddress: q.shippingAddress || '',
      items: q.items || [],
      discountAmount: q.discountAmount || 0,
      termsAndConditions: q.termsAndConditions || '',
      status: q.status || 'pending',
      createdAt: q.createdAt || '',
      validUntil: q.validUntil || '',
      preparedBy: (q as any).preparedBy || ''
    });
    setEditingId(q.id);
    setViewMode('view');
  };

  const handleCopyQuoteNo = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuoteId(id);
    toast.success(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedQuoteId(null), 2000);
  };

  const handleSendEmail = async (q: Order) => {
    if (!q.customerEmail) {
      toast.error('Customer email is missing for this quotation.');
      return;
    }

    const toastId = toast.loading('Sending formal quotation email...');

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #081621; padding: 24px; color: white;">
          <h2 style="margin: 0; color: #818cf8; font-size: 20px;">COMMERCIAL QUOTATION</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #cbd5e1;">Click2IT BD • Computer, Security & IT Solutions</p>
        </div>
        
        <div style="padding: 24px;">
          <p style="font-size: 14px; margin-top: 0;">Dear <strong>${q.customerName}</strong>,</p>
          <p style="font-size: 13px; color: #475569;">Thank you for reaching out to us. We are pleased to provide you with the formal quotation details below:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 10px; border: 1px solid #e2e8f0;">Item</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">Qty</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Unit Price</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(q.items || []).map(item => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; color: #0f172a;">${item.name}</div>
                    ${item.description ? `<div style="font-size: 11px; color: #64748b;">${item.description}</div>` : ''}
                    ${(item as any).brand ? `<div style="font-size: 11px; color: #6366f1;">Brand: ${(item as any).brand}</div>` : ''}
                  </td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity} ${(item as any).unit || 'pcs'}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">BDT ${Number(item.price).toLocaleString()}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">BDT ${Number((item.price * item.quantity) - (item.discount || 0)).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; margin-bottom: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
            ${q.discountAmount ? `<p style="font-size: 13px; margin: 4px 0; color: #ef4444;"><strong>Discount:</strong> BDT ${Number(q.discountAmount).toLocaleString()}</p>` : ''}
            <h3 style="color: #4f46e5; margin: 6px 0; font-size: 18px;">Grand Total: BDT ${Number(q.total || 0).toLocaleString()}</h3>
          </div>
          
          ${q.validUntil ? `<p style="font-size: 12px; color: #64748b; background-color: #f1f5f9; padding: 10px; border-radius: 6px;"><em>⏳ This quotation is valid until: ${new Date(q.validUntil).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</em></p>` : ''}
          
          ${q.termsAndConditions ? `
            <div style="margin-top: 20px; padding: 12px; background: #fafafa; border-radius: 8px; border-left: 3px solid #6366f1;">
              <strong style="font-size: 12px; color: #334155;">Terms & Conditions:</strong>
              <div style="font-size: 12px; color: #64748b; white-space: pre-wrap; margin-top: 4px;">${q.termsAndConditions}</div>
            </div>
          ` : ''}
          
          <p style="margin-top: 24px; font-size: 13px; color: #475569;">If you would like to proceed with this order, please reply to this email or call us at <strong>+880 1882-888805</strong>.</p>
          <p style="margin-top: 16px; font-size: 13px; color: #64748b;">Warm regards,<br><strong>Click2IT BD Team</strong></p>
        </div>
      </div>
    `;

    const successRes = await sendEmail({
      to: q.customerEmail,
      subject: `Quotation #${q.documentNumber || q.id.slice(0, 8)} from Click2IT BD`,
      html: htmlContent,
      category: 'Quotation',
      orderId: q.id
    });

    if (successRes.success) {
      toast.success('Email sent successfully!', { id: toastId });
    } else {
      toast.error(successRes.error || 'Failed to send email. Please check SMTP settings.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <FileSignature size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {viewMode === 'list' ? 'Quotations Management' : 
               viewMode === 'create' ? 'Create New Quotation' : 
               viewMode === 'edit' ? `Edit Quotation #${formData.documentNumber || editingId}` : 
               `Quotation Details #${formData.documentNumber || editingId}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {viewMode === 'list' 
                ? 'Create, manage, print, and convert commercial quotations into sales orders'
                : 'Prepare a professional commercial quote with full item, warranty, and pricing details'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
          {viewMode === 'list' ? (
            <>
              <button 
                type="button"
                onClick={fetchData}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Refresh Quotations"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
              </button>

              <button 
                type="button"
                onClick={() => { setFormData(initialFormState); setViewMode('create'); }}
                className="bg-[#081621] hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-md shadow-slate-950/20 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>New Quotation</span>
              </button>
            </>
          ) : (
            <button 
              type="button"
              onClick={() => setViewMode('list')}
              className="text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to List</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Quotations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Active Quotations</span>
                <div className="text-2xl font-black text-indigo-600">{metrics.activeCount}</div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {metrics.total} total quotes generated
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileText size={22} />
              </div>
            </div>

            {/* Card 2: Active Pipeline Value */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Active Pipeline Value</span>
                <div className="text-2xl font-black text-emerald-600">{formatCurrency(metrics.activeTotal, settings)}</div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Open proposal potential
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={22} />
              </div>
            </div>

            {/* Card 3: Won / Converted */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Won / Converted</span>
                <div className="text-2xl font-black text-purple-600">{metrics.convertedCount}</div>
                <div className="text-[11px] text-purple-700 font-medium">
                  {metrics.winRate}% conversion rate
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
            </div>

            {/* Card 4: Expiring Soon */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Expiring Soon (≤3 Days)</span>
                <div className={`text-2xl font-black ${metrics.expiringSoonCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {metrics.expiringSoonCount}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {metrics.expiringSoonCount > 0 ? 'Follow-up required' : 'No urgent expiries'}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                metrics.expiringSoonCount > 0 
                  ? 'bg-amber-50 border-amber-200 text-amber-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Clock size={22} />
              </div>
            </div>
          </div>

          {/* Table Container with Filters */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-3 px-4 border-b border-slate-100 bg-slate-50/50 overflow-x-auto text-xs font-bold scrollbar-none">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-500" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All', count: quotations.length },
                { id: 'pending', label: 'Pending', count: quotations.filter(q => (q.status === 'pending' || !q.status) && !(q.validUntil && new Date(q.validUntil).getTime() < Date.now())).length },
                { id: 'accepted', label: 'Accepted', count: quotations.filter(q => q.status === 'accepted').length },
                { id: 'converted', label: 'Converted', count: quotations.filter(q => (q.status as any) === 'converted' || q.status === 'completed').length },
                { id: 'expired', label: 'Expired', count: quotations.filter(q => q.validUntil && new Date(q.validUntil).getTime() < Date.now() && (q.status as any) !== 'converted' && q.status !== 'accepted').length },
                { id: 'rejected', label: 'Rejected', count: quotations.filter(q => (q.status as any) === 'rejected' || q.status === 'cancelled').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 text-xs ${
                    statusFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:bg-slate-200/60 font-semibold'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Secondary Controls */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search quote #, customer, phone, WO, item..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-9 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={e => { setDateFilter(e.target.value as any); setCurrentPage(1); }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="this_week">Last 7 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest_value">Total: High to Low</option>
                  <option value="lowest_value">Total: Low to High</option>
                  <option value="expiring_soon">Expiring Soonest</option>
                </select>

                <div className="text-xs text-slate-500 font-bold ml-2">
                  Showing {filteredQuotations.length} of {quotations.length}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Quote No.</th>
                    <th className="py-3.5 px-4">Customer Details</th>
                    <th className="py-3.5 px-4">Items Breakdown</th>
                    <th className="py-3.5 px-4">Date & Validity</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto text-indigo-500 mb-2" />
                        <span className="font-bold">Loading quotations...</span>
                      </td>
                    </tr>
                  ) : filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <div className="max-w-xs mx-auto text-center space-y-2">
                          <FileText size={36} className="mx-auto text-slate-300" />
                          <p className="font-bold text-slate-700 text-sm">No quotations found</p>
                          <p className="text-slate-400 text-xs">
                            {searchQuery || statusFilter !== 'all' 
                              ? 'Try adjusting your search query or status filter.' 
                              : 'Click "+ New Quotation" to generate your first quotation.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedQuotations.map(q => {
                      const isExpired = q.validUntil && new Date(q.validUntil).getTime() < Date.now() && q.status !== 'converted' && q.status !== 'accepted';
                      const isExpiringSoon = q.validUntil && new Date(q.validUntil).getTime() > Date.now() && new Date(q.validUntil).getTime() <= Date.now() + (3 * 24 * 60 * 60 * 1000);
                      const isCopied = copiedQuoteId === q.id;

                      return (
                        <tr key={q.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Quote Number */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span 
                                onClick={() => openView(q)}
                                className="font-mono font-black text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline text-xs"
                                title="Click to view details"
                              >
                                {q.documentNumber || q.id.slice(0, 8)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyQuoteNo(q.documentNumber || q.id, q.id)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy Quote Number"
                              >
                                {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            </div>
                            {(q as any).preparedBy && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                By: {(q as any).preparedBy}
                              </div>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{q.customerName}</span>
                              {q.workOrderNumber && (
                                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200" title={`Work Order / Reference: ${q.workOrderNumber}`}>
                                  WO: {q.workOrderNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                              {q.customerPhone ? (
                                <div className="flex items-center gap-1">
                                  <Phone size={11} className="text-slate-400" />
                                  <span>{q.customerPhone}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleShareWhatsApp(q)}
                                    className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                    title="Open WhatsApp Chat"
                                  >
                                    <Share2 size={11} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No phone</span>
                              )}
                            </div>
                          </td>

                          {/* Items Breakdown */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                {q.items?.length || 0} items
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5" title={(q.items || []).map(i => i.name).join(', ')}>
                              {(q.items || []).map(i => i.name).join(', ') || 'No line items'}
                            </div>
                          </td>

                          {/* Date & Validity */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-slate-800 font-medium">
                              {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </div>
                            <div className="mt-0.5">
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                                  <AlertCircle size={10} /> Expired
                                </span>
                              ) : isExpiringSoon ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                                  <Clock size={10} /> Expires soon
                                </span>
                              ) : q.validUntil ? (
                                <span className="text-[10px] text-slate-400">
                                  Valid to {new Date(q.validUntil).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">No expiry set</span>
                              )}
                            </div>
                          </td>

                          {/* Status with Quick Dropdown */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap relative">
                            <div className="inline-block">
                              <button
                                type="button"
                                onClick={() => setActiveStatusDropdownId(activeStatusDropdownId === q.id ? null : q.id)}
                                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full tracking-wider border flex items-center gap-1 cursor-pointer transition-all ${
                                  q.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' :
                                  (q.status as any) === 'converted' || q.status === 'completed' ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' :
                                  (q.status as any) === 'rejected' || q.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100' :
                                  isExpired ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                  'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                }`}
                                title="Click to change status"
                              >
                                <span>{q.status || 'pending'}</span>
                                <ChevronDown size={11} />
                              </button>

                              {/* Status Dropdown Menu */}
                              {activeStatusDropdownId === q.id && (
                                <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Set Status</div>
                                  {[
                                    { status: 'pending', label: 'Pending', color: 'hover:bg-amber-50 text-amber-700' },
                                    { status: 'accepted', label: 'Accepted', color: 'hover:bg-emerald-50 text-emerald-700' },
                                    { status: 'converted', label: 'Converted', color: 'hover:bg-purple-50 text-purple-700' },
                                    { status: 'rejected', label: 'Rejected', color: 'hover:bg-rose-50 text-rose-700' }
                                  ].map(s => (
                                    <button
                                      key={s.status}
                                      type="button"
                                      onClick={() => handleQuickStatusChange(q.id, s.status)}
                                      className={`w-full text-left px-2 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${s.color}`}
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Grand Total */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-mono font-black text-slate-900 text-sm">
                              {formatCurrency(q.total, settings)}
                            </div>
                            {Number(q.discountAmount) > 0 && (
                              <div className="text-[10px] text-rose-600 font-medium">
                                -{formatCurrency(q.discountAmount, settings)} disc
                              </div>
                            )}
                          </td>

                          {/* Actions Bar */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Details */}
                              <button 
                                onClick={() => openView(q)} 
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer" 
                                title="View Quotation Sheet"
                              >
                                <Eye size={14} />
                              </button>

                              {/* Print */}
                              <button 
                                onClick={() => handleDownloadPDF(q, 'print')} 
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer" 
                                title="Print Quotation PDF"
                              >
                                <Printer size={14} />
                              </button>

                              {/* Download PDF */}
                              <button 
                                onClick={() => handleDownloadPDF(q, 'download')} 
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer" 
                                title="Download PDF"
                              >
                                <Download size={14} />
                              </button>

                              {/* WhatsApp Share */}
                              <button 
                                onClick={() => handleShareWhatsApp(q)} 
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer" 
                                title="Share via WhatsApp"
                              >
                                <Share2 size={14} />
                              </button>

                              {/* Email */}
                              <button 
                                onClick={() => handleSendEmail(q)} 
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-colors cursor-pointer" 
                                title="Email to Client"
                              >
                                <Mail size={14} />
                              </button>

                              {/* Push to POS */}
                              <button 
                                onClick={() => handlePushToPOS(q)} 
                                className="p-1.5 rounded-lg text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 transition-colors cursor-pointer" 
                                title="Load into POS Cart"
                              >
                                <ShoppingCart size={14} />
                              </button>

                              {/* Convert to Sales Order */}
                              <button 
                                onClick={() => setConvertingQuote(q)} 
                                className="p-1.5 rounded-lg text-emerald-700 hover:text-white hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 transition-colors cursor-pointer" 
                                title="Convert to Confirmed Sales Invoice"
                              >
                                <ArrowRightCircle size={14} />
                              </button>

                              {/* Duplicate */}
                              <button 
                                onClick={() => handleDuplicate(q)} 
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition-colors cursor-pointer" 
                                title="Duplicate Quotation"
                              >
                                <Copy size={14} />
                              </button>

                              {/* Edit */}
                              <button 
                                onClick={() => openEdit(q)} 
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer" 
                                title="Edit Quotation"
                              >
                                <Edit3 size={14} />
                              </button>

                              {/* Delete */}
                              <button 
                                onClick={() => handleDelete(q.id)} 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer" 
                                title="Delete Permanently"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40">
              <div className="text-xs text-slate-500 font-medium">
                Showing {filteredQuotations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length} entries
              </div>

              <Pagination
                currentPage={currentPage}
                totalItems={filteredQuotations.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </div>
        </>
      )}

      {/* CREATE & EDIT FORM VIEW */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200">
          <form onSubmit={handleSaveQuotation} className="space-y-8">
            {/* Form Section 1: Customer & Quotation Meta */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Building2 size={18} className="text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Client & Quotation Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Customer Name */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Customer / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    autoComplete="off"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.customerName}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    onChange={e => {
                      const cName = e.target.value;
                      const c = customers.find(x => x.name?.toLowerCase().trim() === cName.toLowerCase().trim());
                      setFormData({
                        ...formData, 
                        customerName: cName,
                        customerPhone: c ? c.phone : formData.customerPhone,
                        customerEmail: c ? c.email : formData.customerEmail,
                        shippingAddress: c ? c.address : formData.shippingAddress
                      });
                    }}
                    placeholder="Search existing customer or type new..."
                  />
                  {showCustomerDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1 animate-in fade-in duration-100">
                      {customers.filter((c: any) => c.name?.toLowerCase().includes((formData.customerName || '').toLowerCase())).length > 0 ? (
                        customers.filter((c: any) => c.name?.toLowerCase().includes((formData.customerName || '').toLowerCase())).map((c: any) => (
                          <div 
                            key={c.id} 
                            className="px-3 py-2 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0"
                            onClick={() => {
                              setFormData({
                                ...formData, 
                                customerName: c.name, 
                                customerPhone: c.phone || formData.customerPhone,
                                customerEmail: c.email || formData.customerEmail,
                                shippingAddress: c.address || formData.shippingAddress
                              });
                              setShowCustomerDropdown(false);
                            }}
                          >
                            <div className="font-bold text-xs text-slate-800">{c.name}</div>
                            {c.phone && <div className="text-[11px] text-slate-500">{c.phone}</div>}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-slate-400 italic">
                          No customer found. Will be saved with this name.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <input 
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="e.g. 01882888805"
                  />
                </div>

                {/* Customer Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Email</label>
                  <input 
                    type="email"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.customerEmail}
                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="client@example.com"
                  />
                </div>

                {/* Work Order / PO Reference */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Order / PO Number</label>
                  <input 
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.workOrderNumber || ''}
                    onChange={e => setFormData({ ...formData, workOrderNumber: e.target.value })}
                    placeholder="Optional reference / PO #"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Quotation Status</label>
                  <select 
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white transition-all"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="pending">PENDING</option>
                    <option value="accepted">ACCEPTED</option>
                    <option value="converted">CONVERTED TO SALE</option>
                    <option value="rejected">REJECTED</option>
                  </select>
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Valid Until Date</label>
                  <input 
                    type="date"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.validUntil?.split('T')[0] || ''}
                    onChange={e => setFormData({ ...formData, validUntil: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  />
                </div>

                {/* Prepared By */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Prepared By</label>
                  <PreparedBySelect
                    value={(formData as any).preparedBy || ''}
                    onChange={val => setFormData(prev => ({ ...prev, preparedBy: val } as any))}
                    users={users}
                  />
                </div>

                {/* Delivery Address */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Delivery / Office Address</label>
                  <input 
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    value={formData.shippingAddress}
                    onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })}
                    placeholder="Complete address or location"
                  />
                </div>
              </div>
            </div>

            {/* Form Section 2: Line Items */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Line Items & Specifications
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+ Custom Item / Service</span>
                  </button>
                </div>
              </div>

              {/* Product Search Bar */}
              <div className="mb-4 relative">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    className="w-full bg-white border border-slate-200 p-2.5 pl-10 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    placeholder="Search inventory products to add (by name, model, or SKU)..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>

                {productSearch && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 shadow-xl max-h-60 overflow-y-auto rounded-xl p-1 animate-in fade-in duration-100">
                    {products.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase())).length > 0 ? (
                      products.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                        <div 
                          key={p.id} 
                          className="p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-b-0 transition-colors"
                          onClick={() => addItem(p)}
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-800">{p.name}</div>
                            {p.sku && <div className="text-[10px] text-slate-400">SKU: {p.sku} • Stock: {p.stock ?? 'N/A'}</div>}
                          </div>
                          <span className="text-xs font-mono font-black text-indigo-600">{formatCurrency(p.price, settings)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs">No matching products found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Items Table */}
              {formData.items.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Item Name & Specs</th>
                        <th className="p-3 w-28 text-right">Price (BDT)</th>
                        <th className="p-3 w-20 text-center">Qty</th>
                        <th className="p-3 w-24 text-right">Discount</th>
                        <th className="p-3 w-28 text-right">Total</th>
                        <th className="p-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              {(item as any).isCustomService && (
                                <span className="bg-purple-100 text-purple-700 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">Custom</span>
                              )}
                              <input 
                                type="text"
                                className="w-full border border-slate-200 p-1.5 rounded-lg font-bold text-xs text-slate-800 focus:bg-white bg-slate-50 outline-none focus:border-indigo-500"
                                placeholder="Item name"
                                value={item.name}
                                onChange={e => updateItem(idx, 'name', e.target.value)}
                              />
                            </div>
                            <input 
                              type="text"
                              className="w-full border border-slate-200 p-1.5 rounded-lg text-[11px] text-slate-600 bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 mb-1.5"
                              placeholder="Description or specifications (optional)"
                              value={item.description || ''}
                              onChange={e => updateItem(idx, 'description', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="text"
                                className="w-full border border-slate-200 p-1.5 rounded-lg text-[11px] text-slate-600 bg-slate-50 focus:bg-white outline-none focus:border-indigo-500"
                                placeholder="Brand (e.g. Asus)"
                                value={item.brand || ''}
                                onChange={e => updateItem(idx, 'brand', e.target.value)}
                              />
                              {(() => {
                                const currentWarranty = ((item as any).warranty || (item as any).specs?.Warranty || ((item as any).warrantyMonths ? ((item as any).warrantyMonths > 12 ? `${(item as any).warrantyMonths / 12} Years` : `${(item as any).warrantyMonths} Months`) : '') || '').toString();
                                const isLifeTime = currentWarranty.toLowerCase().includes('life');
                                const numPart = isLifeTime ? '' : (currentWarranty.match(/\d+/) || [''])[0];
                                const textPart = isLifeTime ? 'Life Time' : (currentWarranty.toLowerCase().includes('year') || currentWarranty.toLowerCase().includes('yr') ? 'Years' : currentWarranty.toLowerCase().includes('month') || currentWarranty.toLowerCase().includes('mo') ? 'Months' : currentWarranty.toLowerCase().includes('day') ? 'Days' : 'Years');
                                
                                return (
                                  <div className="flex gap-1">
                                    <input 
                                      type="number"
                                      min="1"
                                      className="w-1/2 border border-slate-200 p-1 rounded-lg text-xs text-slate-600 bg-slate-50 focus:bg-white outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                                      placeholder="1"
                                      disabled={isLifeTime}
                                      value={numPart}
                                      onChange={e => {
                                        const val = e.target.value;
                                        updateItem(idx, 'warranty', val ? `${val} ${textPart}` : '');
                                      }}
                                    />
                                    <select
                                      className="w-1/2 border border-slate-200 p-1 rounded-lg text-xs text-slate-600 bg-slate-50 focus:bg-white outline-none focus:border-indigo-500"
                                      value={textPart}
                                      onChange={e => {
                                        const val = e.target.value;
                                        if (val === 'Life Time') {
                                          updateItem(idx, 'warranty', 'Life Time');
                                        } else {
                                          updateItem(idx, 'warranty', numPart ? `${numPart} ${val}` : '');
                                        }
                                      }}
                                    >
                                      <option value="Days">Days</option>
                                      <option value="Months">Months</option>
                                      <option value="Years">Years</option>
                                      <option value="Life Time">Life</option>
                                    </select>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Unit Price */}
                          <td className="p-3 text-right">
                            <input 
                              type="number" 
                              min="0"
                              step="0.01"
                              className="w-full border border-slate-200 p-1.5 rounded-lg font-mono text-xs text-right outline-none focus:border-indigo-500 font-bold"
                              value={item.price}
                              onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                            />
                          </td>

                          {/* Quantity */}
                          <td className="p-3 text-center">
                            <input 
                              type="number" 
                              min="1" 
                              className="w-full border border-slate-200 p-1.5 rounded-lg text-xs text-center font-bold outline-none focus:border-indigo-500"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            />
                            <div className="text-[10px] text-slate-400 mt-0.5">{(item as any).unit || 'pcs'}</div>
                          </td>

                          {/* Discount */}
                          <td className="p-3 text-right">
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              className="w-full border border-slate-200 p-1.5 rounded-lg font-mono text-xs text-right outline-none focus:border-indigo-500"
                              value={item.discount || 0}
                              onChange={e => updateItem(idx, 'discount', Number(e.target.value))}
                            />
                          </td>

                          {/* Row Total */}
                          <td className="p-3 text-right font-mono font-black text-slate-900 text-xs">
                            {formatCurrency((item.price * item.quantity) - (item.discount || 0), settings)}
                          </td>

                          {/* Delete Row */}
                          <td className="p-3 text-center">
                            <button 
                              type="button" 
                              onClick={() => removeItem(idx)} 
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove line item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                  <FileText size={30} className="mx-auto text-slate-300 mb-1" />
                  <p className="font-bold text-xs text-slate-600">No line items added yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Search products above or click "+ Custom Item / Service"</p>
                </div>
              )}
            </div>

            {/* Form Section 3: Terms & Conditions and Pricing Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Terms & Conditions */}
              <div>
                <h4 className="font-bold text-xs mb-2 text-slate-700 flex items-center justify-between">
                  <span>Terms & Conditions Clauses</span>
                  <span className="text-[10px] text-indigo-600 font-medium">Click to append:</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    { label: '50% Advance', text: '- 50% Advance before starting work, 100% upon completion.' },
                    { label: '100% on Completion', text: '- 100% Payment required upon work completion.' },
                    { label: '1 Yr Warranty', text: '- 1 Year Full Warranty.' },
                    { label: '7 Days Validity', text: '- Validity: This quotation is valid for 7 days from the date of issue.' },
                    { label: 'Install Included', text: '- Installation & Delivery charges are included in this quotation.' },
                    { label: '1 Yr Free Service', text: '- Service: 1 Year free service support provided (excluding parts).' },
                    { label: 'Damage Policy', text: '- Warranty Void: Warranty does not cover physical damage, burn, or liquid damage.' },
                    { label: 'Tax Excluded', text: '- Tax/VAT: Prices are exclusive of VAT and Tax. If applicable, it will be added to the final invoice.' },
                    { label: 'Timeline', text: '- Timeline: Project will be completed within ____ days after receiving the advance payment.' },
                    { label: 'Subject to Stock', text: '- Stock: Offer is subject to product availability in stock at the time of confirmation.' }
                  ].map((clause, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, termsAndConditions: prev.termsAndConditions + (prev.termsAndConditions ? '\n' : '') + clause.text }))}
                      className="text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-slate-700 transition-colors cursor-pointer"
                    >
                      + {clause.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={5}
                  placeholder="Enter custom terms and conditions here..."
                  className="w-full border border-slate-200 p-3 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={formData.termsAndConditions}
                  onChange={e => setFormData({ ...formData, termsAndConditions: e.target.value })}
                />
              </div>

              {/* Financial Calculation Box */}
              <div className="flex flex-col justify-end bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 px-1">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(calculateSubtotal(), settings)}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 px-1">
                  <span>Global Discount (BDT):</span>
                  <input 
                    type="number" 
                    className="border border-slate-200 bg-white rounded-lg p-1.5 w-28 text-right font-mono text-xs font-bold outline-none focus:border-indigo-500" 
                    value={formData.discountAmount}
                    onChange={e => {
                      let val = parseFloat(e.target.value) || 0;
                      if (val < 0) val = 0;
                      if (val > calculateSubtotal()) val = calculateSubtotal();
                      setFormData({ ...formData, discountAmount: val });
                    }}
                    min="0"
                  />
                </div>

                <div className="flex justify-between items-center text-base border-t border-slate-200 pt-3 px-1">
                  <span className="font-black text-slate-900">Grand Total:</span>
                  <span className="font-mono font-black text-indigo-600 text-lg">
                    {formatCurrency(Math.max(0, calculateSubtotal() - formData.discountAmount), settings)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setViewMode('list')}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-900/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle size={15} />
                    <span>{viewMode === 'edit' ? 'Update Quotation' : 'Save & Generate Quotation'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VIEW / PREVIEW MODE */}
      {viewMode === 'view' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <button 
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to List
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => openEdit(quotations.find(q => q.id === editingId)!)} 
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
              >
                <Edit3 size={14} /> Edit
              </button>

              <button 
                onClick={() => handleDownloadPDF(quotations.find(q => q.id === editingId)!, 'print')} 
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                <Printer size={14} /> Print
              </button>

              <button 
                onClick={() => handleDownloadPDF(quotations.find(q => q.id === editingId)!, 'download')} 
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Download size={14} /> Download PDF
              </button>

              <button 
                onClick={() => handleShareWhatsApp(quotations.find(q => q.id === editingId)!)} 
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Share2 size={14} /> Share WhatsApp
              </button>

              <button 
                onClick={() => handlePushToPOS(quotations.find(q => q.id === editingId)!)} 
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#081621] text-white hover:bg-slate-800 rounded-xl shadow-xs transition cursor-pointer"
              >
                <ShoppingCart size={14} /> Push to POS
              </button>

              <button 
                onClick={() => setConvertingQuote(quotations.find(q => q.id === editingId)!)} 
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <ArrowRightCircle size={14} /> Convert to Sale
              </button>
            </div>
          </div>

          {/* Quotation Sheet */}
          <div className="border border-slate-200 p-6 sm:p-8 rounded-2xl bg-white space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-black text-indigo-600 tracking-tight">COMMERCIAL QUOTATION</h1>
                <div className="text-xs text-slate-500 font-bold mt-1">
                  Quote No: <span className="font-mono text-slate-900">{formData.documentNumber || editingId}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Issue Date: <span className="text-slate-800 font-semibold">{formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                {formData.validUntil && (
                  <div className="text-xs text-slate-500">
                    Valid Until: <span className="text-slate-800 font-semibold">{new Date(formData.validUntil).toLocaleDateString()}</span>
                  </div>
                )}
                {(formData as any).preparedBy && (
                  <div className="text-xs text-slate-500">
                    Prepared By: <span className="text-slate-800 font-semibold">{(formData as any).preparedBy}</span>
                  </div>
                )}
                <div className="mt-2.5">
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full tracking-wider border ${
                    formData.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    (formData.status as any) === 'converted' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                    (formData.status as any) === 'rejected' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {formData.status || 'pending'}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[220px]">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-1">Quotation For:</h3>
                <div className="text-sm font-black text-slate-900">{formData.customerName}</div>
                {formData.customerPhone && <div className="text-xs text-slate-600 font-medium">{formData.customerPhone}</div>}
                {formData.customerEmail && <div className="text-xs text-slate-600">{formData.customerEmail}</div>}
                {formData.shippingAddress && <div className="text-xs text-slate-500 mt-1 max-w-xs">{formData.shippingAddress}</div>}
                {formData.workOrderNumber && (
                  <div className="text-xs text-indigo-700 font-bold mt-1">Ref/WO: {formData.workOrderNumber}</div>
                )}
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-indigo-50/70 border-b border-indigo-100 text-indigo-950 font-black text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-3 text-center">S.N.</th>
                    <th className="py-3 px-3">Item Details</th>
                    <th className="py-3 px-3 text-center">Brand</th>
                    <th className="py-3 px-3 text-center">Warranty</th>
                    <th className="py-3 px-3 text-center">Quantity</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Discount</th>
                    <th className="py-3 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>}
                        {(item as any).isCustomService && <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1 rounded">Custom</span>}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">{(item as any).brand || '-'}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{(item as any).warranty || '-'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{item.quantity} {(item as any).unit || 'pcs'}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.price, settings)}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">{formatCurrency(item.discount || 0, settings)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        {formatCurrency((item.price * item.quantity) - (item.discount || 0), settings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing Summary */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0), settings)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-200">
                  <span>Total Discount:</span>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatCurrency((formData.discountAmount || 0) + formData.items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0), settings)}
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                  <span>Grand Total:</span>
                  <span className="font-mono text-indigo-600 text-base">
                    {formatCurrency(Math.max(0, calculateSubtotal() - formData.discountAmount), settings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            {formData.termsAndConditions && (
              <div className="border-t border-slate-200 pt-5">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2">Terms & Conditions</h4>
                <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {formData.termsAndConditions}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONVERT TO SALE ORDER MODAL */}
      {convertingQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 px-6 bg-[#081621] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ArrowRightCircle size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm">Convert to Sales Invoice</h3>
                  <p className="text-[11px] text-slate-400">Transform quotation into confirmed order</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setConvertingQuote(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Quotation No:</span>
                  <span className="font-mono font-bold text-slate-800">{convertingQuote.documentNumber || convertingQuote.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-800">{convertingQuote.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Items:</span>
                  <span className="font-bold text-slate-800">{convertingQuote.items?.length || 0} line items</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Invoice Amount:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(convertingQuote.total, settings)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Initial Payment Status</label>
                <select
                  value={convertPaymentStatus}
                  onChange={e => setConvertPaymentStatus(e.target.value as any)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="pending">Pending (Full Due)</option>
                  <option value="paid">Paid (Mark fully settled)</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={() => setConvertingQuote(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={handleConfirmConvert}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-950/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{isConverting ? 'Converting...' : 'Confirm Conversion'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ITEM MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 px-6 bg-[#081621] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-indigo-400" />
                <h3 className="text-sm font-black text-white">Add Custom Item / Service</h3>
              </div>
              <button 
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomItemForm({ name: '', description: '', quantity: 1, unit: 'pcs', price: 0, discount: 0, brand: '', warrantyValue: '1', warrantyUnit: 'Years' });
                }} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item / Service Name *</label>
                <input 
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:border-indigo-500 outline-none" 
                  value={customItemForm.name}
                  onChange={e => setCustomItemForm({ ...customItemForm, name: e.target.value })}
                  placeholder="e.g. CCTV Camera Installation or Custom Cable"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (optional)</label>
                <input 
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:border-indigo-500 outline-none" 
                  value={customItemForm.description}
                  onChange={e => setCustomItemForm({ ...customItemForm, description: e.target.value })}
                  placeholder="e.g. High-performance Cat6 cabling with conduits"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (BDT)</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold focus:border-indigo-500 outline-none" 
                    value={customItemForm.price}
                    onChange={e => setCustomItemForm({ ...customItemForm, price: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity & Unit</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="number"
                      min="1"
                      className="w-2/3 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-center focus:border-indigo-500 outline-none" 
                      value={customItemForm.quantity}
                      onChange={e => setCustomItemForm({ ...customItemForm, quantity: Number(e.target.value) })}
                    />
                    <select
                      className="w-1/3 border border-slate-200 p-2 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none bg-white"
                      value={customItemForm.unit}
                      onChange={e => setCustomItemForm({ ...customItemForm, unit: e.target.value })}
                    >
                      <option value="pcs">pcs</option>
                      <option value="meter">meter</option>
                      <option value="feet">feet</option>
                      <option value="set">set</option>
                      <option value="job">job</option>
                      <option value="box">box</option>
                      <option value="ctn">ctn</option>
                      <option value="kg">kg</option>
                      <option value="pack">pack</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand (optional)</label>
                  <input 
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:border-indigo-500 outline-none" 
                    value={customItemForm.brand}
                    onChange={e => setCustomItemForm({ ...customItemForm, brand: e.target.value })}
                    placeholder="e.g. Hikvision, Dahua"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warranty (optional)</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="number"
                      min="1"
                      className="w-1/2 border border-slate-200 p-2.5 rounded-xl text-xs text-center font-bold focus:border-indigo-500 outline-none disabled:bg-slate-100" 
                      value={customItemForm.warrantyValue}
                      onChange={e => setCustomItemForm({ ...customItemForm, warrantyValue: e.target.value })}
                      placeholder="1"
                      disabled={customItemForm.warrantyUnit === 'Life Time'}
                    />
                    <select
                      className="w-1/2 border border-slate-200 p-2 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none bg-white"
                      value={customItemForm.warrantyUnit}
                      onChange={e => {
                        const unit = e.target.value;
                        const updates: any = { warrantyUnit: unit };
                        if (unit === 'Life Time') updates.warrantyValue = '';
                        setCustomItemForm({ ...customItemForm, ...updates });
                      }}
                    >
                      <option value="Days">Days</option>
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                      <option value="Life Time">Life Time</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Discount (optional)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-mono focus:border-indigo-500 outline-none" 
                  value={customItemForm.discount}
                  onChange={e => setCustomItemForm({ ...customItemForm, discount: Number(e.target.value) })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={addCustomItem}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-indigo-900/20 transition-all cursor-pointer"
                >
                  Add Line Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
