const fs = require('fs');
const path = require('path');

const content = `import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { Server, Edit, Trash2, Plus, X, Settings2, Database, LayoutTemplate, Save } from 'lucide-react';

const HostingPlansTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();

  const [activeSubTab, setActiveSubTab] = useState<'packages' | 'features' | 'pricing'>('packages');

  // State for Features
  const [features, setFeatures] = useState<any[]>([]);
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [featureForm, setFeatureForm] = useState({ id: '', name: '', category: 'Standard Features', type: 'text', order: 0 });

  // State for Packages
  const [packages, setPackages] = useState<any[]>([]);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageForm, setPackageForm] = useState({
    name: '', slug: '', status: 'published', order: 0,
    pricing: { monthly: 0, annually: 0 },
    cloudLinuxLimits: { cpu: '100', pmem: '1024', vmem: '2048', io: '10', iops: '1024', ep: '20', nproc: '100', inodes: '250000' },
    allowCustomization: false,
    comparisonValues: {} as Record<string, any>
  });
  const [packageModalTab, setPackageModalTab] = useState<'basic' | 'cloudlinux' | 'compare'>('basic');

  // State for Pricing
  const [customPricing, setCustomPricing] = useState({
    perGbDisk: 50, perGbBandwidth: 10, perEmailAccount: 5, perDatabase: 10, perCoreCpu: 200, perGbRam: 150
  });

  const fetchData = async () => {
    try {
      // Fetch Features
      const featSnap = await getDocs(query(collection(db, 'hosting_features'), orderBy('order', 'asc')));
      setFeatures(featSnap.docs.map(d => ({ docId: d.id, ...d.data() })));

      // Fetch Packages
      const packSnap = await getDocs(query(collection(db, 'hosting_plans'), orderBy('order', 'asc')));
      setPackages(packSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Custom Pricing
      const pricingSnap = await getDoc(doc(db, 'custom_hosting_pricing', 'global_pricing'));
      if (pricingSnap.exists()) {
        setCustomPricing(pricingSnap.data() as any);
      }
    } catch (error) {
      console.error('Error fetching hosting data:', error);
      toast.error('Failed to load hosting data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FEATURE HANDLERS ---
  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFeature) {
        await updateDoc(doc(db, 'hosting_features', editingFeature.docId), featureForm);
        toast.success('Feature updated');
      } else {
        await setDoc(doc(db, 'hosting_features', featureForm.id), featureForm);
        toast.success('Feature added');
      }
      setIsAddingFeature(false);
      setEditingFeature(null);
      setFeatureForm({ id: '', name: '', category: 'Standard Features', type: 'text', order: 0 });
      fetchData();
    } catch (error) {
      toast.error('Failed to save feature');
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (window.confirm('Delete this feature?')) {
      await deleteDoc(doc(db, 'hosting_features', id));
      toast.success('Deleted');
      fetchData();
    }
  };

  // --- PACKAGE HANDLERS ---
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await updateDoc(doc(db, 'hosting_plans', editingPackage.id), { ...packageForm, updatedAt: new Date().toISOString() });
        toast.success('Package updated');
      } else {
        await addDoc(collection(db, 'hosting_plans'), { ...packageForm, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        toast.success('Package added');
      }
      setIsAddingPackage(false);
      setEditingPackage(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save package');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (window.confirm('Delete this package?')) {
      await deleteDoc(doc(db, 'hosting_plans', id));
      toast.success('Deleted');
      fetchData();
    }
  };

  // --- PRICING HANDLERS ---
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'custom_hosting_pricing', 'global_pricing'), customPricing, { merge: true });
      toast.success('Custom pricing saved');
    } catch (error) {
      toast.error('Failed to save pricing');
    }
  };

  if (!hasPermission('manage_hosting')) {
    return <div className="p-8 text-center text-red-500">You do not have permission to access this module.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Hosting Package System</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveSubTab('packages')} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", activeSubTab === 'packages' ? "bg-white text-[#7B61FF] shadow-sm" : "text-gray-600")}>Packages</button>
          <button onClick={() => setActiveSubTab('features')} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", activeSubTab === 'features' ? "bg-white text-[#7B61FF] shadow-sm" : "text-gray-600")}>Compare Features</button>
          <button onClick={() => setActiveSubTab('pricing')} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", activeSubTab === 'pricing' ? "bg-white text-[#7B61FF] shadow-sm" : "text-gray-600")}>Custom Pricing</button>
        </div>
      </div>

      {activeSubTab === 'pricing' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold mb-4">Custom Builder Pricing (Per Unit)</h3>
          <form onSubmit={handleSavePricing} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(customPricing).map(key => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">৳</span>
                  <input type="number" value={(customPricing as any)[key]} onChange={(e) => setCustomPricing({...customPricing, [key]: parseFloat(e.target.value)})} className="w-full pl-8 pr-3 py-2 border rounded-md focus:ring-[#7B61FF]" />
                </div>
              </div>
            ))}
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-[#7B61FF] text-white px-6 py-2 rounded-md font-medium hover:bg-purple-700"><Save size={18} className="inline mr-2" />Save Pricing</button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'features' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Compare Table Features</h3>
            <button onClick={() => { setIsAddingFeature(true); setEditingFeature(null); }} className="bg-[#7B61FF] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-purple-700"><Plus size={16} className="mr-2" />Add Feature</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-sm font-bold text-gray-700">Order</th>
                  <th className="p-3 text-sm font-bold text-gray-700">ID</th>
                  <th className="p-3 text-sm font-bold text-gray-700">Name</th>
                  <th className="p-3 text-sm font-bold text-gray-700">Category</th>
                  <th className="p-3 text-sm font-bold text-gray-700">Type</th>
                  <th className="p-3 text-sm font-bold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {features.map(f => (
                  <tr key={f.docId} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{f.order}</td>
                    <td className="p-3 text-sm font-mono text-gray-500">{f.id || f.docId}</td>
                    <td className="p-3 text-sm font-bold">{f.name}</td>
                    <td className="p-3 text-sm"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{f.category}</span></td>
                    <td className="p-3 text-sm">{f.type === 'boolean' ? 'Check/Cross' : 'Text'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => { setEditingFeature(f); setFeatureForm(f); setIsAddingFeature(true); }} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteFeature(f.docId)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'packages' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Hosting Packages</h3>
            <button onClick={() => { setIsAddingPackage(true); setEditingPackage(null); setPackageModalTab('basic'); }} className="bg-[#7B61FF] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-purple-700"><Plus size={16} className="mr-2" />Add Package</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(p => (
              <div key={p.id} className="border rounded-lg p-5 relative group hover:border-[#7B61FF] transition-colors">
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingPackage(p); setPackageForm(p); setIsAddingPackage(true); setPackageModalTab('basic'); }} className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200"><Edit size={16} /></button>
                  <button onClick={() => handleDeletePackage(p.id)} className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"><Trash2 size={16} /></button>
                </div>
                <div className="mb-4">
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-full", p.status === 'published' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700")}>{p.status}</span>
                </div>
                <h4 className="text-xl font-bold mb-1">{p.name}</h4>
                <p className="text-3xl font-bold text-[#7B61FF] mb-4">৳{p.pricing.monthly}<span className="text-sm text-gray-500 font-normal">/mo</span></p>
                <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p><Server size={14} className="inline mr-2" /> CPU: {p.cloudLinuxLimits?.cpu}% | RAM: {p.cloudLinuxLimits?.pmem}</p>
                  <p><Database size={14} className="inline mr-2" /> EP: {p.cloudLinuxLimits?.ep} | IO: {p.cloudLinuxLimits?.io}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {isAddingFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">{editingFeature ? 'Edit Feature' : 'Add Feature'}</h3>
              <button onClick={() => setIsAddingFeature(false)}><X size={20} className="text-gray-500 hover:text-red-500" /></button>
            </div>
            <form onSubmit={handleSaveFeature} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Feature ID (e.g. disk_space)</label><input type="text" required disabled={!!editingFeature} value={featureForm.id} onChange={(e) => setFeatureForm({...featureForm, id: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label><input type="text" required value={featureForm.name} onChange={(e) => setFeatureForm({...featureForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={featureForm.category} onChange={(e) => setFeatureForm({...featureForm, category: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option>Standard Features</option><option>CloudLinux Limits</option><option>Email & DB</option><option>Security</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={featureForm.type} onChange={(e) => setFeatureForm({...featureForm, type: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="text">Text (e.g. 5GB)</option><option value="boolean">Check/Cross Mark</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Order</label><input type="number" required value={featureForm.order} onChange={(e) => setFeatureForm({...featureForm, order: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-md" /></div>
              <button type="submit" className="w-full bg-[#7B61FF] text-white py-2 rounded-md">Save Feature</button>
            </form>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {isAddingPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">{editingPackage ? 'Edit Package' : 'Add Package'}</h3>
              <button onClick={() => setIsAddingPackage(false)}><X size={20} className="text-gray-500 hover:text-red-500" /></button>
            </div>
            
            <div className="flex border-b bg-gray-50">
              <button onClick={() => setPackageModalTab('basic')} className={cn("px-6 py-3 text-sm font-medium border-b-2", packageModalTab === 'basic' ? "border-[#7B61FF] text-[#7B61FF]" : "border-transparent text-gray-500")}>Basic Info & Price</button>
              <button onClick={() => setPackageModalTab('cloudlinux')} className={cn("px-6 py-3 text-sm font-medium border-b-2", packageModalTab === 'cloudlinux' ? "border-[#7B61FF] text-[#7B61FF]" : "border-transparent text-gray-500")}>CloudLinux Limits</button>
              <button onClick={() => setPackageModalTab('compare')} className={cn("px-6 py-3 text-sm font-medium border-b-2", packageModalTab === 'compare' ? "border-[#7B61FF] text-[#7B61FF]" : "border-transparent text-gray-500")}>Compare Table Values</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {packageModalTab === 'basic' && (
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={packageForm.name} onChange={(e) => setPackageForm({...packageForm, name: e.target.value})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Slug</label><input type="text" value={packageForm.slug} onChange={(e) => setPackageForm({...packageForm, slug: e.target.value})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Monthly Price (BDT)</label><input type="number" value={packageForm.pricing.monthly} onChange={(e) => setPackageForm({...packageForm, pricing: {...packageForm.pricing, monthly: parseFloat(e.target.value)}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Annually Price (BDT)</label><input type="number" value={packageForm.pricing.annually} onChange={(e) => setPackageForm({...packageForm, pricing: {...packageForm.pricing, annually: parseFloat(e.target.value)}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={packageForm.status} onChange={(e) => setPackageForm({...packageForm, status: e.target.value})} className="w-full border p-2 rounded"><option value="published">Published</option><option value="draft">Draft</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Order</label><input type="number" value={packageForm.order} onChange={(e) => setPackageForm({...packageForm, order: parseInt(e.target.value)})} className="w-full border p-2 rounded" /></div>
                  <div className="col-span-2 flex items-center mt-2">
                    <input type="checkbox" id="allowCust" checked={packageForm.allowCustomization} onChange={(e) => setPackageForm({...packageForm, allowCustomization: e.target.checked})} className="mr-2" />
                    <label htmlFor="allowCust" className="text-sm font-medium">Allow Custom Builder (User can adjust resources with sliders)</label>
                  </div>
                </div>
              )}

              {packageModalTab === 'cloudlinux' && (
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium mb-1">CPU Limit (%)</label><input type="text" value={packageForm.cloudLinuxLimits.cpu} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, cpu: e.target.value}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">PMEM (Physical Memory, MB)</label><input type="text" value={packageForm.cloudLinuxLimits.pmem} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, pmem: e.target.value}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">VMEM (Virtual Memory, MB)</label><input type="text" value={packageForm.cloudLinuxLimits.vmem} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, vmem: e.target.value}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">IO Usage (MB/s)</label><input type="text" value={packageForm.cloudLinuxLimits.io} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, io: e.target.value}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">IOPS</label><input type="text" value={packageForm.cloudLinuxLimits.iops} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, iops: e.target.value}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Entry Processes (EP)</label><input type="text" value={packageForm.cloudLinuxLimits.ep} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, ep: e.target.value}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">NPROC (Number of Processes)</label><input type="text" value={packageForm.cloudLinuxLimits.nproc} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, nproc: e.target.value}})} className="w-full border p-2 rounded" /></div>
                  <div><label className="block text-sm font-medium mb-1">Inodes</label><input type="text" value={packageForm.cloudLinuxLimits.inodes} onChange={(e) => setPackageForm({...packageForm, cloudLinuxLimits: {...packageForm.cloudLinuxLimits, inodes: e.target.value}})} className="w-full border p-2 rounded" /></div>
                </div>
              )}

              {packageModalTab === 'compare' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Set the values for this package that will appear in the public comparison table.</p>
                  {features.map(f => (
                    <div key={f.id} className="grid grid-cols-3 items-center border-b pb-4">
                      <div className="col-span-1">
                        <p className="font-bold text-sm text-gray-800">{f.name}</p>
                        <p className="text-xs text-gray-500">{f.category}</p>
                      </div>
                      <div className="col-span-2">
                        {f.type === 'boolean' ? (
                          <select 
                            value={packageForm.comparisonValues[f.id] === undefined ? 'true' : String(packageForm.comparisonValues[f.id])} 
                            onChange={(e) => setPackageForm({...packageForm, comparisonValues: {...packageForm.comparisonValues, [f.id]: e.target.value === 'true'}})}
                            className="w-full border p-2 rounded"
                          >
                            <option value="true">Included (✅)</option>
                            <option value="false">Not Included (❌)</option>
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            value={packageForm.comparisonValues[f.id] || ''} 
                            onChange={(e) => setPackageForm({...packageForm, comparisonValues: {...packageForm.comparisonValues, [f.id]: e.target.value}})}
                            placeholder="e.g. 5 GB SSD, Unlimited, etc."
                            className="w-full border p-2 rounded" 
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {features.length === 0 && <p className="text-red-500 text-sm">Please add some features in the 'Compare Features' tab first.</p>}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={handleSavePackage} className="bg-[#7B61FF] text-white px-6 py-2 rounded-md font-medium">Save Package</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HostingPlansTab;
`;
fs.writeFileSync('src/pages/admin/tabs/hosting/HostingPlans.tsx', content);
