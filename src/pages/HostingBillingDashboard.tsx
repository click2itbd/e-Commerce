import React, { useState, useEffect } from 'react';
import { 
  Menu, ShoppingBag, User, FileEdit, Folder, Package, 
  PlusSquare, Tag, Server, Settings, Globe, LogOut,
  ChevronDown, Search, ArrowUpRight, CheckCircle2, AlertCircle, Download, X
} from 'lucide-react';
import { generatePDF } from '../lib/pdf';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-hot-toast';
import { SiteSettings, Order, ServiceRecord } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, query, orderBy, setDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { formatCurrency, cn } from '../lib/utils';
import { 
  PagesEditorModule, 
  CategoriesModule, 
  PlanPackagesModule, 
  ExtraServicesModule, 
  AddonPackagesModule, 
  PromoCodesModule, 
  ServersModule, 
  DomainPricingModule, 
  DomainRegistrarsModule 
} from '../components/HostingModules';

const areaData = [
  { name: '2026 Jan', paid: 0, invoiced: 0 },
  { name: '2026 Feb', paid: 0, invoiced: 46 },
  { name: '2026 Mar', paid: 0, invoiced: 56 },
  { name: '2026 Apr', paid: 0, invoiced: 48 },
  { name: '2026 May', paid: 0, invoiced: 0 },
  { name: '2026 Jun', paid: 0, invoiced: 0 },
  { name: '2026 Jul', paid: 0, invoiced: 0 },
  { name: '2026 Aug', paid: 0, invoiced: 0 },
  { name: '2026 Sep', paid: 0, invoiced: 0 },
  { name: '2026 Oct', paid: 0, invoiced: 0 },
  { name: '2026 Nov', paid: 0, invoiced: 0 },
];

const pieData = [
  { name: 'Outstanding', value: 109.48 },
  { name: 'Paid', value: 0 },
];
const COLORS = ['#F59E0B', '#3B82F6'];

export const HostingBillingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { settings, updateSettings } = useSettings();
  const [settingsFormData, setSettingsFormData] = useState<SiteSettings>(settings);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Computed data
  const hostingOrders = orders; // Further classify hosting orders if needed
  const unpaidInvoicesCount = hostingOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const activeTicketsCount = tickets.filter(t => t.status !== 'ready').length;
  const totalOutstanding = hostingOrders.filter(o => o.status === 'pending' || o.status === 'processing').reduce((acc, curr) => acc + curr.total, 0);
  const totalPaid = hostingOrders.filter(o => o.status === 'delivered' || o.status === 'shipped').reduce((acc, curr) => acc + curr.total, 0);

  const dynamicPieData = [
    { name: 'Outstanding', value: totalOutstanding },
    { name: 'Paid', value: totalPaid },
  ];

  const [domainQuery, setDomainQuery] = useState('');
  const [isSearchingDomain, setIsSearchingDomain] = useState(false);
  const [domainResults, setDomainResults] = useState<{name: string, available: boolean, price: number, ext: string}[] | null>(null);

  const handleDomainSearch = () => {
    if (!domainQuery.trim()) return;
    setIsSearchingDomain(true);
    // Simulate API delay
    setTimeout(() => {
      const q = domainQuery.trim().toLowerCase();
      const baseName = q.includes('.') ? q.split('.')[0] : q;
      const targetExt = q.includes('.') ? '.' + q.split('.').slice(1).join('.') : '.com';
      
      const availableStatus = Math.random() > 0.3; // 70% chance available
      
      setDomainResults([
        { name: `${baseName}${targetExt}`, available: availableStatus, price: 12.99, ext: targetExt },
        { name: `${baseName}.net`, available: Math.random() > 0.2, price: 10.99, ext: '.net' },
        { name: `${baseName}.org`, available: Math.random() > 0.2, price: 11.99, ext: '.org' },
        { name: `${baseName}.io`, available: Math.random() > 0.4, price: 39.99, ext: '.io' },
        { name: `${baseName}.co`, available: Math.random() > 0.2, price: 24.99, ext: '.co' },
      ]);
      setIsSearchingDomain(false);
    }, 1500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        const ticketsSnap = await getDocs(query(collection(db, 'service_records'), orderBy('receivedAt', 'desc')));
        
        setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
        setTickets(ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ServiceRecord[]);
      } catch (err) {
        console.error("Failed to load hosting data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await updateSettings(settingsFormData);
      toast.success('API Settings preserved successfully!');
    } catch (err) {
      toast.error('Failed to update API settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-4 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 h-full">
          {/* Logo area */}
          <div className="flex items-center gap-2 pr-6 border-r border-gray-100 h-full">
            <div className="w-8 h-8 bg-[#3B82F6] rounded flex items-center justify-center text-white font-bold tracking-tighter">
              &lt;/&gt;
            </div>
            <Link to="/admin" className="font-bold text-xl text-gray-800 tracking-tight hover:text-blue-600 transition-colors">InHostBilling</Link>
          </div>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded text-gray-600"
          >
            <Menu size={20} />
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex h-full items-center">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center px-4 h-full text-sm font-medium ${activeTab === 'dashboard' ? 'text-[#3B82F6] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} border-x border-gray-100`}>Dashboard</button>
            <button onClick={() => setActiveTab('server-accounts')} className={`flex items-center px-4 h-full text-sm font-medium ${activeTab === 'server-accounts' ? 'text-[#3B82F6] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} border-r border-gray-100`}>Server Accounts</button>
            <button onClick={() => setActiveTab('all-orders')} className={`flex items-center px-4 h-full text-sm font-medium ${activeTab === 'all-orders' ? 'text-[#3B82F6] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} border-r border-gray-100`}>All Orders</button>
            <button onClick={() => setActiveTab('domain-search')} className={`flex items-center px-4 h-full text-sm font-medium ${activeTab === 'domain-search' ? 'text-[#3B82F6] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} border-r border-gray-100`}>Domain list</button>
            
            <div className="relative group h-full flex items-center border-r border-gray-100">
              <button className="flex items-center gap-1 px-4 text-sm text-gray-600 hover:bg-gray-50 h-full">
                Sales <ChevronDown size={14} />
              </button>
            </div>
            
            <button className="flex items-center px-4 h-full text-sm text-gray-600 hover:bg-gray-50 border-r border-gray-100">Users</button>
            
            <button className="flex items-center px-4 h-full text-sm text-gray-600 hover:bg-gray-50 border-r border-gray-100 gap-2">
              Ticket <span className="bg-[#F59E0B] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{activeTicketsCount}</span>
            </button>

            <div className="relative group h-full flex items-center border-r border-gray-100">
              <button className="flex items-center gap-1 px-4 text-sm text-gray-600 hover:bg-gray-50 h-full">
                Multi Setting <ChevronDown size={14} />
              </button>
            </div>

            <div className="relative group h-full flex items-center border-r border-gray-100">
              <button className="flex items-center gap-1 px-4 text-sm text-gray-600 hover:bg-gray-50 h-full">
                Financial <ChevronDown size={14} />
              </button>
            </div>

            <button onClick={() => setActiveTab('api-settings')} className={`flex items-center px-4 h-full text-sm font-medium ${activeTab === 'api-settings' ? 'text-[#3B82F6] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} border-r border-gray-100`}>API Settings</button>
          </nav>
        </div>

        <div className="flex items-center gap-4 h-full">
          <button className="text-gray-500 hover:text-gray-800">
            <ShoppingBag size={20} />
          </button>
          <div className="flex items-center gap-2 pl-4 border-l border-gray-100 h-full">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
               <User size={16} className="text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">InHostbilling Team</span>
            <LogOut 
              size={16} 
              className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600" 
              onClick={() => {
                import('firebase/auth').then(({ signOut }) => signOut(auth));
                navigate('/');
              }}
              title="Logout"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        
        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-[#222E3C] text-gray-300 flex flex-col transition-all duration-300 ease-in-out z-50",
            "fixed inset-y-0 left-0 lg:relative lg:inset-auto",
            sidebarOpen ? 'w-[250px] translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
          )}
        >
          <div className="flex-1 overflow-y-auto py-4">
            <div className="flex items-center justify-between px-6 mb-4 lg:hidden">
              <span className="font-bold text-white">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-[#1C2531] rounded text-gray-300">
                <X size={20} />
              </button>
            </div>
            <ul className="space-y-1">
              {[
                { icon: FileEdit, label: 'Pages Editor', id: 'pages-editor' },
                { icon: Folder, label: 'Categories', id: 'categories' },
                { icon: Package, label: 'Plan Packages', id: 'plan-packages' },
                { icon: PlusSquare, label: 'Extra Services', id: 'extra-services' },
                { icon: Package, label: 'Addon Package Service', id: 'addon-packages' },
                { icon: Tag, label: 'Promo coupon Code', id: 'promo-codes' },
                { icon: Server, label: 'Servers', id: 'servers' },
                { icon: Settings, label: 'Domain Price Setting', id: 'domain-pricing' },
                { icon: Globe, label: 'Domain Registrars', id: 'domain-registrars' },
              ].map((item, idx) => (
                <li key={idx}>
                  <button 
                    onClick={() => {
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-[#1C2531] text-white border-l-2 border-blue-500' : 'hover:bg-[#1C2531] hover:text-white text-gray-300'}`}
                  >
                    <item.icon size={18} className="text-gray-400" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-6 border-t border-[#1C2531] mt-auto">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Login as User</p>
            <div className="flex items-center gap-2">
              <select className="bg-[#1C2531] text-sm text-gray-300 border border-gray-700 rounded p-2 flex-1 focus:outline-none focus:border-blue-500">
                <option>Select</option>
              </select>
                    <button 
                      onClick={() => {
                        import('firebase/auth').then(({ signOut }) => signOut(auth));
                        navigate('/');
                      }}
                      className="bg-[#1C2531] p-2 rounded border border-gray-700 hover:bg-gray-700 hover:text-white"
                      title="Logout via Sidebar"
                    >
                      <LogOut size={16} />
                    </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {activeTab === 'dashboard' && (
              <>
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Pending Domains', count: 0, color: 'bg-[#F59E0B]', onClick: () => setActiveTab('domain-search') },
                { title: 'Pending Hosting', count: 0, color: 'bg-[#10B981]', onClick: () => setActiveTab('server-accounts') },
                { title: 'Unpaid Invoices', count: unpaidInvoicesCount, color: 'bg-[#EF4444]', onClick: () => setActiveTab('all-orders') },
                { title: 'Active Tickets', count: activeTicketsCount, color: 'bg-[#8B5CF6]', onClick: () => {} },
              ].map((stat, idx) => (
                <div key={idx} onClick={stat.onClick} className="bg-[#222E3C] rounded-2xl relative overflow-hidden shadow-sm h-32 flex flex-col justify-center px-8 cursor-pointer hover:shadow-md transition-shadow">
                  {/* Color corner blob */}
                  <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full ${stat.color} opacity-80`} />
                  <div className="relative z-10 text-white leading-tight">
                    <span className="text-4xl font-bold">{stat.count}</span>
                    <h3 className="text-xl font-medium mt-1">{stat.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Invoice Payments (Donut) */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex-1 flex flex-col">
                  <h3 className="text-sm font-medium text-gray-600 mb-6">Invoice Payments</h3>
                  <div className="flex-1 flex items-center justify-center min-h-[200px]">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={dynamicPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {dynamicPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                       <span className="text-sm text-gray-600">Outstanding - {formatCurrency(totalOutstanding)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span>
                       <span className="text-sm text-gray-600">Paid - {formatCurrency(totalPaid)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#469A68] p-4 text-white rounded-lg shadow-sm">
                    <p className="text-sm opacity-90 font-medium tracking-wide">LAST MONTH</p>
                    <p className="text-2xl font-bold mt-1">$0.00</p>
                  </div>
                  <div className="bg-[#3186B1] p-4 text-white rounded-lg shadow-sm">
                    <p className="text-sm opacity-90 font-medium tracking-wide">THIS MONTH</p>
                    <p className="text-2xl font-bold mt-1">$0.00</p>
                  </div>
                </div>
              </div>

              {/* Invoiced vs Paid Chart */}
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <select className="border border-gray-300 rounded text-sm p-1">
                        <option>2026</option>
                      </select>
                      <span className="text-sm text-gray-600 font-medium">Invoiced vs Paid</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#3B82F6] block"></span> Paid</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#EF4444] block"></span> Invoiced</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={areaData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip />
                        <Area type="monotone" dataKey="paid" stroke="#3B82F6" fillOpacity={1} fill="#eef2ff" strokeWidth={2} />
                        <Area type="monotone" dataKey="invoiced" stroke="#EF4444" fillOpacity={1} fill="#fef2f2" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[250px]">
                <h3 className="text-sm font-medium text-gray-600 mb-4 border-b border-gray-100 pb-3">Recently Paid Invoices</h3>
                <div className="space-y-4">
                  {hostingOrders.filter(o => o.status === 'delivered' || o.status === 'shipped').slice(0, 3).map(order => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="flex gap-4">
                         <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center shrink-0">
                           <CheckCircle2 size={20} className="text-green-600" />
                         </div>
                         <div>
                            <span className="font-bold text-sm text-gray-800">{order.customerName}</span>
                            <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="font-bold text-sm text-gray-900">{formatCurrency(order.total)}</div>
                         <div className="text-xs text-[#3B82F6] hover:underline cursor-pointer">#{order.id.substring(0, 6)}</div>
                      </div>
                    </div>
                  ))}
                  {hostingOrders.filter(o => o.status === 'delivered' || o.status === 'shipped').length === 0 && (
                    <div className="text-sm text-gray-500">No recently paid invoices</div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[250px]">
                <h3 className="text-sm font-medium text-gray-600 mb-4 border-b border-gray-100 pb-3">Recent Tickets</h3>
                
                <div className="space-y-4">
                  {tickets.slice(0, 3).map(ticket => (
                    <div key={ticket.id} className="flex gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <User size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-sm text-gray-800">{ticket.customerName}</span>
                          <span className="text-xs text-gray-400">{new Date(ticket.receivedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[#3B82F6] text-sm hover:underline cursor-pointer">[{ticket.id.substring(0, 6)}] : {ticket.issueDescription || 'No description'}</span>
                          <span className={`text-white text-[10px] px-2 py-0.5 rounded-full font-bold ${ticket.status === 'received' ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`}>{ticket.status.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tickets.length === 0 && <div className="text-sm text-gray-500">No recent tickets</div>}
                </div>

              </div>
            </div>
              </>
            )}

            {activeTab === 'domain-search' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-6">Domain Search & Registration</h2>
                <div className="flex gap-4 mb-8">
                  <input
                    type="text"
                    placeholder="Enter domain name (e.g., example.com)..."
                    value={domainQuery}
                    onChange={(e) => setDomainQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDomainSearch()}
                    className="flex-1 border border-gray-300 rounded px-4 py-3 text-lg focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                    disabled={isSearchingDomain}
                  />
                  <button onClick={handleDomainSearch} disabled={isSearchingDomain} className={`bg-[#3B82F6] hover:bg-blue-600 text-white px-8 py-3 rounded font-bold text-lg flex items-center gap-2 ${isSearchingDomain ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {isSearchingDomain ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={20} /> Search
                      </>
                    )}
                  </button>
                </div>
                
                {domainQuery.trim() && domainResults === null && !isSearchingDomain && (
                  <div className="text-gray-500 text-center py-8">
                    Enter a domain name and click search to check availability.
                  </div>
                )}

                {domainResults && domainResults.length === 0 && !isSearchingDomain && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 border border-red-100">
                    <AlertCircle className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">No results found</p>
                      <p className="text-sm border-t border-red-100/50 mt-1 pt-1 opacity-90">Please try a different domain name or extension.</p>
                    </div>
                  </div>
                )}
                
                {domainResults && domainResults.length > 0 && !isSearchingDomain && (
                  <>
                    {/* Simulated API Results */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                       <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-bold text-gray-800">{domainResults[0].name}</h3>
                         {domainResults[0].available ? (
                           <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">Available!</span>
                         ) : (
                           <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">Unavailable</span>
                         )}
                       </div>
                       {domainResults[0].available && (
                         <>
                           <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                             <span className="font-mono bg-white px-2 py-1 border border-gray-200 rounded">API: {settingsFormData.apiSettings?.domainApiType || 'manual'}</span>
                             <span>${domainResults[0].price} / year</span>
                           </div>
                           <button onClick={() => toast.success(`Registration initiated via ${settingsFormData.apiSettings?.domainApiType || 'manual'} API`)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold">
                             Initiate Registration
                           </button>
                         </>
                       )}
                    </div>
                    
                    <h3 className="text-lg font-bold mt-8 mb-4">Other Available Extensions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {domainResults.slice(1).map(result => (
                         <div key={result.name} className={`border border-gray-200 rounded p-4 flex justify-between items-center bg-white ${result.available ? 'hover:border-blue-300' : 'opacity-60'} transition-colors`}>
                           <div className="flex flex-col">
                             <span className="font-medium text-gray-800">{result.name}</span>
                             {result.available && <span className="text-xs text-gray-500">${result.price}/yr</span>}
                           </div>
                           {result.available ? (
                             <button onClick={() => toast.success(`Registration initiated for ${result.name}`)} className="text-[#3B82F6] hover:underline text-sm font-bold">Register</button>
                           ) : (
                             <span className="text-xs font-bold text-red-500">Taken</span>
                           )}
                         </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {activeTab === 'server-accounts' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Server Accounts</h2>
                  <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2" onClick={() => {
                     toast.success(`Provisioning via ${settingsFormData.apiSettings?.cloudLinuxApiType === 'cpanel' ? 'WHM API' : settingsFormData.apiSettings?.vpsApiType === 'solusvm' ? 'SolusVM API' : 'Manual Setup'}...`);
                  }}>
                    <PlusSquare size={16} /> New Account (Auto Provision)
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Domain</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Server API</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Server IP</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Placeholder for server accounts list since we don't have standard structure for active accounts */}
                      <tr>
                         <td className="py-4 px-4 text-sm font-medium text-blue-600">example-domain.com</td>
                         <td className="py-4 px-4 text-sm text-gray-600">CPanel Shared</td>
                         <td className="py-4 px-4"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Active</span></td>
                         <td className="py-4 px-4 text-sm text-gray-500">{settingsFormData.apiSettings?.cloudLinuxApiType === 'cpanel' ? 'cPanel webhook' : 'Manual'}</td>
                         <td className="py-4 px-4 text-sm text-gray-600 font-mono">192.168.1.1</td>
                         <td className="py-4 px-4"><button className="text-gray-500 hover:text-blue-600"><ArrowUpRight size={16} /></button></td>
                      </tr>
                      <tr>
                         <td className="py-4 px-4 text-sm font-medium text-blue-600">client-vps.io</td>
                         <td className="py-4 px-4 text-sm text-gray-600">KVM VPS 4GB</td>
                         <td className="py-4 px-4"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Provisioning</span></td>
                         <td className="py-4 px-4 text-sm text-gray-500">{settingsFormData.apiSettings?.vpsApiType === 'solusvm' ? 'SolusVM API' : 'Manual'}</td>
                         <td className="py-4 px-4 text-sm text-gray-600 font-mono">10.0.0.24</td>
                         <td className="py-4 px-4"><button className="text-gray-500 hover:text-blue-600"><ArrowUpRight size={16} /></button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'all-orders' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-6">All Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {hostingOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 text-sm font-mono text-blue-600">#{order.id.substring(0, 8)}</td>
                          <td className="py-4 px-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-4 text-sm font-medium text-gray-800">{order.customerName}</td>
                          <td className="py-4 px-4 text-sm font-bold text-gray-900">{formatCurrency(order.total)}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              order.status === 'delivered' || order.status === 'shipped' || order.status === 'completed' ? 'bg-green-100 text-green-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {(order.status === 'delivered' || order.status === 'shipped' || order.status === 'completed' || order.paymentStatus === 'paid') && (
                              <button
                                onClick={() => generatePDF(order, 'invoice', settings)}
                                className="inline-flex items-center gap-1 bg-white hover:bg-gray-50 text-blue-600 border border-gray-200 px-3 py-1.5 rounded text-xs font-medium shadow-sm transition-colors"
                                title="Download PDF Invoice"
                              >
                                <Download size={14} /> PDF Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {hostingOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 px-4 text-center text-gray-500 italic text-sm">
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'api-settings' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-4xl">
                <h2 className="text-2xl font-bold mb-6">API & Integrations Settings</h2>
                
                <div className="space-y-6">
                  {/* Domain Settings */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                      Domain API Provider
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider type</label>
                        <select 
                          value={settingsFormData.apiSettings?.domainApiType || 'manual'}
                          onChange={e => setSettingsFormData(prev => ({...prev, apiSettings: {...prev.apiSettings, domainApiType: e.target.value as any} as any}))}
                          className="w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                        >
                           <option value="manual">Manual Registration</option>
                           <option value="resellerclub">ResellerClub</option>
                           <option value="namecheap">Namecheap</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select the provider used for domain registration</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input 
                          type="password" 
                          value={settingsFormData.apiSettings?.domainApiKey || ''}
                          onChange={e => setSettingsFormData(prev => ({...prev, apiSettings: {...prev.apiSettings, domainApiKey: e.target.value} as any}))}
                          placeholder="API Key" 
                          className="w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-2" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* CloudLinux / cPanel Settings */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                      Hosting / CloudLinux API Provider
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider type</label>
                        <select 
                          value={settingsFormData.apiSettings?.cloudLinuxApiType || 'manual'}
                          onChange={e => setSettingsFormData(prev => ({...prev, apiSettings: {...prev.apiSettings, cloudLinuxApiType: e.target.value as any} as any}))}
                          className="w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                        >
                           <option value="manual">Manual Provisioning</option>
                           <option value="cpanel">cPanel / WHM Webhooks</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select the provider for creating hosting accounts</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">WHM Token / API Key</label>
                        <input 
                          type="password" 
                          value={settingsFormData.apiSettings?.cloudLinuxApiKey || ''}
                          onChange={e => setSettingsFormData(prev => ({...prev, apiSettings: {...prev.apiSettings, cloudLinuxApiKey: e.target.value} as any}))}
                          placeholder="Token" 
                          className="w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-2" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* VPS Settings */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                      VPS Server API Provider
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider type</label>
                        <select 
                          value={settingsFormData.apiSettings?.vpsApiType || 'manual'}
                          onChange={e => setSettingsFormData(prev => ({...prev, apiSettings: {...prev.apiSettings, vpsApiType: e.target.value as any} as any}))}
                          className="w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                        >
                           <option value="manual">Manual Provisioning</option>
                           <option value="solusvm">SolusVM</option>
                           <option value="virtualizor">Virtualizor</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select the VPS panel API</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Hash</label>
                        <input 
                          type="password" 
                          value={settingsFormData.apiSettings?.vpsApiKey || ''}
                          onChange={e => setSettingsFormData(prev => ({...prev, apiSettings: {...prev.apiSettings, vpsApiKey: e.target.value} as any}))}
                          placeholder="API Key" 
                          className="w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-2" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleSaveSettings}
                      className="bg-[#3B82F6] hover:bg-blue-600 text-white px-6 py-2 rounded font-medium shadow-sm transition-colors"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'pages-editor' && <PagesEditorModule />}
            {activeTab === 'categories' && <CategoriesModule />}
            {activeTab === 'plan-packages' && <PlanPackagesModule />}
            {activeTab === 'extra-services' && <ExtraServicesModule />}
            {activeTab === 'addon-packages' && <AddonPackagesModule />}
            {activeTab === 'promo-codes' && <PromoCodesModule />}
            {activeTab === 'servers' && <ServersModule />}
            {activeTab === 'domain-pricing' && <DomainPricingModule />}
            {activeTab === 'domain-registrars' && <DomainRegistrarsModule />}
          </div>
        </main>
      </div>
    </div>
  );
};
