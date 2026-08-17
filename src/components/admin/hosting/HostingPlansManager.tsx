import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Server, X } from 'lucide-react';
import { HostingPlan, HostingService } from '../../../types';

export const HostingPlansManager: React.FC = () => {
  const [hostingPlans, setHostingPlans] = useState<HostingPlan[]>([]);
  const [hostingServices, setHostingServices] = useState<HostingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingHostingPlan, setIsAddingHostingPlan] = useState(false);
  const [editingHostingPlan, setEditingHostingPlan] = useState<HostingPlan | null>(null);
  const [hostingPlanFormData, setHostingPlanFormData] = useState({
    serviceId: '',
    name: '',
    price: 0,
    billingCycle: '/mo',
    features: [] as string[],
    popular: false,
    order: 0,
  });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansSnap, servicesSnap] = await Promise.all([
        getDocs(query(collection(db, 'hostingPlans'), orderBy('order', 'asc'))),
        getDocs(query(collection(db, 'hostingServices'), orderBy('order', 'asc'))),
      ]);
      setHostingPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as HostingPlan)));
      setHostingServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as HostingService)));
    } catch (error) {
      console.error('Error fetching hosting data:', error);
      toast.error('Failed to load hosting data');
    } finally {
      setLoading(false);
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
      setHostingPlanFormData({ serviceId: '', name: '', price: 0, billingCycle: '/mo', features: [], popular: false, order: 0 });
      fetchData();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const handleDeleteHostingPlan = async (id: string) => {
    setConfirmDelete({
      id,
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
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Server className="text-[#EF4444]" />
            <h2 className="text-xl font-bold">Hosting Plans</h2>
          </div>
          <button
            onClick={() => {
              setEditingHostingPlan(null);
              setHostingPlanFormData({ serviceId: '', name: '', price: 0, billingCycle: '/mo', features: [], popular: false, order: 0 });
              setIsAddingHostingPlan(true);
            }}
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
                  <td className="px-6 py-4 text-[#EF4444] font-bold">{plan.price.toLocaleString()}</td>
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
                            serviceId: plan.serviceId,
                            name: plan.name,
                            price: plan.price,
                            billingCycle: plan.billingCycle,
                            features: plan.features || [],
                            popular: plan.popular || false,
                            order: plan.order || 0,
                          });
                          setIsAddingHostingPlan(true);
                        }}
                        className="bg-gray-100 p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Plan"
                      >
                        <Edit2 size={16} />
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

      {/* Add/Edit Hosting Plan Modal */}
      {isAddingHostingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingHostingPlan ? 'Edit' : 'Create'} Hosting Plan</h2>
              <button onClick={() => { setIsAddingHostingPlan(false); setEditingHostingPlan(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
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

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmDelete.title}</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{confirmDelete.message}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDelete.onConfirm();
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
