import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../../firebase';
import { Customer } from '../../../../types';
import { toast } from 'react-hot-toast';
import {
  Users,
  Building2,
  Plus,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Edit2,
  Trash2,
  Search,
  X,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { Pagination } from '../../../../components/common/Pagination';

interface CustomersProps {
  customers?: Customer[];
  fetchData?: () => void;
  setSelectedLedgerEntity?: (entity: { id: string; name: string; type: 'customer' | 'vendor' }) => void;
  setActiveTab?: (tab: string) => void;
}

const Customers: React.FC<CustomersProps> = ({
  customers: initialCustomers,
  fetchData,
  setSelectedLedgerEntity,
  setActiveTab,
}) => {
  const { user, isAdmin, hasPermission } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers || []);
  const [loading, setLoading] = useState(!initialCustomers || initialCustomers.length === 0);

  // Form State
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    company: 'main',
    branchName: '',
    branchesText: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sync if parent updates customers prop
  useEffect(() => {
    if (initialCustomers && initialCustomers.length > 0) {
      setCustomers(initialCustomers);
      setLoading(false);
    }
  }, [initialCustomers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, 'customers'), orderBy('name')));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(data);
    } catch (error) {
      console.warn('Error fetching customers with orderBy name, trying unordered:', error);
      try {
        const snapshot = await getDocs(collection(db, 'customers'));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setCustomers(data);
      } catch (fallbackErr) {
        console.error('Fallback customer fetch failed:', fallbackErr);
        toast.error('Failed to load customers');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) return;

    // Use real-time listener for reliable live updates
    setLoading(true);
    const q = query(collection(db, 'customers'), orderBy('name'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        setCustomers(data);
        setLoading(false);
      },
      (error) => {
        console.warn('Customers onSnapshot with orderBy failed, falling back:', error);
        // Fallback without ordering in case index or field is missing
        getDocs(collection(db, 'customers'))
          .then((snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Customer[];
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCustomers(data);
          })
          .catch((err) => console.error('Fallback getDocs customers error:', err))
          .finally(() => setLoading(false));
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!customerFormData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      setSubmitting(true);
      const parsedBranches = customerFormData.branchesText
        ? customerFormData.branchesText.split(',').map(b => b.trim()).filter(Boolean)
        : (customerFormData.branchName ? [customerFormData.branchName.trim()] : []);
      const primaryBranch = customerFormData.branchName?.trim() || parsedBranches[0] || '';

      const customerData = {
        name: customerFormData.name.trim(),
        phone: customerFormData.phone.trim(),
        email: customerFormData.email.trim(),
        address: customerFormData.address.trim(),
        company: customerFormData.company || 'main',
        branchName: primaryBranch,
        branches: parsedBranches,
        updatedAt: new Date().toISOString(),
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
        toast.success('Customer updated successfully');
      } else {
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          createdAt: new Date().toISOString(),
        });
        toast.success('Customer added successfully');
      }

      setIsAddingCustomer(false);
      setEditingCustomer(null);
      setCustomerFormData({ name: '', phone: '', email: '', address: '', company: 'main', branchName: '', branchesText: '' });
      fetchCustomers();
      if (fetchData) fetchData();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      toast.success('Customer deleted');
      fetchCustomers();
      if (fetchData) fetchData();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleViewLedger = (customer: Customer) => {
    if (setSelectedLedgerEntity) {
      setSelectedLedgerEntity({ id: customer.id, name: customer.name, type: 'customer' });
    }
    if (setActiveTab) {
      setActiveTab('ledger');
    }
  };

  // Filter list
  const filteredCustomers = customers.filter(customer => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = (customer.name || '').toLowerCase().includes(q);
      const matchesPhone = (customer.phone || '').toLowerCase().includes(q);
      const matchesEmail = (customer.email || '').toLowerCase().includes(q);
      const matchesAddress = (customer.address || '').toLowerCase().includes(q);
      const matchesBranch = (customer.branchName || '').toLowerCase().includes(q) ||
        (customer.branches || []).some(b => b.toLowerCase().includes(q));
      if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress && !matchesBranch) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden space-y-6">
      {/* Header Area */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-[#081621] text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
              <Users size={12} className="text-blue-400" /> CRM Module
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              Customer Directory
              <span className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                {customers.length} Total
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Manage all registered customer profiles, view ledgers, and maintain communication channels.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            {hasPermission('manage_orders') && (
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setCustomerFormData({ name: '', phone: '', email: '', address: '', company: 'main', branchName: '', branchesText: '' });
                  setIsAddingCustomer(true);
                }}
                className="w-full md:w-auto bg-emerald-500 text-white px-5 py-3 rounded-xl hover:bg-emerald-400 transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Plus size={18} /> Add Customer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
         <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Search customers by name, phone, email, branch..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-10 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all placeholder:text-slate-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1 transition-colors">
                <X size={12} />
              </button>
            )}
         </div>
         <div className="text-xs text-slate-500 font-bold shrink-0">
           Showing {filteredCustomers.length} of {customers.length} {customers.length === 1 ? 'Customer' : 'Customers'}
         </div>
      </div>

      {/* Customer Modal (Add / Edit) - Horizontal Layout */}
      {(isAddingCustomer || editingCustomer) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl sm:max-w-3xl w-full overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 px-6 bg-[#081621] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    {editingCustomer ? 'Edit Customer Profile' : 'New Customer Registration'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingCustomer ? 'Update customer profile and assigned business unit' : 'Register a retail client or corporate business partner'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsAddingCustomer(false); setEditingCustomer(null); }}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCustomer} className="p-6 md:p-8 space-y-5 overflow-y-auto max-h-[82vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {/* Customer / Company Name */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Customer / Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Volumezero, Simpletree, or Md. Rahim"
                    value={customerFormData.name}
                    onChange={e => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl px-4 py-2.5 font-bold text-slate-800 text-xs outline-none transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="e.g. 017XXXXXXXX"
                      value={customerFormData.phone}
                      onChange={e => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 font-bold text-slate-800 text-xs outline-none transition-all"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="e.g. contact@example.com"
                      value={customerFormData.email}
                      onChange={e => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 font-bold text-slate-800 text-xs outline-none transition-all"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  </div>
                </div>

                {/* Physical Address */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Physical Address / Office Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. House #12, Road #5, Dhanmondi, Dhaka"
                      value={customerFormData.address}
                      onChange={e => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 font-bold text-slate-800 text-xs outline-none transition-all"
                    />
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  </div>
                </div>

                {/* Branch / Project Name */}
                <div className="md:col-span-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                    <span>Branch / Project Name(s) (Optional)</span>
                    <span className="text-[9px] text-slate-400 font-normal">Comma-separated for multiple (e.g. Simpletree, Treelogy Two, Kapilmuni)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Simpletree, Treelogy Two, Kapilmuni (leave empty for retail)"
                      value={customerFormData.branchesText}
                      onChange={e => setCustomerFormData({ ...customerFormData, branchesText: e.target.value, branchName: e.target.value.split(',')[0]?.trim() || '' })}
                      className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 text-xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    For corporate clients, specify branch or project names. These can be selected during POS sales, invoices, and statement generation.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingCustomer(false); setEditingCustomer(null); }}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Save Customer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Customer Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Contact Details</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Address</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Loading customers...</td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                  No customers found. Click "Add Customer" to add one.
                </td>
              </tr>
            ) : (
              filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner shrink-0 bg-blue-100 text-blue-700 border border-blue-200">
                        {(customer.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 block group-hover:text-blue-600 transition-colors">{customer.name}</span>
                        {((customer.branches && customer.branches.length > 0) || customer.branchName) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(customer.branches && customer.branches.length > 0 ? customer.branches : [customer.branchName]).filter(Boolean).map((br, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                Branch / Project: {br}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1.5">
                    {customer.phone ? (
                      <div className="flex items-center gap-2">
                        <a href={`tel:${customer.phone}`} className="text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1.5 text-sm transition-colors">
                          <Phone size={14} className="text-slate-400" /> {customer.phone}
                        </a>
                        <a
                          href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-500 hover:text-emerald-600 bg-emerald-50 p-1 rounded-md transition-colors"
                          title="Message on WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                    {customer.email && (
                      <a href={`mailto:${customer.email}`} className="text-slate-600 hover:text-blue-600 flex items-center gap-1.5 text-sm font-medium transition-colors">
                        <Mail size={14} className="text-slate-400" /> {customer.email}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate font-medium">
                    {customer.address ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400 shrink-0" /> {customer.address}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleViewLedger(customer)}
                        className="flex items-center gap-1.5 text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all shadow-sm"
                        title="View Ledger Statement"
                      >
                        <FileText size={14} /> <span className="hidden xl:inline">Ledger</span>
                      </button>
                      {hasPermission('manage_orders') && (
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setCustomerFormData({
                              name: customer.name || '',
                              phone: customer.phone || '',
                              email: customer.email || '',
                              address: customer.address || '',
                              company: (customer as any).company || 'main',
                              branchName: customer.branchName || '',
                              branchesText: (customer.branches && customer.branches.length > 0) ? customer.branches.join(', ') : (customer.branchName || ''),
                            });
                            setIsAddingCustomer(true);
                          }}
                          className="p-2 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-200 transition-all shadow-sm"
                          title="Edit Customer"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 hover:border-red-200 transition-all shadow-sm"
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-6 bg-white border-t border-slate-100 rounded-b-2xl">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </div>
  );
};

export default Customers;
