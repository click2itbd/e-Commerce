import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order, OrderStatus, Customer, Vendor, Transaction, TransactionCategory, NavigationMenu, SubCategory, UserProfile, SiteSettings, Campaign, ProductVariant, DiscountCode, HostingPlan, HostingService, SoldSerial, ServiceRecord, DocumentDesignSettings, UserPermission, Lead } from '../types';
import { CRMPage } from './CRMPage';
import { TaskManager } from '../components/TaskManager';
import { SupportTicketManager } from '../components/SupportTicketManager';
import { AdminOverviewDashboard } from '../components/AdminOverviewDashboard';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { CRMIntegrationsSetting } from '../components/CRMIntegrationsSetting';
import { Layout } from '../components/Layout';
import { BulkEditForm } from '../components/BulkEditForm';
import { QuotationManager } from '../components/QuotationManager';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Package, FileText, ShoppingBag, CheckCircle, Clock, Truck, XCircle, Download, Upload, Cpu, Users, Briefcase, CreditCard, Menu as MenuIcon, ChevronRight, Settings, Search, AlertTriangle, Mail, Phone, MessageCircle, Send, List, Ticket, ShieldAlert, Receipt, Server, Edit, X, ArrowLeftRight, ShieldCheck, ShoppingCart, Tag, Percent, LogOut, User, Book, CheckSquare, ArrowLeft, LifeBuoy, Activity, BarChart2, Monitor, Fan, Keyboard, Mouse, Speaker, Headphones, Wifi, BatteryCharging, HardDrive, Plug, Zap, Database, Star, ArrowRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateDocumentNumber } from '../lib/numbering';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionCategories, setTransactionCategories] = useState<TransactionCategory[]>([]);
  const [isAddingTransactionCategory, setIsAddingTransactionCategory] = useState(false);
  const [newTransactionCategory, setNewTransactionCategory] = useState<Partial<TransactionCategory>>({ name: '', type: 'expense', description: '' });

  const [isAddingManualTransaction, setIsAddingManualTransaction] = useState(false);
  const [manualTransactionType, setManualTransactionType] = useState<'income' | 'expense'>('expense');
  const [newManualTransaction, setNewManualTransaction] = useState<Partial<Transaction>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
  });

  const handleSaveTransactionCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransactionCategory.name) return;

    try {
      const category: Omit<TransactionCategory, 'id'> = {
        name: newTransactionCategory.name,
        type: newTransactionCategory.type as 'income' | 'expense',
        description: newTransactionCategory.description || '',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'transaction_categories'), category);
      setTransactionCategories([...transactionCategories, { id: docRef.id, ...category } as TransactionCategory]);
      setIsAddingTransactionCategory(false);
      setNewTransactionCategory({ name: '', type: 'expense', description: '' });
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  
  const handleSaveConveyance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConveyance.description || newConveyance.amount <= 0) return;
    const c = { id: Date.now().toString(), ...newConveyance };
    const updated = [...conveyances, c];
    setConveyances(updated);
    setIsAddingConveyance(false);
    toast.success('Conveyance added successfully');
  };

  const handleSaveManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManualTransaction.amount || newManualTransaction.amount <= 0 || !newManualTransaction.description) {
      toast.error('Please enter amount and description');
      return;
    }

    const selectedCategory = transactionCategories.find(c => c.id === newManualTransaction.categoryId);

    try {
      const transactionData: Omit<Transaction, 'id'> = {
        type: manualTransactionType,
        amount: newManualTransaction.amount,
        date: newManualTransaction.date || new Date().toISOString().split('T')[0],
        description: newManualTransaction.description || '',
        entityId: 'manual', // indicates no specific customer/vendor
        entityName: 'Manual Entry',
        categoryId: newManualTransaction.categoryId,
        categoryName: selectedCategory ? selectedCategory.name : 'Uncategorized',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      setTransactions([...transactions, { id: docRef.id, ...transactionData } as Transaction]);
      
      setIsAddingManualTransaction(false);
      setNewManualTransaction({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
      });
      toast.success('Transaction saved successfully');
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction');
    }
  };

  const [menus, setMenus] = useState<NavigationMenu[]>([]);
    const [conveyances, setConveyances] = useState<{id: string, date: string, description: string, amount: number, employee: string}[]>([]);
  const [isAddingConveyance, setIsAddingConveyance] = useState(false);
  const [newConveyance, setNewConveyance] = useState({date: new Date().toISOString().split('T')[0], description: '', amount: 0, employee: ''});
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [hostingPlans, setHostingPlans] = useState<HostingPlan[]>([]);
  const [hostingServices, setHostingServices] = useState<HostingService[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeLeaves, setEmployeeLeaves] = useState<any[]>([]);
  const [employeeSalaries, setEmployeeSalaries] = useState<any[]>([]);

  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [editingLeave, setEditingLeave] = useState<any>(null);
  const [isAddingSalary, setIsAddingSalary] = useState(false);
  const [editingSalary, setEditingSalary] = useState<any>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({ name: '', email: '', password: '', role: 'user', permissions: [] as UserPermission[] });
  const [employeeFormData, setEmployeeFormData] = useState<any>({ name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, status: 'active', joinDate: '', confirmDate: '', dateOfBirth: '', nidNumber: '', certificateUrl: '', nidUrl: '', cvUrl: '' });
  const [leaveFormData, setLeaveFormData] = useState<any>({ employeeName: '', type: 'casual', startDate: '', endDate: '', reason: '', status: 'pending' });
  const [salaryFormData, setSalaryFormData] = useState<any>({ employeeName: '', month: '', baseAmount: 0, deductions: 0, bonus: 0, netPay: 0, status: 'pending', paymentDate: '' });

  const [settingsTab, setSettingsTab] = useState<'business' | 'pos' | 'tax' | 'invoice' | 'zatca' | 'email' | 'sms' | 'whatsapp' | 'whitelabel' | 'pwa' | 'crm_integrations' | 'review_integrations' | 'external_ecommerce'>('business');
    const [paymentAccountSort, setPaymentAccountSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [isAddingPaymentAccount, setIsAddingPaymentAccount] = useState(false);
  const [paymentAccountFormData, setPaymentAccountFormData] = useState({ type: '', name: '', description: '', openingBalance: 0, status: 'active' });
const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'inventory' | 'orders' | 'sales' | 'quotations' | 'purchases' | 'purchase_return' | 'sale_return' | 'customers' | 'vendors' | 'transactions' | 'menus' | 'reports' | 'all_reports' | 'customer_receive_report' | 'ledger' | 'manual_income' | 'manual_expense' | 'tx_categories' | 'users' | 'campaigns' | 'discountCodes' | 'hostingPlans' | 'hostingServices' | 'settings' | 'services' | 'employees' | 'leave' | 'salary' | 'conveyance' | 'deposits_withdrawals' | 'account_balance' | 'account_statement' | 'balance_sheet' | 'trial_balance' | 'transaction_history' | 'payment_accounts' | 'crm' | 'tasks' | 'support_tickets'>('dashboard');
  
  const [serialSelectionModal, setSerialSelectionModal] = useState<{
    isOpen: boolean;
    orderId: string;
    newStatus: OrderStatus;
    items: { productId: string; productName: string; quantity: number; availableSerials: string[]; selectedSerials: string[]; warrantyMonths: number }[];
  } | null>(null);

  const [servicesData, setServicesData] = useState<{
    searchQuery: string;
    searchResult: SoldSerial | null;
    isCreatingTicket: boolean;
    ticketFormData: Partial<ServiceRecord>;
  }>({
    searchQuery: '',
    searchResult: null,
    isCreatingTicket: false,
    ticketFormData: {}
  });

  const { isAdmin, isManager, isStaff, hasPermission } = useAuth();
  const [showLedgerReportModal, setShowLedgerReportModal] = useState<boolean>(false);
  const [ledgerReportModalData, setLedgerReportModalData] = useState<any[]>([]);
  const [ledgerReportType, setLedgerReportType] = useState<'income' | 'expense' | null>(null);

  const { settings, updateSettings } = useSettings();
  const [settingsFormData, setSettingsFormData] = useState<SiteSettings>(settings);

  const [taxCalcAmount, setTaxCalcAmount] = useState<number>(0);
  useEffect(() => {
    setSettingsFormData(settings);
  }, [settings]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [isAddingDiscountCode, setIsAddingDiscountCode] = useState(false);
  const [isAddingHostingPlan, setIsAddingHostingPlan] = useState(false);
  const [isAddingHostingService, setIsAddingHostingService] = useState(false);
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);
  const [isCreatingSale, setIsCreatingSale] = useState(false);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editingMenu, setEditingMenu] = useState<NavigationMenu | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingDiscountCode, setEditingDiscountCode] = useState<DiscountCode | null>(null);
  const [editingHostingPlan, setEditingHostingPlan] = useState<HostingPlan | null>(null);
  const [editingHostingService, setEditingHostingService] = useState<HostingService | null>(null);
  const [selectedLedgerEntity, setSelectedLedgerEntity] = useState<{ id: string, name: string, type: 'customer' | 'vendor' } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDescription, setPaymentDescription] = useState<string>('');
  const [ledgerPaymentMethod, setLedgerPaymentMethod] = useState<string>('cash');
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  
  const handleFileUpload = async (file: File | null) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `hr/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setIsUploading(false);
      return url;
    } catch (err) {
      setIsUploading(false);
      toast.error('File upload failed');
      return null;
    }
  };

  const handleAddPortalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userFormData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, userFormData.email, userFormData.password);
      
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: userFormData.email,
        displayName: userFormData.name || userFormData.email.split('@')[0],
        role: userFormData.role,
        permissions: userFormData.permissions,
        createdAt: new Date().toISOString(),
      });
      
      await secondaryAuth.signOut();
      
      toast.success('User added successfully');
      setIsAddingUser(false);
      fetchData();
    } catch (err: any) {
      toast.error('Error adding user: ' + err.message);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    try {
      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images.filter(img => img !== ''), ...urls]
      }));
      toast.success(`Successfully uploaded ${urls.length} images`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  const [showPCBuilderModal, setShowPCBuilderModal] = useState(false);

  
  // Ledger State
  const [generalLedgerFilterType, setGeneralLedgerFilterType] = useState<'daily' | 'monthly'>('daily');
  const [generalLedgerStartDate, setGeneralLedgerStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [generalLedgerEndDate, setGeneralLedgerEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Make sure we have a function to get ledger data
  const getLedgerData = () => {
    const data: { [key: string]: { date: string, income: number, expense: number, balance: number, details: any[] } } = {};
    
    transactions.forEach(tx => {
      const txDateStr = new Date(tx.date).toISOString().split('T')[0];
      if (txDateStr >= generalLedgerStartDate && txDateStr <= generalLedgerEndDate) {
        // format key based on type
        const key = generalLedgerFilterType === 'monthly' ? txDateStr.substring(0, 7) : txDateStr;
        const displayDate = generalLedgerFilterType === 'monthly' ? new Date(tx.date).toLocaleString('default', { month: 'long', year: 'numeric' }) : txDateStr;
        
        if (!data[key]) {
          data[key] = { date: displayDate, income: 0, expense: 0, balance: 0, details: [] };
        }
        
        const isIncome = ['sale', 'payment_received', 'money_receipt', 'income'].includes(tx.type);
        if (isIncome) {
          data[key].income += tx.amount;
        } else {
          data[key].expense += tx.amount;
        }
        
        data[key].balance = data[key].income - data[key].expense;
        data[key].details.push(tx);
      }
    });
    
    // Convert to array and sort by date desc
    return Object.keys(data).sort((a, b) => b.localeCompare(a)).map(k => data[k]);
  };

  // Report State
  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportSearch, setReportSearch] = useState('');
  const [reportSortConfig, setReportSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  // Customer Receive Report Filter State
  const [crReportStartDate, setCrReportStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [crReportEndDate, setCrReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [crReportSearch, setCrReportSearch] = useState('');
  const [crReportMethod, setCrReportMethod] = useState('all');
  const [crReportCustomer, setCrReportCustomer] = useState('all');

  // Purchase Filter State
  const [purchaseStartDate, setPurchaseStartDate] = useState('');
  const [purchaseEndDate, setPurchaseEndDate] = useState('');
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [orderSort, setOrderSort] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');
  const [ledgerStartDate, setLedgerStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [ledgerEndDate, setLedgerEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [ledgerView, setLedgerView] = useState<'ledger' | 'products'>('ledger');
  const [vendorProductSearchQuery, setVendorProductSearchQuery] = useState('');
  const [vendorProductCategoryFilter, setVendorProductCategoryFilter] = useState<string>('all');
  
  const [editingUserPermissions, setEditingUserPermissions] = useState<any | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Selection State for Bulk Actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all');
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    price: '',
    stock: '',
    category: '',
    vendorId: '',
    socketType: '',
    ramType: '',
  });

  // Sale Form State
  const [saleData, setSaleData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    items: [] as any[],
    type: 'invoice' as any,
    discountAmount: 0,
    appliedDiscountPercentage: 0,
    appliedDiscountCode: '',
  });

  const [saleDiscountCodeInput, setSaleDiscountCodeInput] = useState('');

  const handleApplySaleDiscountCode = () => {
    if (!saleDiscountCodeInput) return;
    const foundCode = discountCodes.find(c => c.code.toUpperCase() === saleDiscountCodeInput.toUpperCase() && c.isActive);
    if (foundCode) {
      if (new Date(foundCode.expiryDate) < new Date()) {
        toast.error("Discount code expired");
        return;
      }
      setSaleData({
        ...saleData,
        appliedDiscountPercentage: foundCode.discountPercentage,
        appliedDiscountCode: foundCode.code,
        discountAmount: 0 // Reset manual
      });
      toast.success(`Discount code applied: ${foundCode.discountPercentage}% off`);
    } else {
      toast.error("Invalid discount code");
    }
  };


  const [purchaseData, setPurchaseData] = useState({
    vendorId: '',
    vendorName: '',
    items: [] as any[],
    description: '',
  });

  const [soldSerials, setSoldSerials] = useState<SoldSerial[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    stock: 0,
    category: 'Laptop',
    description: '',
    images: [] as string[],
    socketType: '',
    ramType: '',
    chipset: '',
    vendorId: '',
    variants: [] as ProductVariant[],
    specs: {} as Record<string, string>,
    hasSerialTracking: false,
    availableSerials: [] as string[],
    warrantyMonths: 0,
  });

  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [vendorFormData, setVendorFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: 'General',
  });

  const [discountCodeFormData, setDiscountCodeFormData] = useState({
    code: '',
    discountPercentage: 0,
    expiryDate: '',
    isActive: true,
  });

  const [hostingPlanFormData, setHostingPlanFormData] = useState({
    serviceId: '',
    name: '',
    price: 0,
    billingCycle: '/mo',
    features: [] as string[],
    popular: false,
    order: 0,
  });

  const [hostingServiceFormData, setHostingServiceFormData] = useState({
    title: '',
    description: '',
    iconPath: '',
    startingPrice: 0,
    billingCycle: '/mo',
    currency: 'BDT',
    order: 0,
    isActive: true,
  });

  const [menuFormData, setMenuFormData] = useState({
    name: '',
    slug: '',
    order: 0,
    subCategories: [] as SubCategory[],
  });

  const [subCategoryFormData, setSubCategoryFormData] = useState({
    parentId: '',
    name: '',
    slug: '',
  });

  const [campaignFormData, setCampaignFormData] = useState({
    title: '',
    channel: 'email' as 'email' | 'sms' | 'whatsapp' | 'facebook' | 'instagram' | 'google',
    subject: '',
    content: '',
    recipients: [] as string[],
    bulkEmails: '', // Can represent phone numbers as well depending on channel
    selectedUserIds: [] as string[],
    scheduledAt: '',
    targetAudience: '',
    budget: '',
    targetUrl: '',
    imageUrl: '',
  });

  const [serviceFormData, setServiceFormData] = useState({
    serialNumber: '',
    customerName: '',
    customerPhone: '',
    productName: '',
    equipmentType: 'Laptop',
    issueDescription: '',
    isWarranty: false,
    serviceCharge: 0,
    paymentStatus: 'pending' as 'pending' | 'paid',
    paymentMethod: 'cash',
    medeaPayment: '',
    status: 'received' as 'received' | 'in_progress' | 'ready' | 'delivered',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedProductIds([]);
    setSelectedOrderIds([]);
  }, [activeTab]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmColor?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const ConfirmModal = () => {
    if (!confirmModal.isOpen) return null;
    const confirmText = confirmModal.confirmText || 'Confirm Delete';
    const confirmColor = confirmModal.confirmColor || 'bg-red-600 hover:bg-red-700 shadow-red-200';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">{confirmModal.title}</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 leading-relaxed">{confirmModal.message}</p>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                confirmModal.onConfirm();
                setConfirmModal({ ...confirmModal, isOpen: false });
              }}
              className={cn(
                "px-6 py-2 text-white rounded-lg transition-all font-bold shadow-lg",
                confirmColor
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const productsSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const customersSnap = await getDocs(query(collection(db, 'customers'), orderBy('createdAt', 'desc')));
      const vendorsSnap = await getDocs(query(collection(db, 'vendors'), orderBy('createdAt', 'desc')));
      const transactionsSnap = await getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')));
      const menusSnap = await getDocs(query(collection(db, 'menus'), orderBy('order', 'asc')));
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const campaignsSnap = await getDocs(query(collection(db, 'campaigns'), orderBy('createdAt', 'desc')));
      const discountCodesSnap = await getDocs(query(collection(db, 'couponCodes'), orderBy('createdAt', 'desc')));
      const hostingPlansSnap = await getDocs(query(collection(db, 'hostingPlans'), orderBy('order', 'asc')));
      const hostingServicesSnap = await getDocs(query(collection(db, 'hostingServices'), orderBy('order', 'asc')));
      const soldSerialsSnap = await getDocs(query(collection(db, 'sold_serials'), orderBy('soldAt', 'desc')));
      const serviceRecordsSnap = await getDocs(query(collection(db, 'service_records'), orderBy('receivedAt', 'desc')));
      const paymentAccountsSnap = await getDocs(query(collection(db, 'payment_accounts'), orderBy('createdAt', 'desc')));
      const transactionCategoriesSnap = await getDocs(query(collection(db, 'transaction_categories'), orderBy('createdAt', 'desc')));
      
      try {
        const employeesSnap = await getDocs(query(collection(db, 'employees'), orderBy('createdAt', 'desc')));
        const employeeLeavesSnap = await getDocs(query(collection(db, 'employee_leaves'), orderBy('createdAt', 'desc')));
        const employeeSalariesSnap = await getDocs(query(collection(db, 'employee_salaries'), orderBy('createdAt', 'desc')));
        setEmployees(employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setEmployeeLeaves(employeeLeavesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setEmployeeSalaries(employeeSalariesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.log('HR collections might not exist yet'); }

      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
      setCustomers(customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
      setVendors(vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vendor[]);
      setTransactions(transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]);
      setMenus(menusSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NavigationMenu[]);
      setUsers(usersSnap.docs.map(doc => doc.data()) as UserProfile[]);
      setCampaigns(campaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campaign[]);
      setDiscountCodes(discountCodesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DiscountCode[]);
      setHostingPlans(hostingPlansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HostingPlan[]);
      setHostingServices(hostingServicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HostingService[]);
      setSoldSerials(soldSerialsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SoldSerial[]);
      setServiceRecords(serviceRecordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceRecord[]);
      setPaymentAccounts(paymentAccountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      setTransactionCategories(transactionCategoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TransactionCategory[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(settingsFormData);
      toast.success('Site settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save site settings');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updates: Record<string, any> = {};
      if (bulkEditData.price) updates.price = Number(bulkEditData.price);
      if (bulkEditData.stock) updates.stock = Number(bulkEditData.stock);
      if (bulkEditData.category) updates.category = bulkEditData.category;
      if (bulkEditData.vendorId) updates.vendorId = bulkEditData.vendorId;
      if (bulkEditData.socketType) updates.socketType = bulkEditData.socketType;
      if (bulkEditData.ramType) updates.ramType = bulkEditData.ramType;

      if (Object.keys(updates).length === 0) {
        toast.error('Please specify at least one field to update');
        return;
      }

      const batch = selectedProductIds.map(async id => {
        await updateDoc(doc(db, 'products', id), updates);
        if (updates.stock !== undefined) {
          const product = products.find(p => p.id === id);
          if (product) {
            checkLowStock(product.name, updates.stock);
          }
        }
      });

      await Promise.all(batch);
      toast.success(`Successfully updated ${selectedProductIds.length} products`);
      setIsBulkEditing(false);
      setSelectedProductIds([]);
      setBulkEditData({ price: '', stock: '', category: '', vendorId: '', socketType: '', ramType: '' });
      fetchData();
    } catch (error) {
      console.error('Error bulk updating products:', error);
      toast.error('Failed to update products');
    } finally {
      setLoading(false);
    }
  };

  const checkLowStock = async (productName: string, newStock: number) => {
    if (
      settings.lowStockThreshold !== undefined &&
      settings.lowStockEmail &&
      newStock < settings.lowStockThreshold
    ) {
      try {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #16a34a; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ef4444; margin: 0;">Low Stock Alert</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Action Required</p>
            </div>
            <p><strong>${productName}</strong> has dropped below the low stock threshold.</p>
            <p>Current stock: <strong style="color: #ef4444;">${newStock}</strong></p>
            <p>Threshold: <strong>${settings.lowStockThreshold}</strong></p>
          </div>
        `;
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: settings.lowStockEmail,
            subject: `Low Stock Alert: ${productName}`,
            html: emailHtml,
          }),
        });
      } catch (error) {
        console.error('Error sending low stock alert:', error);
      }
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      let permissions: UserPermission[] = [];
      if (newRole === 'admin') permissions = ['view_dashboard', 'manage_users', 'manage_settings', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports', 'manage_hr', 'manage_services', 'manage_marketing'];
      else if (newRole === 'manager') permissions = ['view_dashboard', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports'];
      else if (newRole === 'staff') permissions = ['view_dashboard', 'manage_inventory', 'manage_orders'];
      
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        permissions
      });
      toast.success('User role and permissions updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: `${editingProduct ? 'Update' : 'Create'} Product`,
      message: `Are you sure you want to ${editingProduct ? 'update' : 'create'} the product "${formData.name}"?`,
      confirmText: 'Confirm',
      confirmColor: 'bg-[#EF4444] hover:bg-red-700',
      onConfirm: async () => {
        try {
          const productData = {
            ...formData,
            createdAt: new Date().toISOString(),
          };

          if (editingProduct) {
            await updateDoc(doc(db, 'products', editingProduct.id), productData);
            toast.success('Product updated successfully');
            checkLowStock(productData.name, productData.stock);
          } else {
            await addDoc(collection(db, 'products'), productData);
            toast.success('Product added successfully');
            checkLowStock(productData.name, productData.stock);
          }
          
          setIsAddingProduct(false);
          setEditingProduct(null);
          setFormData({ 
            name: '', 
            price: 0, 
            stock: 0, 
            category: 'Laptop', 
            description: '', 
            images: [],
            socketType: '',
            ramType: '',
            chipset: '',
            vendorId: '',
            variants: [],
            specs: {}
          });
          fetchData();
        } catch (error) {
          console.error('Error saving product:', error);
          toast.error('Failed to save product');
        }
      }
    });
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For email/sms/whatsapp, require recipients. For ad platforms or empty, it could simply be broad targetAudience.
      let allRecipients: string[] = [];
      const needsRecipients = ['email', 'sms', 'whatsapp'].includes(campaignFormData.channel);

      if (needsRecipients) {
        // Parse bulk lists (emails or phones)
        const bulkItems = campaignFormData.bulkEmails
          .split(/[\n,;]/)
          .map(e => e.trim())
          .filter(e => e); // just checking truthiness for phones etc

        // Get emails/phones from selected users (assuming email for simplicity right now)
        const selectedUserItems = users
          .filter(u => campaignFormData.selectedUserIds.includes(u.uid))
          .map(u => u.email);

        allRecipients = Array.from(new Set([...bulkItems, ...selectedUserItems]));

        if (allRecipients.length === 0) {
          toast.error(`Please add at least one recipient for ${campaignFormData.channel} campaign`);
          return;
        }
      }

      const campaignData = {
        title: campaignFormData.title,
        channel: campaignFormData.channel,
        subject: campaignFormData.subject,
        content: campaignFormData.content,
        targetAudience: campaignFormData.targetAudience,
        budget: campaignFormData.budget ? Number(campaignFormData.budget) : null,
        targetUrl: campaignFormData.targetUrl,
        imageUrl: campaignFormData.imageUrl,
        recipients: allRecipients,
        status: campaignFormData.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: campaignFormData.scheduledAt || null,
        createdAt: new Date().toISOString(),
      };

      if (editingCampaign) {
        await updateDoc(doc(db, 'campaigns', editingCampaign.id), campaignData);
        toast.success('Campaign updated successfully');
      } else {
        await addDoc(collection(db, 'campaigns'), campaignData);
        toast.success('Campaign created successfully');
      }

      setIsAddingCampaign(false);
      setEditingCampaign(null);
      setCampaignFormData({
        title: '',
        channel: 'email',
        subject: '',
        content: '',
        recipients: [],
        bulkEmails: '',
        selectedUserIds: [],
        scheduledAt: '',
        targetAudience: '',
        budget: '',
        targetUrl: '',
        imageUrl: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    setLoading(true);
    try {
      // Update status to sending or launching
      const launchingStatus = ['facebook', 'instagram', 'google'].includes(campaign.channel || '') ? 'active' : 'sending';
      await updateDoc(doc(db, 'campaigns', campaign.id), { status: launchingStatus });
      fetchData();

      // In a real app, this would call appropriate backend services/APIs (Twilio, Resend, Meta Graph API, Google Ads API)
      toast.loading(`Deploying ${campaign.channel || 'email'} campaign...`, { id: 'sending-campaign' });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const finalStatus = ['facebook', 'instagram', 'google'].includes(campaign.channel || '') ? 'active' : 'sent';

      await updateDoc(doc(db, 'campaigns', campaign.id), {
        status: finalStatus,
        sentAt: new Date().toISOString(),
      });

      toast.success(`${campaign.channel || 'Email'} campaign deployed successfully!`, { id: 'sending-campaign' });
      fetchData();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to deploy campaign', { id: 'sending-campaign' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...discountCodeFormData,
        code: discountCodeFormData.code.toUpperCase(),
        createdAt: new Date().toISOString(),
      };

      if (editingDiscountCode) {
        await updateDoc(doc(db, 'couponCodes', editingDiscountCode.id), data);
        toast.success('Discount code updated');
      } else {
        await addDoc(collection(db, 'couponCodes'), data);
        toast.success('Discount code created');
      }

      setIsAddingDiscountCode(false);
      setEditingDiscountCode(null);
      setDiscountCodeFormData({ code: '', discountPercentage: 0, expiryDate: '', isActive: true });
      fetchData();
    } catch (error) {
      console.error('Error saving discount code:', error);
      toast.error('Failed to save discount code');
    }
  };

  const handleDeleteDiscountCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    try {
      await deleteDoc(doc(db, 'couponCodes', id));
      toast.success('Discount code deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting discount code:', error);
      toast.error('Failed to delete discount code');
    }
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        { id: Math.random().toString(36).substr(2, 9), name: '', sku: '', price: prev.price, stock: 0 }
      ]
    }));
  };

  const removeVariant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).filter(v => v.id !== id)
    }));
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const addSpec = () => {
    const key = prompt('Enter specification name (e.g. Color, Size, Material):');
    if (key) {
      setFormData(prev => ({
        ...prev,
        specs: { ...prev.specs, [key]: '' }
      }));
    }
  };

  const removeSpec = (key: string) => {
    const newSpecs = { ...formData.specs };
    delete newSpecs[key];
    setFormData({ ...formData, specs: newSpecs });
  };

  const updateSpec = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specs: { ...prev.specs, [key]: value }
    }));
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'products', id));
          toast.success('Product deleted');
          fetchData();
        } catch (error) {
          toast.error('Failed to delete product');
        }
      }
    });
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, skipSerialCheck = false) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (!skipSerialCheck && (status === 'shipped' || status === 'delivered' || status === 'cancelled')) {
        const itemsNeedingSerials = order.items.filter(item => {
          const prod = products.find(p => p.id === item.id);
          return prod?.hasSerialTracking && (!item.selectedSerials || item.selectedSerials.length < item.quantity);
        });

        if (itemsNeedingSerials.length > 0) {
          setSerialSelectionModal({
            isOpen: true,
            orderId,
            newStatus: status,
            items: itemsNeedingSerials.map(i => {
              const prod = products.find(p => p.id === i.id);
              return {
                productId: i.id,
                productName: i.name,
                quantity: i.quantity,
                availableSerials: prod?.availableSerials || [],
                selectedSerials: i.selectedSerials || [],
                warrantyMonths: prod?.warrantyMonths || 0
              };
            })
          });
          return;
        }
      }

      // Handle stock and serial restorations if status is returned or cancelled
      if ((status === 'returned' || status === 'cancelled') && order.status !== 'returned' && order.status !== 'cancelled') {
        for (const item of order.items) {
          const productRef = doc(db, 'products', item.id);
          const currentProduct = products.find(p => p.id === item.id);
          
          if (currentProduct) {
            const updates: any = {
              stock: currentProduct.stock + item.quantity
            };
            
            if (currentProduct.hasSerialTracking && item.selectedSerials) {
              updates.availableSerials = [...(currentProduct.availableSerials || []), ...item.selectedSerials];
              
              // Remove sold serials from tracking
              for (const serial of item.selectedSerials) {
                 const soldSerialRecord = soldSerials.find(s => s.serial === serial && s.orderId === orderId);
                 if (soldSerialRecord) {
                   await deleteDoc(doc(db, 'sold_serials', soldSerialRecord.id));
                 }
              }
            }
            await updateDoc(productRef, updates);
          }
        }
      }

      await updateDoc(doc(db, 'orders', orderId), { status });
      
      // Send shipping update email
      try {
        if (order.customerEmail) {
          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #EF4444; margin: 0;">Star Tech</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Order Status Update</p>
              </div>
              
              <p>Hi ${order.customerName},</p>
              <p>The status of your order <strong>#${orderId.slice(0, 8)}</strong> has been updated to: <span style="color: #EF4444; font-weight: bold; text-transform: uppercase;">${status}</span></p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
                <p style="margin: 5px 0;"><strong>Total:</strong> ${formatCurrency(order.total, settings)}</p>
              </div>
              
              <p style="margin-top: 30px; color: #888; font-size: 0.9em;">If you have any questions, please reply to this email.</p>
            </div>
          `;

          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: order.customerEmail,
              subject: `Order Status Update: ${status.toUpperCase()} - Star Tech`,
              html: emailHtml,
            }),
          });
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleConfirmSerialSelection = async () => {
    if (!serialSelectionModal) return;
    
    // Validate
    const invalidItems = serialSelectionModal.items.filter(i => i.selectedSerials.length !== i.quantity);
    if (invalidItems.length > 0) {
      toast.error(`Please select exactly ${invalidItems[0].quantity} serials for ${invalidItems[0].productName}`);
      return;
    }

    try {
      const order = orders.find(o => o.id === serialSelectionModal.orderId);
      if (!order) return;

      const updatedItems = [...order.items];

      for (const modalItem of serialSelectionModal.items) {
        const itemIndex = updatedItems.findIndex(i => i.id === modalItem.productId);
        if (itemIndex >= 0) {
          updatedItems[itemIndex].selectedSerials = modalItem.selectedSerials;
        }

        const product = products.find(p => p.id === modalItem.productId);
        if (product) {
          const remainingSerials = (product.availableSerials || []).filter(s => !modalItem.selectedSerials.includes(s));
          await updateDoc(doc(db, 'products', product.id), {
            availableSerials: remainingSerials
          });

          // Add to sold_serials
          const warrantyEndDate = new Date();
          warrantyEndDate.setMonth(warrantyEndDate.getMonth() + modalItem.warrantyMonths);
          
          for (const serial of modalItem.selectedSerials) {
             await addDoc(collection(db, 'sold_serials'), {
               serial,
               productId: product.id,
               productName: product.name,
               orderId: order.id,
               customerName: order.customerName,
               customerPhone: order.customerPhone || '',
               soldAt: new Date().toISOString(),
               warrantyEndDate: warrantyEndDate.toISOString(),
               status: 'active'
             });
          }
        }
      }

      await updateDoc(doc(db, 'orders', order.id), { items: updatedItems });
      
      // Continue update order status but skip the check this time
      const statusToApply = serialSelectionModal.newStatus;
      setSerialSelectionModal(null); // Clear first to unblock UI
      await updateOrderStatus(order.id, statusToApply, true);
    } catch (err) {
      toast.error('Failed to save serials');
    }
  };

  const updateOrderDiscount = async (orderId: string, discountAmount: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const newTotal = subtotal - discountAmount;
      
      await updateDoc(doc(db, 'orders', orderId), { 
        discountAmount,
        total: Math.max(0, newTotal)
      });
      toast.success('Discount updated');
      fetchData();
    } catch (error) {
      console.error('Error updating discount:', error);
      toast.error('Failed to update discount');
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProductIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Bulk Delete Products',
      message: `Are you sure you want to delete ${selectedProductIds.length} products? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await Promise.all(selectedProductIds.map(id => deleteDoc(doc(db, 'products', id))));
          toast.success(`${selectedProductIds.length} products deleted`);
          setSelectedProductIds([]);
          fetchData();
        } catch (error) {
          toast.error('Failed to delete some products');
        }
      }
    });
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Bulk Delete Orders',
      message: `Are you sure you want to delete ${selectedOrderIds.length} orders? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await Promise.all(selectedOrderIds.map(id => deleteDoc(doc(db, 'orders', id))));
          toast.success(`${selectedOrderIds.length} orders deleted`);
          setSelectedOrderIds([]);
          fetchData();
        } catch (error) {
          toast.error('Failed to delete some orders');
        }
      }
    });
  };

  const handleBulkReturnOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Bulk Return Orders',
      message: `Are you sure you want to mark ${selectedOrderIds.length} selected orders as "RETURNED"?`,
      confirmText: 'Mark Returned',
      confirmColor: 'bg-yellow-600 hover:bg-yellow-700',
      onConfirm: async () => {
        try {
          await Promise.all(selectedOrderIds.map(async (id) => {
            const order = orders.find(o => o.id === id);
            await updateDoc(doc(db, 'orders', id), { status: 'returned' });
            
            // Record Return Transaction
            await addDoc(collection(db, 'transactions'), {
              type: 'return',
              amount: -(order?.total || 0),
              date: new Date().toISOString(),
              description: `Return for order ${order?.documentNumber || id}`,
              entityId: 'system',
              entityName: 'Sales Return',
              referenceId: id,
              createdAt: new Date().toISOString(),
            });
          }));
          toast.success(`${selectedOrderIds.length} orders marked as returned`);
          setSelectedOrderIds([]);
          fetchData();
        } catch (error) {
          console.error('Error returning orders:', error);
          toast.error('Failed to return some orders');
        }
      }
    });
  };

  const handleBulkUpdateOrderStatus = (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Bulk Update Order Status',
      message: `Are you sure you want to update the status of ${selectedOrderIds.length} selected orders to "${status.toUpperCase()}"?`,
      confirmText: 'Update Status',
      confirmColor: 'bg-[#081621] hover:bg-black shadow-gray-200',
      onConfirm: async () => {
        try {
          await Promise.all(selectedOrderIds.map(async (id) => {
            await updateDoc(doc(db, 'orders', id), { status });
            const order = orders.find(o => o.id === id);
            if (order && order.customerEmail) {
              const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #EF4444; margin: 0;">Star Tech</h1>
                    <p style="color: #666; margin: 5px 0 0 0;">Order Status Update</p>
                  </div>
                  
                  <p>Hi ${order.customerName},</p>
                  <p>The status of your order <strong>#${order.documentNumber || order.id.slice(0, 8)}</strong> has been updated to: <span style="color: #EF4444; font-weight: bold; text-transform: uppercase;">${status}</span></p>
                  
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Details</h3>
                    <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
                    <p style="margin: 5px 0;"><strong>Total:</strong> ${formatCurrency(order.total, settings)}</p>
                  </div>
                  
                  <p style="margin-top: 30px; color: #888; font-size: 0.9em;">If you have any questions, please reply to this email.</p>
                </div>
              `;
              try {
                await fetch('/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: order.customerEmail,
                    subject: `Order Status Update: ${status.toUpperCase()} - Star Tech`,
                    html: emailHtml,
                  }),
                });
              } catch (e) { console.error(e); }
            }
          }));
          toast.success(`${selectedOrderIds.length} orders updated to ${status}`);
          setSelectedOrderIds([]);
          fetchData();
        } catch (error) {
          console.error('Error bulk updating orders:', error);
          toast.error('Failed to update some orders');
        }
      }
    });
  };

  const handleBulkExportProducts = () => {
    if (selectedProductIds.length === 0) return;
    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
    
    const headers = ['Name', 'Category', 'Price', 'Stock', 'Description', 'SocketType', 'RamType', 'Images'];
    const csvContent = [
      headers.join(','),
      ...selectedProducts.map(p => [
        `"${p.name}"`,
        `"${p.category}"`,
        p.price,
        p.stock,
        `"${p.description.replace(/"/g, '""')}"`,
        `"${p.socketType || ''}"`,
        `"${p.ramType || ''}"`,
        `"${(p.images || []).join('|')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllProducts = () => {
    if (products.length === 0) return;
    
    const headers = ['Name', 'Category', 'Price', 'Stock', 'Description', 'SocketType', 'RamType', 'Images'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        `"${p.name}"`,
        `"${p.category}"`,
        p.price,
        p.stock,
        `"${p.description.replace(/"/g, '""')}"`,
        `"${p.socketType || ''}"`,
        `"${p.ramType || ''}"`,
        `"${(p.images || []).join('|')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `all_products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadCSVTemplate = () => {
    const headers = ['Name', 'Category', 'Price', 'Stock', 'Description', 'SocketType', 'RamType', 'Chipset', 'Images'];
    const sampleData = ['Sample Product', 'Laptop', '50000', '10', 'A great laptop', 'AM4', 'DDR4', 'B450', 'https://example.com/image.jpg'];
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'product_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportProductsCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) {
        toast.error('CSV file is empty or missing data');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newProducts = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let char of lines[i]) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const productData: any = {
          name: '',
          category: 'Other',
          price: 0,
          stock: 0,
          description: '',
          images: [],
          socketType: '',
          ramType: '',
          chipset: '',
        };

        headers.forEach((header, index) => {
          const value = values[index];
          if (value === undefined) return;
          
          if (header === 'name') productData.name = value;
          else if (header === 'category') productData.category = value || 'Other';
          else if (header === 'price') productData.price = Number(value) || 0;
          else if (header === 'stock') productData.stock = Number(value) || 0;
          else if (header === 'description') productData.description = value;
          else if (header === 'sockettype') productData.socketType = value;
          else if (header === 'ramtype') productData.ramType = value;
          else if (header === 'chipset') productData.chipset = value;
          else if (header === 'images') productData.images = value ? value.split('|') : [];
        });

        if (productData.name) {
          newProducts.push(productData);
        }
      }

      if (newProducts.length > 0) {
        setLoading(true);
        try {
          const promises = newProducts.map(p => addDoc(collection(db, 'products'), {
            ...p,
            createdAt: new Date().toISOString()
          }));
          await Promise.all(promises);
          toast.success(`Successfully imported ${newProducts.length} products`);
          fetchData();
        } catch (error) {
          toast.error('Failed to import products. Check if all required fields (Name, Category, Price, Stock) are present.');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    const matchesSearch = order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                          order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                          order.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
    const orderDate = order.createdAt.split('T')[0];
    const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
    const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
    return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
  });

  const handleExportFilteredOrders = () => {
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Total', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(o => [
        o.id,
        `"${o.customerName}"`,
        `"${o.customerPhone}"`,
        o.total,
        o.status,
        o.createdAt
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRecordCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (!customer) throw new Error('Customer not found');

      const receiptNumber = await generateDocumentNumber('REC');
      
      await addDoc(collection(db, 'transactions'), {
        type: 'money_receipt',
        amount: paymentFormData.amount,
        date: paymentFormData.date,
        description: paymentFormData.description || `Payment from ${customer.name}`,
        entityId: selectedCustomerId,
        entityName: customer.name,
        referenceId: receiptNumber,
        createdAt: new Date().toISOString(),
      });
      toast.success('Payment recorded successfully');
      setIsRecordingPayment(false);
      setPaymentFormData({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerData = {
        ...customerFormData,
        createdAt: new Date().toISOString(),
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
        toast.success('Customer updated successfully');
      } else {
        await addDoc(collection(db, 'customers'), customerData);
        toast.success('Customer added successfully');
      }
      
      setIsAddingCustomer(false);
      setEditingCustomer(null);
      setCustomerFormData({ name: '', email: '', phone: '', address: '' });
      await fetchData();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Customer',
      message: 'Are you sure you want to delete this customer? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'customers', id));
          toast.success('Customer deleted');
          fetchData();
        } catch (error) {
          toast.error('Failed to delete customer');
        }
      }
    });
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vendorData = {
        ...vendorFormData,
        createdAt: new Date().toISOString(),
      };

      if (editingVendor) {
        await updateDoc(doc(db, 'vendors', editingVendor.id), vendorData);
        toast.success('Vendor updated successfully');
      } else {
        await addDoc(collection(db, 'vendors'), vendorData);
        toast.success('Vendor added successfully');
      }
      
      setIsAddingVendor(false);
      setEditingVendor(null);
      setVendorFormData({ name: '', email: '', phone: '', address: '', category: 'General' });
      fetchData();
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error('Failed to save vendor');
    }
  };

  const handleDeleteVendor = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Vendor',
      message: 'Are you sure you want to delete this vendor? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'vendors', id));
          toast.success('Vendor deleted');
          fetchData();
        } catch (error) {
          toast.error('Failed to delete vendor');
        }
      }
    });
  };

  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleDeleteHostingService = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Hosting Service',
      message: 'Are you sure you want to delete this service category?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'hostingServices', id));
          toast.success('Service deleted');
          fetchData();
        } catch (error) {
          console.error('Error deleting service:', error);
          toast.error('Failed to delete service');
        }
      }
    });
  };

  const handleSaveHostingService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serviceData = {
        ...hostingServiceFormData,
      };

      if (editingHostingService) {
        await updateDoc(doc(db, 'hostingServices', editingHostingService.id), serviceData);
        toast.success('Service updated successfully');
      } else {
        await addDoc(collection(db, 'hostingServices'), serviceData);
        toast.success('Service added successfully');
      }
      
      setIsAddingHostingService(false);
      setEditingHostingService(null);
      setHostingServiceFormData({ title: '', description: '', iconPath: '', startingPrice: 0, billingCycle: '/mo', currency: 'BDT', order: 0, isActive: true });
      fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleDeleteHostingPlan = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Hosting Plan',
      message: 'Are you sure you want to delete this plan?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'hostingPlans', id));
          toast.success('Plan deleted');
          fetchData();
        } catch (error) {
          console.error('Error deleting plan:', error);
          toast.error('Failed to delete plan');
        }
      }
    });
  };

  const handleSaveHostingPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        ...hostingPlanFormData,
        createdAt: new Date().toISOString(),
      };

      if (editingHostingPlan) {
        await updateDoc(doc(db, 'hostingPlans', editingHostingPlan.id), planData);
        toast.success('Plan updated successfully');
      } else {
        await addDoc(collection(db, 'hostingPlans'), planData);
        toast.success('Plan added successfully');
      }
      
      setIsAddingHostingPlan(false);
      setEditingHostingPlan(null);
      setHostingPlanFormData({ name: '', price: 0, billingCycle: '/mo', features: [], popular: false, order: 0 });
      fetchData();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const menuData = {
        ...menuFormData,
        createdAt: new Date().toISOString(),
      };

      if (editingMenu) {
        await updateDoc(doc(db, 'menus', editingMenu.id), menuData);
        toast.success('Menu updated successfully');
      } else {
        await addDoc(collection(db, 'menus'), menuData);
        toast.success('Menu added successfully');
      }
      
      setIsAddingMenu(false);
      setEditingMenu(null);
      setMenuFormData({ name: '', slug: '', order: 0, subCategories: [] });
      fetchData();
    } catch (error) {
      console.error('Error saving menu:', error);
      toast.error('Failed to save menu');
      try {
        handleFirestoreError(error, editingMenu ? 'update' : 'create', 'menus');
      } catch (e) {
        // Error already logged
      }
    }
  };

  const handleDeleteMenu = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? All subcategories will also be removed.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'menus', id));
          toast.success('Category deleted');
          fetchData();
        } catch (error) {
          console.error('Error deleting menu:', error);
          toast.error('Failed to delete category');
          try {
            handleFirestoreError(error, 'delete', `menus/${id}`);
          } catch (e) {
            // Error already logged
          }
        }
      }
    });
  };

  const handleSaveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCategoryFormData.parentId) {
      toast.error('Please select a parent category');
      return;
    }
    try {
      const parentMenu = menus.find(m => m.id === subCategoryFormData.parentId);
      if (!parentMenu) return;

      const newSub = {
        id: Math.random().toString(36).substr(2, 9),
        name: subCategoryFormData.name,
        slug: subCategoryFormData.slug || subCategoryFormData.name.toLowerCase().replace(/\s+/g, '-')
      };

      const updatedSubCategories = [...(parentMenu.subCategories || []), newSub];
      await updateDoc(doc(db, 'menus', parentMenu.id), {
        subCategories: updatedSubCategories
      });

      toast.success('Sub category added successfully');
      setIsAddingSubCategory(false);
      setSubCategoryFormData({ parentId: '', name: '', slug: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding sub category:', error);
      toast.error('Failed to add sub category');
      try {
        handleFirestoreError(error, 'update', `menus/${subCategoryFormData.parentId}`);
      } catch (e) {
        // Error already logged
      }
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedgerEntity || paymentAmount <= 0) return;

    try {
      const type = selectedLedgerEntity.type === 'customer' ? 'payment_received' : 'payment_made';
      let receiptNumber = '';
      if (type === 'payment_received') {
        receiptNumber = await generateDocumentNumber('REC');
      }

      const transactionData = {
        type,
        amount: paymentAmount,
        date: new Date().toISOString(),
        description: paymentDescription || `Payment from ${selectedLedgerEntity.name}`,
        entityId: selectedLedgerEntity.id,
        entityName: selectedLedgerEntity.name,
        referenceId: receiptNumber || undefined,
        createdAt: new Date().toISOString(),
        paymentMethod: ledgerPaymentMethod,
      };

      await addDoc(collection(db, 'transactions'), transactionData);
      toast.success('Payment recorded successfully');
      setPaymentAmount(0);
      setPaymentDescription('');
      setLedgerPaymentMethod('cash');
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const getSalesReportData = () => {
    const aggregatedData: { [key: string]: { date: string, productName: string, quantity: number, total: number } } = {};

    orders.forEach(order => {
      const orderDate = order.createdAt.split('T')[0];
      if (orderDate >= reportStartDate && orderDate <= reportEndDate) {
        order.items.forEach(item => {
          const key = `${orderDate}_${item.id}`;
          if (aggregatedData[key]) {
            aggregatedData[key].quantity += item.quantity;
            aggregatedData[key].total += item.price * item.quantity;
          } else {
            aggregatedData[key] = {
              date: orderDate,
              productName: item.name,
              quantity: item.quantity,
              total: item.price * item.quantity
            };
          }
        });
      }
    });

    let reportArray = Object.values(aggregatedData);

    // Filter by search
    if (reportSearch) {
      reportArray = reportArray.filter(item => 
        item.productName.toLowerCase().includes(reportSearch.toLowerCase()) ||
        item.date.includes(reportSearch)
      );
    }

    // Sort
    reportArray.sort((a, b) => {
      const valA = a[reportSortConfig.key as keyof typeof a];
      const valB = b[reportSortConfig.key as keyof typeof b];
      if (valA < valB) return reportSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return reportSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return reportArray;
  };

  const exportToCSV = () => {
    const data = getSalesReportData();
    const headers = ['Date', 'Product Name', 'Quantity', 'Total Amount'];
    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        `"${row.productName}"`,
        row.quantity,
        row.total
      ].join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${reportStartDate}_to_${reportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCustomerReceiveReportData = () => {
    const reportData: Array<{
      id: string;
      date: string;
      customerName: string;
      description: string;
      paymentMethod: string;
      amount: number;
      referenceId: string;
    }> = [];

    transactions.forEach(tx => {
      // We look for 'payment_received', 'money_receipt', or 'sale'
      if (!['payment_received', 'money_receipt', 'sale'].includes(tx.type)) {
        return;
      }

      // Check date range
      const txDate = tx.date || tx.createdAt || new Date().toISOString();
      const orderDate = txDate.split('T')[0];
      if (orderDate < crReportStartDate || orderDate > crReportEndDate) {
        return;
      }

      // Determine customer name
      const customerName = tx.entityName || "Guest Customer";
      
      // Filter by customer if filter selected
      if (crReportCustomer !== 'all' && tx.entityId !== crReportCustomer) {
        return;
      }

      // Determine payment method
      let method = tx.paymentMethod || 'cash';
      
      // If it's a POS/invoice order transaction, look up the order payment method
      if (tx.type === 'sale' && tx.referenceId) {
        const matchingOrder = orders.find(o => o.id === tx.referenceId);
        if (matchingOrder && matchingOrder.paymentMethod) {
          method = matchingOrder.paymentMethod;
        }
      } else {
        // Fallback checks on description if direct payment
        const descLower = (tx.description || '').toLowerCase();
        if (descLower.includes('bkash')) method = 'bkash';
        else if (descLower.includes('nagad')) method = 'nagad';
        else if (descLower.includes('rocket')) method = 'rocket';
        else if (descLower.includes('bank')) method = 'bank';
        else if (descLower.includes('card') || descLower.includes('visa') || descLower.includes('mastercard')) method = 'card';
        else if (descLower.includes('cellfin')) method = 'cellfin';
      }

      // Filter by payment method if filter selected
      if (crReportMethod !== 'all' && method !== crReportMethod) {
        return;
      }

      const refId = tx.referenceId || "N/A";
      const description = tx.description || `Payment received from ${customerName}`;

      // Filter by search terms
      if (crReportSearch) {
        const s = crReportSearch.toLowerCase();
        const matchesSearch = 
          customerName.toLowerCase().includes(s) ||
          description.toLowerCase().includes(s) ||
          refId.toLowerCase().includes(s) ||
          method.toLowerCase().includes(s);
        if (!matchesSearch) {
          return;
        }
      }

      reportData.push({
        id: tx.id,
        date: txDate,
        customerName,
        description,
        paymentMethod: method,
        amount: tx.amount,
        referenceId: refId,
      });
    });

    // Sort by date desc
    return reportData.sort((a, b) => b.date.localeCompare(a.date));
  };

  const exportCrToCSV = () => {
    const data = getCustomerReceiveReportData();
    const headers = ['Date', 'Receipt No / Ref', 'Customer Name', 'Description', 'Payment Method', 'Amount'];
    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        `"${new Date(row.date).toLocaleString()}"`,
        `"${row.referenceId}"`,
        `"${row.customerName}"`,
        `"${row.description.replace(/"/g, '""')}"`,
        `"${row.paymentMethod.toUpperCase()}"`,
        row.amount
      ].join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer_receive_report_${crReportStartDate}_to_${crReportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseData.items.length === 0 || !purchaseData.vendorId) {
      toast.error('Please select a vendor and add products');
      return;
    }

    try {
      const totalAmount = purchaseData.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);

      // 1. Update Product Stock
      for (const item of purchaseData.items) {
        const productRef = doc(db, 'products', item.id);
        const currentProduct = products.find(p => p.id === item.id);
        if (currentProduct) {
          const updates: any = {
            stock: currentProduct.stock + item.quantity
          };
          
          if (item.hasWarranty) {
            updates.warrantyMonths = (item.warrantyYears || 0) * 12;
          }

          if (currentProduct.hasSerialTracking && item.newSerials) {
             const addedSerials = Array.isArray(item.newSerials) ? item.newSerials.filter((s: string) => s.trim()) : item.newSerials.split('\n').map((s: string) => s.trim()).filter((s: string) => s);
             updates.availableSerials = [...(currentProduct.availableSerials || []), ...addedSerials];
          }

          await updateDoc(productRef, updates);
        }
      }

      // 2. Create Purchase Transaction
      const transactionData = {
        type: 'purchase',
        amount: totalAmount,
        date: new Date().toISOString(),
        description: purchaseData.description || `Purchase from ${purchaseData.vendorName}`,
        entityId: purchaseData.vendorId,
        entityName: purchaseData.vendorName,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'transactions'), transactionData);
      
      toast.success('Purchase recorded and inventory updated');
      setIsCreatingPurchase(false);
      setPurchaseData({ vendorId: '', vendorName: '', items: [], description: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Failed to create purchase');
    }
  };

  const handleBulkExportOrders = () => {
    if (selectedOrderIds.length === 0) return;
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Total', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...selectedOrders.map(o => [
        o.id,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${(o.customerPhone || '').replace(/"/g, '""')}"`,
        o.total,
        o.status,
        o.createdAt
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `selected_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${selectedOrderIds.length} orders`);
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      for (const item of saleData.items) {
        if (item.hasSerialTracking) {
          if (!item.selectedSerials || item.selectedSerials.length !== item.quantity) {
            toast.error(`Please select exactly ${item.quantity} serial(s) for ${item.name}`);
            return;
          }
        }
      }

      const docType = saleData.type === 'quotation' ? 'QUO' : (saleData.type === 'challan' ? 'CHA' : 'INV');
      const docNumber = await generateDocumentNumber(docType);

      const subtotal = saleData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const effectiveDiscount = saleData.appliedDiscountPercentage > 0 
        ? (subtotal * saleData.appliedDiscountPercentage) / 100 
        : (saleData.discountAmount || 0);
      const total = subtotal - effectiveDiscount;
      const processedItems = saleData.items.map(item => {
        const currentProduct = products.find(p => p.id === item.id);
        const wMonths = item.hasWarranty ? (item.warrantyYears || 0) * 12 : (currentProduct?.warrantyMonths || 0);
        return { ...item, warrantyMonths: wMonths };
      });

      const orderData = {
        ...saleData,
        items: processedItems,
        discountAmount: effectiveDiscount,
        documentNumber: docNumber,
        total: Math.max(0, total),
        status: 'delivered',
        userId: 'admin',
        createdAt: new Date().toISOString(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update Stock for Invoice/Challan
      if (saleData.type === 'invoice' || saleData.type === 'challan') {
        for (const item of saleData.items) {
          const productRef = doc(db, 'products', item.id);
          const currentProduct = products.find(p => p.id === item.id);
          if (currentProduct) {
            const updates: any = {};
            const newStock = Math.max(0, currentProduct.stock - item.quantity);
            updates.stock = newStock;
            
            if (currentProduct.hasSerialTracking && item.selectedSerials) {
              const remainingSerials = (currentProduct.availableSerials || []).filter(s => !item.selectedSerials.includes(s));
              updates.availableSerials = remainingSerials;
              
              // Add to sold_serials collection
              const warrantyEndDate = new Date();
              const wMonths = item.hasWarranty ? (item.warrantyYears || 0) * 12 : (currentProduct.warrantyMonths || 0);
              warrantyEndDate.setMonth(warrantyEndDate.getMonth() + wMonths);
              
              for (const serial of item.selectedSerials) {
                await addDoc(collection(db, 'sold_serials'), {
                  serial,
                  productId: currentProduct.id,
                  productName: currentProduct.name,
                  orderId: orderRef.id,
                  customerName: saleData.customerName,
                  customerPhone: saleData.customerPhone,
                  soldAt: new Date().toISOString(),
                  warrantyEndDate: warrantyEndDate.toISOString(),
                  status: 'active'
                });
              }
            }

            await updateDoc(productRef, updates);
            checkLowStock(currentProduct.name, newStock);
          }
        }
      }

      // Record Transaction
      const customer = customers.find(c => c.name === saleData.customerName);
      await addDoc(collection(db, 'transactions'), {
        type: 'sale',
        amount: Math.max(0, total),
        date: new Date().toISOString(),
        description: `Sale to ${saleData.customerName}`,
        entityId: customer?.id || 'unknown',
        entityName: saleData.customerName,
        referenceId: orderRef.id,
        createdAt: new Date().toISOString(),
      });

      toast.success('Sale recorded successfully');
      setIsCreatingSale(false);
      setSaleData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: '',
        items: [],
        type: 'invoice',
        discountAmount: 0,
        appliedDiscountPercentage: 0,
        appliedDiscountCode: '',
      });
      setSaleDiscountCodeInput('');
      fetchData();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Failed to record sale');
    }
  };

  const addItemToSale = (product: Product) => {
    setSaleData(prev => {
      const existing = prev.items.find(i => i.id === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        };
      }
      return {
        ...prev,
        items: [...prev.items, { ...product, quantity: 1 }]
      };
    });
    toast.success(`Added ${product.name} to sale`);
  };

  const addItemToPurchase = (product: Product) => {
    setPurchaseData(prev => {
      const existing = prev.items.find(i => i.id === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        };
      }
      return {
        ...prev,
        items: [...prev.items, { ...product, quantity: 1, purchasePrice: product.price * 0.8 }] // Default purchase price 80% of selling price
      };
    });
    toast.success(`Added ${product.name} to purchase list`);
  };

  const removeItemFromPurchase = (productId: string) => {
    setPurchaseData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== productId)
    }));
  };

  const updatePurchaseItem = (productId: string, field: string, value: any) => {
    setPurchaseData(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === productId ? { ...i, [field]: value } : i)
    }));
  };

  const handleDownloadLedgerPDF = () => {
    if (!selectedLedgerEntity) return;

    const doc = new jsPDF();
    const entityTransactions = transactions
      .filter(t => {
        const matchesEntity = t.entityId === selectedLedgerEntity.id;
        const txDate = new Date(t.date).toISOString().split('T')[0];
        const matchesDate = txDate >= ledgerStartDate && txDate <= ledgerEndDate;
        const matchesSearch = t.description.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || 
                            t.id.toLowerCase().includes(ledgerSearchQuery.toLowerCase());
        return matchesEntity && matchesDate && matchesSearch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Header
    doc.setFontSize(20);
    doc.setTextColor(239, 68, 68); // #EF4444
    doc.text('Star Tech', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(8, 22, 33); // #081621
    doc.text(`${selectedLedgerEntity.name}'s Ledger Report`, 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${ledgerStartDate} to ${ledgerEndDate}`, 105, 38, { align: 'center' });

    // Summary
    const totalDebit = entityTransactions
      .filter(t => selectedLedgerEntity.type === 'customer' ? t.type === 'sale' : t.type === 'payment_made')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalCredit = entityTransactions
      .filter(t => selectedLedgerEntity.type === 'customer' ? t.type === 'payment_received' : t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = selectedLedgerEntity.type === 'customer' ? totalDebit - totalCredit : totalCredit - totalDebit;

    autoTable(doc, {
      startY: 45,
      head: [['Total Debit', 'Total Credit', 'Outstanding Balance']],
      body: [[formatCurrency(totalDebit, settings), formatCurrency(totalCredit, settings), formatCurrency(balance, settings)]],
      theme: 'grid',
      headStyles: { fillColor: [8, 22, 33] }
    });

    // Transactions Table
    let runningBalance = 0;
    const tableData = entityTransactions.map(t => {
      const isDebit = selectedLedgerEntity.type === 'customer' ? t.type === 'sale' : t.type === 'payment_made';
      const isCredit = selectedLedgerEntity.type === 'customer' ? t.type === 'payment_received' : t.type === 'purchase';
      
      if (isDebit) runningBalance += t.amount;
      if (isCredit) runningBalance -= t.amount;
      const displayBalance = selectedLedgerEntity.type === 'vendor' ? -runningBalance : runningBalance;

      return [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.type.replace('_', ' ').toUpperCase(),
        isDebit ? formatCurrency(t.amount, settings) : '-',
        isCredit ? formatCurrency(t.amount, settings) : '-',
        formatCurrency(displayBalance, settings)
      ];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Date', 'Description', 'Type', 'Debit', 'Credit', 'Balance']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] }
    });

    doc.save(`${selectedLedgerEntity.name}_Ledger_${ledgerStartDate}_to_${ledgerEndDate}.pdf`);
  };

  const handleDownloadLedgerCSV = () => {
    if (!selectedLedgerEntity) return;

    const entityTransactions = transactions
      .filter(t => {
        const matchesEntity = t.entityId === selectedLedgerEntity.id;
        const txDate = new Date(t.date).toISOString().split('T')[0];
        const matchesDate = txDate >= ledgerStartDate && txDate <= ledgerEndDate;
        const matchesSearch = t.description.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || 
                            t.id.toLowerCase().includes(ledgerSearchQuery.toLowerCase());
        return matchesEntity && matchesDate && matchesSearch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const csvRows = [
      ['Date', 'Description', 'Type', 'Debit', 'Credit', 'Balance'],
      ...entityTransactions.map(t => {
        const isDebit = selectedLedgerEntity.type === 'customer' ? t.type === 'sale' : t.type === 'payment_made';
        const isCredit = selectedLedgerEntity.type === 'customer' ? t.type === 'payment_received' : t.type === 'purchase';
        
        if (isDebit) runningBalance += t.amount;
        if (isCredit) runningBalance -= t.amount;
        const displayBalance = selectedLedgerEntity.type === 'vendor' ? -runningBalance : runningBalance;

        return [
          new Date(t.date).toLocaleDateString(),
          `"${t.description.replace(/"/g, '""')}"`,
          t.type.replace('_', ' ').toUpperCase(),
          isDebit ? t.amount : 0,
          isCredit ? t.amount : 0,
          displayBalance
        ];
      })
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedLedgerEntity.name}_Ledger_${ledgerStartDate}_to_${ledgerEndDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printServiceReceipt = (record: ServiceRecord) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let currentY = 20;

    const useLetterhead = settings?.documentDesign?.printOnLetterhead;

    if (!useLetterhead) {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(8, 22, 33);
      doc.text(settings?.brandName || 'STAR TECH', 20, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(settings?.contactPhone || '16793 | startech.com.bd', 20, currentY + 7);
      doc.text(settings?.contactAddress || '123 Main Street, City, Country', 20, currentY + 12);
    } else {
      currentY += 20;
    }
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('SERVICE RECEIPT', 190, currentY, { align: 'right' });
    
    currentY += 20;
    doc.setDrawColor(239, 68, 68);
    doc.line(20, currentY, 190, currentY);
    
    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ticket ID: ${record.id.toUpperCase()}`, 20, currentY);
    doc.text(`Date Received: ${new Date(record.receivedAt).toLocaleDateString()}`, 20, currentY + 7);
    doc.text(`Customer: ${record.customerName}`, 140, currentY);
    doc.text(`Phone: ${record.customerPhone}`, 140, currentY + 7);
    
    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Device Information', 20, currentY);
    doc.setFont('helvetica', 'normal');
    
    currentY += 10;
    doc.text(`Product Name: ${record.productName}`, 20, currentY);
    doc.text(`Serial Number: ${record.serialNumber}`, 140, currentY);

    currentY += 10;
    doc.text(`Type: ${record.isWarranty ? 'Warranty Claim' : 'Paid Service'}`, 20, currentY);
    if (!record.isWarranty) {
      doc.text(`Estimated/Final Charge: ${formatCurrency(record.serviceCharge || 0, settings)}`, 140, currentY);
    }
    
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Issue Description', 20, currentY);
    doc.setFont('helvetica', 'normal');
    
    currentY += 10;
    const splitDesc = doc.splitTextToSize(record.issueDescription, 170);
    doc.text(splitDesc, 20, currentY);
    
    currentY += splitDesc.length * 7 + 20;
    doc.setFontSize(10);
    doc.text('Customer Signature', 40, currentY, { align: 'center' });
    doc.line(20, currentY - 5, 60, currentY - 5);
    
    doc.text('Authorized Signature', 170, currentY, { align: 'center' });
    doc.line(150, currentY - 5, 190, currentY - 5);

    doc.save(`Service_Receipt_${record.id}.pdf`);
  };

  const printServiceBill = (record: ServiceRecord) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let currentY = 20;

    const useLetterhead = settings?.documentDesign?.printOnLetterhead;

    if (!useLetterhead) {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(8, 22, 33);
      doc.text(settings?.brandName || 'STAR TECH', 20, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(settings?.contactPhone || '16793 | startech.com.bd', 20, currentY + 7);
      doc.text(settings?.contactAddress || '123 Main Street, City, Country', 20, currentY + 12);
    } else {
      currentY += 20;
    }
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('SERVICE BILL / INVOICE', 190, currentY, { align: 'right' });
    
    currentY += 20;
    doc.setDrawColor(239, 68, 68);
    doc.line(20, currentY, 190, currentY);
    
    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ticket ID: ${record.id.toUpperCase()}`, 20, currentY);
    doc.text(`Date Received: ${new Date(record.receivedAt).toLocaleDateString()}`, 20, currentY + 7);
    doc.text(`Customer: ${record.customerName}`, 140, currentY);
    doc.text(`Phone: ${record.customerPhone}`, 140, currentY + 7);
    
    currentY += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Service Details', 20, currentY);
    doc.setFont('helvetica', 'normal');
    
    currentY += 10;
    const splitDesc = doc.splitTextToSize(`Serviced: ${record.productName} (SN: ${record.serialNumber}) - ${record.issueDescription}`, 120);
    doc.text(splitDesc, 20, currentY);
    
    doc.text(formatCurrency(record.serviceCharge || 0, settings), 190, currentY, { align: 'right' });
    
    currentY += Math.max(splitDesc.length * 7, 20) + 10;
    
    doc.line(20, currentY, 190, currentY);
    currentY += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount Due:', 130, currentY);
    doc.text(formatCurrency(record.serviceCharge || 0, settings), 190, currentY, { align: 'right' });
    
    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Status: ${record.paymentStatus?.toUpperCase() || 'PENDING'}`, 130, currentY);
    if (record.paymentMethod) {
      currentY += 7;
      doc.text(`Payment Method: ${record.paymentMethod.toUpperCase()}`, 130, currentY);
    }
    
    currentY += 40;
    doc.setFontSize(10);
    doc.text('Authorized Signature', 170, currentY, { align: 'center' });
    doc.line(140, currentY - 5, 190, currentY - 5);

    doc.save(`Service_Bill_${record.id}.pdf`);
  };

  const generatePDF = (order: Order | Transaction, type: 'invoice' | 'quotation' | 'challan' | 'receipt') => {
    const doc = new jsPDF('p', 'mm', 'a4'); 
    let currentY = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const useLetterhead = settings?.documentDesign?.printOnLetterhead;

    // ----- HEADER -----
    if (!useLetterhead) {
      // Company brand and contacts
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138); // Deep Blue
      doc.text(settings?.brandName || 'STAR TECH', 20, currentY + 10);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(settings?.contactPhone || '16793 | startech.com.bd', 20, currentY + 17);
      doc.text(settings?.contactAddress || '123 Main Street, City, Country', 20, currentY + 22);
    } else {
      currentY += 30; // Extra shift for letterhead
    }

    // Document Title Box
    doc.setFillColor(30, 58, 138); // Deep Blue
    doc.rect(pageWidth - 70, currentY - 5, 50, 14, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(type.toUpperCase(), pageWidth - 45, currentY + 4, { align: 'center' });

    currentY += 35;

    // ----- CUSTOMER & DOC INFO -----
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, currentY - 5, pageWidth - 20, currentY - 5);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    if (type === 'receipt') {
      const tx = order as Transaction;
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(tx.entityName, 20, currentY + 11);
      
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('Receipt Details:', pageWidth - 80, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Receipt No: ${tx.referenceId}`, pageWidth - 80, currentY + 11);
      doc.text(`Date: ${new Date(tx.date).toLocaleDateString()}`, pageWidth - 80, currentY + 17);
      currentY += 30;
      
      // Rect box for receipt amount
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY, pageWidth - 40, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Amount Received:', 30, currentY + 13);
      doc.setTextColor(30, 58, 138);
      doc.text(formatCurrency(tx.amount, settings), pageWidth - 70, currentY + 13);
      
      currentY += 40;
    } else {
      const o = order as Order;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(type === 'challan' ? 'Ship To:' : 'Bill To:', 20, currentY + 5);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(o.customerName, 20, currentY + 12);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(o.customerPhone, 20, currentY + 17);
      
      let addressY = currentY + 22;
      if (type === 'challan') {
        const addressText = doc.splitTextToSize(`Address: ${o.shippingAddress || 'N/A'}`, 80);
        doc.text(addressText, 20, addressY);
        addressY += (addressText.length * 5);
      } else if (o.paymentMethod === 'cod') {
        doc.text('Address: Pay On Delivery', 20, addressY);
        addressY += 5;
      }

      doc.setFont('helvetica', 'bold');
      let detailsLabel = 'Invoice Details:';
      if (type === 'quotation') detailsLabel = 'Quote Details:';
      if (type === 'challan') detailsLabel = 'Challan Details:';
      
      doc.text(detailsLabel, pageWidth - 80, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Doc No: ${o.documentNumber || o.id.substring(0, 8).toUpperCase()}`, pageWidth - 80, currentY + 11);
      doc.text(`Date: ${new Date(o.createdAt).toLocaleDateString()}`, pageWidth - 80, currentY + 17);
      currentY = Math.max(addressY, currentY + 20) + 10;
      
      // Table
      const tableData = o.items.map(item => {
        let nameDesc = item.name;
        if (item.hasSerialTracking && type !== 'quotation') {
          const serials = item.selectedSerials?.join(', ') || 'N/A';
          nameDesc += `\nSN: ${serials}`;
          if (item.warrantyMonths && item.warrantyMonths > 0) {
            const warrantyEnd = new Date(o.createdAt);
            warrantyEnd.setMonth(warrantyEnd.getMonth() + item.warrantyMonths);
            nameDesc += `\nWarranty: ${item.warrantyMonths} Months`;
          }
        }
        return [
          nameDesc,
          item.quantity.toString(),
          type === 'challan' ? '-' : formatCurrency(item.price, settings),
          type === 'challan' ? '-' : formatCurrency(item.price * item.quantity, settings)
        ];
      });
      
      autoTable(doc, {
        startY: currentY,
        head: [['Product Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });
      
      if (type !== 'challan') {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        
        const subtotal = o.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const discount = o.discountAmount || 0;
        
        const totalsX = pageWidth - 60;
        const alignRightX = pageWidth - 20;

        doc.setTextColor(80, 80, 80);
        doc.text('Subtotal:', totalsX, finalY);
        doc.setTextColor(0, 0, 0);
        doc.text(formatCurrency(subtotal, settings), alignRightX, finalY, { align: 'right' });
        
        let currTotalY = finalY;
        
        if (discount > 0) {
          currTotalY += 7;
          doc.setTextColor(80, 80, 80);
          doc.text('Discount:', totalsX, currTotalY);
          doc.setTextColor(220, 38, 38); // Red
          doc.text(`-${formatCurrency(discount, settings)}`, alignRightX, currTotalY, { align: 'right' });
        }
        
        currTotalY += 10;
        doc.setDrawColor(220, 220, 220);
        doc.line(totalsX, currTotalY - 6, alignRightX, currTotalY - 6);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text('Total Amount:', totalsX, currTotalY);
        doc.text(formatCurrency(o.total, settings), alignRightX, currTotalY, { align: 'right' });
        
        if (type === 'invoice' && o.paymentMethod) {
          currTotalY += 14;
          // Add Paid Stamp or Payment Info
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 163, 74); // Green
          const methodDisplay = o.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : `PAID VIA ${o.paymentMethod.toUpperCase()}`;
          doc.text(methodDisplay, alignRightX, currTotalY, { align: 'right' });
          if (o.paymentReference) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`Ref: ${o.paymentReference}`, alignRightX, currTotalY + 5, { align: 'right' });
          }
        }
        
        currentY = currTotalY + 20;
      } else {
         currentY = (doc as any).lastAutoTable.finalY + 30;
      }
    }
    
    // ----- FOOTER -----
    const pageHeight = doc.internal.pageSize.getHeight();
    if (pageHeight - currentY < 40) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 40, pageWidth - 20, pageHeight - 40);
    
    // Signatures
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(type === 'challan' ? 'Receiver Signature' : 'Customer Signature', 30, pageHeight - 20);
    doc.text('Authorized Signature', pageWidth - 70, pageHeight - 20);
    
    // Thank you text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    doc.save(`${type}_${order.id}.pdf`);
  };

  const statusIcons = {
    pending: <Clock className="text-yellow-500" size={18} />,
    processing: <ShoppingBag className="text-blue-500" size={18} />,
    shipped: <Truck className="text-purple-500" size={18} />,
    delivered: <CheckCircle className="text-green-500" size={18} />,
    cancelled: <XCircle className="text-red-500" size={18} />,
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0 shadow-sm z-20 hidden lg:flex">
        <div className="h-[60px] flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-[#0f172a]">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <ShoppingBag size={18} />
             </div>
             CLICK POS <span className="opacity-50 text-xs mt-1 border border-gray-200 px-1 rounded-full">+</span>
          </div>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
           {/* Section 1 */}
           <div className="px-4 mb-2">
             <button onClick={() => setActiveTab('dashboard')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'dashboard' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
               <Activity size={18} className={activeTab === 'dashboard' ? "text-blue-600" : "text-gray-400"} /> Overview
             </button>
             <button onClick={() => setActiveTab('analytics')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'analytics' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
               <BarChart2 size={18} className={activeTab === 'analytics' ? "text-blue-600" : "text-gray-400"} /> Analytics
             </button>
             <button onClick={() => setActiveTab('inventory')} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors", activeTab === 'inventory' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 font-medium hover:bg-gray-50")}>
               <Package size={18} className={activeTab === 'inventory' ? "text-blue-600" : "text-gray-400"} /> Stock
             </button>
             <button onClick={() => window.open('/pos', '_blank')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-gray-600 font-medium hover:bg-gray-50">
               <ShoppingCart size={18} className="text-gray-400" /> CLICK POS
             </button>
           </div>
           
           {/* Section 2: Sale & Customer */}
           <div className="px-4 mb-2">
             <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Sale & Customer</div>
             {hasPermission('manage_orders') && (
              <button onClick={() => setActiveTab('sales')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'sales' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ShoppingCart size={16} className={activeTab === 'sales' ? "text-blue-600" : "text-gray-400"} /> Sale
               </button>
             )}
             {hasPermission('manage_orders') && (
              <button onClick={() => setActiveTab('sale_return')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'sale_return' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ArrowLeftRight size={16} className={activeTab === 'sale_return' ? "text-blue-600" : "text-gray-400"} /> Sale Return
               </button>
             )}
             <button onClick={() => setActiveTab('orders')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'orders' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
               <Receipt size={16} className={activeTab === 'orders' ? "text-blue-600" : "text-gray-400"} /> Orders & Docs
             </button>
             <button onClick={() => setActiveTab('customers')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'customers' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
               <Users size={16} className={activeTab === 'customers' ? "text-blue-600" : "text-gray-400"} /> Customer
             </button>
             <button onClick={() => setActiveTab('quotations')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'quotations' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
               <FileText size={16} className={activeTab === 'quotations' ? "text-blue-600" : "text-gray-400"} /> Quotation System
             </button>
           </div>

           {/* Section 3: Purchase & Supplier */}
           <div className="px-4 mb-2">
             <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Purchase & Supplier</div>
             {hasPermission('manage_inventory') && (
               <button onClick={() => setActiveTab('purchases')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'purchases' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ShoppingBag size={16} className={activeTab === 'purchases' ? "text-blue-600" : "text-gray-400"} /> Purchase
               </button>
             )}
             {hasPermission('manage_inventory') && (
               <button onClick={() => setActiveTab('purchase_return')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'purchase_return' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ArrowLeftRight size={16} className={activeTab === 'purchase_return' ? "text-blue-600" : "text-gray-400"} /> Purchase Return
               </button>
             )}
             <button onClick={() => setActiveTab('vendors')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'vendors' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
               <Briefcase size={16} className={activeTab === 'vendors' ? "text-blue-600" : "text-gray-400"} /> Supplier
             </button>
           </div>

           {/* Warranty */}
           <div className="px-4 mb-2">
             <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Warranty & Servicing</div>
             {hasPermission('manage_services') && (
               <button onClick={() => setActiveTab('services')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'services' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ShieldCheck size={16} className={activeTab === 'services' ? "text-blue-600" : "text-gray-400"} /> Warranty & Service
               </button>
             )}
           </div>

           {/* Accounting */}
           <div className="px-4 mb-2">
             <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Accounting</div>
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('payment_accounts')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'payment_accounts' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <CreditCard size={16} className={activeTab === 'payment_accounts' ? "text-blue-600" : "text-gray-400"} /> Payment Account
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('ledger')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'ledger' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Book size={16} className={activeTab === 'ledger' ? "text-blue-600" : "text-gray-400"} /> Ledger
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('manual_income')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'manual_income' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Download size={16} className={activeTab === 'manual_income' ? "text-blue-600" : "text-gray-400"} /> Income
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('manual_expense')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'manual_expense' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Upload size={16} className={activeTab === 'manual_expense' ? "text-blue-600" : "text-gray-400"} /> Expense
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('tx_categories')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'tx_categories' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <List size={16} className={activeTab === 'tx_categories' ? "text-blue-600" : "text-gray-400"} /> Categories
               </button>
             )}
             {hasPermission('manage_reports') && (
               <button onClick={() => setActiveTab('reports')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'reports' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <FileText size={16} className={activeTab === 'reports' ? "text-blue-600" : "text-gray-400"} /> Sales Accounting
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('deposits_withdrawals')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'deposits_withdrawals' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <ArrowLeftRight size={16} className={activeTab === 'deposits_withdrawals' ? "text-blue-600" : "text-gray-400"} /> Deposit/Withdraw
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('account_balance')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'account_balance' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <CreditCard size={16} className={activeTab === 'account_balance' ? "text-blue-600" : "text-gray-400"} /> Account Balance
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('account_statement')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'account_statement' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <FileText size={16} className={activeTab === 'account_statement' ? "text-blue-600" : "text-gray-400"} /> Account Statement
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('balance_sheet')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'balance_sheet' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Book size={16} className={activeTab === 'balance_sheet' ? "text-blue-600" : "text-gray-400"} /> Balance Sheet
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('trial_balance')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'trial_balance' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Book size={16} className={activeTab === 'trial_balance' ? "text-blue-600" : "text-gray-400"} /> Trial Balance
               </button>
             )}
             {hasPermission('manage_finances') && (
               <button onClick={() => setActiveTab('transaction_history')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'transaction_history' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <List size={16} className={activeTab === 'transaction_history' ? "text-blue-600" : "text-gray-400"} /> Transaction History
               </button>
             )}
             {hasPermission('manage_reports') && (
               <button onClick={() => setActiveTab('all_reports')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'all_reports' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <FileText size={16} className={activeTab === 'all_reports' ? "text-blue-600" : "text-gray-400"} /> All Reports
               </button>
             )}
           </div>

           {/* Marketing */}
           <div className="px-4 mb-2">
             <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Marketing</div>
             {hasPermission('manage_marketing') && (
               <button onClick={() => setActiveTab('campaigns')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'campaigns' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Tag size={16} className={activeTab === 'campaigns' ? "text-blue-600" : "text-gray-400"} /> Marketing
               </button>
             )}
             {hasPermission('manage_marketing') && (
               <button onClick={() => setActiveTab('discountCodes')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'discountCodes' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Percent size={16} className={activeTab === 'discountCodes' ? "text-blue-600" : "text-gray-400"} /> Discounts
               </button>
             )}
           </div>

           {/* HR */}
           <div className="px-4 mb-2">
             <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Human Resource</div>
             {hasPermission('manage_users') && (
                 <button onClick={() => setActiveTab('users')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'users' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                   <Users size={16} className={activeTab === 'users' ? "text-blue-600" : "text-gray-400"} /> App Access
                 </button>
               )}
               {hasPermission('manage_hr') && (
                 <>
                   <button onClick={() => setActiveTab('employees')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'employees' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                   <Briefcase size={16} className={activeTab === 'employees' ? "text-blue-600" : "text-gray-400"} /> Employees
                 </button>
                 <button onClick={() => setActiveTab('leave')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'leave' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                   <CheckCircle size={16} className={activeTab === 'leave' ? "text-blue-600" : "text-gray-400"} /> Leave
                 </button>
                 <button onClick={() => setActiveTab('salary')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'salary' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                   <CreditCard size={16} className={activeTab === 'salary' ? "text-blue-600" : "text-gray-400"} /> Salary Overview
                 </button>
               </>
             )}
           </div>

           <div className="px-4 mb-6">
             <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-3">Other</div>
             {hasPermission('manage_settings') && (
               <button onClick={() => setActiveTab('menus')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'menus' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <List size={16} className={activeTab === 'menus' ? "text-blue-600" : "text-gray-400"} /> Site Menus
               </button>
             )}
             <button onClick={() => setActiveTab('crm')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'crm' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Users size={16} className={activeTab === 'crm' ? "text-blue-600" : "text-gray-400"} /> CRM System
               </button>
             <button onClick={() => setActiveTab('tasks')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'tasks' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <CheckCircle size={16} className={activeTab === 'tasks' ? "text-blue-600" : "text-gray-400"} /> To-Do List
               </button>
             <button onClick={() => setActiveTab('support_tickets')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'support_tickets' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <LifeBuoy size={16} className={activeTab === 'support_tickets' ? "text-blue-600" : "text-gray-400"} /> Support Tickets
               </button>
             {hasPermission('manage_services') && (
               <button onClick={() => setActiveTab('hostingPlans')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'hostingPlans' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Server size={16} className={activeTab === 'hostingPlans' ? "text-blue-600" : "text-gray-400"} /> Hosting Plans
               </button>
             )}
             {hasPermission('manage_services') && (
               <button onClick={() => setActiveTab('hostingServices')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'hostingServices' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Server size={16} className={activeTab === 'hostingServices' ? "text-blue-600" : "text-gray-400"} /> Hosting Services
               </button>
             )}
             {hasPermission('manage_settings') && (
               <button onClick={() => setActiveTab('settings')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'settings' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Settings size={16} className={activeTab === 'settings' ? "text-blue-600" : "text-gray-400"} /> Settings
               </button>
             )}
             {isAdmin && (
               <button onClick={() => navigate('/admin/billing')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-purple-600 font-bold hover:bg-purple-50">
                 <ArrowLeftRight size={16} className="text-purple-600" /> Web Host Billing
               </button>
             )}
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
           <div className="flex-1 max-w-lg relative">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Search [CTRL + K]" className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
           </div>
           <div className="flex items-center gap-4 text-gray-500">
              <User size={18} className="hover:text-gray-800 cursor-pointer" />
              <LogOut size={18} className="hover:text-red-600 cursor-pointer" onClick={() => navigate('/')} />
           </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">

        {activeTab === 'dashboard' ? (
          <AdminOverviewDashboard
            products={products}
            orders={orders}
            customers={customers}
            transactions={transactions}
            setActiveTab={setActiveTab}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsDashboard
            products={products}
            orders={orders}
            customers={customers}
            transactions={transactions}
          />
        ) : activeTab === 'crm' ? (
          <CRMPage />
        ) : activeTab === 'tasks' ? (
          <TaskManager />
        ) : activeTab === 'support_tickets' ? (
          <SupportTicketManager />
        ) : activeTab === 'inventory' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="text-[#EF4444]" /> Product Inventory
              </h2>
              <div className="flex items-center gap-2">
                {hasPermission('manage_inventory') && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportProductsCSV}
                      accept=".csv"
                      className="hidden"
                    />
                    <button
                      onClick={handleDownloadCSVTemplate}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                      title="Download CSV Template"
                    >
                      <FileText size={18} /> Template
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                      title="Import Products from CSV"
                    >
                      <Upload size={18} /> Import
                    </button>
                  </>
                )}
                <button
                  onClick={handleExportAllProducts}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                  title="Export All Products to CSV"
                >
                  <Download size={18} /> Export All
                </button>
                {hasPermission('manage_inventory') && (
                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
                  >
                    <Plus size={18} /> Add Product
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-gray-400 uppercase mr-2">Filter by Category:</span>
              <button
                onClick={() => setInventoryCategoryFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                  inventoryCategoryFilter === 'all' 
                    ? "bg-[#EF4444] text-white border-[#EF4444]" 
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                All
              </button>
              {Array.from(new Set(products.map(p => p.category))).sort().map(category => (
                <button
                  key={category}
                  onClick={() => setInventoryCategoryFilter(category)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                    inventoryCategoryFilter === category 
                      ? "bg-[#EF4444] text-white border-[#EF4444]" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {isAddingProduct || editingProduct ? (
              <form onSubmit={handleSaveProduct} className="p-6 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (BDT)</label>
                      <input
                        type="number"
                        required
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock</label>
                      <input
                        type="number"
                        required
                        readOnly={formData.hasSerialTracking}
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className={`w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] ${formData.hasSerialTracking ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase">Category</label>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('menus'); setIsAddingMenu(true); }}
                        className="text-[#EF4444] text-[10px] font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus size={10} /> Add New
                      </button>
                    </div>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    >
                      <option value="">Select Category</option>
                      {menus.map(menu => (
                        <optgroup key={menu.id} label={menu.name}>
                          <option value={menu.name}>{menu.name} (Main)</option>
                          {menu.subCategories?.map(sub => (
                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Has Serial Tracking</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.hasSerialTracking}
                        onChange={e => setFormData({ ...formData, hasSerialTracking: e.target.checked })}
                        className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                      />
                      <span className="text-sm font-medium">Require scanning individual serial numbers</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Is Accessory</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.isAccessory}
                        onChange={e => setFormData({ ...formData, isAccessory: e.target.checked })}
                        className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                      />
                      <span className="text-sm font-medium">Mark this product as an accessory</span>
                    </div>
                  </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-1">
                        <input 
                            type="checkbox" 
                            checked={(formData.warrantyMonths || 0) > 0} 
                            onChange={(e) => setFormData({...formData, warrantyMonths: e.target.checked ? (formData.warrantyMonths || 12) : 0})}
                            className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                        />
                        Warranty Included
                      </label>
                      
                      {(formData.warrantyMonths || 0) > 0 && (
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={Math.max(1, Math.round((formData.warrantyMonths || 0) / 12))}
                            onChange={e => setFormData({ ...formData, warrantyMonths: Math.max(1, Number(e.target.value)) * 12 })}
                            className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                          />
                          <span className="text-xs text-gray-500 uppercase font-bold">Years</span>
                        </div>
                      )}
                    </div>
                  {formData.hasSerialTracking && !editingProduct && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opening Stock Serials (Barcode scan / 1 per line)</label>
                      <textarea
                        value={formData.availableSerials?.join('\n') || ''}
                        onChange={e => {
                          const lines = e.target.value.split('\n').map(s => s.trim()).filter(s => s);
                          setFormData({ 
                            ...formData, 
                            availableSerials: lines,
                            stock: lines.length // Auto-update stock based on serial count
                          });
                        }}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] h-32 font-mono text-sm"
                        placeholder="SN-001&#10;SN-002&#10;SN-003"
                      />
                      <p className="text-xs text-gray-500 mt-1">Found {formData.availableSerials?.length || 0} serials. Quantity will be set automatically.</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Specifications</label>
                    <div className="space-y-2">
                      {Object.entries(formData.specs || {}).map(([key, value], index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Key"
                            value={key}
                            onChange={e => {
                              const newSpecs = { ...formData.specs };
                              delete newSpecs[key];
                              newSpecs[e.target.value] = value;
                              setFormData({ ...formData, specs: newSpecs });
                            }}
                            className="flex-1 border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={value}
                            onChange={e => {
                              const newSpecs = { ...formData.specs };
                              newSpecs[key] = e.target.value;
                              setFormData({ ...formData, specs: newSpecs });
                            }}
                            className="flex-1 border-gray-200 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSpecs = { ...formData.specs };
                              delete newSpecs[key];
                              setFormData({ ...formData, specs: newSpecs });
                            }}
                            className="text-red-500 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, specs: { ...formData.specs, '': '' } })}
                        className="text-xs font-bold text-[#EF4444] hover:underline"
                      >
                        + Add Specification
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Variants</label>
                    <div className="space-y-2">
                       {formData.variants?.map((variant, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Name (e.g. Red)"
                            value={variant.name}
                            onChange={e => {
                              const newVariants = [...formData.variants || []];
                              newVariants[index].name = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="flex-1 border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            placeholder="SKU"
                            value={variant.sku}
                            onChange={e => {
                              const newVariants = [...formData.variants || []];
                              newVariants[index].sku = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-20 border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={variant.price}
                            onChange={e => {
                              const newVariants = [...formData.variants || []];
                              newVariants[index].price = Number(e.target.value);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-20 border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={variant.stock}
                            onChange={e => {
                              const newVariants = [...formData.variants || []];
                              newVariants[index].stock = Number(e.target.value);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-20 border-gray-200 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = [...formData.variants || []];
                              newVariants.splice(index, 1);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="text-red-500 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, variants: [...(formData.variants || []), { id: Date.now().toString(), name: '', sku: '', price: 0, stock: 0 }] })}
                        className="text-xs font-bold text-[#EF4444] hover:underline"
                      >
                        + Add Variant
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vendor</label>
                    <select
                      value={formData.vendorId}
                      onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Images</label>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer",
                        dragOver ? "border-[#EF4444] bg-red-50" : "border-gray-200 hover:border-gray-300"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleImageUpload(e.dataTransfer.files);
                      }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = 'image/*';
                        input.onchange = (e) => handleImageUpload((e.target as HTMLInputElement).files);
                        input.click();
                      }}
                    >
                      <Upload className={cn("text-gray-400", isUploading && "animate-bounce")} />
                      <p className="text-xs text-gray-500 font-medium">
                        {isUploading ? 'Uploading...' : 'Drag & drop or click to upload'}
                      </p>
                    </div>

                    {formData.images.length > 0 && formData.images[0] !== '' && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {formData.images.map((url, index) => (
                          <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-gray-100">
                            <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XCircle size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>

                  {/* Variants Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase">Product Variants</h3>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="text-xs bg-[#EF4444] text-white px-3 py-1 rounded-md font-bold hover:bg-red-700 transition-all flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Variant
                      </button>
                    </div>
                    
                    {(formData.variants || []).length > 0 ? (
                      <div className="space-y-3">
                        {(formData.variants || []).map((variant) => (
                          <div key={variant.id} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                placeholder="Variant Name (e.g. Red, XL)"
                                value={variant.name}
                                onChange={e => updateVariant(variant.id, 'name', e.target.value)}
                                className="text-sm font-bold border-none focus:ring-0 p-0 w-full"
                              />
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">SKU</label>
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={e => updateVariant(variant.id, 'sku', e.target.value)}
                                  className="w-full text-xs border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Price</label>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={e => updateVariant(variant.id, 'price', Number(e.target.value))}
                                  className="w-full text-xs border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Stock</label>
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={e => updateVariant(variant.id, 'stock', Number(e.target.value))}
                                  className="w-full text-xs border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No variants defined for this product.</p>
                    )}
                  </div>

                  {/* Specs Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase">Technical Specifications</h3>
                      <button
                        type="button"
                        onClick={addSpec}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-bold hover:bg-gray-200 transition-all flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Spec
                      </button>
                    </div>
                    
                    {Object.keys(formData.specs || {}).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(formData.specs || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <div className="w-1/3 text-xs font-bold text-gray-500 uppercase truncate">{key}:</div>
                            <input
                              type="text"
                              value={value}
                              onChange={e => updateSpec(key, e.target.value)}
                              className="w-full text-xs border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444]"
                            />
                            <button
                              type="button"
                              onClick={() => removeSpec(key)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No technical specifications added.</p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[#EF4444] text-white py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                    >
                      {editingProduct ? 'Update Product' : 'Save Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : null}

            {isBulkEditing && selectedProductIds.length > 0 && (
              <BulkEditForm
                selectedCount={selectedProductIds.length}
                bulkEditData={bulkEditData}
                setBulkEditData={setBulkEditData}
                handleBulkUpdate={handleBulkUpdate}
                setIsBulkEditing={setIsBulkEditing}
                menus={menus}
                vendors={vendors}
                loading={loading}
              />
            )}
            {selectedProductIds.length > 0 && (
              <div className="bg-[#081621] text-white p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">{selectedProductIds.length} items selected</span>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <button
                    onClick={handleBulkExportProducts}
                    className="flex items-center gap-2 text-sm hover:text-[#EF4444] transition-colors font-bold"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button
                    onClick={handleBulkDeleteProducts}
                    className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors font-bold"
                  >
                    <Trash2 size={16} /> Delete Selected
                  </button>
                  <button
                    onClick={() => setIsBulkEditing(!isBulkEditing)}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-colors font-bold",
                      isBulkEditing ? "text-[#EF4444]" : "hover:text-[#EF4444]"
                    )}
                  >
                    <Edit2 size={16} /> Bulk Edit
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedProductIds([]);
                    setIsBulkEditing(false);
                  }}
                  className="text-xs uppercase tracking-wider font-bold hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === products.length && products.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(products.map(p => p.id));
                          } else {
                            setSelectedProductIds([]);
                            setIsBulkEditing(false);
                          }
                        }}
                        className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                      />
                    </th>
                    <th className="px-6 py-4 w-10">#</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...products]
                    .filter(p => inventoryCategoryFilter === 'all' || p.category === inventoryCategoryFilter)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((product, index) => (
                    <tr key={product.id} className={cn(
                      "hover:bg-gray-50 transition-colors",
                      selectedProductIds.includes(product.id) && "bg-red-50/50"
                    )}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds([...selectedProductIds, product.id]);
                            } else {
                              setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                            }
                          }}
                          className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                        />
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            <img src={product.images?.[0] || undefined} alt="" className="object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-[#081621]">{product.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase">ID: {product.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {vendors.find(v => v.id === product.vendorId)?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#EF4444]">{formatCurrency(product.price, settings)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit",
                            product.stock >= 10 ? "bg-green-100 text-green-700" : 
                            product.stock > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          )}>
                            {product.stock} {product.stock > 0 ? 'in stock' : 'stock out'}
                          </span>
                          {product.stock < 10 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
                              <AlertTriangle size={12} /> LOW STOCK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {settings.externalStoreEnabled && (
                            <button
                              onClick={async () => {
                                try {
                                  toast.loading(`Pushing ${product.name} to ${settings.externalStoreType}...`, { id: 'sync' });
                                  
                                  // Simulation of external API call
                                  if (settings.externalStoreType === 'webhook' && settings.externalStoreUrl) {
                                     // In a real app, this would be a fetch() call
                                     console.log('Pushing to Webhook:', {
                                       url: settings.externalStoreUrl,
                                       product: {
                                         id: product.id,
                                         name: product.name,
                                         price: product.price,
                                         stock: product.stock
                                       }
                                     });
                                  }
                                  
                                  await new Promise(resolve => setTimeout(resolve, 1500));
                                  toast.success(`Product synced successfully to ${settings.externalStoreType || 'external store'}`, { id: 'sync' });
                                } catch (error) {
                                  toast.error('Failed to sync product', { id: 'sync' });
                                }
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-all"
                              title="Push to External Store"
                            >
                              <ArrowRight size={18} />
                            </button>
                          )}
                          {hasPermission('manage_inventory') && (
                            <button
                              onClick={() => { setEditingProduct(product); setFormData({ ...product, variants: product.variants || [], specs: product.specs || {} }); setIsAddingProduct(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        
        ) : activeTab === 'quotations' ? (
          <QuotationManager />
        ) : activeTab === 'orders' ? (

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-[#EF4444]" /> Order Management
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-2">
                  {orders.filter(order => {
                    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
                    const matchesSearch = order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                                        order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                        order.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
                    const orderDate = order.createdAt.split('T')[0];
                    const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
                    const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
                    return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
                  }).length} Orders
                </span>
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by ID, Name or Phone..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Status:</label>
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value as OrderStatus | 'all')}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">From:</label>
                  <input
                    type="date"
                    value={orderStartDate}
                    onChange={e => setOrderStartDate(e.target.value)}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">To:</label>
                  <input
                    type="date"
                    value={orderEndDate}
                    onChange={e => setOrderEndDate(e.target.value)}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Sort:</label>
                  <select
                    value={orderSort}
                    onChange={e => setOrderSort(e.target.value as any)}
                    className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  >
                    <option value="date_desc">Date (Newest)</option>
                    <option value="date_asc">Date (Oldest)</option>
                    <option value="total_desc">Total (High-Low)</option>
                    <option value="total_asc">Total (Low-High)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={handleExportFilteredOrders}
                className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
              >
                <Download size={18} /> Export Filtered CSV
              </button>
            </div>
            {selectedOrderIds.length > 0 && (
              <div className="bg-[#081621] text-white p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">{selectedOrderIds.length} orders selected</span>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase font-bold">Update Status:</span>
                    <select
                      onChange={(e) => handleBulkUpdateOrderStatus(e.target.value as OrderStatus)}
                      className="bg-gray-800 border-gray-700 text-white text-xs rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      defaultValue=""
                    >
                      <option value="" disabled>Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <button
                    onClick={handleBulkReturnOrders}
                    className="flex items-center gap-2 text-sm hover:text-yellow-400 transition-colors font-bold"
                  >
                    <ArrowLeftRight size={16} /> Return Selected
                  </button>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <button
                    onClick={handleBulkExportOrders}
                    className="flex items-center gap-2 text-sm hover:text-[#EF4444] transition-colors font-bold"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button
                    onClick={handleBulkDeleteOrders}
                    className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors font-bold"
                  >
                    <Trash2 size={16} /> Delete Selected
                  </button>
                </div>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="text-xs uppercase tracking-wider font-bold hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.length === orders.filter(o => {
                          const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                          const matchesSearch = o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                                              o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                              o.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
                          const orderDate = o.createdAt.split('T')[0];
                          const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
                          const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
                          return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
                        }).length && orders.length > 0}
                        onChange={(e) => {
                          const filteredOrders = orders.filter(o => {
                            const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                            const matchesSearch = o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                                                o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                                o.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
                            const orderDate = o.createdAt.split('T')[0];
                            const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
                            const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
                            return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
                          });
                          if (e.target.checked) {
                            setSelectedOrderIds(filteredOrders.map(o => o.id));
                          } else {
                            setSelectedOrderIds([]);
                          }
                        }}
                        className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                      />
                    </th>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total & Payment</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Generate Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders
                    .filter(order => {
                      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
                      const matchesSearch = order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                                          order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                          order.customerPhone.toLowerCase().includes(orderSearchQuery.toLowerCase());
                      const orderDate = order.createdAt.split('T')[0];
                      const matchesStartDate = !orderStartDate || orderDate >= orderStartDate;
                      const matchesEndDate = !orderEndDate || orderDate <= orderEndDate;
                      return matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
                    })
                    .sort((a, b) => {
                      if (orderSort === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      if (orderSort === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      if (orderSort === 'total_desc') return b.total - a.total;
                      if (orderSort === 'total_asc') return a.total - b.total;
                      return 0;
                    })
                    .map(order => (
                      <tr key={order.id} className={cn(
                        "hover:bg-gray-50 transition-colors",
                        selectedOrderIds.includes(order.id) && "bg-red-50/50"
                      )}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrderIds([...selectedOrderIds, order.id]);
                              } else {
                                setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                              }
                            }}
                            className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                          />
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">#{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <button
                            onClick={() => {
                              const customer = customers.find(c => c.name === order.customerName);
                              if (customer) {
                                setSelectedLedgerEntity({ id: customer.id, name: customer.name, type: 'customer' });
                              } else {
                                toast.error('Customer details not found');
                              }
                            }}
                            className="text-sm font-bold text-[#EF4444] hover:underline text-left"
                          >
                            {order.customerName}
                          </button>
                          <span className="text-xs text-gray-500">{order.customerPhone}</span>
                        </div>
                      </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-sm font-bold text-[#EF4444]">{formatCurrency(order.total, settings)}</span>
                            {order.paymentMethod && (
                              <div className="flex flex-col gap-0.5">
                                <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase bg-gray-100 text-gray-600 inline-block w-fit">
                                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                   order.paymentMethod === 'bkash' ? 'bKash' : 
                                   order.paymentMethod === 'nagad' ? 'Nagad' : 
                                   order.paymentMethod === 'rocket' ? 'Rocket' : 
                                   order.paymentMethod === 'cellfin' ? 'Cellfin' : 
                                   order.paymentMethod === 'card' ? 'Visa/Mastercard' : 
                                   order.paymentMethod === 'bank' ? 'Bank Transfer' : 'Other Gateway'}
                                </span>
                                {order.paymentReference && (
                                  <span className="text-[10px] text-gray-500 max-w-[120px] truncate" title={order.paymentReference}>
                                    Ref: {order.paymentReference}
                                  </span>
                                )}
                              </div>
                            )}
                            {order.discountAmount && order.discountAmount > 0 ? (
                              <div className="text-[10px] text-gray-400 line-through">
                                {formatCurrency(order.items.reduce((acc, item) => acc + item.price * item.quantity, 0), settings)}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={order.discountAmount || 0}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val !== (order.discountAmount || 0)) {
                                  updateOrderDiscount(order.id, val);
                                }
                              }}
                              disabled={!hasPermission('manage_orders')}
                              className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444] disabled:bg-gray-50"
                              placeholder="0.00"
                            />
                          </div>
                        </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          disabled={!hasPermission('manage_orders')}
                          className="text-xs border-gray-200 rounded-md focus:ring-[#EF4444] disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="returned">Returned</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => generatePDF(order, 'invoice')}
                            className="p-2 text-gray-600 hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold"
                            title="Invoice"
                          >
                            <Download size={16} /> Invoice
                          </button>
                          <button
                            onClick={() => generatePDF(order, 'quotation')}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold"
                            title="Quotation"
                          >
                            <Download size={16} /> Quotation
                          </button>
                          <button
                            onClick={() => generatePDF(order, 'challan')}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-all flex items-center gap-1 text-xs font-bold"
                            title="Challan"
                          >
                            <Download size={16} /> Challan
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        
        ) : activeTab === 'purchase_return' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Purchase Return</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Reference No <span className="text-red-500">*</span></label>
                  <input type="text" value="PRET-2026-00001" className="w-full border-gray-200 rounded-md bg-gray-50 mb-4 text-sm" readOnly />
                  <label className="block text-xs font-bold text-gray-500 mb-1">Purchase Date</label>
                  <input type="date" className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Supplier <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 mb-4">
                    <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm">
                      <option>Select Supplier</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <button className="bg-blue-100 text-blue-600 px-3 rounded-md"><Plus size={16} /></button>
                  </div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Status <span className="text-red-500">*</span></label>
                  <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm">
                    <option>Select Status</option>
                    <option>Pending</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={new Date().toISOString().split('T')[0]} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] mb-4 text-sm" />
                  <label className="block text-xs font-bold text-gray-500 mb-1">Invoice No</label>
                  <input type="text" placeholder="Invoice No" className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-1">Note</label>
                <textarea className="w-full border-gray-200 rounded-md h-20 text-sm" placeholder="Note"></textarea>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-1">Items</label>
                <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm max-w-md">
                  <option>Select Item</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <table className="w-full text-left mb-6 border-b border-gray-100">
                <thead className="text-[10px] font-bold text-gray-500 uppercase border-b border-t border-gray-100">
                  <tr>
                    <th className="py-3 px-2">SN</th>
                    <th className="py-3 px-2">ITEM NAME</th>
                    <th className="py-3 px-2">IMEI/SERIAL/MEDICINE</th>
                    <th className="py-3 px-2">QUANTITY</th>
                    <th className="py-3 px-2">UNIT PRICE</th>
                    <th className="py-3 px-2">TOTAL</th>
                    <th className="py-3 px-2">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 min-h-[100px]">
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No items added to return</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-end mb-8">
                <div className="w-full max-w-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-700">Total Item 0 (0)</span>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Grand Total</label>
                    <input type="text" value="0.00" className="w-full border-gray-200 rounded-md bg-gray-50 text-sm" readOnly />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="bg-indigo-500 text-white px-6 py-2 rounded-md font-bold text-sm flex items-center gap-2"><CheckSquare size={16} /> Submit</button>
                <button className="bg-indigo-400 text-white px-6 py-2 rounded-md font-bold text-sm flex items-center gap-2" onClick={() => setActiveTab('purchases')}><ArrowLeft size={16} /> Back</button>
              </div>
            </div>
          </div>


        
        ) : activeTab === 'sale_return' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Sale Return</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Reference No <span className="text-red-500">*</span></label>
                  <input type="text" value="SR-2026-00001" className="w-full border-gray-200 rounded-md bg-gray-50 mb-4 text-sm" readOnly />
                  <label className="block text-xs font-bold text-gray-500 mb-1">Sale Invoice <span className="text-red-500">*</span></label>
                  <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm">
                    <option>Select Sale Invoice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={new Date().toISOString().split('T')[0]} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] mb-4 text-sm" />
                  <label className="block text-xs font-bold text-gray-500 mb-1">Sale Items</label>
                  <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm">
                    <option>Select Sale Item</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Customer <span className="text-red-500">*</span></label>
                  <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm">
                     <option>Select Customer</option>
                     {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <table className="w-full text-left mb-6 border-b border-gray-100">
                <thead className="text-[10px] font-bold text-gray-500 uppercase border-b border-t border-gray-100">
                  <tr>
                    <th className="py-3 px-2">SN</th>
                    <th className="py-3 px-2">ITEM - CODE - BRAND</th>
                    <th className="py-3 px-2">IMEI/SERIAL/MEDICINE</th>
                    <th className="py-3 px-2">SALE QTY</th>
                    <th className="py-3 px-2">RETURN QTY</th>
                    <th className="py-3 px-2">UNIT PRICE</th>
                    <th className="py-3 px-2">RETURN PRICE</th>
                    <th className="py-3 px-2">TOTAL</th>
                    <th className="py-3 px-2">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 min-h-[100px]">
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">No items added to return</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-end mb-8">
                <div className="w-full max-w-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-700">Total Item 0 (0)</span>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Grand Total</label>
                    <input type="text" value="0.00" className="w-full border-gray-200 rounded-md bg-gray-50 text-sm" readOnly />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method <span className="text-red-500">*</span></label>
                    <select className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm">
                      <option>Select Payment Method</option>
                      <option>Cash</option>
                      <option>Bank</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Paid Amount <span className="text-red-500">*</span></label>
                    <input type="text" value="0.00" className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] text-sm" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Due Amount</label>
                    <input type="text" value="0.00" className="w-full border-gray-200 rounded-md bg-gray-50 text-sm" readOnly />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="bg-indigo-500 text-white px-6 py-2 rounded-md font-bold text-sm flex items-center gap-2"><CheckSquare size={16} /> Submit</button>
              </div>
            </div>
          </div>

        ) : activeTab === 'purchases' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-[#EF4444]" /> Product Purchases
              </h2>
              <button
                onClick={() => setIsCreatingPurchase(true)}
                className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
              >
                <Plus size={18} /> New Purchase
              </button>
            </div>

            {isCreatingPurchase && (
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <form onSubmit={handleCreatePurchase} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Vendor</label>
                      <select
                        required
                        value={purchaseData.vendorId}
                        onChange={e => {
                          const vendor = vendors.find(v => v.id === e.target.value);
                          setPurchaseData({ ...purchaseData, vendorId: e.target.value, vendorName: vendor?.name || '' });
                        }}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description / Reference</label>
                      <input
                        type="text"
                        value={purchaseData.description}
                        onChange={e => setPurchaseData({ ...purchaseData, description: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. Monthly Stock Refill"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#081621] uppercase">Add Products to Purchase</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {products.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addItemToPurchase(product)}
                          className="p-3 bg-white border border-gray-200 rounded-lg hover:border-[#EF4444] transition-all text-left flex flex-col gap-2"
                        >
                          <img src={product.images[0]} alt="" className="w-full h-20 object-contain" />
                          <span className="text-xs font-bold line-clamp-2">{product.name}</span>
                          <span className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-500">Stock: {product.stock}</span>
                            <span className="text-[10px] text-[#EF4444] font-bold uppercase">
                              {vendors.find(v => v.id === product.vendorId)?.name || 'No Vendor'}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {purchaseData.items.length > 0 && (
                    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                          <tr>
                            <th className="px-4 py-2">Product</th>
                            <th className="px-4 py-2">Purchase Price</th>
                            <th className="px-4 py-2">Quantity</th>
                            <th className="px-4 py-2">Total</th>
                            <th className="px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {purchaseData.items.map(item => (
                            <React.Fragment key={item.id}>
                              <tr>
                                <td className="px-4 py-2 text-xs font-bold">{item.name}</td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={item.purchasePrice}
                                    onChange={e => updatePurchaseItem(item.id, 'purchasePrice', Number(e.target.value))}
                                    className="w-24 text-xs border-gray-200 rounded-md"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => updatePurchaseItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                    className="w-20 text-xs border-gray-200 rounded-md"
                                  />
                                </td>
                                <td className="px-4 py-2 text-xs font-bold">
                                  {formatCurrency(item.purchasePrice * item.quantity, settings)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeItemFromPurchase(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                              <tr className="bg-gray-50/30">
                                <td colSpan={5} className="px-4 py-2 border-t border-gray-100">
                                  <div className="flex flex-col gap-1">
                                     <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                                       <input
                                         type="checkbox"
                                         checked={item.hasWarranty || false}
                                         onChange={(e) => updatePurchaseItem(item.id, 'hasWarranty', e.target.checked)}
                                         className="rounded border-gray-300"
                                       />
                                       <span>Include Warranty for this product</span>
                                     </label>
                                     {item.hasWarranty && (
                                        <div className="flex items-center gap-2 ml-6 mt-1">
                                           <input
                                             type="number"
                                             min="1"
                                             value={item.warrantyYears || ''}
                                             onChange={(e) => updatePurchaseItem(item.id, 'warrantyYears', Number(e.target.value))}
                                             className="w-20 text-xs border-gray-200 rounded-md bg-white"
                                             placeholder="Years"
                                           />
                                           <span className="text-xs text-gray-500 font-medium">Years</span>
                                        </div>
                                     )}
                                  </div>
                                </td>
                              </tr>
                              {item.hasSerialTracking && (
                                <tr className="bg-orange-50/50">
                                  <td colSpan={5} className="px-4 py-3">
                                    <label className="block text-[10px] font-bold text-orange-600 uppercase mb-2 flex items-center gap-1">
                                      <Ticket size={12} /> Enter/Scan Serials for each unit
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {Array.from({ length: Math.max(1, item.quantity || 1) }).map((_, idx) => (
                                        <div key={idx} className="flex flex-col">
                                          <span className="text-[10px] text-orange-700 font-bold mb-0.5">Unit {idx + 1}</span>
                                          <input
                                            type="text"
                                            value={(Array.isArray(item.newSerials) ? item.newSerials[idx] : (item.newSerials?.split('\n')[idx] || '')) || ''}
                                            onChange={(e) => {
                                              const newArr = Array.isArray(item.newSerials) ? [...item.newSerials] : (item.newSerials ? item.newSerials.split('\n') : []);
                                              newArr[idx] = e.target.value;
                                              const newData = { ...purchaseData };
                                              const iidx = newData.items.findIndex(i => i.id === item.id);
                                              if (iidx !== -1) {
                                                newData.items[iidx].newSerials = newArr;
                                                setPurchaseData(newData);
                                              }
                                            }}
                                            className="w-full text-xs font-mono border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                                            placeholder="Scan barcode..."
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right text-xs uppercase">Grand Total:</td>
                            <td className="px-4 py-2 text-sm text-[#EF4444]">
                              {formatCurrency(purchaseData.items.reduce((sum, i) => sum + (i.purchasePrice * i.quantity), 0), settings)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[#EF4444] text-white py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                    >
                      Record Purchase & Update Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingPurchase(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                    <input type="date" value={purchaseStartDate} onChange={e => setPurchaseStartDate(e.target.value)} className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                    <input type="date" value={purchaseEndDate} onChange={e => setPurchaseEndDate(e.target.value)} className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Vendor or Description..."
                        value={purchaseSearchQuery}
                        onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] w-48"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Purchase History</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions
                      .filter(t => t.type === 'purchase')
                      .filter(t => {
                        const matchesSearch = t.entityName.toLowerCase().includes(purchaseSearchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(purchaseSearchQuery.toLowerCase());
                        const txDate = new Date(t.date).toISOString().split('T')[0];
                        const matchesStartDate = !purchaseStartDate || txDate >= purchaseStartDate;
                        const matchesEndDate = !purchaseEndDate || txDate <= purchaseEndDate;
                        return matchesSearch && matchesStartDate && matchesEndDate;
                      })
                      .map(tx => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedLedgerEntity({ id: tx.entityId, name: tx.entityName, type: 'vendor' })}
                              className="font-medium text-sm text-[#EF4444] hover:underline text-left"
                            >
                              {tx.entityName}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{tx.description}</td>
                          <td className="px-6 py-4 text-right font-bold text-red-600">
                            {formatCurrency(tx.amount, settings)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'customers' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-[#EF4444]" /> Customer Management
              </h2>
              {hasPermission('manage_orders') && (
                <button
                  onClick={() => setIsAddingCustomer(true)}
                  className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Add Customer
                </button>
              )}
            </div>

            {(isAddingCustomer || editingCustomer) && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                   <div className="p-6 border-b border-gray-100 font-bold text-lg">
                     {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                   </div>
                      <form onSubmit={handleSaveCustomer} className="p-6 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                            <input
                              type="text"
                              required
                              value={customerFormData.name}
                              onChange={e => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                              className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                            <input
                              type="email"
                              required
                              value={customerFormData.email}
                              onChange={e => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                              className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                            <input
                              type="tel"
                              required
                              value={customerFormData.phone}
                              onChange={e => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                              className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                            <input
                              type="text"
                              required
                              value={customerFormData.address}
                              onChange={e => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                              className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                            />
                          </div>
                          <div className="flex gap-4">
                            <button
                              type="submit"
                              className="flex-1 bg-[#EF4444] text-white py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                            >
                              {editingCustomer ? 'Update Customer' : 'Save Customer'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setIsAddingCustomer(false); setEditingCustomer(null); }}
                              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </form>
                </div>
              </div>
            )}


            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedLedgerEntity({ id: customer.id, name: customer.name, type: 'customer' })}
                          className="font-medium text-sm text-[#EF4444] hover:underline text-left"
                        >
                          {customer.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Mail size={12} /> {customer.email}
                          </a>
                          {customer.phone && (
                              <div className="flex items-center gap-2">
                                  <a href={`tel:${customer.phone}`} className="hover:text-blue-600 flex items-center gap-1">
                                      <Phone size={12} /> {customer.phone}
                                  </a>
                                  <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-700">
                                      <MessageCircle size={14} />
                                  </a>
                              </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.address}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedLedgerEntity({ id: customer.id, name: customer.name, type: 'customer' })}
                            className="p-2 text-[#EF4444] hover:bg-red-50 rounded-md transition-all"
                            title="View Ledger"
                          >
                            <FileText size={18} />
                          </button>
                          {hasPermission('manage_orders') && (
                            <button
                              onClick={() => { setEditingCustomer(customer); setCustomerFormData({ ...customer }); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                              title="Edit Customer"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'vendors' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="text-[#EF4444]" /> Vendor Management
              </h2>
              {hasPermission('manage_inventory') && (
                <button
                  onClick={() => setIsAddingVendor(true)}
                  className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Add Vendor
                </button>
              )}
            </div>

            {(isAddingVendor || editingVendor) && (
              <form onSubmit={handleSaveVendor} className="p-6 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vendor Name</label>
                    <input
                      type="text"
                      required
                      value={vendorFormData.name}
                      onChange={e => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={vendorFormData.email}
                      onChange={e => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                    <input
                      type="text"
                      value={vendorFormData.category}
                      onChange={e => setVendorFormData({ ...vendorFormData, category: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={vendorFormData.phone}
                      onChange={e => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={vendorFormData.address}
                      onChange={e => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[#EF4444] text-white py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                    >
                      {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingVendor(false); setEditingVendor(null); }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map(vendor => (
                    <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setSelectedLedgerEntity({ id: vendor.id, name: vendor.name, type: 'vendor' }); setLedgerView('ledger'); }}
                          className="font-medium text-sm text-[#EF4444] hover:underline text-left"
                        >
                          {vendor.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{vendor.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">{vendor.email}</span>
                          <span className="text-xs text-gray-400">{vendor.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedLedgerEntity({ id: vendor.id, name: vendor.name, type: 'vendor' }); setLedgerView('ledger'); }}
                            className="p-2 text-[#EF4444] hover:bg-red-50 rounded-md transition-all"
                            title="View Ledger"
                          >
                            <FileText size={18} />
                          </button>
                          {hasPermission('manage_inventory') && (
                            <button
                              onClick={() => { setEditingVendor(vendor); setVendorFormData({ ...vendor }); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                              title="Edit Vendor"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteVendor(vendor.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        
        
        
        ) : activeTab === 'conveyance' && isAdmin ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck className="text-[#EF4444]" /> Employee Transport Conveyance
              </h2>
              <button
                onClick={() => setIsAddingConveyance(true)}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Add Conveyance
              </button>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {conveyances.length > 0 ? (
                    conveyances.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{c.date}</td>
                        <td className="px-6 py-4 text-sm font-bold">{c.employee || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{c.description}</td>
                        <td className="px-6 py-4 text-sm font-bold text-right">{formatCurrency(c.amount, settings)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No conveyance records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


        ) : ['deposits_withdrawals', 'account_balance', 'account_statement', 'balance_sheet', 'trial_balance', 'transaction_history'].includes(activeTab) && hasPermission('manage_finances') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 capitalize">
                <Book className="text-[#EF4444]" /> {activeTab.replace('_', ' ')}
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-gray-400">
                <Book size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-bold text-lg capitalize">{activeTab.replace('_', ' ')} Module</p>
                <p className="text-sm">This accounting feature is currently available in the standard version.</p>
              </div>
            </div>
          </div>

        ) : activeTab === 'all_reports' && hasPermission('manage_reports') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <FileText className="text-[#EF4444]" /> Reports Directory
              </h2>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    const reports = document.querySelectorAll('.report-item');
                    reports.forEach((report: any) => {
                      const name = report.querySelector('span').innerText.toLowerCase();
                      report.style.display = name.includes(search) ? 'flex' : 'none';
                    });
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  'Register Report', 'Z Report', 'Daily Summary Report', 'Sale Report', 'Due Sale Report', 'Final Invoice Due Report', 'Service Sale Report', 'Combo Service Report', 'Stock Report', 'Low Stock Report', 'Expire Soon Report', 'Employee Sale Report', 'Customer Receive Report', 'Attendance Report', 'Product Profit Report', 'Supplier Ledger Report', 'Supplier Balance Report', 'Customer Ledger Report', 'Customer Balance Report', 'Servicing Report', 'Product Sale Report', 'Tax Report', 'GST Reports', 'Detailed Sale Report', 'Profit Loss Report', 'Purchase Report', 'Expense Report', 'Income Report', 'Salary Report', 'Purchase Return Report', 'Sale Return Report', 'Damage Report', 'Installment Collection Report', 'Installment Due Report', 'Item Tracking Report', 'Price History Report', 'Cash Flow Report', 'Available Loyalty Point Report', 'Usage Loyalty Point Report'
                ].map((reportName, idx) => {
                  let customAction = () => toast.success('Opening ' + reportName + '...');
                  if (reportName === 'Sale Report') { customAction = () => setActiveTab('reports'); }
                  if (reportName === 'Customer Receive Report') { customAction = () => setActiveTab('customer_receive_report'); }
                  if (reportName === 'Stock Report' || reportName === 'Low Stock Report') { customAction = () => setActiveTab('inventory'); }
                  if (reportName === 'Supplier Ledger Report' || reportName === 'Customer Ledger Report') { customAction = () => setActiveTab('ledger'); }
                  if (reportName === 'Income Report') { customAction = () => setActiveTab('manual_income'); }
                  if (reportName === 'Expense Report') { customAction = () => setActiveTab('manual_expense'); }
                  
                  return (
                    <div key={idx} className="report-item border border-gray-100 rounded-lg p-4 hover:border-red-200 hover:shadow-sm transition-all cursor-pointer group flex flex-col items-start gap-2 bg-gray-50 hover:bg-white" onClick={customAction}>
                      <div className="bg-white p-2 text-[#EF4444] rounded border border-gray-100 group-hover:bg-red-50">
                        <FileText size={20} />
                      </div>
                      <span className="font-bold text-sm text-gray-700">{reportName}</span>
                      <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Standard Report</span>
                    </div>
                  );
                })}
                <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 transition-all cursor-pointer">
                  <Plus size={24} className="mb-2" />
                  <span className="font-bold text-xs uppercase">Add New Report</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'tx_categories' && hasPermission('manage_finances') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <List className="text-[#EF4444]" /> Income & Expense Categories
              </h2>
              <button
                onClick={() => {
                  setNewTransactionCategory({name: '', type: 'expense', description: ''});
                  setIsAddingTransactionCategory(true);
                }}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Add Category
              </button>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactionCategories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold">{cat.name}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 text-[10px] font-bold rounded-full uppercase", cat.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                          {cat.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{cat.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(cat.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {transactionCategories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No categories found. Create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


        ) : activeTab === 'manual_expense' && hasPermission('manage_finances') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload className="text-[#EF4444]" /> Manual Expenses
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('tx_categories')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                >
                  <List size={18} /> Manage Categories
                </button>
                <button
                  onClick={() => {
                    setManualTransactionType('expense');
                    setNewManualTransaction({amount: 0, date: new Date().toISOString().split('T')[0], description: '', categoryId: ''});
                    setIsAddingManualTransaction(true);
                  }}
                  className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Record Expense
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.filter(t => t.type === 'expense' && t.entityId === 'manual').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{t.date}</td>
                      <td className="px-6 py-4 font-bold text-sm">{t.categoryName || 'Uncategorized'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.description}</td>
                      <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(t.amount, settings)}</td>
                    </tr>
                  ))}
                  {transactions.filter(t => t.type === 'expense' && t.entityId === 'manual').length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No manual expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


        ) : activeTab === 'manual_income' && hasPermission('manage_finances') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Download className="text-[#EF4444]" /> Manual Income
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('tx_categories')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                >
                  <List size={18} /> Manage Categories
                </button>
                <button
                  onClick={() => {
                    setManualTransactionType('income');
                    setNewManualTransaction({amount: 0, date: new Date().toISOString().split('T')[0], description: '', categoryId: ''});
                    setIsAddingManualTransaction(true);
                  }}
                  className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Record Income
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.filter(t => t.type === 'income' && t.entityId === 'manual').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{t.date}</td>
                      <td className="px-6 py-4 font-bold text-sm">{t.categoryName || 'Uncategorized'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.description}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(t.amount, settings)}</td>
                    </tr>
                  ))}
                  {transactions.filter(t => t.type === 'income' && t.entityId === 'manual').length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No manual income recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        ) : activeTab === 'payment_accounts' && hasPermission('manage_finances') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="text-[#EF4444]" /> Payment Account
              </h2>
              <div className="flex gap-2">
                {!isAddingPaymentAccount && (
                  <button onClick={() => setIsAddingPaymentAccount(true)} className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm">
                    <Plus size={18} /> Add Payment Method
                  </button>
                )}
              </div>
            </div>

            {isAddingPaymentAccount ? (
              <div className="p-6">
                <div><h3 className="text-xl font-bold mb-6 text-gray-800">Add Payment Method</h3><form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const docRef = await addDoc(collection(db, 'payment_accounts'), {
                      ...paymentAccountFormData,
                      createdAt: new Date().toISOString()
                    });
                    toast.success('Payment account added successfully');
                    setPaymentAccounts([...paymentAccounts, { id: docRef.id, ...paymentAccountFormData, createdAt: new Date().toISOString() }]);
                    setIsAddingPaymentAccount(false);
                    setPaymentAccountFormData({ type: '', name: '', description: '', openingBalance: 0, status: 'active' });
                  } catch (error) {
                    toast.error('Failed to add payment account');
                  }
                }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-[#EF4444] mb-1">Account Type <span className="text-red-500">*</span></label>
                      <select required value={paymentAccountFormData.type} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, type: e.target.value})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]">
                        <option value="">Select Account Type</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="bkash">Bkash</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#EF4444] mb-1">Account Name <span className="text-red-500">*</span></label>
                      <input type="text" required placeholder="Account Name" value={paymentAccountFormData.name} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, name: e.target.value})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                      <textarea placeholder="Description" rows={1} value={paymentAccountFormData.description} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, description: e.target.value})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#EF4444] mb-1">Opening Balance <span className="text-red-500">*</span></label>
                      <input type="number" required placeholder="Opening Balance" value={paymentAccountFormData.openingBalance} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, openingBalance: Number(e.target.value) || 0})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#EF4444] mb-1">Status <span className="text-red-500">*</span></label>
                      <select required value={paymentAccountFormData.status} onChange={e => setPaymentAccountFormData({...paymentAccountFormData, status: e.target.value})} className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-[#6366F1] text-white px-6 py-2 rounded-md font-bold hover:bg-indigo-600 transition-all flex items-center gap-2">
                      <CheckCircle size={18} /> Submit
                    </button>
                    <button type="button" onClick={() => setIsAddingPaymentAccount(false)} className="bg-[#6366F1] opacity-90 text-white px-6 py-2 rounded-md font-bold hover:opacity-100 transition-all flex items-center gap-2">
                      <ArrowLeft size={18} /> Back
                    </button>
                  </div>
                </form>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'name', direction: paymentAccountSort.key === 'name' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Account Name {paymentAccountSort.key === 'name' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'type', direction: paymentAccountSort.key === 'type' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Account Type {paymentAccountSort.key === 'type' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'description', direction: paymentAccountSort.key === 'description' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Description {paymentAccountSort.key === 'description' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none text-right hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'balance', direction: paymentAccountSort.key === 'balance' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Balance {paymentAccountSort.key === 'balance' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-center cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => setPaymentAccountSort({ key: 'status', direction: paymentAccountSort.key === 'status' && paymentAccountSort.direction === 'asc' ? 'desc' : 'asc' })}>
                        Status {paymentAccountSort.key === 'status' && (paymentAccountSort.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {[...paymentAccounts].sort((a,b) => {
                      let valA = a[paymentAccountSort.key === 'balance' ? 'openingBalance' : paymentAccountSort.key];
                      let valB = b[paymentAccountSort.key === 'balance' ? 'openingBalance' : paymentAccountSort.key];
                      
                      if (typeof valA === 'string') valA = valA.toLowerCase();
                      if (typeof valB === 'string') valB = valB.toLowerCase();
                      
                      if (valA < valB) return paymentAccountSort.direction === 'asc' ? -1 : 1;
                      if (valA > valB) return paymentAccountSort.direction === 'asc' ? 1 : -1;
                      return 0;
                    }).map((account, idx) => (
                      <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{account.name}</td>
                        <td className="px-6 py-4 text-xs font-mono uppercase text-gray-500">{account.type.replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-gray-500">{account.description || '-'}</td>
                        <td className="px-6 py-4 font-mono font-bold text-right">{formatCurrency(account.openingBalance, settings)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {account.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => {
                            if(window.confirm('Are you sure you want to delete this payment account?')) {
                              deleteDoc(doc(db, 'payment_accounts', account.id)).then(() => {
                                setPaymentAccounts(paymentAccounts.filter(p => p.id !== account.id));
                                toast.success('Account deleted');
                              });
                            }
                          }} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paymentAccounts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No payment accounts configured.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'transactions' && hasPermission('manage_finances') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="text-[#EF4444]" /> Transaction History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Entity</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          tx.type === 'sale' || tx.type === 'payment_received' || tx.type === 'money_receipt' ? "bg-green-100 text-green-700" : 
                          tx.type === 'purchase' || tx.type === 'payment_made' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            const isCustomer = customers.some(c => c.id === tx.entityId);
                            setSelectedLedgerEntity({ 
                              id: tx.entityId, 
                              name: tx.entityName, 
                              type: isCustomer ? 'customer' : 'vendor' 
                            });
                          }}
                          className="font-medium text-sm text-[#EF4444] hover:underline text-left"
                        >
                          {tx.entityName}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tx.description}</td>
                      <td className={cn(
                        "px-6 py-4 text-right font-bold",
                        tx.type === 'sale' || tx.type === 'payment_received' || tx.type === 'money_receipt' ? "text-green-600" : "text-red-600"
                      )}>
                        {tx.type === 'sale' || tx.type === 'payment_received' || tx.type === 'money_receipt' ? '+' : '-'}{formatCurrency(tx.amount, settings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'menus' && isAdmin ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MenuIcon className="text-[#EF4444]" /> Categories & Menus
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const pcBuilderCategories = [
                      { id: 'cpu', name: 'CPU', slug: 'cpu' },
                      { id: 'cooler', name: 'CPU Cooler', slug: 'cpu-cooler' },
                      { id: 'motherboard', name: 'Motherboard', slug: 'motherboard' },
                      { id: 'ram', name: 'RAM', slug: 'ram' },
                      { id: 'storage', name: 'Storage', slug: 'storage' },
                      { id: 'gpu', name: 'Graphics Card', slug: 'graphics-card' },
                      { id: 'psu', name: 'Power Supply', slug: 'power-supply' },
                      { id: 'casing', name: 'Casing', slug: 'casing' },
                      { id: 'monitor', name: 'Monitor', slug: 'monitor' },
                      { id: 'casing_cooler', name: 'Casing Cooler', slug: 'casing-cooler' },
                      { id: 'keyboard', name: 'Keyboard', slug: 'keyboard' },
                      { id: 'mouse', name: 'Mouse', slug: 'mouse' },
                      { id: 'speaker', name: 'Speaker & Home Theater', slug: 'speaker' },
                      { id: 'headphone', name: 'Headphone', slug: 'headphone' },
                      { id: 'wifi', name: 'Wifi Adapter / LAN Card', slug: 'wifi-adapter' },
                      { id: 'antivirus', name: 'Anti Virus', slug: 'anti-virus' },
                      { id: 'ups', name: 'UPS', slug: 'ups' }
                    ];

                    let componentsMenu = menus.find(m => m.name.toLowerCase() === 'components');
                    
                    try {
                      if (!componentsMenu) {
                        const docRef = await addDoc(collection(db, 'menus'), {
                          name: 'Components',
                          slug: 'components',
                          order: 1,
                          subCategories: [],
                          createdAt: new Date().toISOString()
                        });
                        componentsMenu = { id: docRef.id, name: 'Components', slug: 'components', order: 1, subCategories: [] };
                      }

                      const existingSubs = componentsMenu.subCategories || [];
                      const newSubs = [...existingSubs];
                      
                      pcBuilderCategories.forEach(cat => {
                        if (!existingSubs.some(s => s.slug === cat.slug)) {
                          newSubs.push({ id: Math.random().toString(36).substr(2, 9), name: cat.name, slug: cat.slug });
                        }
                      });

                      await updateDoc(doc(db, 'menus', componentsMenu.id), {
                        subCategories: newSubs
                      });
                      
                      toast.success('Categories seeded to Components menu');
                      fetchData();
                    } catch (error) {
                      console.error('Error seeding categories:', error);
                      toast.error('Failed to seed categories');
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-all font-bold text-sm"
                >
                  <Cpu size={18} /> Seed Builder Categories
                </button>
                <button
                  onClick={() => setIsAddingSubCategory(true)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Add Sub Category
                </button>
                <button
                  onClick={() => setIsAddingMenu(true)}
                  className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Add Parent Category
                </button>
              </div>
            </div>

            {isAddingSubCategory && (
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <form onSubmit={handleSaveSubCategory} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Category</label>
                      <select
                        required
                        value={subCategoryFormData.parentId}
                        onChange={e => setSubCategoryFormData({ ...subCategoryFormData, parentId: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      >
                        <option value="">Select Category</option>
                        {menus.map(menu => (
                          <option key={menu.id} value={menu.id}>{menu.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sub Category Name</label>
                      <input
                        type="text"
                        required
                        value={subCategoryFormData.name}
                        onChange={e => setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. Gaming Laptops"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug</label>
                      <input
                        type="text"
                        required
                        value={subCategoryFormData.slug}
                        onChange={e => setSubCategoryFormData({ ...subCategoryFormData, slug: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. gaming-laptops"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-[#EF4444] text-white px-8 py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                    >
                      Add Sub Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSubCategory(false)}
                      className="bg-gray-200 text-gray-700 px-8 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {(isAddingMenu || editingMenu) && (
              <form onSubmit={handleSaveMenu} className="p-6 bg-gray-50 border-b border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Category Name</label>
                    <input
                      type="text"
                      required
                      value={menuFormData.name}
                      onChange={e => setMenuFormData({ ...menuFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      value={menuFormData.slug}
                      onChange={e => setMenuFormData({ ...menuFormData, slug: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Order</label>
                    <input
                      type="number"
                      required
                      value={menuFormData.order}
                      onChange={e => setMenuFormData({ ...menuFormData, order: parseInt(e.target.value) })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Sub Categories</h3>
                    <button
                      type="button"
                      onClick={() => setMenuFormData({
                        ...menuFormData,
                        subCategories: [...menuFormData.subCategories, { id: Math.random().toString(36).substr(2, 9), name: '', slug: '' }]
                      })}
                      className="text-[#EF4444] text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> Add Sub Category
                    </button>
                  </div>
                  <div className="space-y-3">
                    {menuFormData.subCategories.map((sub, idx) => (
                      <div key={sub.id} className="flex items-center gap-4 bg-white p-3 rounded-md border border-gray-200">
                        <div className="flex-grow grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Sub Category Name"
                            value={sub.name}
                            onChange={e => {
                              const newSubs = [...menuFormData.subCategories];
                              newSubs[idx].name = e.target.value;
                              newSubs[idx].slug = e.target.value.toLowerCase().replace(/\s+/g, '-');
                              setMenuFormData({ ...menuFormData, subCategories: newSubs });
                            }}
                            className="text-sm border-gray-200 rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Slug"
                            value={sub.slug}
                            onChange={e => {
                              const newSubs = [...menuFormData.subCategories];
                              newSubs[idx].slug = e.target.value;
                              setMenuFormData({ ...menuFormData, subCategories: newSubs });
                            }}
                            className="text-sm border-gray-200 rounded-md"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSubs = menuFormData.subCategories.filter((_, i) => i !== idx);
                            setMenuFormData({ ...menuFormData, subCategories: newSubs });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-[#EF4444] text-white px-8 py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                  >
                    {editingMenu ? 'Update Menu' : 'Save Menu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingMenu(false); setEditingMenu(null); }}
                    className="bg-gray-200 text-gray-700 px-8 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="p-6 space-y-4">
              {menus.map(menu => (
                <div key={menu.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#EF4444] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-md text-gray-500 font-bold text-xs">#{menu.order}</div>
                      <div>
                        <h3 className="font-bold text-lg">{menu.name}</h3>
                        <p className="text-xs text-gray-400">/{menu.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingMenu(menu); setMenuFormData({ ...menu }); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {menu.subCategories && menu.subCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {menu.subCategories.map(sub => (
                        <span key={sub.id} className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs border border-gray-100 flex items-center gap-1">
                          {sub.name} <ChevronRight size={10} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {menus.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic">No menus created yet.</div>
              )}
            </div>
          </div>
        
        ) : activeTab === 'ledger' && hasPermission('manage_finances') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Book className="text-[#EF4444]" /> General Ledger
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setGeneralLedgerFilterType('daily')}
                    className={cn("px-3 py-1 rounded text-sm font-bold transition-all", generalLedgerFilterType === 'daily' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setGeneralLedgerFilterType('monthly')}
                    className={cn("px-3 py-1 rounded text-sm font-bold transition-all", generalLedgerFilterType === 'monthly' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                  >
                    Monthly
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">From</label>
                  <input
                    type="date"
                    value={generalLedgerStartDate}
                    onChange={e => setGeneralLedgerStartDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">To</label>
                  <input
                    type="date"
                    value={generalLedgerEndDate}
                    onChange={e => setGeneralLedgerEndDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 border-b border-gray-100">
              <button 
                onClick={() => {
                  const allDetails = getLedgerData().flatMap(item => item.details);
                  setLedgerReportModalData(allDetails.filter(tx => ['sale', 'payment_received', 'money_receipt', 'income'].includes(tx.type)));
                  setLedgerReportType('income');
                  setShowLedgerReportModal(true);
                }}
                className="bg-white p-4 rounded-lg shadow-sm border border-green-100 flex flex-col hover:shadow-md transition-shadow text-left"
              >
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Total Income</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.income, 0), settings)}
                </span>
              </button>
              <button 
                onClick={() => {
                  const allDetails = getLedgerData().flatMap(item => item.details);
                  setLedgerReportModalData(allDetails.filter(tx => !['sale', 'payment_received', 'money_receipt', 'income'].includes(tx.type)));
                  setLedgerReportType('expense');
                  setShowLedgerReportModal(true);
                }}
                className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex flex-col hover:shadow-md transition-shadow text-left"
              >
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Total Expenditure</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.expense, 0), settings)}
                </span>
              </button>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase mb-1">Net Balance</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(getLedgerData().reduce((sum, item) => sum + item.balance, 0), settings)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Date / Period</th>
                    <th className="px-6 py-4 text-right">Income (Credit)</th>
                    <th className="px-6 py-4 text-right">Expenditure (Debit)</th>
                    <th className="px-6 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getLedgerData().map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{row.date}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(row.income, settings)}</td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">{formatCurrency(row.expense, settings)}</td>
                      <td className={cn("px-6 py-4 text-right font-bold", row.balance >= 0 ? "text-blue-600" : "text-red-600")}>
                        {formatCurrency(row.balance, settings)}
                      </td>
                    </tr>
                  ))}
                  {getLedgerData().length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No ledger records found for the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {showLedgerReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900 capitalize">{ledgerReportType} Report</h2>
                      <button onClick={() => setShowLedgerReportModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                      </button>
                    </div>
                    <div className="overflow-y-auto p-6">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {ledgerReportModalData.map((tx, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4">{tx.description}</td>
                              <td className="px-6 py-4 capitalize">{tx.type}</td>
                              <td className="px-6 py-4 text-right">{formatCurrency(tx.amount, settings)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end">
                      <button onClick={() => setShowLedgerReportModal(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-bold text-sm">Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        ) : activeTab === 'reports' && hasPermission('manage_reports') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-[#EF4444]" /> Sales Report
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">From</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={e => setReportStartDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">To</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={e => setReportEndDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition-all font-bold text-sm"
                >
                  <Download size={18} /> Export CSV
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by product name or date..."
                  value={reportSearch}
                  onChange={e => setReportSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                />
                <ShoppingBag className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th 
                      className="px-6 py-4 cursor-pointer hover:text-[#EF4444] transition-colors"
                      onClick={() => setReportSortConfig({ key: 'date', direction: reportSortConfig.key === 'date' && reportSortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      Date {reportSortConfig.key === 'date' && (reportSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-4 cursor-pointer hover:text-[#EF4444] transition-colors"
                      onClick={() => setReportSortConfig({ key: 'productName', direction: reportSortConfig.key === 'productName' && reportSortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      Product Name {reportSortConfig.key === 'productName' && (reportSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-4 cursor-pointer hover:text-[#EF4444] transition-colors text-right"
                      onClick={() => setReportSortConfig({ key: 'quantity', direction: reportSortConfig.key === 'quantity' && reportSortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      Quantity {reportSortConfig.key === 'quantity' && (reportSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-4 cursor-pointer hover:text-[#EF4444] transition-colors text-right"
                      onClick={() => setReportSortConfig({ key: 'total', direction: reportSortConfig.key === 'total' && reportSortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    >
                      Total Amount {reportSortConfig.key === 'total' && (reportSortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getSalesReportData().map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-sm">{row.productName}</td>
                      <td className="px-6 py-4 text-right text-sm">{row.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#EF4444]">{formatCurrency(row.total, settings)}</td>
                    </tr>
                  ))}
                  {getSalesReportData().length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No sales data found for the selected period.</td>
                    </tr>
                  )}
                </tbody>
                {getSalesReportData().length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-right uppercase text-xs text-gray-500 tracking-wider">Total</td>
                      <td className="px-6 py-4 text-right">{getSalesReportData().reduce((sum, row) => sum + row.quantity, 0)}</td>
                      <td className="px-6 py-4 text-right text-[#EF4444]">{formatCurrency(getSalesReportData().reduce((sum, row) => sum + row.total, 0), settings)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : activeTab === 'customer_receive_report' && hasPermission('manage_reports') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-[#EF4444]" /> Customer Receive Report
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">From</label>
                  <input
                    type="date"
                    value={crReportStartDate}
                    onChange={e => setCrReportStartDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">To</label>
                  <input
                    type="date"
                    value={crReportEndDate}
                    onChange={e => setCrReportEndDate(e.target.value)}
                    className="border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <button
                  onClick={exportCrToCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition-all font-bold text-sm"
                >
                  <Download size={18} /> Export CSV
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="p-6 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by customer name, ref, desc..."
                  value={crReportSearch}
                  onChange={e => setCrReportSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] bg-white"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>

              <div>
                <select
                  value={crReportMethod}
                  onChange={e => setCrReportMethod(e.target.value)}
                  className="w-full border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] bg-white"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash (Direct/COD)</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="cellfin">Cellfin</option>
                  <option value="card">Visa/Mastercard</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="other">Other Gateways</option>
                </select>
              </div>

              <div>
                <select
                  value={crReportCustomer}
                  onChange={e => setCrReportCustomer(e.target.value)}
                  className="w-full border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] bg-white"
                >
                  <option value="all">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* KPI Overview Cards */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50 border-b border-gray-100">
              {(() => {
                const reportRows = getCustomerReceiveReportData();
                const totalAmount = reportRows.reduce((sum, r) => sum + r.amount, 0);
                const cashTotal = reportRows.filter(r => r.paymentMethod === 'cash' || r.paymentMethod === 'cod').reduce((sum, r) => sum + r.amount, 0);
                const mfsTotal = reportRows.filter(r => ['bkash', 'nagad', 'rocket', 'cellfin'].includes(r.paymentMethod)).reduce((sum, r) => sum + r.amount, 0);
                const bankCardTotal = totalAmount - cashTotal - mfsTotal;

                return (
                  <>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Received</p>
                      <p className="text-2xl font-black text-gray-900">{formatCurrency(totalAmount, settings)}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">{reportRows.length} total payments collected</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cash Collected</p>
                      <p className="text-2xl font-black text-green-600">{formatCurrency(cashTotal, settings)}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">Physical cash & cash-on-delivery payments</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">MFS / Mobile Wallets</p>
                      <p className="text-2xl font-black text-pink-600">{formatCurrency(mfsTotal, settings)}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">bKash, Nagad, Rocket, Cellfin</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bank & Card Collections</p>
                      <p className="text-2xl font-black text-blue-600">{formatCurrency(bankCardTotal, settings)}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium font-sans">Direct transfers & digital cards</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Date/Time</th>
                    <th className="px-6 py-4">Receipt No / Ref</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Description / Memo</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getCustomerReceiveReportData().map((row) => {
                    // Method badge styles
                    const isCash = row.paymentMethod === 'cash' || row.paymentMethod === 'cod';
                    const isMfs = ['bkash', 'nagad', 'rocket', 'cellfin'].includes(row.paymentMethod);
                    const badgeClass = isCash
                      ? "bg-green-100 text-green-700" 
                      : isMfs 
                        ? "bg-pink-100 text-pink-700 border border-pink-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200";

                    return (
                      <tr key={row.id} className="hover:bg-gray-50 transition-all font-sans">
                        <td className="px-6 py-4 text-xs font-medium text-gray-600">
                          {new Date(row.date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-gray-500">
                          {row.referenceId}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-700">
                          {row.customerName}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${badgeClass}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {row.paymentMethod === 'cod' ? 'CASH ON DELIVERY' : row.paymentMethod.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 truncate max-w-[200px]" title={row.description}>
                          {row.description}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-950">
                          {formatCurrency(row.amount, settings)}
                        </td>
                      </tr>
                    );
                  })}
                  {getCustomerReceiveReportData().length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-400 italic">
                        No payments received matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
                {getCustomerReceiveReportData().length > 0 && (
                  <tfoot className="bg-gray-50 border-t border-gray-200 font-extrabold">
                    <tr>
                      <td colSpan={5} className="px-6 py-5 text-right uppercase text-xs text-gray-500 tracking-wider">
                        Total Collections For Selected Criteria
                      </td>
                      <td className="px-6 py-5 text-right text-gray-950 text-base">
                        {formatCurrency(getCustomerReceiveReportData().reduce((sum, r) => sum + r.amount, 0), settings)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : activeTab === 'users' && isAdmin ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-[#EF4444]" /> User Management
              </h2>
              <button onClick={() => {
                setUserFormData({ name: '', email: '', password: '', role: 'user', permissions: [] });
                setIsAddingUser(true);
              }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
                 + Add User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                            {user.displayName.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{user.displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                          <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <Mail size={12} /> {user.email}
                          </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.uid, e.target.value)}
                          disabled={user.email === 'click2itbd@gmail.com'}
                          className="text-xs border-gray-200 rounded-md focus:ring-[#EF4444] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="user">User</option>
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button 
                          onClick={() => {
                            setEditingUserPermissions(user);
                            setShowPermissionsModal(true);
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                        >
                          Permissions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showPermissionsModal && editingUserPermissions && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                  <h3 className="font-bold text-lg mb-4">Edit Permissions for {editingUserPermissions.displayName}</h3>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {['view_dashboard', 'manage_users', 'manage_settings', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports', 'manage_hr', 'manage_services', 'manage_marketing'].map(perm => {
                       const hasPermission = (editingUserPermissions.permissions || []).includes(perm);
                       return (
                         <label key={perm} className="flex items-center gap-2 text-sm">
                           <input type="checkbox" checked={hasPermission} onChange={() => {
                             const newPermissions = hasPermission
                               ? (editingUserPermissions.permissions || []).filter((p: string) => p !== perm)
                               : [...(editingUserPermissions.permissions || []), perm];
                             setEditingUserPermissions({...editingUserPermissions, permissions: newPermissions});
                           }} className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]" />
                           {perm.replace('manage_', '').replace('view_', '')}
                         </label>
                       );
                    })}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowPermissionsModal(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
                    <button onClick={async () => {
                      await updateDoc(doc(db, 'users', editingUserPermissions.uid), { permissions: editingUserPermissions.permissions });
                      toast.success('Permissions updated');
                      setShowPermissionsModal(false);
                      fetchData();
                    }} className="px-4 py-2 bg-[#EF4444] text-white rounded text-sm font-bold">Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'campaigns' && hasPermission('manage_marketing') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Mail className="text-[#EF4444]" /> Marketing Campaigns
              </h2>
              <button
                onClick={() => setIsAddingCampaign(true)}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Create Campaign
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Title / Channel</th>
                    <th className="px-6 py-4">Audience / Subject</th>
                    <th className="px-6 py-4">Metrics</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map(campaign => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-sm">
                        <div className="flex flex-col">
                          <span>{campaign.title}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {campaign.channel || 'EMAIL'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {['facebook', 'instagram', 'google'].includes(campaign.channel || '') 
                          ? campaign.targetAudience 
                          : campaign.subject}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {['facebook', 'instagram', 'google'].includes(campaign.channel || '') ? (
                          <div className="flex flex-col text-[11px]">
                            <span>Impressions: {campaign.impressions || 0}</span>
                            <span>Clicks: {campaign.clicked || 0}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col text-[11px]">
                            <span>Sent: {campaign.sent || 0}</span>
                            <span>Del: {campaign.delivered || 0}</span>
                            <span>Open: {campaign.opened || 0}</span>
                            <span>Click: {campaign.clicked || 0}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap",
                          (campaign.status === 'sent' || campaign.status === 'completed') ? "bg-green-100 text-green-700" :
                          campaign.status === 'active' ? "bg-blue-100 text-blue-700 animate-pulse" :
                          campaign.status === 'scheduled' ? "bg-purple-100 text-purple-700" :
                          campaign.status === 'sending' ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {campaign.status === 'scheduled' && campaign.scheduledAt ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-purple-600 uppercase">Scheduled for</span>
                            <span>{new Date(campaign.scheduledAt).toLocaleString()}</span>
                          </div>
                        ) : (campaign.status === 'sent' || campaign.status === 'active') && campaign.sentAt ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-green-600 uppercase">Deployed on</span>
                            <span>{new Date(campaign.sentAt).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => handleSendCampaign(campaign)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-all"
                              title="Deploy Campaign"
                            >
                              <Send size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingCampaign(campaign);
                              setCampaignFormData({
                                title: campaign.title,
                                channel: campaign.channel || 'email',
                                subject: campaign.subject || '',
                                content: campaign.content,
                                recipients: campaign.recipients || [],
                                bulkEmails: campaign.recipients ? campaign.recipients.join('\n') : '',
                                selectedUserIds: [],
                                scheduledAt: campaign.scheduledAt || '',
                                targetAudience: campaign.targetAudience || '',
                                budget: campaign.budget ? String(campaign.budget) : '',
                                targetUrl: campaign.targetUrl || '',
                                imageUrl: campaign.imageUrl || '',
                              });
                              setIsAddingCampaign(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Delete this campaign?')) {
                                await deleteDoc(doc(db, 'campaigns', campaign.id));
                                fetchData();
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'discountCodes' && hasPermission('manage_marketing') ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Ticket className="text-[#EF4444]" /> Discount Codes
              </h2>
              <button
                onClick={() => setIsAddingDiscountCode(true)}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Create Code
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {discountCodes.map(code => (
                    <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-sm">{code.code}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#EF4444]">{code.discountPercentage}%</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(code.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          code.isActive && new Date(code.expiryDate) > new Date() ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {code.isActive && new Date(code.expiryDate) > new Date() ? 'Active' : 'Inactive/Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingDiscountCode(code);
                              setDiscountCodeFormData({
                                code: code.code,
                                discountPercentage: code.discountPercentage,
                                expiryDate: code.expiryDate,
                                isActive: code.isActive,
                              });
                              setIsAddingDiscountCode(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteDiscountCode(code.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {discountCodes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No discount codes created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'hostingPlans' && isAdmin ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Server className="text-[#EF4444]" />
                <h2 className="text-xl font-bold">Hosting Plans</h2>
              </div>
              <button
                onClick={() => setIsAddingHostingPlan(true)}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all hover:bg-red-600"
              >
                <Plus size={18} /> Add Plan
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#081621] text-white text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Plan Name</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Billing Cycle</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Popular</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hostingPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold">{plan.name}</td>
                      <td className="px-6 py-4 text-[#EF4444] font-bold">{formatCurrency(plan.price, settings)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{plan.billingCycle}</td>
                      <td className="px-6 py-4">
                         <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">#{plan.order}</span>
                      </td>
                      <td className="px-6 py-4">
                         {plan.popular ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold w-fit">Popular</span> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingHostingPlan(plan);
                              setHostingPlanFormData({
                                name: plan.name,
                                price: plan.price,
                                billingCycle: plan.billingCycle,
                                features: plan.features || [],
                                popular: plan.popular || false,
                                order: plan.order || 0
                              });
                              setIsAddingHostingPlan(true);
                            }}
                            className="bg-gray-100 p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Plan"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteHostingPlan(plan.id)}
                            className="bg-gray-100 p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Plan"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {hostingPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No hosting plans created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'hostingServices' && isAdmin ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Server className="text-[#EF4444]" />
                <h2 className="text-xl font-bold">Hosting Services</h2>
              </div>
              <button
                onClick={() => setIsAddingHostingService(true)}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all hover:bg-red-600"
              >
                <Plus size={18} /> Add Service Category
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#081621] text-white text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Icon/Title</th>
                    <th className="px-6 py-4">Starting Price</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hostingServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold">{service.title}</span>
                          <span className="text-xs text-gray-500">{service.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#EF4444] font-bold">
                        {service.startingPrice} {service.currency || 'BDT'} {service.billingCycle}
                      </td>
                      <td className="px-6 py-4">
                         <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">#{service.order}</span>
                      </td>
                      <td className="px-6 py-4">
                         {service.isActive ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span> : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Inactive</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingHostingService(service);
                              setHostingServiceFormData({
                                title: service.title,
                                description: service.description,
                                iconPath: service.iconPath,
                                startingPrice: service.startingPrice,
                                billingCycle: service.billingCycle,
                                currency: service.currency || 'BDT',
                                order: service.order || 0,
                                isActive: service.isActive
                              });
                              setIsAddingHostingService(true);
                            }}
                            className="bg-gray-100 p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Service"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteHostingService(service.id)}
                            className="bg-gray-100 p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Service"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {hostingServices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No hosting services created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'settings' && hasPermission('manage_settings') ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Setting List Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-[#7B61FF] text-white">
                  <h3 className="font-bold">Setting List</h3>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { id: 'business', icon: Briefcase, label: 'Business Setting' },
                    { id: 'pos', icon: ShoppingCart, label: 'POS Setting' },
                    { id: 'tax', icon: Percent, label: 'Tax Setting' },
                    { id: 'invoice', icon: FileText, label: 'Invoice Setting' },
                    { id: 'zatca', icon: FileText, label: 'Zatca Setting' },
                    { id: 'email', icon: Mail, label: 'Email Setting' },
                    { id: 'sms', icon: Mail, label: 'SMS Setting' },
                    { id: 'whatsapp', icon: Mail, label: 'Whatsapp Setting' },
                    { id: 'whitelabel', icon: Settings, label: 'Whitelabel Setting' },
                    { id: 'pwa', icon: Settings, label: 'PWA Setting' },
                    { id: 'crm_integrations', icon: Settings, label: 'CRM Integrations' },
                    { id: 'review_integrations', icon: MessageCircle, label: 'Review Integrations' },
                    { id: 'external_ecommerce', icon: ShoppingBag, label: 'External E-commerce' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${settingsTab === tab.id ? "bg-[#7B61FF] text-white font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      <tab.icon size={16} /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Setting Content */}
            <div className="flex-1 space-y-6">
              <form onSubmit={handleSaveSettings}>
                {settingsTab === 'business' ? (
                  <>
                    {/* Business Setting Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700">Business Setting</h3>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Business Name <span className="text-red-500">*</span></label>
                          <input type="text" value={settingsFormData.businessName || ''} onChange={e => setSettingsFormData({...settingsFormData, businessName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="Computer Zone" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Address <span className="text-red-500">*</span></label>
                          <textarea rows={1} value={settingsFormData.address || ''} onChange={e => setSettingsFormData({...settingsFormData, address: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="1100 Edinger Ave, Tustin, CA 92780"></textarea>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Website</label>
                          <div className="flex">
                            <input type="text" value={settingsFormData.website || ''} onChange={e => setSettingsFormData({...settingsFormData, website: e.target.value})} className="flex-1 text-sm border-gray-200 rounded-l-md focus:ring-[#7B61FF]" placeholder="Enter Website" />
                            <span className="bg-[#7B61FF] text-white px-3 flex items-center justify-center rounded-r-md"><Settings size={16}/></span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Email <span className="text-red-500">*</span></label>
                          <input type="email" value={settingsFormData.contactEmail || ''} onChange={e => setSettingsFormData({...settingsFormData, contactEmail: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="info@computerzone.com" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Phone <span className="text-red-500">*</span></label>
                          <input type="text" value={settingsFormData.contactPhone || ''} onChange={e => setSettingsFormData({...settingsFormData, contactPhone: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="(210) 224-13135" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Default Shipping Cost</label>
                          <input type="number" value={settingsFormData.shippingCost || 0} onChange={e => setSettingsFormData({...settingsFormData, shippingCost: Number(e.target.value)})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Date Format <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.dateFormat || 'm/d/Y'} onChange={e => setSettingsFormData({...settingsFormData, dateFormat: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="m/d/Y">m/d/Y</option>
                            <option value="d/m/Y">d/m/Y</option>
                            <option value="Y-m-d">Y-m-d</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Zone Name <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.zoneName || 'Asia/Dhaka'} onChange={e => setSettingsFormData({...settingsFormData, zoneName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Asia/Dhaka">Asia/Dhaka</option>
                            <option value="America/Los_Angeles">America/Los_Angeles</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Currency <span className="text-red-500">*</span></label>
                          <input type="text" value={settingsFormData.currency || 'Tk.'} onChange={e => setSettingsFormData({...settingsFormData, currency: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Currency Position <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.currencyPosition || 'Before Amount'} onChange={e => setSettingsFormData({...settingsFormData, currencyPosition: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Before Amount">Before Amount</option>
                            <option value="After Amount">After Amount</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Precision</label>
                          <select value={settingsFormData.precision || '2 Digit'} onChange={e => setSettingsFormData({...settingsFormData, precision: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="2 Digit">2 Digit</option>
                            <option value="0 Digit">0 Digit</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Thousand Separator</label>
                          <select value={settingsFormData.thousandSeparator || 'Select Thousand Separator'} onChange={e => setSettingsFormData({...settingsFormData, thousandSeparator: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Select Thousand Separator">Select Thousand Separator</option>
                            <option value="Comma (,)">Comma (,)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Decimal Separator <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.decimalSeparator || 'Dot (.)'} onChange={e => setSettingsFormData({...settingsFormData, decimalSeparator: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Dot (.)">Dot (.)</option>
                            <option value="Comma (,)">Comma (,)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Installment Days <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.installmentDays || '3 Days'} onChange={e => setSettingsFormData({...settingsFormData, installmentDays: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="3 Days">3 Days</option>
                            <option value="7 Days">7 Days</option>
                            <option value="30 Days">30 Days</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">E-Commerce Checker <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.ecommerceChecker || 'No'} onChange={e => setSettingsFormData({...settingsFormData, ecommerceChecker: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Item Setting Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700">Item Setting</h3>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Is Loyalty Enable <span className="text-red-500">*</span></label>
                          <select value={settingsFormData.isLoyaltyEnable || 'Enable'} onChange={e => setSettingsFormData({...settingsFormData, isLoyaltyEnable: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                            <option value="Enable">Enable</option>
                            <option value="Disable">Disable</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Minimum Point To Redeem <span className="text-red-500">*</span></label>
                          <input type="number" value={settingsFormData.minimumPointToRedeem || 40} onChange={e => setSettingsFormData({...settingsFormData, minimumPointToRedeem: Number(e.target.value)})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Loyalty Rate <span className="text-red-500">*</span></label>
                          <input type="number" step="0.1" value={settingsFormData.loyaltyRate || 0.1} onChange={e => setSettingsFormData({...settingsFormData, loyaltyRate: Number(e.target.value)})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Product Code Start From <span className="text-red-500">*</span></label>
                          <input type="text" value={settingsFormData.productCodeStartFrom || '000001'} onChange={e => setSettingsFormData({...settingsFormData, productCodeStartFrom: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : settingsTab === 'pos' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">POS Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">POS Fast Mode Enable</label>
                        <select value={settingsFormData.posFastMode || 'No'} onChange={e => setSettingsFormData({...settingsFormData, posFastMode: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Receipt Printer Type</label>
                        <select value={settingsFormData.receiptPrinterType || 'Thermal'} onChange={e => setSettingsFormData({...settingsFormData, receiptPrinterType: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="Thermal">Thermal Printer</option>
                          <option value="A4">A4 Printer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'tax' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Tax Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Default Tax Rate (%)</label>
                        <input type="number" step="0.01" value={settingsFormData.defaultTaxRate || 0} onChange={e => setSettingsFormData({...settingsFormData, defaultTaxRate: Number(e.target.value)})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Tax Name</label>
                        <input type="text" value={settingsFormData.taxName || 'VAT'} onChange={e => setSettingsFormData({...settingsFormData, taxName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="e.g. VAT" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">VAT Number</label>
                        <input type="text" value={settingsFormData.vatNumber || ''} onChange={e => setSettingsFormData({...settingsFormData, vatNumber: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-gray-700">Tax Calculator</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Amount</label>
                          <input type="number" step="0.01" value={taxCalcAmount} onChange={e => setTaxCalcAmount(Number(e.target.value))} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="Enter amount" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Calculated Tax ({settingsFormData.taxName || 'VAT'} @ {settingsFormData.defaultTaxRate || 0}%)</label>
                          <div className="w-full text-sm border-gray-200 rounded-md bg-white p-2 font-bold text-gray-700">
                             {formatCurrency(taxCalcAmount * (settingsFormData.defaultTaxRate || 0) / 100)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'invoice' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Invoice Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Invoice Prefix</label>
                        <input type="text" value={settingsFormData.invoicePrefix || 'INV-'} onChange={e => setSettingsFormData({...settingsFormData, invoicePrefix: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Invoice Terms & Conditions</label>
                        <textarea rows={4} value={settingsFormData.invoiceTerms || ''} onChange={e => setSettingsFormData({...settingsFormData, invoiceTerms: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"></textarea>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'zatca' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Zatca Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ZATCA e-Invoicing Enable</label>
                        <select value={settingsFormData.zatcaEnable || 'No'} onChange={e => setSettingsFormData({...settingsFormData, zatcaEnable: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ZATCA Phase</label>
                        <select value={settingsFormData.zatcaPhase || '1'} onChange={e => setSettingsFormData({...settingsFormData, zatcaPhase: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="1">Phase 1</option>
                          <option value="2">Phase 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Commercial Registration Number (CRN)</label>
                        <input type="text" value={settingsFormData.zatcaCrn || ''} onChange={e => setSettingsFormData({...settingsFormData, zatcaCrn: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'email' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Email Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Driver</label>
                        <input type="text" value={settingsFormData.mailDriver || 'smtp'} onChange={e => setSettingsFormData({...settingsFormData, mailDriver: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Host</label>
                        <input type="text" value={settingsFormData.mailHost || ''} onChange={e => setSettingsFormData({...settingsFormData, mailHost: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="smtp.gmail.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Port</label>
                        <input type="text" value={settingsFormData.mailPort || '587'} onChange={e => setSettingsFormData({...settingsFormData, mailPort: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Username</label>
                        <input type="text" value={settingsFormData.mailUsername || ''} onChange={e => setSettingsFormData({...settingsFormData, mailUsername: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Password</label>
                        <input type="password" value={settingsFormData.mailPassword || ''} onChange={e => setSettingsFormData({...settingsFormData, mailPassword: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Mail Encryption</label>
                        <select value={settingsFormData.mailEncryption || 'tls'} onChange={e => setSettingsFormData({...settingsFormData, mailEncryption: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'sms' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">SMS Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">SMS API URL</label>
                        <input type="text" value={settingsFormData.smsApiUrl || ''} onChange={e => setSettingsFormData({...settingsFormData, smsApiUrl: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">SMS API Key</label>
                        <input type="text" value={settingsFormData.smsApiKey || ''} onChange={e => setSettingsFormData({...settingsFormData, smsApiKey: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Sender ID</label>
                        <input type="text" value={settingsFormData.smsSenderId || ''} onChange={e => setSettingsFormData({...settingsFormData, smsSenderId: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'whatsapp' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Whatsapp Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Whatsapp API URL</label>
                        <input type="text" value={settingsFormData.whatsappApiUrl || ''} onChange={e => setSettingsFormData({...settingsFormData, whatsappApiUrl: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Whatsapp Access Token</label>
                        <input type="password" value={settingsFormData.whatsappAccessToken || ''} onChange={e => setSettingsFormData({...settingsFormData, whatsappAccessToken: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'whitelabel' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">Whitelabel Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Application Name <span className="text-red-500">*</span></label>
                        <input type="text" value={settingsFormData.brandName || ''} onChange={e => setSettingsFormData({...settingsFormData, brandName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="My Business App" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Logo URL</label>
                        <input type="text" value={settingsFormData.logoUrl || ''} onChange={e => setSettingsFormData({...settingsFormData, logoUrl: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" placeholder="https://example.com/logo.png" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Primary Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={settingsFormData.primaryColor || '#7B61FF'} onChange={e => setSettingsFormData({...settingsFormData, primaryColor: e.target.value})} className="h-9 p-1 w-12 border-gray-200 rounded-md" />
                          <input type="text" value={settingsFormData.primaryColor || '#7B61FF'} onChange={e => setSettingsFormData({...settingsFormData, primaryColor: e.target.value})} className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'pwa' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700">PWA Setting</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Enable PWA</label>
                        <select value={settingsFormData.pwaEnable || 'No'} onChange={e => setSettingsFormData({...settingsFormData, pwaEnable: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">App Name</label>
                        <input type="text" value={settingsFormData.pwaAppName || ''} onChange={e => setSettingsFormData({...settingsFormData, pwaAppName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Short Name</label>
                        <input type="text" value={settingsFormData.pwaShortName || ''} onChange={e => setSettingsFormData({...settingsFormData, pwaShortName: e.target.value})} className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Theme Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={settingsFormData.pwaThemeColor || '#ffffff'} onChange={e => setSettingsFormData({...settingsFormData, pwaThemeColor: e.target.value})} className="h-9 p-1 w-12 border-gray-200 rounded-md" />
                          <input type="text" value={settingsFormData.pwaThemeColor || '#ffffff'} onChange={e => setSettingsFormData({...settingsFormData, pwaThemeColor: e.target.value})} className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Background Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={settingsFormData.pwaBackgroundColor || '#ffffff'} onChange={e => setSettingsFormData({...settingsFormData, pwaBackgroundColor: e.target.value})} className="h-9 p-1 w-12 border-gray-200 rounded-md" />
                          <input type="text" value={settingsFormData.pwaBackgroundColor || '#ffffff'} onChange={e => setSettingsFormData({...settingsFormData, pwaBackgroundColor: e.target.value})} className="flex-1 text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'crm_integrations' ? (
                  <CRMIntegrationsSetting />
                ) : settingsTab === 'review_integrations' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-700">Review Widget Integration</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4">
                        <Star className="text-blue-500 shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-bold mb-1">Aggregate Amazon & Google Reviews</p>
                          <p>Use this section to embed third-party review widgets (like Elfsight, Trustpilot, or Reviews.io) that aggregate verified customer feedback from across the web. This is the recommended way to bridge your Amazon reputation into your standalone portal.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-bold text-gray-700">Enable Review Widget</label>
                            <p className="text-xs text-gray-500">Show aggregated reviews on product detail pages</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSettingsFormData({...settingsFormData, reviewWidgetEnabled: !settingsFormData.reviewWidgetEnabled})}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              settingsFormData.reviewWidgetEnabled ? "bg-[#7B61FF]" : "bg-gray-200"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settingsFormData.reviewWidgetEnabled ? "translate-x-6" : "translate-x-1"
                            )} />
                          </button>
                        </div>

                        {settingsFormData.reviewWidgetEnabled && (
                          <>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Integrator Provider</label>
                              <select 
                                value={settingsFormData.reviewWidgetProvider || 'generic'} 
                                onChange={e => setSettingsFormData({...settingsFormData, reviewWidgetProvider: e.target.value})}
                                className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                              >
                                <option value="generic">Generic Embed Script</option>
                                <option value="elfsight">Elfsight Widget</option>
                                <option value="trustpilot">Trustpilot</option>
                                <option value="reviews_io">Reviews.io</option>
                                <option value="amazon_api">Amazon API (Custom)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Widget Script / Embed Code</label>
                              <textarea
                                rows={6}
                                value={settingsFormData.reviewWidgetConfig || ''}
                                onChange={e => setSettingsFormData({...settingsFormData, reviewWidgetConfig: e.target.value})}
                                placeholder='Paste your widget code here, e.g.: <script src="https://static.elfsight.com/platform/platform.js" data-use-service-core defer></script><div class="elfsight-app-YOUR-WIDGET-ID"></div>'
                                className="w-full text-sm font-mono border-gray-200 rounded-md focus:ring-[#7B61FF]"
                              ></textarea>
                              <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-dashed">
                                <strong>Tip:</strong> You can typically find this code in your review provider's dashboard under "Install" or "Embed Code".
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : settingsTab === 'external_ecommerce' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-700">External E-commerce Integration</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4">
                        <ShoppingBag className="text-blue-500 shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-bold mb-1">Cross-Post Products to Other Sites</p>
                          <p>Enable this feature to synchronize your products with other e-commerce platforms like Shopify, WooCommerce, or via a custom webhook. You'll be able to "Push" individual products with their price and stock status directly from the inventory list.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-bold text-gray-700">Enable External Sync</label>
                            <p className="text-xs text-gray-500">Allow pushing products to external platforms</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSettingsFormData({...settingsFormData, externalStoreEnabled: !settingsFormData.externalStoreEnabled})}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              settingsFormData.externalStoreEnabled ? "bg-[#7B61FF]" : "bg-gray-200"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settingsFormData.externalStoreEnabled ? "translate-x-6" : "translate-x-1"
                            )} />
                          </button>
                        </div>

                        {settingsFormData.externalStoreEnabled && (
                          <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">External Store Type</label>
                              <select 
                                value={settingsFormData.externalStoreType || 'webhook'} 
                                onChange={e => setSettingsFormData({...settingsFormData, externalStoreType: e.target.value as any})}
                                className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                              >
                                <option value="webhook">Custom Webhook (JSON)</option>
                                <option value="shopify">Shopify API</option>
                                <option value="woocommerce">WooCommerce REST API</option>
                                <option value="custom">Custom Integration</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">External Store API URL</label>
                              <input
                                type="url"
                                value={settingsFormData.externalStoreUrl || ''}
                                onChange={e => setSettingsFormData({...settingsFormData, externalStoreUrl: e.target.value})}
                                placeholder="https://external-site.com/api/products"
                                className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">API Key / Secret</label>
                              <input
                                type="password"
                                value={settingsFormData.externalStoreKey || ''}
                                onChange={e => setSettingsFormData({...settingsFormData, externalStoreKey: e.target.value})}
                                placeholder="Enter your API Key or Auth Token"
                                className="w-full text-sm border-gray-200 rounded-md focus:ring-[#7B61FF]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700 capitalize">{settingsTab.replace(/([A-Z])/g, ' $1').trim()} Setting</h3>
                    </div>
                    <div className="p-6 text-center py-12 text-gray-400">
                      <Settings size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-bold text-lg capitalize">{settingsTab.replace(/([A-Z])/g, ' $1').trim()} Module</p>
                      <p className="text-sm">Configuring options for {settingsTab} are under development.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-4 pb-12">
                   <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#7B61FF] text-white rounded-md font-bold hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {loading ? 'Saving...' : <><CheckSquare size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeTab === 'services' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="text-[#EF4444]" /> Warranty & Service
              </h2>
              <div className="flex bg-gray-100 p-1 rounded-md">
                <button
                  onClick={() => setLedgerView('ledger')} // we can reuse state variable or create one
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded-sm transition-all",
                    ledgerView === 'ledger' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Warranty Check
                </button>
                <button
                  onClick={() => setLedgerView('products')}
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded-sm transition-all",
                    ledgerView === 'products' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Service Tracking
                </button>
              </div>
              <button
                onClick={() => {
                  setServiceFormData({
                    serialNumber: '',
                    customerName: '',
                    customerPhone: '',
                    productName: '',
                    issueDescription: '',
                    isWarranty: false,
                    serviceCharge: 0,
                    status: 'received',
                  });
                  setEditingService(null);
                  setIsAddingService(true);
                  if (ledgerView !== 'products') setLedgerView('products');
                }}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Receive Product for Service
              </button>
            </div>
            
            {ledgerView === 'ledger' && (
              <div className="p-6">
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <h3 className="font-bold text-lg mb-2">Check Warranty Status</h3>
                    <p className="text-sm text-gray-500 mb-4">Enter a product serial number to verify its warranty status.</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Scan or enter Serial Number..."
                        value={ledgerSearchQuery}
                        onChange={(e) => setLedgerSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#EF4444] focus:ring-0 text-lg transition-all"
                      />
                    </div>
                  </div>

                  {ledgerSearchQuery && (
                    <div className="space-y-4">
                      {soldSerials
                        .filter(s => s.serial.toLowerCase().includes(ledgerSearchQuery.toLowerCase()))
                        .map(record => {
                          const wEndDate = new Date(record.warrantyEndDate);
                          const isExpired = wEndDate < new Date();
                          return (
                            <div key={record.id} className="bg-white border rounded-lg p-5 shadow-sm">
                              <div className="flexjustify-between items-start mb-4">
                                <div>
                                  <h4 className="font-bold text-lg">{record.productName}</h4>
                                  <p className="font-mono text-sm text-gray-500">SN: {record.serial}</p>
                                </div>
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold",
                                  isExpired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                )}>
                                  {isExpired ? 'Warranty Expired' : 'In Warranty'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm mt-4 border-t pt-4">
                                <div>
                                  <span className="text-gray-500 block mb-1">Customer</span>
                                  <span className="font-medium">{record.customerName}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block mb-1">Sold Date</span>
                                  <span className="font-medium">{new Date(record.soldAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block mb-1">Warranty Ends</span>
                                  <span className="font-medium">{wEndDate.toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block mb-1">Order Ref</span>
                                  <span className="font-medium">{record.orderId}</span>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t flex justify-end">
                                <button
                                  onClick={() => {
                                    setServiceFormData({
                                      serialNumber: record.serial,
                                      customerName: record.customerName,
                                      customerPhone: record.customerPhone,
                                      productName: record.productName,
                                      issueDescription: '',
                                      isWarranty: !isExpired,
                                      serviceCharge: isExpired ? 500 : 0,
                                      status: 'received',
                                    });
                                    setEditingService(null);
                                    setIsAddingService(true);
                                    setLedgerView('products');
                                  }}
                                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded transition-all"
                                >
                                  Receive Product for Service
                                </button>
                              </div>
                            </div>
                          );
                      })}
                      {soldSerials.filter(s => s.serial.toLowerCase().includes(ledgerSearchQuery.toLowerCase())).length === 0 && (
                        <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
                          No warranty records found for this serial number.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            
             {ledgerView === 'products' && (
              <div>
                <div className="p-4 bg-white border-b border-gray-100 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by Customer Name or Serial Number..."
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:border-[#EF4444] focus:ring-0 text-sm transition-all"
                    />
                  </div>
                </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-4">Ticket / Date</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Product / SN</th>
                      <th className="px-6 py-4">Status & Type</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceRecords.filter(r => r.serialNumber?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) || r.customerName?.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((record) => (
                      <tr key={record.id} className="bg-white border-b hover:bg-gray-50 transition-all">
                        <td className="px-6 py-4">
                          <div className="font-bold">{record.id.slice(-6).toUpperCase()}</div>
                          <div className="text-xs text-gray-500">{new Date(record.receivedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold">{record.customerName}</div>
                          <div className="text-xs text-gray-500">{record.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold line-clamp-1">{record.productName}</div>
                          <div className="text-xs font-mono text-gray-500">{record.serialNumber}</div>
                          {record.equipmentType && <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">{record.equipmentType}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold w-fit",
                              record.status === 'received' ? "bg-amber-100 text-amber-800" :
                              record.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                              record.status === 'ready' ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {record.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold w-fit",
                              record.isWarranty ? "bg-purple-100 text-purple-800" : "bg-orange-100 text-orange-800"
                            )}>
                              {record.isWarranty ? "WARRANTY" : `PAID SERVICE`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {!record.isWarranty ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-bold text-sm text-gray-900">{formatCurrency(record.serviceCharge, settings)}</span>
                              <div className="flex flex-wrap items-center gap-1">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase",
                                  record.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                  {record.paymentStatus || 'pending'}
                                </span>
                                {(record.paymentMethod) && (
                                  <span className="text-[9px] text-gray-500 bg-gray-100 py-0.5 px-1.5 rounded-[4px] uppercase">{record.paymentMethod.replace('_', ' ')}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Free (Warranty)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end">
                           <button onClick={() => printServiceReceipt(record)} className="text-gray-500 hover:text-gray-900 mx-1" title="Print Receipt">
                             <FileText size={16} />
                           </button>
                           {!record.isWarranty && record.serviceCharge > 0 && (
                             <button onClick={() => printServiceBill(record)} className="text-green-600 hover:text-green-800 mx-1" title="Print Bill">
                               <Download size={16} />
                             </button>
                           )}
                           <button onClick={() => { setEditingService(record); setServiceFormData({...record, equipmentType: record.equipmentType || 'Laptop', paymentMethod: record.paymentMethod || 'cash', paymentStatus: record.paymentStatus || 'pending', medeaPayment: record.medeaPayment || ''}); setIsAddingService(true); }} className="text-blue-500 hover:text-blue-700 mx-1" title="Edit Service/Payment">
                             <Edit2 size={16} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
            
          </div>
        ) : activeTab === 'employees' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="text-[#EF4444]" /> Employee Directory
              </h2>
              <button onClick={() => {
                setEditingEmployee(null);
                setEmployeeFormData({ name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, status: 'active', joinDate: '', confirmDate: '', dateOfBirth: '', nidNumber: '', certificateUrl: '', nidUrl: '', cvUrl: '' });
                setIsAddingEmployee(true);
              }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
                 + Add Employee
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold">{emp.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs"><div className="truncate w-32">{emp.email}</div>{emp.phone}</td>
                      <td className="px-6 py-4">{emp.role}</td>
                      <td className="px-6 py-4"><span className={cn("px-2 py-1 uppercase text-[10px] font-bold rounded", emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{emp.status || 'active'}</span></td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => { setEditingEmployee(emp); setEmployeeFormData(emp); setIsAddingEmployee(true); }} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                        <button onClick={() => { if(window.confirm('Are you sure?')) deleteDoc(doc(db, 'employees', emp.id)).then(() => fetchData())}} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No employees found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'leave' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="text-[#EF4444]" /> Leave Management
              </h2>
              <button onClick={() => {
                setEditingLeave(null);
                setLeaveFormData({ employeeName: '', type: 'casual', startDate: '', endDate: '', reason: '', status: 'pending' });
                setIsAddingLeave(true);
              }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
                 + Record Leave
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Reason</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employeeLeaves.map(leave => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold">{leave.employeeName}</td>
                      <td className="px-6 py-4 capitalize">{leave.type || 'casual'}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{leave.reason}</td>
                      <td className="px-6 py-4"><span className={cn("px-2 py-1 uppercase text-[10px] font-bold rounded", leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{leave.status || 'pending'}</span></td>
                      <td className="px-6 py-4 text-right space-x-2">
                         {leave.status === 'pending' && (
                           <>
                           <button onClick={() => {updateDoc(doc(db, 'employee_leaves', leave.id), { status: 'approved' }).then(() => { toast.success('Leave approved successfully'); fetchData(); })}} className="text-green-600 font-bold hover:underline text-xs">Approve</button>
                           <button onClick={() => {updateDoc(doc(db, 'employee_leaves', leave.id), { status: 'rejected' }).then(() => { toast.success('Leave rejected successfully'); fetchData(); })}} className="text-red-500 font-bold hover:underline text-xs">Reject</button>
                           </>
                         )}
                         <button onClick={() => { setEditingLeave(leave); setLeaveFormData(leave); setIsAddingLeave(true); }} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                         <button onClick={() => { if(window.confirm('Delete this leave?')) deleteDoc(doc(db, 'employee_leaves', leave.id)).then(() => fetchData())}} className="text-gray-500 font-bold hover:underline text-xs">Del</button>
                      </td>
                    </tr>
                  ))}
                  {employeeLeaves.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No leaves recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'salary' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="text-[#EF4444]" /> Salary & Payroll
              </h2>
              <button onClick={() => {
                setEditingSalary(null);
                setSalaryFormData({ employeeName: '', month: new Date().toISOString().slice(0, 7), baseAmount: 0, deductions: 0, bonus: 0, netPay: 0, status: 'pending', paymentDate: new Date().toISOString().split('T')[0] });
                setIsAddingSalary(true);
              }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
                 + Process Salary
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Month</th><th className="px-6 py-4">Net Amount</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employeeSalaries.map(sal => (
                    <tr key={sal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold">{sal.employeeName}</td>
                      <td className="px-6 py-4">{sal.month}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(sal.netPay || 0, settings)}</td>
                      <td className="px-6 py-4"><span className={cn("px-2 py-1 uppercase text-[10px] font-bold rounded", sal.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{sal.status || 'pending'}</span></td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {sal.status !== 'paid' && (
                          <button onClick={() => {updateDoc(doc(db, 'employee_salaries', sal.id), { status: 'paid', paymentDate: new Date().toISOString() }).then(() => fetchData())}} className="text-green-600 font-bold hover:underline text-xs">Mark Paid</button>
                        )}
                        <button onClick={() => { setEditingSalary(sal); setSalaryFormData(sal); setIsAddingSalary(true); }} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                        <button onClick={() => { if(window.confirm('Delete salary record?')) deleteDoc(doc(db, 'employee_salaries', sal.id)).then(() => fetchData())}} className="text-red-500 font-bold hover:underline text-xs">Del</button>
                      </td>
                    </tr>
                  ))}
                  {employeeSalaries.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No salary records found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="text-[#EF4444]" /> Create New Sale
                </h2>
                <button
                  onClick={() => setShowPCBuilderModal(true)}
                  className="bg-[#EF4444] text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  <Cpu size={18} /> Use PC Builder
                </button>
              </div>
              <form onSubmit={handleCreateSale} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <select
                      value={saleData.customerName}
                      onChange={e => {
                        const selected = customers.find(c => c.name === e.target.value);
                        if (selected) {
                          setSaleData({
                            ...saleData,
                            customerName: selected.name,
                            customerPhone: selected.phone,
                            customerEmail: selected.email,
                            shippingAddress: selected.address
                          });
                        } else if (e.target.value === "") {
                          setSaleData({
                            ...saleData,
                            customerName: "",
                            customerPhone: "",
                            customerEmail: "",
                            shippingAddress: ""
                          });
                        }
                      }}
                      className="w-full border-gray-200 rounded-md"
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomer(true)}
                      className="bg-gray-100 p-2 rounded-md hover:bg-gray-200"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Code (e.g. SUMMER20)"
                          value={saleDiscountCodeInput}
                          onChange={e => setSaleDiscountCodeInput(e.target.value)}
                          className="flex-1 border-gray-200 rounded-md focus:ring-[#EF4444]"
                        />
                        <button
                          type="button"
                          onClick={handleApplySaleDiscountCode}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-bold hover:bg-gray-200"
                        >
                          Apply
                        </button>
                      </div>
                      {saleData.appliedDiscountCode && (
                        <div className="flex items-center justify-between mt-1 p-2 bg-green-50 rounded-md border border-green-100">
                          <span className="text-xs text-green-700 font-bold">Applied: {saleData.appliedDiscountCode} ({saleData.appliedDiscountPercentage}%)</span>
                          <button 
                            type="button" 
                            onClick={() => setSaleData({...saleData, appliedDiscountCode: '', appliedDiscountPercentage: 0})}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <hr className="flex-1 border-gray-200" />
                      <span className="text-[10px] uppercase font-bold text-gray-400">OR</span>
                      <hr className="flex-1 border-gray-200" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Manual Discount (Amount)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        disabled={saleData.appliedDiscountPercentage > 0}
                        value={saleData.discountAmount}
                        onChange={e => setSaleData({ ...saleData, discountAmount: parseFloat(e.target.value) || 0 })}
                        className={`w-full border-gray-200 rounded-md ${saleData.appliedDiscountPercentage > 0 ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-[#EF4444]'}`}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Document Type</label>
                    <select
                      value={saleData.type}
                      onChange={e => setSaleData({ ...saleData, type: e.target.value as any })}
                      className="w-full border-gray-200 rounded-md"
                    >
                      <option value="invoice">Direct Invoice</option>
                      <option value="quotation">Quotation</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-bold mb-4">Selected Items</h3>
                  {saleData.items.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No items added yet. Select from the right panel.</p>
                  ) : (
                    <div className="space-y-2">
                      {saleData.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col bg-gray-50 p-3 rounded-md gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-bold">{formatCurrency(item.price, settings)} x {item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setSaleData(prev => ({
                                  ...prev,
                                  items: prev.items.filter(i => i.id !== item.id)
                                }))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.hasWarranty || false}
                                onChange={(e) => setSaleData(prev => ({
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, hasWarranty: e.target.checked } : i)
                                }))}
                                className="rounded border-gray-300"
                              />
                              Configure Warranty
                            </label>
                            {item.hasWarranty && (
                              <div className="flex items-center gap-2 ml-4">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.warrantyYears || ''}
                                  onChange={(e) => setSaleData(prev => ({
                                    ...prev,
                                    items: prev.items.map(i => i.id === item.id ? { ...i, warrantyYears: Number(e.target.value) } : i)
                                  }))}
                                  className="w-16 text-xs border-gray-200 rounded-md py-1 px-2"
                                  placeholder="Yrs"
                                />
                                <span className="text-xs text-gray-500">Years</span>
                              </div>
                            )}
                          </div>
                          
                          {item.hasSerialTracking && (
                            <div className="mt-2 border-t border-gray-200 pt-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Serials (Need {item.quantity})</label>
                              <div className="flex flex-wrap gap-1">
                                {(item.availableSerials || []).map((serial: string) => {
                                  const isSelected = (item.selectedSerials || []).includes(serial);
                                  return (
                                    <button
                                      type="button"
                                      key={serial}
                                      onClick={() => {
                                        setSaleData(prev => ({
                                          ...prev,
                                          items: prev.items.map(i => {
                                            if (i.id !== item.id) return i;
                                            let newSelected = [...(i.selectedSerials || [])];
                                            if (isSelected) {
                                              newSelected = newSelected.filter(s => s !== serial);
                                            } else if (newSelected.length < i.quantity) {
                                              newSelected.push(serial);
                                            } else {
                                              toast.error(`You only need ${i.quantity} serial(s) for this item.`);
                                            }
                                            return { ...i, selectedSerials: newSelected };
                                          })
                                        }));
                                      }}
                                      className={`px-2 py-1 text-xs rounded-md border transition-all ${
                                        isSelected ? 'bg-[#EF4444] text-white border-[#EF4444]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#EF4444]'
                                      }`}
                                    >
                                      {serial}
                                    </button>
                                  );
                                })}
                              </div>
                              {(!item.selectedSerials || item.selectedSerials.length < item.quantity) && (
                                <p className="text-[10px] text-red-500 mt-1 italic">Please select {item.quantity - (item.selectedSerials?.length || 0)} more serial(s).</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                        <span className="font-bold">Total</span>
                        <div className="flex flex-col items-end gap-1">
                          {(() => {
                            const subt = saleData.items.reduce((s, item) => s + (item.price * item.quantity), 0);
                            const effDiscount = saleData.appliedDiscountPercentage > 0 
                              ? (subt * saleData.appliedDiscountPercentage) / 100 
                              : (saleData.discountAmount || 0);
                            
                            return (
                              <>
                                {effDiscount > 0 && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatCurrency(subt, settings)}
                                  </span>
                                )}
                                <span className="text-xl font-bold text-[#EF4444]">
                                  {formatCurrency(subt - effDiscount, settings)}
                                </span>
                                {effDiscount > 0 && (
                                  <span className="text-xs text-green-600 font-bold">
                                    Saved {formatCurrency(effDiscount, settings)}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#081621] text-white py-4 rounded-md font-bold hover:bg-[#EF4444] transition-all"
                >
                  Confirm Sale & Generate Document
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold mb-4">Select Products</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {products.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:border-[#EF4444] transition-all group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold line-clamp-1">{product.name}</span>
                      <span className="text-xs text-[#EF4444] font-bold">{formatCurrency(product.price, settings)}</span>
                    </div>
                    <button
                      onClick={() => addItemToSale(product)}
                      className="p-2 bg-gray-50 rounded-md group-hover:bg-[#EF4444] group-hover:text-white transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Modal */}
      {isAddingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingCampaign ? 'Edit' : 'Create'} Marketing Campaign</h2>
              <button onClick={() => { setIsAddingCampaign(false); setEditingCampaign(null); }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveCampaign} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={campaignFormData.title}
                    onChange={e => setCampaignFormData({ ...campaignFormData, title: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    placeholder="e.g. Summer Sale 2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marketing Channel</label>
                  <select
                    value={campaignFormData.channel}
                    onChange={e => setCampaignFormData({ ...campaignFormData, channel: e.target.value as any })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook">Facebook Ads</option>
                    <option value="instagram">Instagram Ads</option>
                    <option value="google">Google Ads</option>
                  </select>
                </div>
              </div>

              {['email', 'sms', 'whatsapp'].includes(campaignFormData.channel) && (
                <>
                  {campaignFormData.channel === 'email' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Subject</label>
                      <input
                        type="text"
                        required
                        value={campaignFormData.subject}
                        onChange={e => setCampaignFormData({ ...campaignFormData, subject: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. Don't miss out on our biggest sale!"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Recipients (Bulk {campaignFormData.channel === 'email' ? 'Emails' : 'Phone Numbers'} - One per line)
                    </label>
                    <textarea
                      value={campaignFormData.bulkEmails}
                      onChange={e => setCampaignFormData({ ...campaignFormData, bulkEmails: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] h-32"
                      placeholder={campaignFormData.channel === 'email' ? "email1@example.com\nemail2@example.com" : "+1234567890\n+0987654321"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select from Registered Users</label>
                    <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto p-2 space-y-2">
                      {users.map(user => (
                        <label key={user.uid} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={campaignFormData.selectedUserIds.includes(user.uid)}
                            onChange={e => {
                              const newIds = e.target.checked
                                ? [...campaignFormData.selectedUserIds, user.uid]
                                : campaignFormData.selectedUserIds.filter(id => id !== user.uid);
                              setCampaignFormData({ ...campaignFormData, selectedUserIds: newIds });
                            }}
                            className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                          />
                          <span className="text-sm">{user.displayName} ({campaignFormData.channel === 'email' ? user.email : user.phoneNumber || 'No phone'})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {['facebook', 'instagram', 'google'].includes(campaignFormData.channel) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 border border-blue-100 rounded-lg">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Target Audience</label>
                    <input
                      type="text"
                      value={campaignFormData.targetAudience}
                      onChange={e => setCampaignFormData({ ...campaignFormData, targetAudience: e.target.value })}
                      className="w-full border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Retargeting cart abandoners, Lookalike 1%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Daily Budget ($)</label>
                    <input
                      type="number"
                      value={campaignFormData.budget}
                      onChange={e => setCampaignFormData({ ...campaignFormData, budget: e.target.value })}
                      className="w-full border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Target URL</label>
                    <input
                      type="url"
                      value={campaignFormData.targetUrl}
                      onChange={e => setCampaignFormData({ ...campaignFormData, targetUrl: e.target.value })}
                      className="w-full border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/promo"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Creative Image URL</label>
                    <input
                      type="url"
                      value={campaignFormData.imageUrl}
                      onChange={e => setCampaignFormData({ ...campaignFormData, imageUrl: e.target.value })}
                      className="w-full border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/ad-image.jpg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Content / Ad Copy</label>
                <textarea
                  required
                  value={campaignFormData.content}
                  onChange={e => setCampaignFormData({ ...campaignFormData, content: e.target.value })}
                  className={`w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] ${campaignFormData.channel === 'email' ? 'h-64 font-mono text-sm' : 'h-32'}`}
                  placeholder={campaignFormData.channel === 'email' ? "<h1>Hello!</h1><p>Check out our new products...</p>" : "Limited time offer! Get 20% off your next purchase."}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Schedule for Future (Optional)</label>
                <input
                  type="datetime-local"
                  value={campaignFormData.scheduledAt}
                  onChange={e => setCampaignFormData({ ...campaignFormData, scheduledAt: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Leave blank to save as draft or deploy immediately.</p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => { setIsAddingCampaign(false); setEditingCampaign(null); }}
                  className="px-6 py-2 border border-gray-200 rounded-md font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600 transition-all"
                >
                  {editingCampaign ? 'Update Campaign' : campaignFormData.scheduledAt ? 'Schedule Campaign' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Code Modal */}
      {isAddingDiscountCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingDiscountCode ? 'Edit' : 'Add'} Discount Code</h2>
              <button onClick={() => { setIsAddingDiscountCode(false); setEditingDiscountCode(null); }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveDiscountCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER20"
                  value={discountCodeFormData.code}
                  onChange={e => setDiscountCodeFormData({ ...discountCodeFormData, code: e.target.value.toUpperCase() })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={discountCodeFormData.discountPercentage}
                  onChange={e => setDiscountCodeFormData({ ...discountCodeFormData, discountPercentage: Number(e.target.value) })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={discountCodeFormData.expiryDate}
                  onChange={e => setDiscountCodeFormData({ ...discountCodeFormData, expiryDate: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={discountCodeFormData.isActive}
                  onChange={e => setDiscountCodeFormData({ ...discountCodeFormData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[#EF4444] text-white py-3 rounded-md font-bold hover:bg-red-600 transition-all"
              >
                {editingDiscountCode ? 'Update Code' : 'Create Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddingHostingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingHostingPlan ? 'Edit' : 'Create'} Hosting Plan</h2>
              <button onClick={() => { setIsAddingHostingPlan(false); setEditingHostingPlan(null); }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveHostingPlan} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Category</label>
                <select
                  required
                  value={hostingPlanFormData.serviceId}
                  onChange={e => setHostingPlanFormData({ ...hostingPlanFormData, serviceId: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                >
                  <option value="">Select a service category</option>
                  {hostingServices.map(service => (
                    <option key={service.id} value={service.id}>{service.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={hostingPlanFormData.name}
                  onChange={e => setHostingPlanFormData({ ...hostingPlanFormData, name: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  placeholder="e.g. Basic Hosting"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={hostingPlanFormData.price}
                    onChange={e => setHostingPlanFormData({ ...hostingPlanFormData, price: Number(e.target.value) })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Billing Cycle</label>
                  <input
                    type="text"
                    required
                    value={hostingPlanFormData.billingCycle}
                    onChange={e => setHostingPlanFormData({ ...hostingPlanFormData, billingCycle: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    placeholder="e.g. /mo or /yr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Order</label>
                <input
                  type="number"
                  required
                  value={hostingPlanFormData.order}
                  onChange={e => setHostingPlanFormData({ ...hostingPlanFormData, order: Number(e.target.value) })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  placeholder="e.g. 1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center justify-between">
                  <span>Features</span>
                  <button 
                    type="button" 
                    onClick={() => setHostingPlanFormData(prev => ({ ...prev, features: [...prev.features, ''] }))}
                    className="text-[#EF4444] flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add
                  </button>
                </label>
                <div className="space-y-2">
                  {hostingPlanFormData.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                       <input
                         type="text"
                         value={feature}
                         onChange={(e) => {
                           const newFeatures = [...hostingPlanFormData.features];
                           newFeatures[idx] = e.target.value;
                           setHostingPlanFormData({ ...hostingPlanFormData, features: newFeatures });
                         }}
                         className="flex-1 border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] text-sm py-1.5"
                         placeholder="e.g. 10GB SSD Storage"
                       />
                       <button
                         type="button"
                         onClick={() => {
                           const newFeatures = hostingPlanFormData.features.filter((_, i) => i !== idx);
                           setHostingPlanFormData({ ...hostingPlanFormData, features: newFeatures });
                         }}
                         className="text-red-500 hover:text-red-700"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
                  {hostingPlanFormData.features.length === 0 && <div className="text-sm text-gray-400 italic">No features added.</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="popularPlan"
                  checked={hostingPlanFormData.popular}
                  onChange={e => setHostingPlanFormData({ ...hostingPlanFormData, popular: e.target.checked })}
                  className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                />
                <label htmlFor="popularPlan" className="text-sm font-medium text-gray-700">Mark as Popular</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[#EF4444] text-white py-3 rounded-md font-bold hover:bg-red-600 transition-all"
              >
                {editingHostingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddingHostingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingHostingService ? 'Edit' : 'Create'} Hosting Service</h2>
              <button onClick={() => { setIsAddingHostingService(false); setEditingHostingService(null); }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveHostingService} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={hostingServiceFormData.title}
                  onChange={e => setHostingServiceFormData({ ...hostingServiceFormData, title: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  placeholder="e.g. Domain, VPS"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={hostingServiceFormData.description}
                  onChange={e => setHostingServiceFormData({ ...hostingServiceFormData, description: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  placeholder="Short description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Starting Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={hostingServiceFormData.startingPrice}
                    onChange={e => setHostingServiceFormData({ ...hostingServiceFormData, startingPrice: Number(e.target.value) })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Billing Cycle</label>
                  <input
                    type="text"
                    required
                    value={hostingServiceFormData.billingCycle}
                    onChange={e => setHostingServiceFormData({ ...hostingServiceFormData, billingCycle: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    placeholder="e.g. /Year"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon Path / Emoji</label>
                  <input
                    type="text"
                    value={hostingServiceFormData.iconPath}
                    onChange={e => setHostingServiceFormData({ ...hostingServiceFormData, iconPath: e.target.value })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    placeholder="e.g. 🌐"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Order Index</label>
                  <input
                    type="number"
                    required
                    value={hostingServiceFormData.order}
                    onChange={e => setHostingServiceFormData({ ...hostingServiceFormData, order: Number(e.target.value) })}
                    className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveService"
                  checked={hostingServiceFormData.isActive}
                  onChange={e => setHostingServiceFormData({ ...hostingServiceFormData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                />
                <label htmlFor="isActiveService" className="text-sm font-medium text-gray-700">Service is Active</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[#EF4444] text-white py-3 rounded-md font-bold hover:bg-red-600 transition-all"
              >
                {editingHostingService ? 'Update Service' : 'Create Service'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Service Record Modal */}
            {isAddingService && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{editingService ? 'Update Service Ticket' : 'New Service Ticket'}</h2>
                    <button onClick={() => { setIsAddingService(false); setEditingService(null); }} className="text-gray-400 hover:text-gray-600">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto w-full">
                    <form className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Serial Number</label>
                          <input type="text" value={serviceFormData.serialNumber} onChange={e => setServiceFormData({...serviceFormData, serialNumber: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                          <input type="text" value={serviceFormData.productName} onChange={e => setServiceFormData({...serviceFormData, productName: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Equipment Type</label>
                          <input type="text" placeholder="e.g. Laptop, Desktop, Printer" value={serviceFormData.equipmentType} onChange={e => setServiceFormData({...serviceFormData, equipmentType: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Status</label>
                          <select value={serviceFormData.status} onChange={e => setServiceFormData({...serviceFormData, status: e.target.value as any})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white">
                            <option value="received">Received</option>
                            <option value="in_progress">In Progress</option>
                            <option value="ready">Ready for Pickup</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                          <input type="text" value={serviceFormData.customerName} onChange={e => setServiceFormData({...serviceFormData, customerName: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Phone</label>
                          <input type="text" value={serviceFormData.customerPhone} onChange={e => setServiceFormData({...serviceFormData, customerPhone: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Description</label>
                        <textarea value={serviceFormData.issueDescription} onChange={e => setServiceFormData({...serviceFormData, issueDescription: e.target.value})} className="w-full border-gray-200 rounded-md bg-gray-50 focus:bg-white" rows={3}></textarea>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                         <div className="md:col-span-1">
                          <label className="flex items-center gap-2 mt-6 cursor-pointer">
                            <input type="checkbox" checked={serviceFormData.isWarranty} onChange={e => setServiceFormData({...serviceFormData, isWarranty: e.target.checked})} className="rounded text-[#EF4444] focus:ring-[#EF4444]" />
                            <span className="text-sm font-bold">In Warranty</span>
                          </label>
                         </div>
                         {!serviceFormData.isWarranty && (
                           <>
                             <div className="md:col-span-1">
                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Service Charge</label>
                               <input type="number" value={serviceFormData.serviceCharge} onChange={e => setServiceFormData({...serviceFormData, serviceCharge: Number(e.target.value)})} className="w-full border-gray-200 rounded-md" />
                             </div>
                             <div className="md:col-span-1">
                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                               <select value={serviceFormData.paymentMethod} onChange={e => setServiceFormData({...serviceFormData, paymentMethod: e.target.value})} className="w-full border-gray-200 rounded-md">
                                 <option value="cash">Cash</option>
                                 <option value="card">Card</option>
                                 <option value="mfs">MFS (bKash/Nagad)</option>
                                 <option value="media_payment">Media Payment</option>
                               </select>
                             </div>
                             <div className="md:col-span-1">
                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Payment Status</label>
                               <select value={serviceFormData.paymentStatus} onChange={e => setServiceFormData({...serviceFormData, paymentStatus: e.target.value as any})} className="w-full border-gray-200 rounded-md">
                                 <option value="pending">Pending</option>
                                 <option value="paid">Paid</option>
                               </select>
                             </div>
                             {(serviceFormData.paymentMethod === 'media_payment' || serviceFormData.paymentMethod === 'mfs') && (
                               <div className="col-span-2 md:col-span-4 mt-2 border-t border-gray-200 pt-3">
                                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                   {serviceFormData.paymentMethod === 'media_payment' ? 'Media Payment Reference' : 'MFS Reference / Phone'}
                                 </label>
                                 <input type="text" placeholder="TrxID or Reference" value={serviceFormData.medeaPayment} onChange={e => setServiceFormData({...serviceFormData, medeaPayment: e.target.value})} className="w-full border-gray-200 rounded-md bg-white" />
                               </div>
                             )}
                           </>
                         )}
                      </div>
                    </form>
                  </div>
                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" onClick={() => { setIsAddingService(false); setEditingService(null); }} className="px-6 py-2 border border-gray-200 rounded-md text-gray-600 font-bold hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={async () => {
                       try {
                         if (editingService) {
                           await updateDoc(doc(db, 'service_records', editingService.id), {
                             ...serviceFormData,
                             updatedAt: new Date().toISOString()
                           });
                           toast.success('Service record updated');
                         } else {
                           const newRecord = {
                             ...serviceFormData,
                             receivedAt: new Date().toISOString(),
                             createdAt: new Date().toISOString()
                           };
                           const docRef = await addDoc(collection(db, 'service_records'), newRecord);
                           toast.success('Service record created');
                           printServiceReceipt({ id: docRef.id, ...newRecord } as ServiceRecord);
                         }
                         setIsAddingService(false);
                         fetchData();
                       } catch (e) {
                         toast.error('Failed to save service record');
                       }
                    }} className="px-6 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600">Save Service Ticket</button>
                  </div>
                </div>
              </div>
            )}

      
      
      {/* Transaction Category Modal */}
      {isAddingTransactionCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add Category</h2>
              <button onClick={() => setIsAddingTransactionCategory(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveTransactionCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newTransactionCategory.name}
                  onChange={e => setNewTransactionCategory({ ...newTransactionCategory, name: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                <select
                  required
                  value={newTransactionCategory.type}
                  onChange={e => setNewTransactionCategory({ ...newTransactionCategory, type: e.target.value as 'income' | 'expense' })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTransactionCategory.description}
                  onChange={e => setNewTransactionCategory({ ...newTransactionCategory, description: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingTransactionCategory(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Transaction Modal */}
      {isAddingManualTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Record Manual {manualTransactionType === 'income' ? 'Income' : 'Expense'}</h2>
              <button onClick={() => setIsAddingManualTransaction(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveManualTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newManualTransaction.date}
                  onChange={e => setNewManualTransaction({ ...newManualTransaction, date: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category (Optional)</label>
                <select
                  value={newManualTransaction.categoryId || ''}
                  onChange={e => setNewManualTransaction({ ...newManualTransaction, categoryId: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                >
                  <option value="">Uncategorized</option>
                  {transactionCategories.filter(c => c.type === manualTransactionType).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={newManualTransaction.amount || ''}
                  onChange={e => setNewManualTransaction({ ...newManualTransaction, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={newManualTransaction.description}
                  onChange={e => setNewManualTransaction({ ...newManualTransaction, description: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                  placeholder="e.g. Office Supplies, Salary, etc."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingManualTransaction(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Conveyance Modal */}
      {isAddingConveyance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add Conveyance</h2>
              <button onClick={() => setIsAddingConveyance(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveConveyance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newConveyance.date}
                  onChange={e => setNewConveyance({ ...newConveyance, date: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={newConveyance.employee}
                  onChange={e => setNewConveyance({ ...newConveyance, employee: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                  placeholder="Employee Name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={newConveyance.description}
                  onChange={e => setNewConveyance({ ...newConveyance, description: e.target.value })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                  placeholder="Transport from A to B"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={newConveyance.amount}
                  onChange={e => setNewConveyance({ ...newConveyance, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border-gray-200 rounded-md focus:ring-[#EF4444]"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingConveyance(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-md font-bold hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">New Portal User</h2>
              <button onClick={() => setIsAddingUser(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddPortalUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                <input type="text" required className="w-full border-gray-300 rounded-md" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input type="email" required className="w-full border-gray-300 rounded-md" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input type="password" required minLength={6} className="w-full border-gray-300 rounded-md" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select className="w-full border-gray-300 rounded-md" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})}>
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {(userFormData.role === 'manager' || userFormData.role === 'staff') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Permissions</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                    {['view_dashboard', 'manage_users', 'manage_settings', 'manage_inventory', 'manage_orders', 'manage_finances', 'manage_reports', 'manage_hr', 'manage_services', 'manage_marketing'].map((perm) => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={userFormData.permissions.includes(perm as UserPermission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserFormData({ ...userFormData, permissions: [...userFormData.permissions, perm as UserPermission] });
                            } else {
                              setUserFormData({ ...userFormData, permissions: userFormData.permissions.filter(p => p !== perm) });
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize">{perm.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {isAddingEmployee && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-y-auto max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">{editingEmployee ? 'Edit Employee' : 'New Employee'}</h2>
              <button onClick={() => setIsAddingEmployee(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (editingEmployee) {
                await updateDoc(doc(db, 'employees', editingEmployee.id), employeeFormData);
              } else {
                await addDoc(collection(db, 'employees'), { ...employeeFormData, createdAt: new Date().toISOString() });
              }
              setIsAddingEmployee(false);
              fetchData();
            }} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                    <input type="text" required className="w-full border-gray-300 rounded-md" value={employeeFormData.name || ''} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input type="email" required className="w-full border-gray-300 rounded-md" value={employeeFormData.email || ''} onChange={e => setEmployeeFormData({...employeeFormData, email: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                    <input type="tel" required className="w-full border-gray-300 rounded-md" value={employeeFormData.phone || ''} onChange={e => setEmployeeFormData({...employeeFormData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" required className="w-full border-gray-300 rounded-md" value={employeeFormData.dateOfBirth || ''} onChange={e => setEmployeeFormData({...employeeFormData, dateOfBirth: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">NID Number</label>
                    <input type="text" required className="w-full border-gray-300 rounded-md" value={employeeFormData.nidNumber || ''} onChange={e => setEmployeeFormData({...employeeFormData, nidNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                    <select className="w-full border-gray-300 rounded-md" value={employeeFormData.role || 'Staff'} onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})}>
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Technician">Technician</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Join Date</label>
                    <input type="date" required className="w-full border-gray-300 rounded-md" value={employeeFormData.joinDate || ''} onChange={e => setEmployeeFormData({...employeeFormData, joinDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Date</label>
                    <input type="date" className="w-full border-gray-300 rounded-md" value={employeeFormData.confirmDate || ''} onChange={e => setEmployeeFormData({...employeeFormData, confirmDate: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Base Salary</label>
                     <input type="number" className="w-full border-gray-300 rounded-md" value={employeeFormData.baseSalary || 0} onChange={e => setEmployeeFormData({...employeeFormData, baseSalary: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                    <select className="w-full border-gray-300 rounded-md" value={employeeFormData.status || 'active'} onChange={e => setEmployeeFormData({...employeeFormData, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Certificate</label>
                    <div className="flex items-center gap-2">
                       <input type="file" id="cert-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                         const url = await handleFileUpload(e.target.files?.[0] || null);
                         if (url) setEmployeeFormData({...employeeFormData, certificateUrl: url});
                       }} />
                       <label htmlFor="cert-upload" className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md text-sm text-center flex-1 hover:bg-gray-50 flex items-center justify-center gap-2">
                         <Upload size={14} /> Upload
                       </label>
                       {employeeFormData.certificateUrl && <a href={employeeFormData.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 bg-blue-50 p-2 rounded" title="View Certificate"><FileText size={16} /></a>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">NID Card</label>
                    <div className="flex items-center gap-2">
                       <input type="file" id="nid-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => {
                         const url = await handleFileUpload(e.target.files?.[0] || null);
                         if (url) setEmployeeFormData({...employeeFormData, nidUrl: url});
                       }} />
                       <label htmlFor="nid-upload" className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md text-sm text-center flex-1 hover:bg-gray-50 flex items-center justify-center gap-2">
                         <Upload size={14} /> Upload
                       </label>
                       {employeeFormData.nidUrl && <a href={employeeFormData.nidUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 bg-blue-50 p-2 rounded" title="View NID"><FileText size={16} /></a>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">CV (Soft Copy)</label>
                    <div className="flex items-center gap-2">
                       <input type="file" id="cv-upload" className="hidden" accept=".pdf,.doc,.docx" onChange={async (e) => {
                         const url = await handleFileUpload(e.target.files?.[0] || null);
                         if (url) setEmployeeFormData({...employeeFormData, cvUrl: url});
                       }} />
                       <label htmlFor="cv-upload" className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md text-sm text-center flex-1 hover:bg-gray-50 flex items-center justify-center gap-2">
                         <Upload size={14} /> Upload
                       </label>
                       {employeeFormData.cvUrl && <a href={employeeFormData.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 bg-blue-50 p-2 rounded" title="View CV"><FileText size={16} /></a>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingEmployee(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600 disabled:opacity-50">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {isAddingLeave && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">{editingLeave ? 'Edit Leave Request' : 'New Leave Request'}</h2>
              <button onClick={() => setIsAddingLeave(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (editingLeave) {
                await updateDoc(doc(db, 'employee_leaves', editingLeave.id), leaveFormData);
              } else {
                await addDoc(collection(db, 'employee_leaves'), { ...leaveFormData, createdAt: new Date().toISOString() });
              }
              setIsAddingLeave(false);
              fetchData();
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Employee</label>
                <select required className="w-full border-gray-300 rounded-md" value={leaveFormData.employeeName || ''} onChange={e => setLeaveFormData({...leaveFormData, employeeName: e.target.value})}>
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                  <input type="date" required className="w-full border-gray-300 rounded-md" value={leaveFormData.startDate || ''} onChange={e => setLeaveFormData({...leaveFormData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                  <input type="date" required className="w-full border-gray-300 rounded-md" value={leaveFormData.endDate || ''} onChange={e => setLeaveFormData({...leaveFormData, endDate: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                  <select className="w-full border-gray-300 rounded-md" value={leaveFormData.type || 'casual'} onChange={e => setLeaveFormData({...leaveFormData, type: e.target.value})}>
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select className="w-full border-gray-300 rounded-md" value={leaveFormData.status || 'pending'} onChange={e => setLeaveFormData({...leaveFormData, status: e.target.value})}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                <textarea required rows={3} className="w-full border-gray-300 rounded-md" value={leaveFormData.reason || ''} onChange={e => setLeaveFormData({...leaveFormData, reason: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingLeave(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {isAddingSalary && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">{editingSalary ? 'Edit Salary Record' : 'Process Salary'}</h2>
              <button onClick={() => setIsAddingSalary(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const netPay = (Number(salaryFormData.baseAmount) || 0) + (Number(salaryFormData.bonus) || 0) - (Number(salaryFormData.deductions) || 0);
              const dataToSave = { ...salaryFormData, netPay };
              if (editingSalary) {
                await updateDoc(doc(db, 'employee_salaries', editingSalary.id), dataToSave);
              } else {
                await addDoc(collection(db, 'employee_salaries'), { ...dataToSave, createdAt: new Date().toISOString() });
              }
              setIsAddingSalary(false);
              fetchData();
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Employee</label>
                  <select required className="w-full border-gray-300 rounded-md" value={salaryFormData.employeeName || ''} onChange={e => {
                    const empName = e.target.value;
                    const emp = employees.find(e => e.name === empName);
                    setSalaryFormData({...salaryFormData, employeeName: empName, baseAmount: emp ? emp.baseSalary || 0 : 0});
                  }}>
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Month</label>
                  <input type="month" required className="w-full border-gray-300 rounded-md" value={salaryFormData.month || ''} onChange={e => setSalaryFormData({...salaryFormData, month: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Base Amount</label>
                  <input type="number" required className="w-full border-gray-300 rounded-md" value={salaryFormData.baseAmount || 0} onChange={e => setSalaryFormData({...salaryFormData, baseAmount: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bonus</label>
                  <input type="number" className="w-full border-gray-300 rounded-md text-green-600" value={salaryFormData.bonus || 0} onChange={e => setSalaryFormData({...salaryFormData, bonus: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Deductions</label>
                  <input type="number" className="w-full border-gray-300 rounded-md text-red-600" value={salaryFormData.deductions || 0} onChange={e => setSalaryFormData({...salaryFormData, deductions: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-700">Calculated Net Pay:</span>
                <span className="text-xl font-bold text-[#EF4444]">
                  {formatCurrency((Number(salaryFormData.baseAmount) || 0) + (Number(salaryFormData.bonus) || 0) - (Number(salaryFormData.deductions) || 0), settings)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select className="w-full border-gray-300 rounded-md" value={salaryFormData.status || 'pending'} onChange={e => setSalaryFormData({...salaryFormData, status: e.target.value})}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Payment Date</label>
                  <input type="date" className="w-full border-gray-300 rounded-md" value={salaryFormData.paymentDate || ''} onChange={e => setSalaryFormData({...salaryFormData, paymentDate: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingSalary(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-[#EF4444] rounded-md hover:bg-red-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PC Builder Modal for Sales */}

      {showPCBuilderModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
              <h2 className="text-xl font-bold">PC Builder for Sale</h2>
              <button onClick={() => setShowPCBuilderModal(false)} className="text-gray-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              <p className="text-sm text-gray-500 mb-6">Select components to build a PC and add them to the sale.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { id: 'cpu', name: 'CPU', Icon: Cpu },
                  { id: 'cooler', name: 'CPU Cooler', Icon: Fan },
                  { id: 'motherboard', name: 'Motherboard', Icon: Server },
                  { id: 'ram', name: 'RAM', Icon: Database },
                  { id: 'storage', name: 'Storage', Icon: HardDrive },
                  { id: 'gpu', name: 'Graphics Card', Icon: Monitor },
                  { id: 'psu', name: 'Power Supply', Icon: Plug },
                  { id: 'casing', name: 'Casing', Icon: Server },
                  { id: 'monitor', name: 'Monitor', Icon: Monitor },
                  { id: 'casing_cooler', name: 'Casing Cooler', Icon: Fan },
                  { id: 'keyboard', name: 'Keyboard', Icon: Keyboard },
                  { id: 'mouse', name: 'Mouse', Icon: Mouse },
                  { id: 'speaker', name: 'Speaker & Home Theater', Icon: Speaker },
                  { id: 'headphone', name: 'Headphone', Icon: Headphones },
                  { id: 'wifi', name: 'Wifi Adapter / LAN Card', Icon: Wifi },
                  { id: 'antivirus', name: 'Anti Virus', Icon: ShieldCheck },
                  { id: 'ups', name: 'UPS', Icon: BatteryCharging }
                ].map(cat => (
                  <div key={cat.id} className="border border-gray-100 rounded-lg p-4 hover:border-[#EF4444] transition-all">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <cat.Icon size={16} className="text-[#EF4444]" /> {cat.name}
                    </h3>
                    <select 
                      className="w-full border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                      onChange={(e) => {
                        const p = products.find(prod => prod.id === e.target.value);
                        if (p) addItemToSale(p);
                      }}
                    >
                      <option value="">Select {cat.name}</option>
                      {products.filter(p => 
                        p.category.toLowerCase().includes(cat.id.toLowerCase()) || 
                        p.name.toLowerCase().includes(cat.name.toLowerCase()) ||
                        p.category.toLowerCase().includes(cat.name.toLowerCase())
                      ).map(p => (
                        <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price, settings)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowPCBuilderModal(false)}
                className="bg-[#EF4444] text-white px-8 py-2 rounded-md font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Ledger Modal */}
      {selectedLedgerEntity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#081621] text-white">
              <div>
                <h2 className="text-xl font-bold">{selectedLedgerEntity.name}'s {ledgerView === 'ledger' ? 'Ledger' : 'Products'}</h2>
                <p className="text-xs opacity-70 uppercase tracking-wider">{selectedLedgerEntity.type} Account</p>
              </div>
              <div className="flex items-center gap-4">
                {selectedLedgerEntity.type === 'vendor' && (
                  <div className="flex bg-white/10 p-1 rounded-lg">
                    <button
                      onClick={() => setLedgerView('ledger')}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                        ledgerView === 'ledger' ? "bg-white text-[#081621]" : "text-white hover:bg-white/10"
                      )}
                    >
                      Ledger
                    </button>
                    <button
                      onClick={() => setLedgerView('products')}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                        ledgerView === 'products' ? "bg-white text-[#081621]" : "text-white hover:bg-white/10"
                      )}
                    >
                      Products
                    </button>
                  </div>
                )}
                <button onClick={() => { setSelectedLedgerEntity(null); setLedgerView('ledger'); }} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {ledgerView === 'ledger' ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      value={ledgerStartDate}
                      onChange={e => setLedgerStartDate(e.target.value)}
                      className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                    <input
                      type="date"
                      value={ledgerEndDate}
                      onChange={e => setLedgerEndDate(e.target.value)}
                      className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search Transactions</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Description or ID..."
                        value={ledgerSearchQuery}
                        onChange={(e) => setLedgerSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444] w-48"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadLedgerCSV()}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                  >
                    <Download size={18} /> CSV
                  </button>
                  <button
                    onClick={() => handleDownloadLedgerPDF()}
                    className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
                  >
                    <Download size={18} /> PDF Report
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {(() => {
                  const entityTransactions = transactions.filter(t => {
                    const matchesEntity = t.entityId === selectedLedgerEntity.id;
                    const txDate = new Date(t.date).toISOString().split('T')[0];
                    const matchesDate = txDate >= ledgerStartDate && txDate <= ledgerEndDate;
                    const matchesSearch = t.description.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || 
                                        t.id.toLowerCase().includes(ledgerSearchQuery.toLowerCase());
                    return matchesEntity && matchesDate && matchesSearch;
                  });
                  const totalDebit = entityTransactions
                    .filter(t => selectedLedgerEntity.type === 'customer' ? t.type === 'sale' : t.type === 'payment_made')
                    .reduce((sum, t) => sum + t.amount, 0);
                  const totalCredit = entityTransactions
                    .filter(t => selectedLedgerEntity.type === 'customer' ? t.type === 'payment_received' : t.type === 'purchase')
                    .reduce((sum, t) => sum + t.amount, 0);
                  const balance = selectedLedgerEntity.type === 'customer' ? totalDebit - totalCredit : totalCredit - totalDebit;

                  return (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total {selectedLedgerEntity.type === 'customer' ? 'Sales' : 'Payments Made'}</p>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalDebit, settings)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">Total {selectedLedgerEntity.type === 'customer' ? 'Payments Received' : 'Purchases'}</p>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(totalCredit, settings)}</p>
                      </div>
                      <div className={cn("p-4 rounded-lg border", balance > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100")}>
                        <p className={cn("text-xs font-bold uppercase mb-1", balance > 0 ? "text-red-600" : "text-gray-600")}>Outstanding Balance</p>
                        <p className={cn("text-2xl font-bold", balance > 0 ? "text-red-900" : "text-gray-900")}>{formatCurrency(balance, settings)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Record New Payment</h3>
                <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Amount</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(Number(e.target.value))}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Payment Method</label>
                    <select
                      value={ledgerPaymentMethod}
                      onChange={e => setLedgerPaymentMethod(e.target.value)}
                      className="w-full border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                    >
                      <option value="cash">Cash</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="rocket">Rocket</option>
                      <option value="cellfin">Cellfin</option>
                      <option value="card">Visa/Mastercard</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="other">Other Gateway</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      value={paymentDescription}
                      onChange={e => setPaymentDescription(e.target.value)}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      placeholder="e.g. Cash Payment, Bank Transfer"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-[#EF4444] text-white py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                    >
                      Record Payment
                    </button>
                  </div>
                </form>
              </div>

              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Transaction History</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Credit</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {(() => {
                      let runningBalance = 0;
                      return transactions
                        .filter(t => {
                          const matchesEntity = t.entityId === selectedLedgerEntity.id;
                          const txDate = new Date(t.date).toISOString().split('T')[0];
                          const matchesDate = txDate >= ledgerStartDate && txDate <= ledgerEndDate;
                          const matchesSearch = t.description.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) || 
                                              t.id.toLowerCase().includes(ledgerSearchQuery.toLowerCase());
                          return matchesEntity && matchesDate && matchesSearch;
                        })
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(t => {
                          const isDebit = selectedLedgerEntity.type === 'customer' ? t.type === 'sale' : t.type === 'payment_made';
                          const isCredit = selectedLedgerEntity.type === 'customer' ? t.type === 'payment_received' : t.type === 'purchase';
                          
                          if (isDebit) runningBalance += t.amount;
                          if (isCredit) runningBalance -= t.amount;

                          // For Vendor, balance is Credit - Debit, so we flip it
                          const displayBalance = selectedLedgerEntity.type === 'vendor' ? -runningBalance : runningBalance;

                          return (
                            <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-medium">{t.description}</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                  t.type === 'sale' || t.type === 'purchase' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                )}>
                                  {t.type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-blue-600 font-mono">{isDebit ? formatCurrency(t.amount, settings) : '-'}</td>
                              <td className="px-4 py-3 text-right text-green-600 font-mono">{isCredit ? formatCurrency(t.amount, settings) : '-'}</td>
                              <td className={cn("px-4 py-3 text-right font-bold font-mono", displayBalance > 0 ? "text-red-600" : "text-gray-900")}>
                                {formatCurrency(displayBalance, settings)}
                              </td>
                            </tr>
                          );
                        });
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={vendorProductSearchQuery}
                      onChange={(e) => setVendorProductSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md text-sm focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Category:</label>
                    <select
                      value={vendorProductCategoryFilter}
                      onChange={e => setVendorProductCategoryFilter(e.target.value)}
                      className="text-sm border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    >
                      <option value="all">All Categories</option>
                      {Array.from(new Set(products.map(p => p.category))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase">
                  {products.filter(p => 
                    p.vendorId === selectedLedgerEntity.id &&
                    (vendorProductCategoryFilter === 'all' || p.category === vendorProductCategoryFilter) &&
                    p.name.toLowerCase().includes(vendorProductSearchQuery.toLowerCase())
                  ).length} Products Found
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products
                      .filter(p => 
                        p.vendorId === selectedLedgerEntity.id &&
                        (vendorProductCategoryFilter === 'all' || p.category === vendorProductCategoryFilter) &&
                        p.name.toLowerCase().includes(vendorProductSearchQuery.toLowerCase())
                      )
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                <img src={product.images[0]} alt="" className="object-contain" referrerPolicy="no-referrer" />
                              </div>
                              <span className="text-sm font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                          <td className="px-4 py-3 text-sm font-bold text-[#EF4444]">{formatCurrency(product.price, settings)}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              product.stock >= 10 ? "bg-green-100 text-green-700" : 
                              product.stock > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            )}>
                              {product.stock} in stock
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedLedgerEntity(null);
                                setEditingProduct(product);
                                setFormData({ ...product, variants: product.variants || [], specs: product.specs || {} });
                                setActiveTab('inventory');
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                              title="Edit Product"
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {products.filter(p => p.vendorId === selectedLedgerEntity.id).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400 italic">No products associated with this vendor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
  {/* Serial Selection Modal */}
  {serialSelectionModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Select Sold Serials</h2>
        <p className="text-sm text-gray-500 mb-4">
          Please select the exact serial numbers being fulfilled for the serial-tracked items in this order.
        </p>

        <div className="space-y-6">
          {serialSelectionModal.items.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800">{item.productName}</h3>
                <span className="text-sm bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">
                  Required: {item.quantity}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Selected: {item.selectedSerials.length} / {item.quantity}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {item.availableSerials.map((serial, sIdx) => {
                  const isSelected = item.selectedSerials.includes(serial);
                  return (
                    <button
                      key={sIdx}
                      onClick={() => {
                        const newSelected = isSelected
                          ? item.selectedSerials.filter(s => s !== serial)
                          : item.selectedSerials.length < item.quantity
                            ? [...item.selectedSerials, serial]
                            : item.selectedSerials;
                        
                        setSerialSelectionModal({
                          ...serialSelectionModal,
                          items: serialSelectionModal.items.map(i => 
                            i.productId === item.productId ? { ...i, selectedSerials: newSelected } : i
                          )
                        });
                      }}
                      className={cn(
                        "text-xs py-2 px-3 rounded border font-mono transition-all text-left truncate",
                        isSelected 
                          ? "bg-[#EF4444] text-white border-[#EF4444]" 
                          : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                      )}
                    >
                      {serial}
                    </button>
                  );
                })}
                {item.availableSerials.length === 0 && (
                  <div className="col-span-full text-xs text-red-500 italic">No serials available in stock!</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => setSerialSelectionModal(null)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSerialSelection}
            className="px-6 py-2 bg-[#EF4444] text-white rounded font-bold hover:bg-red-600 transition-all"
          >
            Confirm & Update Status
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Confirm Modal */}
  <ConfirmModal />
    </main>
      </div>
        </div>
  );
};
