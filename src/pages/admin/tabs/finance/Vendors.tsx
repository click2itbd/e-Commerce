import React from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { Briefcase, Plus, Edit, Trash2, ArrowRight, Package, FileText, Edit2 } from 'lucide-react';

interface VendorsTabProps { vendors: any[]; isAddingVendor: boolean; setIsAddingVendor: (v: boolean) => void; editingVendor: any; setEditingVendor: (v: any) => void; vendorFormData: any; setVendorFormData: (v: any) => void; handleSaveVendor: (e: any) => void; handleDeleteVendor: (id: string) => void; setSelectedLedgerEntity: (v: any) => void; setLedgerView: (v: any) => void; setActiveTab: (v: string) => void; }

const VendorsTab: React.FC<VendorsTabProps> = ({ vendors, isAddingVendor, setIsAddingVendor, editingVendor, setEditingVendor, vendorFormData, setVendorFormData, handleSaveVendor, handleDeleteVendor, setSelectedLedgerEntity, setLedgerView, setActiveTab }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();

  return (
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
  );
};

export default VendorsTab;
