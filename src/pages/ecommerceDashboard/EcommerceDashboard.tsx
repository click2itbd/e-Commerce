
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Product, Order, Customer, Transaction, Vendor, NavigationMenu } from '../../types';
import { logoBase64 } from '../../lib/logoBase64';
import { 
  Menu as MenuIcon, X, Activity, Package, ShoppingBag, Users, 
  Tag, Globe, Settings, ExternalLink, ArrowLeft, Star, CalendarPlus, MessageCircle, HelpCircle, Zap, RefreshCcw, Truck, ShoppingCart, PieChart as PieChartIcon, Layers, Heart, FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BannersManagerTab } from '../admin/tabs/marketing/BannersManagerTab';
import { toast } from 'react-hot-toast';

// Lazy loaded components
const EcommerceOverview = lazy(() => import('./EcommerceOverview').then(m => ({ default: m.EcommerceOverview })));
const EcommerceInventory = lazy(() => import('./EcommerceInventory').then(m => ({ default: m.EcommerceInventory })));
const EcommerceOrders = lazy(() => import('./EcommerceOrders').then(m => ({ default: m.EcommerceOrders })));
const CustomersTab = lazy(() => import('../admin/tabs/sales/Customers').then(m => ({ default: m.default })));
const EcommerceSettings = lazy(() => import('./EcommerceSettings').then(m => ({ default: m.EcommerceSettings })));
const EcommerceMarketing = lazy(() => import('./EcommerceMarketing').then(m => ({ default: m.EcommerceMarketing })));
const EcommerceBrands = lazy(() => import('./EcommerceBrands').then(m => ({ default: m.EcommerceBrands })));
const EcommercePreBooks = lazy(() => import('./EcommercePreBooks').then(m => ({ default: m.EcommercePreBooks })));
const EcommerceReviews = lazy(() => import('./EcommerceReviews').then(m => ({ default: m.EcommerceReviews })));
const EcommerceInquiries = lazy(() => import('./EcommerceInquiries').then(m => ({ default: m.EcommerceInquiries })));
const EcommerceFlashSales = lazy(() => import('./EcommerceFlashSales').then(m => ({ default: m.EcommerceFlashSales })));
const EcommerceReturns = lazy(() => import('./EcommerceReturns').then(m => ({ default: m.EcommerceReturns })));
const EcommerceShipping = lazy(() => import('./EcommerceShipping').then(m => ({ default: m.EcommerceShipping })));
const EcommerceAbandonedCarts = lazy(() => import('./EcommerceAbandonedCarts').then(m => ({ default: m.EcommerceAbandonedCarts })));
const EcommerceAnalytics = lazy(() => import('./EcommerceAnalytics').then(m => ({ default: m.EcommerceAnalytics })));
const EcommerceCategories = lazy(() => import('./EcommerceCategories').then(m => ({ default: m.EcommerceCategories })));
const EcommerceWishlistAnalytics = lazy(() => import('./EcommerceWishlistAnalytics').then(m => ({ default: m.EcommerceWishlistAnalytics })));
const EcommerceBlog = lazy(() => import('./EcommerceBlog').then(m => ({ default: m.EcommerceBlog })));

const EcommerceDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [menus, setMenus] = useState<NavigationMenu[]>([]);

  // Inventory Tab State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({ variants: [] });
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ categoryId: '', brandId: '', priceModifier: 0, modifierType: 'percentage' });
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', image: '', isActive: true });
  const [newSubCategory, setNewSubCategory] = useState({ name: '', slug: '', parentId: '', description: '', isActive: true });
  const [newBrand, setNewBrand] = useState({ name: '', slug: '', logo: '', description: '', isActive: true });

  // Orders Tab State
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');
  const [orderSort, setOrderSort] = useState('newest');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedLedgerEntity, setSelectedLedgerEntity] = useState<{ id: string; name: string; type: 'customer' | 'vendor' } | null>(null);

  // Customers Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerFormData, setCustomerFormData] = useState<Partial<Customer>>({});

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsSnap, ordersSnap, customersSnap, transactionsSnap, menusSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'customers'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(500))),
        getDocs(query(collection(db, 'menus'), orderBy('order', 'asc'), limit(100)))
      ]);

      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setCustomers(customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      setTransactions(transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setMenus(menusSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NavigationMenu)));
      
      // Vendors missing from fetch but type required for props
      setVendors([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dummy Handlers (Replace with real implementations from AdminDashboard if fully needed)
  const handleSaveProduct = async () => { alert("Saved"); setIsAddingProduct(false); fetchData(); };
  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };
  const handleBulkUpdate = async () => {};
  const handleBulkDeleteProducts = async () => {};
  const handleImageUpload = async () => 'url';
  const handleImageDelete = async () => {};
  const handleCategorySave = async () => {};
  const handleSubCategorySave = async () => {};
  const handleBrandSave = async () => {};
  const generateBarcode = () => '123456789';

  const handleExportFilteredOrders = () => {};
  const handleBulkUpdateOrderStatus = async () => {};
  const handleBulkReturnOrders = async () => {};
  const handleBulkExportOrders = () => {};
  const handleBulkDeleteOrders = async () => {};
  const updateOrderDiscount = async () => {};
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const toastId = toast.loading('Updating status...');
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Status updated', { id: toastId });
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(`Error: ${error.message}`);
    }
  };
  const generatePDF = () => {};
  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
      setOrders(orders.filter(o => o.id !== id));
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };
  
  const handleSaveCustomer = async () => {};
  const handleDeleteCustomer = async () => {};

  const renderNavBtn = (id: string, label: string, Icon: React.ElementType, badge?: string) => {
    const isActive = activeTab === id;
    return (
      <button 
        key={id}
        onClick={() => { setActiveTab(id as any); setIsMobileMenuOpen(false); }} 
        title={isCollapsed ? label : undefined}
        className={cn(
          "w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden",
          isCollapsed ? "px-0 justify-center" : "px-3",
          isActive 
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30" 
            : "text-slate-400 hover:text-white hover:bg-slate-800/80"
        )}
      >
        <div className={cn("flex items-center justify-center rounded-lg transition-colors", isCollapsed ? "p-2" : "p-1.5", isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-blue-400")}>
          <Icon size={isCollapsed ? 20 : 16} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        {!isCollapsed && <span className={cn("tracking-wide", isActive ? "font-bold" : "font-semibold")}>{label}</span>}
      </button>
    );
  };

  const NavGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6 last:mb-0">
      {!isCollapsed && (
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3 flex items-center gap-2">
          <span>{title}</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>
      )}
      <div className={cn("space-y-1", isCollapsed ? "px-2" : "")}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
        !isMobileMenuOpen && "-ml-64 lg:ml-0",
        isMobileMenuOpen && "fixed inset-y-0 left-0 z-50 shadow-2xl w-64"
      )}>
        <div className={cn("h-16 flex items-center bg-slate-950 text-white font-bold tracking-tight gap-3 shrink-0 border-b border-slate-800", isCollapsed ? "px-0 justify-center" : "px-6 text-xl")}>
          <img src={logoBase64} alt="Logo" className="h-8 w-8 object-contain bg-white rounded p-1 shrink-0" />
          {!isCollapsed && <span>E-Commerce</span>}
          <button className="lg:hidden ml-auto p-1 hover:bg-slate-800 rounded" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavGroup title="Dashboard">
            {renderNavBtn('dashboard', 'Overview', Activity)}
            {renderNavBtn('analytics', 'Analytics', PieChartIcon)}
            {renderNavBtn('wishlists', 'Wishlist Analytics', Heart)}
          </NavGroup>
          <NavGroup title="Catalog">
            {renderNavBtn('inventory', 'Products', Package)}
            {renderNavBtn('categories', 'Categories', Layers)}
          </NavGroup>
          <NavGroup title="Sales">
            {renderNavBtn('orders', 'Orders', ShoppingBag)}
            {renderNavBtn('customers', 'Customers', Users)}
            {renderNavBtn('abandonedCarts', 'Abandoned Carts', ShoppingCart)}
          </NavGroup>
          <NavGroup title="Marketing">
            {renderNavBtn('discountCodes', 'Coupons', Tag)}
            {renderNavBtn('blog', 'Blog & News', FileText)}
            {renderNavBtn('banners', 'Banners', Globe)}
            {renderNavBtn('brands', 'Brands', Star)}
            {renderNavBtn('preBooks', 'Pre-Books', CalendarPlus)}
            {renderNavBtn('flashSales', 'Flash Sales', Zap)}
          </NavGroup>
          <NavGroup title="Operations">
            {renderNavBtn('reviews', 'Reviews', MessageCircle)}
            {renderNavBtn('inquiries', 'Inquiries', HelpCircle)}
            {renderNavBtn('returns', 'Returns', RefreshCcw)}
            {renderNavBtn('shipping', 'Shipping', Truck)}
          </NavGroup>
          <NavGroup title="System">
            {renderNavBtn('settings', 'Settings', Settings)}
          </NavGroup>
        </div>

        <div className={cn("bg-slate-950 space-y-2 border-t border-slate-800 shrink-0", isCollapsed ? "p-2" : "p-4")}>
          <button onClick={() => window.open('/', '_blank')} title={isCollapsed ? "View Live Shop" : undefined} className={cn("w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors", isCollapsed ? "px-0" : "px-4")}>
            <ExternalLink size={16} /> {!isCollapsed && <span>Live Shop</span>}
          </button>
          <button onClick={() => navigate('/admin')} title={isCollapsed ? "Main Admin" : undefined} className={cn("w-full flex items-center justify-center gap-2 py-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors", isCollapsed ? "px-0" : "px-4")}>
            <ArrowLeft size={16} /> {!isCollapsed && <span>Main Admin</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600">
              <MenuIcon size={20} />
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:block p-2 rounded-md hover:bg-slate-100 text-slate-600">
              <MenuIcon size={20} />
            </button>
            <h1 className="font-bold text-lg text-slate-800 capitalize">
              {activeTab.replace(/([A-Z])/g, ' $1').trim()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:inline-block">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              {activeTab === 'dashboard' ? (
                <EcommerceOverview products={products} orders={orders} setActiveTab={setActiveTab} />
              ) : activeTab === 'analytics' ? (
                <EcommerceAnalytics />
              ) : activeTab === 'wishlists' ? (
                <EcommerceWishlistAnalytics />
              ) : activeTab === 'inventory' ? (
                <EcommerceInventory products={products} menus={menus} handleDeleteProduct={handleDeleteProduct} setActiveTab={setActiveTab} fetchData={fetchData} />
              ) : activeTab === 'categories' ? (
                <EcommerceCategories />
              ) : activeTab === 'orders' ? (
                <EcommerceOrders
                  orders={orders}
                  customers={customers}
                  updateOrderStatus={updateOrderStatus}
                  handleDeleteOrder={handleDeleteOrder}
                />
              ) : activeTab === 'customers' ? (
                <CustomersTab
                  customers={customers}
                  setSelectedLedgerEntity={setSelectedLedgerEntity}
                  setActiveTab={setActiveTab}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  customerTypeFilter={customerTypeFilter}
                  setCustomerTypeFilter={setCustomerTypeFilter}
                  isAddingCustomer={isAddingCustomer}
                  setIsAddingCustomer={setIsAddingCustomer}
                  editingCustomer={editingCustomer}
                  setEditingCustomer={setEditingCustomer}
                  customerFormData={customerFormData}
                  setCustomerFormData={setCustomerFormData}
                  handleSaveCustomer={handleSaveCustomer}
                  handleDeleteCustomer={handleDeleteCustomer}
                  fetchData={fetchData}
                />
              ) : activeTab === 'settings' ? (
                <EcommerceSettings />
              ) : activeTab === 'marketing' || activeTab === 'discountCodes' || activeTab === 'banners' ? (
                <EcommerceMarketing initialTab={activeTab === 'banners' ? 'banners' : 'coupons'} menus={menus} />
              ) : activeTab === 'blog' ? (
                <EcommerceBlog />
              ) : activeTab === 'brands' ? (
                <EcommerceBrands />
              ) : activeTab === 'preBooks' ? (
                <EcommercePreBooks />
              ) : activeTab === 'reviews' ? (
                <EcommerceReviews />
              ) : activeTab === 'inquiries' ? (
                <EcommerceInquiries />
              ) : activeTab === 'flashSales' ? (
                <EcommerceFlashSales />
              ) : activeTab === 'returns' ? (
                <EcommerceReturns />
              ) : activeTab === 'shipping' ? (
                <EcommerceShipping />
              ) : activeTab === 'abandonedCarts' ? (
                <EcommerceAbandonedCarts />
              ) : (
                <div className="text-center p-8 text-gray-500">Select an item from the menu</div>
              )}
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
};

export default EcommerceDashboard;
