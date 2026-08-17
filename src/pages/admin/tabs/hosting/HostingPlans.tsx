import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { Server, Edit, Trash2, Plus, X } from 'lucide-react';

const HostingPlansTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();

  const [hostingPlans, setHostingPlans] = useState<any[]>([]);
  const [isAddingHostingPlan, setIsAddingHostingPlan] = useState(false);
  const [editingHostingPlan, setEditingHostingPlan] = useState<any>(null);
  const [hostingPlanFormData, setHostingPlanFormData] = useState({
    name: '',
    price: 0,
    billingCycle: '',
    features: [] as string[],
    popular: false,
    order: 0,
  });

  const fetchData = async () => {
    try {
      const hostingPlansSnap = await getDocs(query(collection(db, 'hostingPlans'), orderBy('order', 'asc')));
      setHostingPlans(hostingPlansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching hosting plans:', error);
      toast.error('Failed to load hosting plans');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      setHostingPlanFormData({ name: '', price: 0, billingCycle: '', features: [], popular: false, order: 0 });
      fetchData();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const handleDeleteHostingPlan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'hostingPlans', id));
      toast.success('Plan deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  return (
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
  );
};

export default HostingPlansTab;