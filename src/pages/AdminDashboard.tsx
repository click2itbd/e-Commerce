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
import InventoryTab from './admin/tabs/inventory/Inventory';
import OrdersTab from './admin/tabs/sales/Orders';
import { Settings as SettingsTab } from './admin/tabs/others/Settings';
import MenusTab from './admin/tabs/menus/Menus';
import EmployeesTab from './admin/tabs/hr/Employees';
import LeaveTab from './admin/tabs/hr/Leave';
import SalaryTab from './admin/tabs/hr/Salary';
import CampaignsTab from './admin/tabs/marketing/Campaigns';
import DiscountCodesTab from './admin/tabs/marketing/DiscountCodes';
import UsersTab from './admin/tabs/hr/Users';
import HostingServicesTab from './admin/tabs/hosting/HostingServices';
import HostingPlansTab from './admin/tabs/hosting/HostingPlans';
import { SalesForm } from './admin/tabs/sales/SalesForm';
import ServicesTab from './admin/tabs/services/Services';

import HostingOrdersTab from './admin/tabs/hosting/HostingOrders';
import SupportTicketsTab from './admin/tabs/hosting/SupportTickets';

// Finance tabs
import AllReportsTab from './admin/tabs/finance/AllReports';
import LedgerTab from './admin/tabs/finance/Ledger';
import ManualExpenseTab from './admin/tabs/finance/ManualExpense';
import ManualIncomeTab from './admin/tabs/finance/ManualIncome';
import PaymentAccountsTab from './admin/tabs/finance/PaymentAccounts';
import SalesReportTab from './admin/tabs/finance/SalesReport';
import TransactionsTab from './admin/tabs/finance/Transactions';
import TxCategoriesTab from './admin/tabs/finance/TxCategories';
import ConveyanceTab from './admin/tabs/finance/Conveyance';
import PurchaseReturnTab from './admin/tabs/sales/PurchaseReturn';
import PurchasesTab from './admin/tabs/purchase/Purchases';
import SaleReturnTab from './admin/tabs/sales/SaleReturn';
import CustomersTab from './admin/tabs/sales/Customers';
import VendorsTab from './admin/tabs/purchase/Vendors';
import CustomerReceiveReportTab from './admin/tabs/accounting/CustomerReceiveReport';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Package, FileText, ShoppingBag, CheckCircle, Clock, Truck, XCircle, Download, Upload, Cpu, Users, Briefcase, CreditCard, Menu as MenuIcon, ChevronRight, Settings, Search, AlertTriangle, Mail, Phone, MessageCircle, Send, List, Ticket, ShieldAlert, Receipt, Server, Edit, X, ArrowLeftRight, ShieldCheck, ShoppingCart, Tag, Percent, LogOut, User, Book, CheckSquare, ArrowLeft, LifeBuoy, Activity, BarChart2, Monitor, Fan, Keyboard, Mouse, Speaker, Headphones, Wifi, BatteryCharging, HardDrive, Plug, Zap, Database, Star, ArrowRight, MessageSquare } from 'lucide-react';
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
const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'inventory' | 'orders' | 'sales' | 'quotations' | 'purchases' | 'purchase_return' | 'sale_return' | 'customers' | 'vendors' | 'transactions' | 'menus' | 'reports' | 'all_reports' | 'customer_receive_report' | 'ledger' | 'manual_income' | 'manual_expense' | 'tx_categories' | 'users' | 'campaigns' | 'discountCodes' | 'hostingPlans' | 'hostingServices' | 'hostingOrders' | 'settings' | 'services' | 'employees' | 'leave' | 'salary' | 'conveyance' | 'deposits_withdrawals' | 'account_balance' | 'account_statement' | 'balance_sheet' | 'trial_balance' | 'transaction_history' | 'payment_accounts' | 'crm' | 'tasks' | 'support_tickets'>('dashboard');
  
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
             {hasPermission('manage_reports') && (
               <button onClick={() => setActiveTab('customer_receive_report')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'customer_receive_report' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                 <Receipt size={16} className={activeTab === 'customer_receive_report' ? "text-blue-600" : "text-gray-400"} /> Receive Report
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
               <>
                 <button onClick={() => setActiveTab('hostingOrders')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'hostingOrders' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                   <Server size={16} className={activeTab === 'hostingOrders' ? "text-blue-600" : "text-gray-400"} /> Hosting Orders
                 </button>
                 <button onClick={() => setActiveTab('support_tickets')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'support_tickets' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                   <MessageSquare size={16} className={activeTab === 'support_tickets' ? "text-blue-600" : "text-gray-400"} /> Support Tickets
                 </button>
                 <button onClick={() => setActiveTab('hostingPlans')} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", activeTab === 'hostingPlans' ? "text-blue-600 font-bold bg-blue-50" : "text-gray-600 hover:bg-gray-50")}>
                   <Server size={16} className={activeTab === 'hostingPlans' ? "text-blue-600" : "text-gray-400"} /> Hosting Plans
                 </button>
               </>
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
          <InventoryTab
            products={products}
            vendors={vendors}
            menus={menus}
            isAddingProduct={isAddingProduct}
            setIsAddingProduct={setIsAddingProduct}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            formData={formData}
            setFormData={setFormData}
            inventoryCategoryFilter={inventoryCategoryFilter}
            setInventoryCategoryFilter={setInventoryCategoryFilter}
            selectedProductIds={selectedProductIds}
            setSelectedProductIds={setSelectedProductIds}
            isBulkEditing={isBulkEditing}
            setIsBulkEditing={setIsBulkEditing}
            bulkEditData={bulkEditData}
            setBulkEditData={setBulkEditData}
            isUploading={isUploading}
            dragOver={dragOver}
            setDragOver={setDragOver}
            loading={loading}
            handleSaveProduct={handleSaveProduct}
            handleDeleteProduct={handleDeleteProduct}
            handleImportProductsCSV={handleImportProductsCSV}
            handleDownloadCSVTemplate={handleDownloadCSVTemplate}
            handleExportAllProducts={handleExportAllProducts}
            handleBulkExportProducts={handleBulkExportProducts}
            handleBulkDeleteProducts={handleBulkDeleteProducts}
            handleBulkUpdate={handleBulkUpdate}
            handleImageUpload={handleImageUpload}
            removeImage={removeImage}
            addVariant={addVariant}
            updateVariant={updateVariant}
            removeVariant={removeVariant}
            addSpec={addSpec}
            updateSpec={updateSpec}
            removeSpec={removeSpec}
            setActiveTab={setActiveTab}
            fetchData={fetchData}
          />
        ) : activeTab === 'quotations' ? (
          <QuotationManager />
        ) : activeTab === 'orders' ? (
          <OrdersTab
            orders={orders}
            customers={customers}
            orderSearchQuery={orderSearchQuery}
            setOrderSearchQuery={setOrderSearchQuery}
            orderStatusFilter={orderStatusFilter}
            setOrderStatusFilter={setOrderStatusFilter}
            orderStartDate={orderStartDate}
            setOrderStartDate={setOrderStartDate}
            orderEndDate={orderEndDate}
            setOrderEndDate={setOrderEndDate}
            orderSort={orderSort}
            setOrderSort={setOrderSort}
            selectedOrderIds={selectedOrderIds}
            setSelectedOrderIds={setSelectedOrderIds}
            handleExportFilteredOrders={handleExportFilteredOrders}
            handleBulkUpdateOrderStatus={handleBulkUpdateOrderStatus}
            handleBulkReturnOrders={handleBulkReturnOrders}
            handleBulkExportOrders={handleBulkExportOrders}
            handleBulkDeleteOrders={handleBulkDeleteOrders}
            setSelectedLedgerEntity={setSelectedLedgerEntity}
            setActiveTab={setActiveTab}
            fetchData={fetchData}
            updateOrderDiscount={updateOrderDiscount}
            updateOrderStatus={updateOrderStatus}
            generatePDF={generatePDF}
          />
        ) : activeTab === 'purchase_return' ? (
          <PurchaseReturnTab />
        ) : activeTab === 'sale_return' ? (
          <SaleReturnTab />
        ) : activeTab === 'purchases' ? (
          <PurchasesTab />
        ) : activeTab === 'customers' ? (
          <CustomersTab />
        ) : activeTab === 'vendors' ? (
          <VendorsTab />
        ) : activeTab === 'conveyance' && isAdmin ? (
          <ConveyanceTab />
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
          <AllReportsTab />
        ) : activeTab === 'menus' && isAdmin ? (
          <MenusTab />
        ) : activeTab === 'hostingServices' && isAdmin ? (
          <HostingServicesTab />
        ) : activeTab === 'settings' && hasPermission('manage_settings') ? (
          <SettingsTab />
        ) : activeTab === 'services' ? (
          <ServicesTab />
        ) : activeTab === 'employees' ? (
          <EmployeesTab />
        ) : activeTab === 'leave' ? (
          <LeaveTab />
        ) : activeTab === 'salary' ? (
          <SalaryTab />
        ) : activeTab === 'payment_accounts' && hasPermission('manage_finances') ? (
          <PaymentAccountsTab />
        ) : activeTab === 'ledger' && hasPermission('manage_finances') ? (
          <LedgerTab />
        ) : activeTab === 'manual_income' && hasPermission('manage_finances') ? (
          <ManualIncomeTab />
        ) : activeTab === 'manual_expense' && hasPermission('manage_finances') ? (
          <ManualExpenseTab />
        ) : activeTab === 'tx_categories' && hasPermission('manage_finances') ? (
          <TxCategoriesTab />
        ) : activeTab === 'reports' && hasPermission('manage_reports') ? (
          <SalesReportTab />
        ) : activeTab === 'hostingOrders' && isAdmin ? (
          <HostingOrdersTab />
        ) : activeTab === 'support_tickets' && isAdmin ? (
          <SupportTicketsTab />
        ) : activeTab === 'hostingPlans' && isAdmin ? (
          <HostingPlansTab />
        ) : activeTab === 'campaigns' && hasPermission('manage_marketing') ? (
          <CampaignsTab />
        ) : activeTab === 'discountCodes' && hasPermission('manage_marketing') ? (
          <DiscountCodesTab />
        ) : activeTab === 'users' && isAdmin ? (
          <UsersTab />
        ) : activeTab === 'customer_receive_report' && hasPermission('manage_reports') ? (
          <CustomerReceiveReportTab
            orders={orders}
            transactions={transactions}
            customers={customers}
            settings={settings}
            hasPermission={hasPermission}
            formatCurrency={formatCurrency}
          />
        ) : activeTab === 'sales' ? (
          <SalesForm
            products={products}
            customers={customers}
            discountCodes={discountCodes}
            settings={settings}
            formatCurrency={formatCurrency}
            cn={cn}
            toast={toast}
            fetchData={fetchData}
            checkLowStock={checkLowStock}
            setActiveTab={setActiveTab}
            setIsAddingCustomer={setIsAddingCustomer}
          />
        ) : null}
      </div>
      {/* Confirm Modal */}
      <ConfirmModal />
    </main>
  </div>
</div>
);
};
