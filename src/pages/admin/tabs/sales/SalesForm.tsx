import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, doc, query, getDocs, getDoc, orderBy, where, deleteDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../../../firebase';
import { Product, ProductVariant, Customer, DiscountCode, SiteSettings, PaymentAccount } from '../../../../types';
import { formatCurrency, cn, addWarranty, formatWarranty } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { generatePDF } from '../../../../lib/pdf';
import { useBusinessUnits, getHierarchicalCompanyGroups } from '../../../../hooks/useBusinessUnits';
import { CompanyModal } from '../businessUnits/CompanyModal';
import { PreparedBySelect } from '../../../../components/common/PreparedBySelect';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag, Barcode, ScanLine,
  Cpu,
  X,
  Search,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  UserCheck,
  User,
  PackagePlus,
  Calendar,
  FileText,
  CreditCard,
  Tag,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Percent,
  Clock,
  ChevronRight,
  Store,
  DollarSign,
  Receipt,
  PauseCircle,
  RotateCcw,
  Building2
} from 'lucide-react';
import { generateDocumentNumber } from '../../../../lib/numbering';
import { CustomProductPurchaseModal } from '../../modals/CustomProductPurchaseModal';
import { sendEmail } from '../../../../services/emailService';
import { logAudit } from '../../../../lib/audit';
import { recordSensitiveAlert } from '../../../../lib/alerts';

interface SalesFormProps {
  users?: any[];
  editingOrder?: any;
  onCancelEdit?: () => void;
  products: Product[];
  customers: Customer[];
  transactions?: any[];
  discountCodes: DiscountCode[];
  settings: SiteSettings;
  formatCurrency: (amount: number, settings?: SiteSettings) => string;
  cn: (...inputs: any[]) => string;
  toast: any;
  fetchData: () => Promise<void>;
  checkLowStock: (productName: string, newStock: number) => Promise<void>;
  setActiveTab: (tab: string) => void;
  setIsAddingCustomer: (val: boolean) => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({
  users = [], editingOrder, onCancelEdit,
  products,
  customers: initialCustomers,
  discountCodes,
  settings,
  formatCurrency,
  cn,
  toast,
  fetchData,
  checkLowStock,
  setActiveTab,
  transactions = [],
}) => {
  const { profile } = useAuth();
  const { companies, addCompany } = useBusinessUnits();
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyModalTarget, setCompanyModalTarget] = useState<'sale' | 'customer'>('sale');

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers || []);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  // Searchable customer picker state
  const [customerQuery, setCustomerQuery] = useState('');
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerHighlight, setCustomerHighlight] = useState(0);
  const customerBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (customerBoxRef.current && !customerBoxRef.current.contains(e.target as Node)) {
        setIsCustomerOpen(false);
        setCustomerQuery('');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    company: 'main',
    branchName: '',
  });

    const [saleData, setSaleData] = useState(() => {
    const saved = localStorage.getItem('sales_form_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      } catch (e) {}
    }
    return {
      customerId: '',
      customerName: '',
      workOrderNumber: '',
      customerPhone: '',
      customerEmail: '',
      shippingAddress: '',
      createdBy: '',
      date: new Date().toISOString().split('T')[0],
      items: [] as any[],
      type: 'invoice' as 'invoice' | 'challan' | 'quotation',
      paymentMethod: '',
      paymentAccountId: '',
      saleSource: 'in_store' as 'in_store' | 'online',
      paidAmount: 0,
      discountAmount: 0,
      appliedDiscountPercentage: 0,
      appliedDiscountCode: '',
      notes: '',
      branchName: '',
      company: 'main',
    };
  });

  useEffect(() => {
    localStorage.setItem('sales_form_draft', JSON.stringify(saleData));
  }, [saleData]);

  const [saleDiscountCodeInput, setSaleDiscountCodeInput] = useState('');
  const [showPCBuilderModal, setShowPCBuilderModal] = useState(false);
  const [servicePresets, setServicePresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('service_presets');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      'Motherboard Problem Fix',
      'Power Supply Fix',
      'Screen / Display Repair',
      'Keyboard Repair',
      'OS Installation / Reinstall',
      'Data Recovery',
      'Cooling Fan Replacement',
      'RAM Upgrade',
      'Battery Replacement',
      'Charging Port Fix',
      'Virus Removal',
      'Repair / Servicing',
    ];
  });
  const [editingPresets, setEditingPresets] = useState(false);
  const [newPresetText, setNewPresetText] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingOrder) {
      setSaleData({
        ...saleData,
        type: editingOrder.type || 'invoice',
        customerId: editingOrder.customerId || '',
        customerName: editingOrder.customerName || '',
        customerPhone: editingOrder.customerPhone || '',
        customerEmail: editingOrder.customerEmail || '',
        shippingAddress: editingOrder.shippingAddress || editingOrder.customerAddress || '',
        company: editingOrder.company || 'main',
        workOrderNumber: editingOrder.workOrderNumber || '',
        items: editingOrder.items || [],
        discountType: 'flat',
        discountValue: editingOrder.discountAmount || 0,
        taxRate: editingOrder.taxAmount ? (editingOrder.taxAmount / (editingOrder.subtotal || 1) * 100) : 0,
        shippingCost: editingOrder.shippingCost || 0,
        paidAmount: editingOrder.paidAmount || editingOrder.amountPaid || 0,
        paymentMethod: editingOrder.paymentMethod || '',
        paymentAccountId: '',
        notes: editingOrder.notes || '',
      });
    }
  }, [editingOrder]);

  // Robustly identify if a transaction belongs to the order currently being edited
  const isTransactionLinkedToEditingOrder = (t: any) => {
    if (!editingOrder) return false;
    const editingId = String(editingOrder.id || '').trim();
    const editingDocNum = String(editingOrder.documentNumber || '').trim();
    const editingInvNum = String(editingOrder.invoiceNumber || '').trim();

    // Check referenceId against editing order id or document numbers
    if (editingId && t.referenceId === editingId) return true;
    if (editingDocNum && t.referenceId === editingDocNum) return true;
    if (editingInvNum && t.referenceId === editingInvNum) return true;

    // Check documentNumber against editing order document numbers or id
    if (editingDocNum && t.documentNumber === editingDocNum) return true;
    if (editingId && t.documentNumber === editingId) return true;
    if (editingInvNum && t.documentNumber === editingInvNum) return true;

    // Check description for document number
    if (editingDocNum && typeof t.description === 'string' && t.description.includes(editingDocNum)) return true;
    if (editingInvNum && typeof t.description === 'string' && t.description.includes(editingInvNum)) return true;

    return false;
  };

  // Calculate actual previous due for a customer excluding the order currently being edited
  const getCustomerPreviousDue = (customerId: string) => {
    if (!customerId || !transactions) return 0;
    let due = 0;
    transactions.forEach(t => {
      if (t.entityId === customerId && !isTransactionLinkedToEditingOrder(t)) {
        if (t.type === 'sale' || t.type === 'opening_balance') due += Number(t.amount) || 0;
        else if (t.type === 'payment_received' || t.type === 'return' || t.type === 'sale_return') due -= Number(t.amount) || 0;
      }
    });
    return due > 0 ? due : 0;
  };

  const [showCustomProductModal, setShowCustomProductModal] = useState(false);

  const [heldSales, setHeldSales] = useState<{ id: string; time: string; saleData: any }[]>(() => {
    try {
      const saved = localStorage.getItem('sales_form_held');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const holdCurrentSale = () => {
    if (saleData.items.length === 0) {
      toast.error('Cart is empty!');
      return;
    }
    const newHold = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      saleData,
    };
    const updated = [newHold, ...heldSales];
    setHeldSales(updated);
    localStorage.setItem('sales_form_held', JSON.stringify(updated));
    setSaleData({
      ...saleData,
      customerId: '',
      customerName: '',
      workOrderNumber: '',
      customerPhone: '',
      customerEmail: '',
      shippingAddress: '',
      items: [],
      type: 'invoice',
      paymentMethod: '',
      paymentAccountId: '',
      paidAmount: 0,
      discountAmount: 0,
    });
    setSaleDiscountCodeInput('');
    toast.success('Sale put on hold!');
  };

  const restoreSale = (id) => {
    const toRestore = heldSales.find(h => h.id === id);
    if (toRestore) {
      if (saleData.items.length > 0) {
        holdCurrentSale(); // Auto-hold current if non-empty
      }
      setSaleData(toRestore.saleData);
      const updated = heldSales.filter(h => h.id !== id);
      setHeldSales(updated);
      localStorage.setItem('sales_form_held', JSON.stringify(updated));
      toast.success('Sale restored!');
    }
  };


  // Sync customers and fetch accounts
  const loadData = async () => {
    try {
      const [custSnap, accSnap] = await Promise.all([
        getDocs(query(collection(db, 'customers'), orderBy('name'))),
        getDocs(query(collection(db, 'payment_accounts'), orderBy('name'))),
      ]);
      const fetchedCusts = custSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(fetchedCusts);

      const accs = accSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentAccount));
      setPaymentAccounts(accs);
      
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const pendingService = localStorage.getItem('pos_pending_service_item');
    if (pendingService) {
      try {
        const parsedService = JSON.parse(pendingService);
        setSaleData(prev => ({
          ...prev,
          items: [...prev.items, parsedService]
        }));
        localStorage.removeItem('pos_pending_service_item');
        toast.success(`Added ${parsedService.name} to invoice`);
      } catch (e) {
        console.error('Failed to parse pending service item', e);
      }
    }
  }, []);

  const playBeep = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const addItemToSale = (product: Product, scannedSerial?: string, scannedVariant?: ProductVariant) => {
    const availableStock = scannedVariant?.stock ?? product.stock;
    if (availableStock <= 0) {
      playBeep('error');
      toast.error(`${product.name}${scannedVariant ? ` (${scannedVariant.name})` : ''} is out of stock`);
      return;
    }

    setSaleData(prev => {
      const existing = prev.items.find(i => i.id === product.id && (!scannedVariant || (i as any).variantId === scannedVariant.id));
      
      // Prevent duplicate serial scanning
      if (scannedSerial && existing?.selectedSerials?.includes(scannedSerial)) {
        playBeep('error');
        toast.error(`Serial '${scannedSerial}' is already scanned for this item!`);
        return prev;
      }

      // Auto-select a serial if none was scanned but the product has serials available
      let serialToSelect = scannedSerial;
      if (!serialToSelect && product.hasSerialTracking && product.availableSerials && product.availableSerials.length > 0) {
        const currentlySelected = existing ? (existing.selectedSerials || []) : [];
        const firstUnselected = product.availableSerials.find((s: string) => !currentlySelected.includes(s));
        if (firstUnselected) {
          serialToSelect = firstUnselected;
        }
      }

      if (existing) {
        if (existing.quantity >= availableStock) {
          playBeep('error');
          toast.error(`Maximum available stock is ${availableStock}`);
          return prev;
        }
        return {
          ...prev,
          items: prev.items.map(i => (i.id === product.id && (!scannedVariant || (i as any).variantId === scannedVariant.id)) ? { 
            ...i, 
            quantity: i.quantity + 1,
            selectedSerials: serialToSelect && !i.selectedSerials?.includes(serialToSelect) 
              ? [...(i.selectedSerials || []), serialToSelect] 
              : (i.selectedSerials || [])
          } : i),
        };
      }

      const effectivePrice = scannedVariant?.price ?? product.price;
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            ...product,
            price: effectivePrice,
            variantId: scannedVariant?.id,
            variantName: scannedVariant?.name,
            quantity: 1,
            selectedSerials: serialToSelect ? [serialToSelect] : []
          }
        ],
      };
    });
    playBeep('success');
    toast.success(`Added ${product.name}${scannedSerial ? ` [S/N: ${scannedSerial}]` : ''}`);
  };

  const findProductForScan = (rawScan: string) => {
    const scanValue = rawScan.replace(/[\x00-\x1F\x7F]/g, '').trim();
    if (!scanValue) return null;
    const searchLower = scanValue.toLowerCase();

    // 1. Exact match on Available Serials (highest priority for physical units)
    for (const p of products) {
      const foundSerial = (p.availableSerials || []).find((s: string) => s.toLowerCase() === searchLower);
      if (foundSerial) {
        return { product: p, matchedSerial: foundSerial, matchedVariant: undefined };
      }
    }

    // 2. Exact match on Variants (barcode, SKU, ID, Name)
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        const foundVariant = p.variants.find(v =>
          (v.barcode && v.barcode.toLowerCase() === searchLower) ||
          (v.sku && v.sku.toLowerCase() === searchLower) ||
          v.id.toLowerCase() === searchLower ||
          v.name.toLowerCase() === searchLower
        );
        if (foundVariant) {
          return { product: p, matchedSerial: undefined, matchedVariant: foundVariant };
        }
      }
    }

    // 3. Exact match on Product (barcode, SKU, ID, model, exact name)
    const exactMatches = products.filter(p => {
      const pBarcode = (p.barcode || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();
      const pModel = (p.model || '').toLowerCase();
      const pId = p.id.toLowerCase();
      const pName = p.name.toLowerCase();

      return (
        (pBarcode && pBarcode === searchLower) ||
        (pSku && pSku === searchLower) ||
        (pId === searchLower) ||
        (pModel && pModel === searchLower) ||
        (pName === searchLower)
      );
    });

    if (exactMatches.length === 1) {
      return { product: exactMatches[0], matchedSerial: undefined, matchedVariant: undefined };
    }

    // 4. Fallback: Unique partial match on Name, SKU, Barcode, Model
    const partialMatches = products.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      (p.sku || '').toLowerCase().includes(searchLower) ||
      (p.barcode || '').toLowerCase().includes(searchLower) ||
      (p.model || '').toLowerCase().includes(searchLower)
    );

    if (partialMatches.length === 1) {
      return { product: partialMatches[0], matchedSerial: undefined, matchedVariant: undefined };
    }

    return { product: null, multiple: exactMatches.length > 1 || partialMatches.length > 1 };
  };

  const executeScan = (rawScan: string): boolean => {
    const match = findProductForScan(rawScan);
    if (match && match.product) {
      const p = match.product;
      let serialToUse = match.matchedSerial;

      if (p.hasSerialTracking && !serialToUse) {
        const existing = saleData.items.find(i => i.id === p.id);
        const selected = existing ? (existing.selectedSerials || []) : [];
        const unselected = (p.availableSerials || []).find(s => !selected.includes(s));
        if (unselected) {
          serialToUse = unselected;
        }
      }

      addItemToSale(p, serialToUse, match.matchedVariant);
      return true;
    } else if (match?.multiple) {
      playBeep('error');
      toast.error('Found multiple items matching scan. Please select manually.');
      return false;
    } else {
      playBeep('error');
      toast.error('No matching product found for scan');
      return false;
    }
  };

  // Global Barcode Scanner Logic for SalesForm
  useEffect(() => {
    let barcode = '';
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Enter') {
        if (barcode.trim().length > 0) {
          executeScan(barcode);
        }
        barcode = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcode += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcode = '';
        }, 350);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [products, saleData.items]);

  // Subtotal & Total Calculations
  const subtotal = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const effectiveDiscount = saleData.appliedDiscountPercentage > 0
    ? (subtotal * saleData.appliedDiscountPercentage) / 100
    : (saleData.discountAmount || 0);
  const netTotal = Math.max(0, subtotal - effectiveDiscount);

  // Net total computed
  const handleCustomerChange = (customerId: string) => {
    const selected = customers.find(c => c.id === customerId);
    if (selected) {
      setSaleData(prev => ({
        ...prev,
        customerId: selected.id,
        customerName: selected.name,
        customerPhone: selected.phone || '',
        customerEmail: selected.email || '',
        shippingAddress: selected.address || '',
        branchName: '', // Keep empty unless explicitly chosen/added
        company: (selected as any).company || 'main',
      }));
    } else {
      setSaleData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        workOrderNumber: '',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: '',
        branchName: '',
      }));
    }
  };

  // Create new customer modal submission
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const branchVal = newCustomerForm.branchName?.trim() || '';
      const branchesArr = branchVal ? [branchVal] : [];
      const docRef = await addDoc(collection(db, 'customers'), {
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email.trim(),
        address: newCustomerForm.address.trim(),
        company: newCustomerForm.company || 'main',
        branchName: branchVal,
        branches: branchesArr,
        createdAt: new Date().toISOString(),
      });

      const newlyAdded: Customer = {
        id: docRef.id,
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email.trim(),
        address: newCustomerForm.address.trim(),
        company: newCustomerForm.company || 'main',
        branchName: branchVal,
        branches: branchesArr,
        createdAt: new Date().toISOString(),
      };

      setCustomers(prev => [...prev, newlyAdded]);
      // Auto select the newly added customer
      setSaleData(prev => ({
        ...prev,
        customerId: newlyAdded.id,
        customerName: newlyAdded.name,
        customerPhone: newlyAdded.phone || '',
        customerEmail: newlyAdded.email || '',
        shippingAddress: newlyAdded.address || '',
        branchName: branchVal,
        company: newlyAdded.company || 'main',
      }));

      setIsAddingNewCustomer(false);
      setNewCustomerForm({ name: '', phone: '', email: '', address: '', company: 'main', branchName: '' });
      toast.success(`Customer "${newlyAdded.name}" added and selected!`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add customer');
    }
  };

  const handleApplySaleDiscountCode = () => {
    if (!saleDiscountCodeInput.trim()) return;
    const foundCode = discountCodes.find(
      c => c.code.toUpperCase() === saleDiscountCodeInput.toUpperCase() && c.isActive
    );
    if (foundCode) {
      if (new Date(foundCode.expiryDate) < new Date()) {
        toast.error('Discount code expired');
        return;
      }
      setSaleData({
        ...saleData,
        appliedDiscountPercentage: foundCode.discountPercentage,
        appliedDiscountCode: foundCode.code,
        discountAmount: 0,
      });
      toast.success(`Discount code applied: ${foundCode.discountPercentage}% off`);
    } else {
      toast.error('Invalid discount code');
    }
  };

  const updateItemQty = (productId: string, newQty: number) => {
    const itemInCart = saleData.items.find(i => i.id === productId);
    if (!itemInCart) return;

    if (newQty <= 0) {
      setSaleData(prev => ({
        ...prev,
        items: prev.items.filter(i => i.id !== productId),
      }));
      return;
    }

    if (!itemInCart.isCustomService) {
      const product = products.find(p => p.id === productId);
      if (product && newQty > product.stock) {
        toast.error(`Maximum available stock is ${product.stock}`);
        return;
      }
      
      // Auto-select serials if qty increases
      if (product && product.hasSerialTracking && product.availableSerials && newQty > itemInCart.quantity) {
        let newSelectedSerials = [...(itemInCart.selectedSerials || [])];
        let diff = newQty - itemInCart.quantity;
        
        for (const serial of product.availableSerials) {
          if (diff <= 0) break;
          if (!newSelectedSerials.includes(serial)) {
            newSelectedSerials.push(serial);
            diff--;
          }
        }
        
        setSaleData(prev => ({
          ...prev,
          items: prev.items.map(i => i.id === productId ? { ...i, quantity: newQty, selectedSerials: newSelectedSerials } : i),
        }));
        return;
      }
    }

    setSaleData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { 
        ...i, 
        quantity: newQty,
        // Trim selected serials if qty decreases
        selectedSerials: newQty < (i.selectedSerials?.length || 0) 
          ? (i.selectedSerials || []).slice(0, newQty) 
          : (i.selectedSerials || [])
      } : i),
    }));
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setSaleData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, price: newPrice } : i),
    }));
  };

  const updateItemCostPrice = (productId: string, newCostPrice: number) => {
    if (newCostPrice < 0) return;
    setSaleData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, costPrice: newCostPrice } : i),
    }));
  };

  const updateItemName = (productId: string, newName: string) => {
    setSaleData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, name: newName } : i),
    }));
  };

  const handleAddCustomService = () => {
    const serviceId = 'service-' + Date.now();
    setSaleData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: serviceId,
          name: 'Repair / Servicing',
          price: 0,
          costPrice: 0,
          quantity: 1,
          isCustomService: true,
          hasSerialTracking: false,
          hasWarranty: false,
          selectedSerials: [],
        }
      ],
    }));
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saleData.type !== 'quotation' && saleData.paidAmount > 0 && !saleData.paymentAccountId) {
      toast.error('Please select a payment account to receive the paid amount');
      return;
    }

    // MUST HAVE A REGISTERED CUSTOMER SELECTED
    if (!saleData.customerId || !saleData.customerName) {
      toast.error('Please select a registered customer for this sale');
      return;
    }

    if (saleData.items.length === 0) {
      toast.error('Please add at least one product to the sale');
      return;
    }

    try {
      setSubmitting(true);

      // Verify Serials if tracking enabled
      for (const item of saleData.items) {
        if (item.hasSerialTracking) {
          if (!item.selectedSerials || item.selectedSerials.length !== item.quantity) {
            toast.error(`Please select exactly ${item.quantity} serial(s) for ${item.name}`);
            setSubmitting(false);
            return;
          }
        }
      }

      const docType = saleData.type === 'quotation' ? 'QUO' : (saleData.type === 'challan' ? 'CHA' : 'INV');
        const docNumber = editingOrder ? (editingOrder.documentNumber || editingOrder.id) : await generateDocumentNumber(docType);

      const processedItems = saleData.items.map(item => {
          const currentProduct = products.find(p => p.id === item.id);
        if (item.isCustomService) {
          return {
            productId: item.id,
            name: item.name,
            price: Number(item.price),
            costPrice: 0,
            quantity: Number(item.quantity),
            unit: (item as any).unit || currentProduct?.unit || 'pcs',
            hasWarranty: false,
            warrantyMonths: 0,
            selectedSerials: [],
            itemType: 'service',
          };
        }
        

        const wMonths = item.hasWarranty ? (item.warrantyMonths || currentProduct?.warrantyMonths || 0) : (currentProduct?.warrantyMonths || 0);
        return {
          productId: item.id,
          name: item.name,
          price: Number(item.price),
          costPrice: Number(currentProduct?.costPrice) || 0,
          quantity: Number(item.quantity),
            unit: (item as any).unit || currentProduct?.unit || 'pcs',
          hasWarranty: Boolean(item.hasWarranty),
            warrantyMonths: wMonths,
            warrantyUnit: currentProduct?.warrantyUnit || 'months',
            brand: currentProduct?.brand || (item as any).brand || '',
            warranty: wMonths > 0 ? formatWarranty(wMonths, currentProduct?.warrantyUnit) : '',
          selectedSerials: item.selectedSerials || [],
        };
      });

      const previousDue = getCustomerPreviousDue(saleData.customerId);

      const totalCost = processedItems.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);
      const profit = netTotal - totalCost;

      const paid = saleData.type === 'quotation' ? 0 : (Number(saleData.paidAmount) || 0);
      const paymentStatus = paid >= (netTotal + previousDue) ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');
      const createdAt = new Date(saleData.date || new Date()).toISOString();

      const orderData = {
        previousDue: previousDue > 0 ? previousDue : 0,
        documentNumber: docNumber,
        type: saleData.type,
        saleSource: saleData.saleSource,
        company: saleData.company || 'main',
          createdBy: saleData.createdBy || profile?.displayName || profile?.email || 'Admin',
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        workOrderNumber: saleData.workOrderNumber,
        customerPhone: saleData.customerPhone || '',
        customerEmail: saleData.customerEmail || '',
        shippingAddress: saleData.shippingAddress || '',
        branchName: saleData.branchName || '',
        projectName: saleData.branchName || '',
        items: processedItems,
        subtotal,
        discountAmount: effectiveDiscount,
        appliedDiscountPercentage: saleData.appliedDiscountPercentage,
        appliedDiscountCode: saleData.appliedDiscountCode,
        total: netTotal,
        totalCost,
        profit,
        paidAmount: paid,
        paymentStatus,
        paymentMethod: saleData.paymentMethod || 'cash',
        paymentAccountId: saleData.paymentAccountId || '',
        status: saleData.type === 'quotation' ? 'pending' : 'delivered',
        userId: 'admin',
        notes: saleData.notes || '',
        createdAt,
      };

      let orderRefId = '';
        if (editingOrder) {
          orderRefId = editingOrder.id;
          await updateDoc(doc(db, 'orders', editingOrder.id), orderData);
          
          // REVERT OLD STOCK
          if (editingOrder.type === 'invoice' || editingOrder.type === 'challan') {
            for (const oldItem of editingOrder.items || []) {
              if (oldItem.isCustomService) continue;
              const prodRef = doc(db, 'products', oldItem.productId || oldItem.id);
              const pSnap = await getDoc(prodRef);
              if (pSnap.exists()) {
                const currentProd = pSnap.data();
                const updates: any = {};
                updates.stock = increment(oldItem.quantity || 0);
                
                // UPDATE LOCAL STATE SO THE DEDUCT LOGIC USES IT
                const localProd = products.find(p => p.id === (oldItem.productId || oldItem.id));
                if (localProd) {
                   localProd.stock = updates.stock;
                   if (oldItem.selectedSerials) {
                      localProd.availableSerials = [...(localProd.availableSerials || []), ...oldItem.selectedSerials];
                   }
                }
                if (oldItem.selectedSerials && oldItem.selectedSerials.length > 0) {
                   updates.availableSerials = [...(currentProd.availableSerials || []), ...oldItem.selectedSerials];
                }
                await updateDoc(prodRef, updates);
              }
            }
            
            // DELETE OLD SOLD SERIALS
            const oldSerialsSnap = await getDocs(query(collection(db, 'sold_serials'), where('orderId', '==', editingOrder.id)));
            await Promise.all(oldSerialsSnap.docs.map(d => deleteDoc(doc(db, 'sold_serials', d.id))));
          }
          
          // DELETE OLD TRANSACTIONS (by referenceId AND by documentNumber to ensure complete cleanup)
          const txDocsToDelete = new Map<string, any>();
          const oldTxSnap1 = await getDocs(query(collection(db, 'transactions'), where('referenceId', '==', editingOrder.id)));
          oldTxSnap1.docs.forEach(d => txDocsToDelete.set(d.id, d.ref));
          if (editingOrder.documentNumber) {
            const oldTxSnap2 = await getDocs(query(collection(db, 'transactions'), where('documentNumber', '==', editingOrder.documentNumber)));
            oldTxSnap2.docs.forEach(d => txDocsToDelete.set(d.id, d.ref));
            const oldTxSnap3 = await getDocs(query(collection(db, 'transactions'), where('referenceId', '==', editingOrder.documentNumber)));
            oldTxSnap3.docs.forEach(d => txDocsToDelete.set(d.id, d.ref));
          }
          await Promise.all(Array.from(txDocsToDelete.values()).map(ref => deleteDoc(ref)));
          
        } else {
          const orderRef = await addDoc(collection(db, 'orders'), orderData);
          orderRefId = orderRef.id;
        }

      // Deduct stock and record serial warranties if invoice/challan
      if (saleData.type === 'invoice' || saleData.type === 'challan') {
        for (const item of saleData.items) {
          if (item.isCustomService) continue;
          const productRef = doc(db, 'products', item.id);
          const currentProduct = products.find(p => p.id === item.id);
          if (currentProduct) {
            const updates: any = {};
            updates.stock = increment(-item.quantity);

            if (currentProduct.hasSerialTracking && item.selectedSerials) {
              const remainingSerials = (currentProduct.availableSerials || []).filter(
                (s: string) => !item.selectedSerials.includes(s)
              );
              updates.availableSerials = remainingSerials;

              const warrantyEndDate = new Date();
              const wMonths = item.hasWarranty ? (item.warrantyMonths || currentProduct.warrantyMonths || 0) : (currentProduct.warrantyMonths || 0);
              warrantyEndDate.setTime(addWarranty(warrantyEndDate, wMonths).getTime());

              for (const serial of item.selectedSerials) {
                await addDoc(collection(db, 'sold_serials'), {
                  serial,
                  productId: currentProduct.id,
                  productName: currentProduct.name,
                  orderId: orderRefId,
                  documentNumber: docNumber,
                  customerName: saleData.customerName,
                  customerPhone: saleData.customerPhone,
                  soldAt: createdAt,
                  warrantyEndDate: warrantyEndDate.toISOString(),
                  status: 'active',
                });
              }
            }

            await updateDoc(productRef, updates);
            checkLowStock(currentProduct.name, Math.max(0, currentProduct.stock - item.quantity));
          }
        }

        // Record Cash/Bank Inflow Transaction in Firestore
        // Always record the full sale amount to update the customer ledger (Receivable)
        await addDoc(collection(db, 'transactions'), {
          type: 'sale',
          amount: netTotal,
          date: createdAt,
          description: `Sale to ${saleData.customerName} (#${docNumber})`,
          entityId: saleData.customerId,
          entityName: saleData.customerName,
          entityType: 'customer',
          referenceId: orderRefId,
          documentNumber: docNumber,
          branchName: saleData.branchName || '',
          projectName: saleData.branchName || '',
          company: saleData.company || 'main',
          paymentAccountId: '', // No payment account for the sale itself
          paymentMethod: '',
          createdAt,
        });

        // If any amount was paid, record the payment transaction
        if (paid > 0) {
          const selectedAcc = paymentAccounts.find(a => a.id === saleData.paymentAccountId);
          await addDoc(collection(db, 'transactions'), {
            type: 'payment_received',
            amount: paid,
            date: createdAt,
            description: `Payment for Invoice #${docNumber}`,
            entityId: saleData.customerId,
            entityName: saleData.customerName,
            entityType: 'customer',
            referenceId: orderRefId,
            documentNumber: docNumber,
            branchName: saleData.branchName || '',
            projectName: saleData.branchName || '',
            company: saleData.company || 'main',
            paymentAccountId: selectedAcc?.id || '',
            paymentMethod: selectedAcc?.type || selectedAcc?.name || saleData.paymentMethod || 'cash',
            createdAt,
          });
        }

        // Auto-save branch to customer's branches list if newly introduced
        if (saleData.customerId && saleData.branchName) {
          const curCust = customers.find(c => c.id === saleData.customerId);
          if (curCust && (!curCust.branches || !curCust.branches.includes(saleData.branchName))) {
            const updatedBranches = Array.from(new Set([...(curCust.branches || []), saleData.branchName]));
            updateDoc(doc(db, 'customers', saleData.customerId), { branches: updatedBranches }).catch(e => console.error(e));
          }
        }
      }

      const typeStr = saleData.type === 'quotation' ? 'Quotation' : (saleData.type === 'challan' ? 'Challan' : 'Invoice');
      
      // Send email invoice (non-blocking - never prevents sale from saving)
      if (saleData.customerEmail) {
        try {
          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2>${settings?.brandName || 'Click2IT'}</h2>
                <h3>${typeStr} #${docNumber}</h3>
              </div>
              <p>Dear <strong>${saleData.customerName}</strong>,</p>
              <p>Thank you for your business. Please find the details of your recent ${typeStr.toLowerCase()} below:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Qty</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Price</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${processedItems.map((item: any) => `
                    <tr>
                      <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.name}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${item.quantity}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(item.price, settings)}</td>
                      <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${formatCurrency(item.price * item.quantity, settings)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="margin-top: 20px; text-align: right;">
                <p><strong>Subtotal:</strong> ${formatCurrency(subtotal, settings)}</p>
                ${effectiveDiscount > 0 ? `<p><strong>Discount:</strong> -${formatCurrency(effectiveDiscount, settings)}</p>` : ''}
                <p style="font-size: 1.2em;"><strong>Net Total:</strong> ${formatCurrency(netTotal, settings)}</p>
                ${saleData.type === 'invoice' ? `
                <p><strong>Paid:</strong> ${formatCurrency(paid, settings)}</p>
                ${settings?.showInvoiceDue ? `<p><strong>Due:</strong> ${formatCurrency(Math.max(0, netTotal - paid), settings)}</p>` : ''}
                ` : ''}
              </div>
              
              <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280; text-align: center;">
                If you have any questions, please contact us.<br>
                ${settings?.brandName || 'Store Team'}
              </p>
            </div>
          `;
          
          sendEmail({
            to: saleData.customerEmail,
            subject: `${typeStr} #${docNumber} from ${settings?.brandName || 'Our Store'}`,
            html: emailHtml,
            orderId: orderRefId,
            category: saleData.type
          }).then(() => {
            toast.success(`Email sent to ${saleData.customerEmail}`);
          }).catch((emailErr: any) => {
            console.error("Failed to send email", emailErr);
          });
        } catch (emailBuildErr) {
          console.error("Email build error", emailBuildErr);
        }
      }

      toast.success(`${typeStr} #${docNumber} created successfully!`);

      // Log sale to Audit Trail
      await logAudit(
        editingOrder ? 'EDIT' : 'CREATE',
        'Sale',
        `${editingOrder ? 'Updated' : 'Created'} ${typeStr} #${docNumber} for ${saleData.customerName} (Net Total: ৳${netTotal}, Paid: ৳${paid}, Items: ${saleData.items.length})`,
        saleData.preparedBy || profile?.displayName || profile?.email || 'Admin',
        {
          entityId: orderRefId,
          newState: { documentNumber: docNumber, type: saleData.type, netTotal, paid, customerName: saleData.customerName, itemsCount: saleData.items.length }
        }
      );

      // Trigger sensitive action alert if high discount applied
      if (effectiveDiscount >= 500 || (subtotal > 0 && effectiveDiscount / subtotal >= 0.08)) {
        const discountPct = subtotal > 0 ? Math.round((effectiveDiscount / subtotal) * 100) : 0;
        recordSensitiveAlert({
          type: 'HIGH_DISCOUNT',
          severity: effectiveDiscount >= 2000 ? 'critical' : 'warning',
          title: 'High Discount Applied',
          message: `${saleData.preparedBy || profile?.displayName || 'Staff'} gave ৳${effectiveDiscount.toLocaleString()} (${discountPct}%) discount on ${typeStr} #${docNumber}`,
          amount: effectiveDiscount,
          documentNumber: docNumber,
          entityId: orderRefId,
          performedBy: saleData.preparedBy || profile?.displayName || profile?.email || 'Staff',
          metadata: { subtotal, netTotal, customerName: saleData.customerName, discountPercentage: discountPct }
        }).catch(() => {});
      }

      // Auto-print invoice/challan/quotation
      try {
        const savedOrder = { id: orderRefId, ...orderData, _autoPrint: true };
        generatePDF(savedOrder as any, saleData.type as any, settings);
      } catch (err) {
        console.error('Failed to auto-print PDF', err);
      }

      // Reset form & exit editing mode so subsequent sales never overwrite this order
      setSaleData({
        customerId: '',
        customerName: '',
        workOrderNumber: '',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: '',
        branchName: '',
        projectName: '',
        items: [],
        type: 'invoice',
        paymentMethod: '',
        paymentAccountId: '',
        saleSource: 'in_store',
        paidAmount: 0,
        discountAmount: 0,
        appliedDiscountPercentage: 0,
        appliedDiscountCode: '',
        notes: '',
      });
      setSaleDiscountCodeInput('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sales_form_draft');
        sessionStorage.removeItem('adminEditingOrder');
      }
      if (editingOrder && onCancelEdit) {
        onCancelEdit();
      }
      await fetchData();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products on the right catalog
  const filteredProducts = products.filter(product => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(q);
      const matchesCategory = (product.category || '').toLowerCase().includes(q);
      const matchesBrand = (product.brand || '').toLowerCase().includes(q);
      const matchesModel = (product.model || '').toLowerCase().includes(q);
      const matchesSku = (product.sku || '').toLowerCase().includes(q) || (product.id || '').toLowerCase().includes(q);
      const matchesSerial = (product.availableSerials || []).some((s: string) => s.toLowerCase().includes(q));
      if (!matchesName && !matchesCategory && !matchesBrand && !matchesModel && !matchesSku && !matchesSerial) return false;
    }
    return true;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* --- LEFT: SALES ORDER INVOICE FORM (7 COLS) --- */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 md:p-6 space-y-6">
          {/* Header & Quick Action Pills */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-sm shadow-rose-200 shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  {editingOrder ? (
                    <span>Editing Invoice <span className="text-blue-600">#{editingOrder.documentNumber || editingOrder.id}</span></span>
                  ) : (
                    <span>Create Sale & Invoice</span>
                  )}
                  <span className={cn(
                    "text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border tracking-wider",
                    saleData.type === 'invoice' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    saleData.type === 'challan' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {saleData.type}
                  </span>
                </h2>
                {editingOrder ? (
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                      Editing Existing Bill #{editingOrder.documentNumber || editingOrder.id} ({editingOrder.customerName || 'Customer'})
                    </span>
                    {onCancelEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            sessionStorage.removeItem('adminEditingOrder');
                            localStorage.removeItem('sales_form_draft');
                          }
                          onCancelEdit();
                        }}
                        className="text-[11px] font-bold bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-0.5 rounded transition-all shadow-2xs active:scale-95"
                      >
                        Exit Edit & Create New Bill
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 font-medium">Create invoices, delivery challans, or price quotations</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomProductModal(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-200 shadow-2xs hover:shadow-xs active:scale-95"
              >
                <PackagePlus size={14} className="text-indigo-600" /> Custom Product
              </button>
              <button
                type="button"
                onClick={handleAddCustomService}
                className="bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-violet-200 shadow-2xs hover:shadow-xs active:scale-95"
              >
                <Sparkles size={14} className="text-violet-600" /> Add Service
              </button>
              <button
                type="button"
                onClick={() => setShowPCBuilderModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              >
                <Cpu size={14} className="text-[#EF4444]" /> PC Builder
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateSale} className="space-y-6 text-xs">
            {/* Metadata Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              {/* Date */}
              <div className="min-w-0">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span>Sale Date</span>
                </label>
                <input
                  type="date"
                  value={saleData.date || ''}
                  onChange={e => setSaleData({ ...saleData, date: e.target.value })}
                  className="w-full h-10 border border-slate-200 bg-white rounded-xl px-3 font-semibold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>

              {/* Prepared By */}
              <div className="min-w-0">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 whitespace-nowrap">
                  <UserCheck size={13} className="text-slate-400 shrink-0" />
                  <span>Prepared By</span>
                </label>
                <PreparedBySelect
                  value={saleData.createdBy || ''}
                  onChange={val => setSaleData(prev => ({ ...prev, createdBy: val, preparedBy: val }))}
                  users={users}
                />
              </div>


              {/* Work Order # */}
              <div className="min-w-0">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 whitespace-nowrap">
                  <FileText size={13} className="text-slate-400 shrink-0" />
                  <span>Work Order / Ref</span>
                </label>
                <input
                  type="text"
                  placeholder="Optional ref #"
                  value={saleData.workOrderNumber || ''}
                  onChange={e => setSaleData({ ...saleData, workOrderNumber: e.target.value })}
                  className="w-full h-10 border border-slate-200 bg-white rounded-xl px-3 font-semibold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>

              {/* Document Type */}
              <div className="min-w-0">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 whitespace-nowrap">
                  <Receipt size={13} className="text-slate-400 shrink-0" />
                  <span>Document Type</span>
                </label>
                <select
                  value={saleData.type}
                  onChange={e => setSaleData({ ...saleData, type: e.target.value as any })}
                  className="w-full h-10 border border-slate-200 bg-white rounded-xl px-3 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
                >
                  <option value="invoice">Invoice</option>
                  <option value="challan">Challan</option>
                  <option value="quotation">Quotation</option>
                </select>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  <span>Customer <span className="text-red-500">*</span></span>
                </label>
                {(() => {
                  const due = getCustomerPreviousDue(saleData.customerId);
                  if (saleData.customerId && due > 0) {
                    return (
                      <span className="text-red-600 font-extrabold text-xs px-2.5 py-0.5 bg-red-50 border border-red-200 rounded-full flex items-center gap-1">
                        <AlertCircle size={12} />
                        Previous Due: {formatCurrency(due, settings)}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex gap-2">
                {(() => {
                  const q = customerQuery.trim().toLowerCase();
                  const qDigits = q.replace(/\D/g, '');
                  const matches = customers
                    .filter((cu: any) => {
                      if (!q) return true;
                      return (
                        (cu.name || '').toLowerCase().includes(q) ||
                        (cu.email || '').toLowerCase().includes(q) ||
                        (qDigits.length > 0 && String(cu.phone || '').replace(/\D/g, '').includes(qDigits))
                      );
                    })
                    .slice(0, 50);
                  const selectCustomer = (id: string) => {
                    handleCustomerChange(id);
                    setCustomerQuery('');
                    setIsCustomerOpen(false);
                  };
                  return (
                    <div className="relative w-full" ref={customerBoxRef}>
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        autoComplete="off"
                        value={isCustomerOpen ? customerQuery : (saleData.customerId ? `${saleData.customerName}${saleData.customerPhone ? ` (${saleData.customerPhone})` : ''}` : '')}
                        placeholder="Search customer by name or phone number..."
                        onFocus={() => { setIsCustomerOpen(true); setCustomerQuery(''); setCustomerHighlight(0); }}
                        onChange={e => { setCustomerQuery(e.target.value); setIsCustomerOpen(true); setCustomerHighlight(0); }}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') { e.preventDefault(); setIsCustomerOpen(true); setCustomerHighlight(h => Math.min(h + 1, matches.length - 1)); }
                          else if (e.key === 'ArrowUp') { e.preventDefault(); setCustomerHighlight(h => Math.max(h - 1, 0)); }
                          else if (e.key === 'Enter') { if (isCustomerOpen) { e.preventDefault(); if (matches[customerHighlight]) selectCustomer(matches[customerHighlight].id); } }
                          else if (e.key === 'Escape') { setIsCustomerOpen(false); setCustomerQuery(''); }
                        }}
                        className={cn(
                          "w-full h-11 border rounded-xl pl-10 pr-10 font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-2xs",
                          saleData.customerId ? "border-emerald-300 bg-emerald-50/20 text-emerald-950" : "border-slate-200"
                        )}
                      />
                      {saleData.customerId && (
                        <button
                          type="button"
                          title="Clear customer"
                          onClick={() => { handleCustomerChange(''); setCustomerQuery(''); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X size={15} />
                        </button>
                      )}
                      {isCustomerOpen && (
                        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-gray-50">
                          {matches.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">
                              <p className="font-semibold text-gray-700">No customer found{customerQuery ? ` for "${customerQuery}"` : ''}</p>
                              <button
                                type="button"
                                onClick={() => { setIsCustomerOpen(false); setIsAddingNewCustomer(true); }}
                                className="inline-flex items-center gap-1 mt-2 text-blue-600 font-bold hover:underline"
                              >
                                <Plus size={13} /> Add &quot;{customerQuery}&quot; as new customer
                              </button>
                            </div>
                          ) : (
                            matches.map((cu: any, idx: number) => (
                              <button
                                key={cu.id}
                                type="button"
                                onMouseEnter={() => setCustomerHighlight(idx)}
                                onClick={() => selectCustomer(cu.id)}
                                className={cn(
                                  "w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors",
                                  idx === customerHighlight ? "bg-blue-50/80" : "bg-white hover:bg-slate-50",
                                  cu.id === saleData.customerId && "bg-emerald-50/60 font-black text-emerald-900"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                                    {(cu.name || 'C').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <span className="text-xs font-bold text-gray-900 block truncate">{cu.name}</span>
                                    {cu.address && <span className="text-[10px] text-gray-400 block truncate">{cu.address}</span>}
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-slate-500 shrink-0 font-mono">{cu.phone || cu.email || ''}</span>
                              </button>
                            ))
                          )}
                          {customers.length > matches.length && matches.length === 50 && (
                            <div className="px-3 py-1.5 text-[10px] text-gray-400 text-center bg-gray-50">Showing first 50 results · keep typing to narrow down</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(true)}
                  className="bg-slate-900 hover:bg-[#EF4444] text-white px-4 h-11 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-xs text-xs active:scale-95"
                  title="Add New Customer"
                >
                  <Plus size={15} /> New Customer
                </button>
              </div>

              {saleData.customerId ? (
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                      {(saleData.customerName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-sm">{saleData.customerName}</span>
                        {saleData.customerPhone && <span className="text-slate-500 font-mono text-xs">({saleData.customerPhone})</span>}
                      </div>
                      {saleData.shippingAddress && <p className="text-[11px] text-slate-500 truncate">{saleData.shippingAddress}</p>}
                    </div>
                  </div>

                  {/* Branch / Project Selector */}
                  {(() => {
                    const selCust = customers.find(c => c.id === saleData.customerId);
                    const bSet = new Set<string>();
                    (selCust?.branches || []).forEach(b => {
                      if (b && typeof b === 'string' && b.trim()) bSet.add(b.trim());
                    });
                    if (selCust?.branchName && typeof selCust.branchName === 'string' && selCust.branchName.trim()) {
                      bSet.add(selCust.branchName.trim());
                    }
                    const bList = Array.from(bSet).filter(Boolean);

                    return (
                      <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                        <span className="text-[11px] font-black text-slate-500 uppercase whitespace-nowrap">
                          Branch / Project:
                        </span>
                        <select
                          value={saleData.branchName || ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '__new__') {
                              const newBr = window.prompt('Enter new Branch / Project name:');
                              if (newBr && newBr.trim()) {
                                setSaleData({ ...saleData, branchName: newBr.trim() });
                              }
                            } else {
                              setSaleData({ ...saleData, branchName: val });
                            }
                          }}
                          className="bg-transparent font-bold text-slate-800 outline-none text-xs cursor-pointer"
                        >
                          <option value="">-- None / No Project --</option>
                          {bList.map((br, bi) => (
                            <option key={bi} value={br}>{br}</option>
                          ))}
                          {saleData.branchName && !bList.includes(saleData.branchName) && (
                            <option value={saleData.branchName}>{saleData.branchName}</option>
                          )}
                          <option value="__new__">+ Add New Branch / Project...</option>
                        </select>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border border-blue-200/80 rounded-xl p-3 flex items-center gap-2.5 text-blue-900 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">i</div>
                  <span>
                    Select a customer using the search box above, or click <strong className="font-bold text-blue-700">&quot;+ New Customer&quot;</strong> to create one.
                  </span>
                </div>
              )}
            </div>

            {/* Cart Items Section */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                  <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-400" />
                    Selected Items
                  </label>
                  <span className="bg-slate-100 text-slate-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {saleData.items.length}
                  </span>
                </div>
                {saleData.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSaleData({ ...saleData, items: [] })}
                    className="text-red-500 hover:text-red-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} /> Clear Cart
                  </button>
                )}
              </div>

              {saleData.items.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200/90 rounded-2xl p-8 text-center text-slate-400 bg-slate-50/40">
                  <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-2xs">
                    <ShoppingBag size={24} />
                  </div>
                  <p className="font-bold text-slate-700 text-xs">Your sale cart is currently empty</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click products from the catalog on the right or scan barcodes to add items.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {saleData.items.map((item, idx) => {
                    const originalProd = products.find(p => p.id === item.id);
                    const displayImg = (item as any).imageUrl || originalProd?.imageUrl || (originalProd?.images && originalProd.images[0]);
                    return (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:border-slate-300 transition-all shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* Left: Product Thumbnail & Title */}
                          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                            <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                              {displayImg ? (
                                <img src={displayImg} alt={item.name} className="w-full h-full object-contain p-0.5" />
                              ) : item.isCustomService ? (
                                <Sparkles size={18} className="text-violet-500" />
                              ) : (
                                <Package size={18} className="text-slate-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              {item.isCustomService ? (
                                <div className="space-y-1 w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-extrabold text-violet-600 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-200">
                                      Custom Service
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPresets(ep => !ep)}
                                      className="text-[10px] text-violet-600 hover:text-violet-800 underline font-semibold"
                                    >
                                      {editingPresets ? 'Done' : 'Edit Presets'}
                                    </button>
                                  </div>
                                  <select
                                    value={servicePresets.includes(item.name) ? item.name : '__custom__'}
                                    onChange={e => {
                                      if (e.target.value !== '__custom__') updateItemName(item.id, e.target.value);
                                    }}
                                    className="border border-violet-200 bg-violet-50/30 rounded-lg py-1 px-2 font-semibold text-xs focus:ring-violet-500 w-full"
                                  >
                                    {servicePresets.map(p => <option key={p} value={p}>{p}</option>)}
                                    {!servicePresets.includes(item.name) && <option value="__custom__">{item.name || 'Custom...'}</option>}
                                  </select>
                                  <input 
                                    type="text"
                                    value={item.name} 
                                    onChange={e => updateItemName(item.id, e.target.value)}
                                    placeholder="Or type custom description..."
                                    className="w-full border border-slate-200 bg-white rounded-lg py-1 px-2 text-xs text-gray-900 focus:ring-1 focus:ring-violet-500 shadow-2xs"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-slate-900 block text-xs truncate">
                                    {item.name}{(item as any).variantName ? " - " + (item as any).variantName : ""}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                    <span>Stock: <strong className="text-slate-600">{originalProd?.stock || 0}</strong></span>
                                    <span>•</span>
                                    <span className="text-amber-700 font-semibold">Cost: {formatCurrency(originalProd?.costPrice || 0, settings)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Quantity Stepper & Prices & Trash */}
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Editable Cost Price (Service Only) */}
                            {item.isCustomService && (
                              <div className="flex flex-col items-center">
                                <label className="text-[9px] font-extrabold text-amber-600 uppercase">Cost Price</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.costPrice || 0}
                                  onChange={e => updateItemCostPrice(item.id, Number(e.target.value))}
                                  className="w-20 text-center border border-amber-200 bg-amber-50/50 rounded-lg py-1 font-bold text-amber-900 focus:ring-1 focus:ring-amber-500 text-xs"
                                  placeholder="0"
                                  title="Used for profit calculation"
                                />
                              </div>
                            )}

                            {/* Editable Sale Price */}
                            <div className="flex flex-col items-center">
                              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Unit Price</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.price}
                                  onChange={e => updateItemPrice(item.id, Number(e.target.value))}
                                  className="w-22 text-center border border-slate-200 bg-slate-50/60 rounded-lg py-1 font-black text-slate-900 focus:ring-1 focus:ring-blue-500 text-xs"
                                />
                              </div>
                            </div>

                            {/* Quantity Stepper & Unit */}
                            <div className="flex flex-col items-center">
                              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Qty & Unit</label>
                              <div className="flex items-stretch border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(item.id, item.quantity - 1)}
                                  className="px-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border-r border-slate-200 flex items-center justify-center transition-colors"
                                >
                                  <Minus size={11} />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={originalProd?.stock || 9999}
                                  value={item.quantity}
                                  onChange={e => updateItemQty(item.id, Number(e.target.value))}
                                  className="w-10 text-center py-1 font-black text-xs text-slate-900 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(item.id, item.quantity + 1)}
                                  className="px-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border-l border-slate-200 flex items-center justify-center transition-colors"
                                >
                                  <Plus size={11} />
                                </button>
                                <select
                                  value={(item as any).unit || originalProd?.unit || 'pcs'}
                                  onChange={e => {
                                    setSaleData(prev => ({
                                      ...prev,
                                      items: prev.items.map(i => i.id === item.id ? { ...i, unit: e.target.value } : i)
                                    }));
                                  }}
                                  className="border-l border-slate-200 py-1 px-1.5 text-[10px] font-bold bg-slate-50 text-slate-600 outline-none cursor-pointer"
                                >
                                  <option value="pcs">pcs</option>
                                  <option value="nos">nos</option>
                                  <option value="meter">meter</option>
                                  <option value="kg">kg</option>
                                  <option value="gm">gm</option>
                                  <option value="litre">litre</option>
                                  <option value="box">box</option>
                                  <option value="pack">pack</option>
                                  <option value="chop">chop</option>
                                </select>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="text-right min-w-[70px]">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Total</span>
                              <span className="font-black text-slate-900 text-xs block">
                                {formatCurrency(item.price * item.quantity, settings)}
                              </span>
                            </div>

                            {/* Trash Delete */}
                            <button
                              type="button"
                              onClick={() => setSaleData(prev => ({
                                ...prev,
                                items: prev.items.filter(i => i.id !== item.id),
                              }))}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Serial Numbers (if serial tracking is enabled) */}
                        {item.hasSerialTracking && (
                          <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <p className={cn(
                              "text-[10px] font-extrabold uppercase mb-1.5 flex items-center justify-between",
                              (item.selectedSerials?.length || 0) !== item.quantity ? "text-red-500" : "text-emerald-700"
                            )}>
                              <span className="flex items-center gap-1">
                                <Barcode size={12} />
                                Serial Numbers (Required: {item.quantity} | Selected: {item.selectedSerials?.length || 0})
                              </span>
                              {(item.selectedSerials?.length || 0) !== item.quantity && (
                                <span className="bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-extrabold">Must Select!</span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(originalProd?.availableSerials || []).length === 0 ? (
                                <span className="text-xs text-red-500 font-bold">No serials in stock!</span>
                              ) : (originalProd?.availableSerials || []).map((serial: string) => {
                                const isSelected = (item.selectedSerials || []).includes(serial);
                                return (
                                  <button
                                    type="button"
                                    key={serial}
                                    onClick={() => {
                                      let newSelected = [...(item.selectedSerials || [])];
                                      if (isSelected) {
                                        newSelected = newSelected.filter(s => s !== serial);
                                      } else if (newSelected.length < item.quantity) {
                                        newSelected.push(serial);
                                      } else {
                                        toast.error(`Already selected ${item.quantity} serial(s)`);
                                      }
                                      setSaleData(prev => ({
                                        ...prev,
                                        items: prev.items.map(i => i.id === item.id ? { ...i, selectedSerials: newSelected } : i),
                                      }));
                                    }}
                                    className={cn(
                                      "px-2 py-0.5 text-[11px] rounded-md border font-mono transition-all font-semibold",
                                      isSelected ? "bg-red-600 text-white border-red-600 shadow-2xs" : "bg-white text-slate-700 border-slate-200 hover:border-red-300"
                                    )}
                                  >
                                    {serial}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Discounts & Payment Details Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              {/* Left: Discounts & Coupons */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Tag size={13} className="text-slate-400" />
                  Discounts & Coupons
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER COUPON CODE"
                    value={saleDiscountCodeInput}
                    onChange={e => setSaleDiscountCodeInput(e.target.value)}
                    className="flex-1 border border-slate-200 bg-white rounded-xl px-3 py-2 uppercase font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplySaleDiscountCode}
                    className="bg-slate-900 text-white px-3.5 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors text-xs active:scale-95 shadow-2xs"
                  >
                    Apply
                  </button>
                </div>
                {saleData.appliedDiscountCode && (
                  <div className="flex justify-between items-center bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 font-extrabold text-[11px] flex items-center gap-1">
                      <CheckCircle size={12} /> {saleData.appliedDiscountCode} ({saleData.appliedDiscountPercentage}% OFF)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSaleData({ ...saleData, appliedDiscountCode: '', appliedDiscountPercentage: 0 })}
                      className="text-red-500 font-bold text-[11px] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    Manual Cash Discount
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={saleData.appliedDiscountPercentage > 0}
                    value={saleData.discountAmount || ''}
                    onChange={e => setSaleData({ ...saleData, discountAmount: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Right: Payment Method & Paid Amount */}
              {saleData.type !== 'quotation' && (
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CreditCard size={13} className="text-slate-400" />
                    Payment Collection
                  </span>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                      Deposit Into Account
                    </label>
                    <select
                      value={saleData.paymentAccountId}
                      onChange={e => {
                        const acc = paymentAccounts.find(a => a.id === e.target.value);
                        setSaleData({
                          ...saleData,
                          paymentAccountId: e.target.value,
                          paymentMethod: acc?.type || 'cash',
                        });
                      }}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Select Payment Account --</option>
                      {paymentAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase">
                        Paid Amount
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSaleData({ ...saleData, paidAmount: 0 })}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline"
                        >
                          Full Due (0)
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => {
                            const prevDue = getCustomerPreviousDue(saleData.customerId);
                            setSaleData({ ...saleData, paidAmount: netTotal + (prevDue > 0 ? prevDue : 0) });
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:underline"
                        >
                          Full Paid
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={saleData.paidAmount || ''}
                      onChange={e => setSaleData({ ...saleData, paidAmount: Number(e.target.value) || 0 })}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 font-black text-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 shadow-2xs"
                      placeholder="Enter amount (0 for Full Due)"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                      Sale Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={saleData.notes}
                      onChange={e => setSaleData({ ...saleData, notes: e.target.value })}
                      placeholder="e.g. Courier via SA Paribahan, handle with care..."
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  {/* Due preview */}
                  {(() => {
                    const prevDue = getCustomerPreviousDue(saleData.customerId);
                    const totalDueNow = netTotal + (prevDue > 0 ? prevDue : 0) - (Number(saleData.paidAmount) || 0);
                    if (totalDueNow > 0) {
                      return (
                        <div className="flex justify-between items-center text-xs font-extrabold text-amber-900 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                          <span>Remaining Balance (Due):</span>
                          <span>{formatCurrency(totalDueNow, settings)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* Total Financial Summary Footer */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-700">{formatCurrency(subtotal, settings)}</span>
              </div>
              {effectiveDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Applied</span>
                  <span>- {formatCurrency(effectiveDiscount, settings)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-2 border-t border-slate-200">
                <span>Current Invoice Total</span>
                <span className="text-base text-slate-900">{formatCurrency(netTotal, settings)}</span>
              </div>
              {(() => {
                const prevDue = getCustomerPreviousDue(saleData.customerId);
                if (prevDue > 0) {
                  return (
                    <>
                      <div className="flex justify-between text-red-500 font-bold text-xs pt-1">
                        <span>Customer Previous Due</span>
                        <span>+ {formatCurrency(prevDue, settings)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-black text-slate-900 pt-2 border-t border-slate-300">
                        <span>Grand Total Payable</span>
                        <span className="text-2xl text-[#EF4444] font-black">{formatCurrency(netTotal + prevDue, settings)}</span>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="flex justify-between items-center text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Payable</span>
                      <span className="text-2xl text-slate-900 font-black">{formatCurrency(netTotal, settings)}</span>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={holdCurrentSale}
                disabled={saleData.items.length === 0}
                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 disabled:opacity-40 py-3 rounded-xl font-extrabold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 border border-amber-200 active:scale-98 cursor-pointer"
              >
                <PauseCircle size={16} className="text-amber-700" />
                Hold Current Sale
              </button>
              <button
                type="submit"
                disabled={submitting || saleData.items.length === 0 || !saleData.customerId}
                className="w-full bg-slate-900 hover:bg-[#EF4444] disabled:opacity-40 text-white py-3 rounded-xl font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <CheckCircle size={16} />
                {submitting ? 'Generating Document...' : (editingOrder ? 'Update & Save Changes' : `Confirm & Save ${saleData.type.toUpperCase()}`)}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- RIGHT: PRODUCT CATALOG & QUICK SELECT (5 COLS) --- */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 space-y-4">
          {/* Held Sales Banner */}
          {heldSales.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl p-3.5 shadow-2xs">
              <h4 className="text-[11px] font-extrabold text-amber-900 uppercase mb-2 flex items-center gap-2 tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Held Sales ({heldSales.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {heldSales.map(hold => (
                  <button
                    key={hold.id}
                    type="button"
                    onClick={() => restoreSale(hold.id)}
                    className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    <span>{hold.saleData.customerName || 'Walk-in'}</span>
                    <span className="text-[10px] text-amber-600 font-semibold">• {hold.time}</span>
                    <span className="bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md text-[10px] font-black">
                      {hold.saleData.items.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Catalog Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Store size={16} className="text-slate-500" />
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Product Catalog</h3>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full">
              {filteredProducts.length} Items
            </span>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2 text-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Scan barcode or search name, SKU, model..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const currentValue = e.currentTarget.value.trim();
                    if (!currentValue) return;
                    const success = executeScan(currentValue);
                    if (success) {
                      setProductSearch('');
                    }
                  }
                }}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all text-xs font-medium shadow-2xs"
              />
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 bg-white rounded-xl outline-none font-semibold text-slate-700 text-xs shadow-2xs cursor-pointer focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            >
              <option value="all">-- All Categories ({products.length}) --</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Product Items List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                <Package size={28} className="mx-auto mb-1.5 opacity-40 text-slate-400" />
                <p className="font-semibold text-slate-600">No products match your search</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try a different keyword or category</p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const thumb = product.imageUrl || (product.images && product.images[0]);
                return (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 border rounded-xl transition-all gap-2.5",
                      isOutOfStock
                        ? "bg-slate-50/60 border-slate-200 opacity-60"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={product.name} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Package size={18} className="text-slate-400" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate" title={product.name}>
                        {product.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-slate-900">
                          {formatCurrency(product.price, settings)}
                        </span>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase border",
                          product.stock > 5 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          product.stock > 0 ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addItemToSale(product)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 shrink-0",
                        isOutOfStock
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-slate-900 hover:bg-[#EF4444] text-white shadow-2xs active:scale-95 cursor-pointer"
                      )}
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isAddingNewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-[#081621] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <User size={16} className="text-[#EF4444]" /> Add & Select New Customer
              </h3>
              <button onClick={() => setIsAddingNewCustomer(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Customer / Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Volumezero, Simpletree, or Md. Rahim"
                  value={newCustomerForm.name}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Branch / Project Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Simpletree, Treelogy Two, Kapilmuni (leave empty for retail)"
                  value={newCustomerForm.branchName || ''}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, branchName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={newCustomerForm.phone}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={newCustomerForm.email}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  placeholder="House, Road, City"
                  value={newCustomerForm.address}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>



              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#EF4444] hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} /> Add & Select Customer
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCustomProductModal && (
        <CustomProductPurchaseModal 
          onClose={() => setShowCustomProductModal(false)} 
          onSuccess={(product) => {
            setShowCustomProductModal(false);
            addItemToSale(product);
          }} 
        />
      )}
      {/* Quick Add Business Unit / Sister Concern Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        companies={companies}
        onSave={async (compData) => {
          const created = await addCompany(compData);
          if (companyModalTarget === 'customer') {
            setNewCustomerForm(prev => ({ ...prev, company: created.id }));
          } else {
            setSaleData(prev => ({ ...prev, company: created.id }));
          }
          setIsCompanyModalOpen(false);
        }}
      />
    </div>
  );
};
