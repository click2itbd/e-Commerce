import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Customer } from '../../../../types';
import { toast } from 'react-hot-toast';
import {
  Users,
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
  setSelectedLedgerEntity?: (entity: { id: string; name: string; type: 'customer' | 'vendor' }) => void;
  setActiveTab?: (tab: string) => void;
}

const Customers: React.FC<CustomersProps> = ({
  setSelectedLedgerEntity,
  setActiveTab,
}) => {
  const { isAdmin, hasPermission } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!customerFormData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      setSubmitting(true);
      const customerData = {
        name: customerFormData.name.trim(),
        phone: customerFormData.phone.trim(),
        email: customerFormData.email.trim(),
        address: customerFormData.address.trim(),
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
      setCustomerFormData({ name: '', phone: '', email: '', address: '' });
      fetchCustomers();
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
      if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden space-y-6">
      {/* Header Bar */}
      <div className="p-6 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-[#EF4444]" /> Customer Directory
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Add and manage registered customer details ({customers.length} total).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-100"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          </div>

          {hasPermission('manage_orders') && (
            <button
              onClick={() => {
                setEditingCustomer(null);
                setCustomerFormData({ name: '', phone: '', email: '', address: '' });
                setIsAddingCustomer(true);
              }}
              className="bg-[#081621] hover:bg-[#EF4444] text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            >
              <Plus size={14} /> Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Customer Modal (Add / Edit) */}
      {(isAddingCustomer || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 bg-[#081621] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users size={16} className="text-[#EF4444]" />
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => { setIsAddingCustomer(false); setEditingCustomer(null); }}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={customerFormData.name}
                  onChange={e => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 017XXXXXXXX"
                  value={customerFormData.phone}
                  onChange={e => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. tanvir@example.com"
                  value={customerFormData.email}
                  onChange={e => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Dhanmondi, Dhaka"
                  value={customerFormData.address}
                  onChange={e => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {submitting ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Save Customer')}
                  </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingCustomer(false); setEditingCustomer(null); }}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="overflow-x-auto border-t border-gray-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
            <tr>
              <th className="px-6 py-3.5">Customer Name</th>
              <th className="px-6 py-3.5">Phone Number</th>
              <th className="px-6 py-3.5">Email Address</th>
              <th className="px-6 py-3.5">Address</th>
              <th className="px-6 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading customers...</td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                  No customers found. Click &quot;Add Customer&quot; to add one.
                </td>
              </tr>
            ) : (
              filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-3.5">
                    {customer.phone ? (
                      <div className="flex items-center gap-2">
                        <a href={`tel:${customer.phone}`} className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1">
                          <Phone size={11} className="text-gray-400" /> {customer.phone}
                        </a>
                        <a
                          href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-500 hover:text-emerald-700"
                          title="WhatsApp"
                        >
                          <MessageCircle size={12} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                        <Mail size={11} className="text-gray-400" /> {customer.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-gray-600 max-w-xs truncate">
                    {customer.address ? (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-gray-400 shrink-0" /> {customer.address}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewLedger(customer)}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        title="View Ledger Statement"
                      >
                        <FileText size={14} />
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
                            });
                            setIsAddingCustomer(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
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
      <div className="p-6 pt-0">
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
