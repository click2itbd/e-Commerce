import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Customer } from '../../../../types';
import { toast } from 'react-hot-toast';
import {
  ShoppingBag,
  Plus,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const Customers: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const q = query(collection(db, 'customers'), orderBy('name'));
        const snap = await getDocs(q);
        setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load customers');
      }
    };
    fetchCustomers();
  }, []);

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
      const q = query(collection(db, 'customers'), orderBy('name'));
      const snap = await getDocs(q);
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      toast.success('Customer deleted');
      const q = query(collection(db, 'customers'), orderBy('name'));
      const snap = await getDocs(q);
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const setSelectedLedgerEntity = (entity: { id: string; name: string; type: string }) => {
    console.log('Ledger entity clicked:', entity);
  };

  return (
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
  );
};

export default Customers;
