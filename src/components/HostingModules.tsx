import React, { useState, useEffect } from 'react';
import { 
  FileEdit, Folder, Package, PlusSquare, Tag, Server, Settings, Globe, Plus, Trash2, Edit2, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const PagesEditorModule = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileEdit className="text-blue-500" /> Pages Editor
            </h3>
            <button onClick={() => toast('Feature coming soon - UI mockup only', { icon: '🚧' })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Add Page
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="px-4 py-3">Page Title</th>
                        <th className="px-4 py-3">Slug</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {['Home', 'About Us', 'Shared Hosting', 'Contact'].map((page, i) => (
                        <tr key={i}>
                            <td className="px-4 py-3 font-medium text-gray-800">{page}</td>
                            <td className="px-4 py-3 text-gray-500">/{page.toLowerCase().replace(' ', '-')}</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Published</span></td>
                            <td className="px-4 py-3 text-right">
                                <button className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={16} /></button>
                                <button className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const CategoriesModule = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Folder className="text-purple-500" /> Categories
            </h3>
            <button onClick={() => toast('Feature coming soon - UI mockup only', { icon: '🚧' })} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Add Category
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="px-4 py-3">Category Name</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {[
                        { name: 'Shared Hosting', desc: 'Standard cPanel shared hosting' },
                        { name: 'VPS Hosting', desc: 'Virtual Private Servers' },
                        { name: 'Dedicated Servers', desc: 'Bare metal dedicated servers' },
                    ].map((cat, i) => (
                        <tr key={i}>
                            <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                            <td className="px-4 py-3 text-gray-500">{cat.desc}</td>
                            <td className="px-4 py-3 text-right">
                                <button className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={16} /></button>
                                <button className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

interface HostingPlan {
  id?: string;
  name: string;
  price: string;
  disk: string;
  bw: string;
  featured: boolean;
  order?: number;
}

export const PlanPackagesModule = () => {
    const [plans, setPlans] = useState<HostingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<HostingPlan | null>(null);
    const [formData, setFormData] = useState<HostingPlan>({
        name: '',
        price: '',
        disk: '',
        bw: '',
        featured: false,
    });

    const fetchPlans = async () => {
        try {
            const q = query(collection(db, 'hosting_plans'));
            const snapshot = await getDocs(q);
            const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostingPlan));
            // Sort client-side to avoid needing an index initially
            plansData.sort((a, b) => (a.order || 0) - (b.order || 0));
            setPlans(plansData);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan && editingPlan.id) {
                await updateDoc(doc(db, 'hosting_plans', editingPlan.id), { ...formData });
                toast.success('Plan updated successfully');
            } else {
                await addDoc(collection(db, 'hosting_plans'), { ...formData, order: plans.length, createdAt: serverTimestamp() });
                toast.success('Plan created successfully');
            }
            setShowModal(false);
            setEditingPlan(null);
            setFormData({ name: '', price: '', disk: '', bw: '', featured: false });
            fetchPlans();
        } catch (error) {
            console.error('Error saving plan:', error);
            toast.error('Failed to save plan');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this plan?')) {
            try {
                await deleteDoc(doc(db, 'hosting_plans', id));
                toast.success('Plan deleted successfully');
                fetchPlans();
            } catch (error) {
                console.error('Error deleting plan:', error);
                toast.error('Failed to delete plan');
            }
        }
    };

    const openEditModal = (plan: HostingPlan) => {
        setEditingPlan(plan);
        setFormData(plan);
        setShowModal(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Package className="text-orange-500" /> Plan Packages
                </h3>
                <button 
                    onClick={() => {
                        setEditingPlan(null);
                        setFormData({ name: '', price: '', disk: '', bw: '', featured: false });
                        setShowModal(true);
                    }} 
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
                >
                    <Plus size={16} /> Add Package
                </button>
            </div>
            
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading plans...</div>
            ) : plans.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    No hosting plans found. Add your first plan!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, i) => (
                        <div key={plan.id || i} className={cn("border rounded-lg p-6 relative group", plan.featured ? "border-orange-500 shadow-md" : "border-gray-200 hover:border-orange-300 transition-colors")}>
                            {plan.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">Popular</span>}
                            
                            <button 
                                onClick={(e) => plan.id && handleDelete(plan.id, e)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>

                            <h4 className="text-xl font-bold text-gray-800 mb-2 text-center">{plan.name}</h4>
                            <p className="text-2xl font-bold text-orange-600 mb-4 text-center">{plan.price}</p>
                            <ul className="mb-6 space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> {plan.disk}</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> {plan.bw}</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Free SSL</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> cPanel Included</li>
                            </ul>
                            <button 
                                onClick={() => openEditModal(plan)}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                            >
                                <Edit2 size={14}/> Edit Package
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="font-bold text-lg">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Plan Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500" placeholder="e.g. Starter Plan" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Monthly Price</label>
                                    <input required type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500" placeholder="e.g. $4.99/mo" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Disk Space</label>
                                    <input required type="text" value={formData.disk} onChange={e => setFormData({...formData, disk: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500" placeholder="e.g. 10GB SSD" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Bandwidth</label>
                                    <input required type="text" value={formData.bw} onChange={e => setFormData({...formData, bw: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500" placeholder="e.g. 100GB Bandwidth" />
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" id="featured" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer w-4 h-4" />
                                    <label htmlFor="featured" className="text-sm font-bold text-gray-700 cursor-pointer">Mark as Featured (Popular)</label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded font-medium">Cancel</button>
                                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded font-medium shadow-sm hover:bg-orange-700">Save Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ExtraServicesModule = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <PlusSquare className="text-indigo-500" /> Extra Services
            </h3>
            <button onClick={() => toast('Feature coming soon - UI mockup only', { icon: '🚧' })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Add Service
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { name: 'Dedicated IP', price: '$3.50/mo', desc: 'A dedicated IP address for your hosting account.' },
                { name: 'Premium SSL Certificate', price: '$49.99/yr', desc: 'Wildcard SSL from Comodo to secure all subdomains.' },
                { name: 'Daily Backup + Restore', price: '$2.99/mo', desc: 'JetBackup powered daily offsite backups.' },
            ].map((svc, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-sm">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded">
                        <PlusSquare size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{svc.name} <span className="text-indigo-600 ml-2">{svc.price}</span></h4>
                        <p className="text-sm text-gray-500 mt-1">{svc.desc}</p>
                    </div>
                    <button className="text-gray-400 hover:text-indigo-600"><Edit2 size={18} /></button>
                </div>
            ))}
        </div>
    </div>
);

export const AddonPackagesModule = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Package className="text-teal-500" /> Addon Package Services
            </h3>
            <button onClick={() => toast('Feature coming soon - UI mockup only', { icon: '🚧' })} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Add Addon
            </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">Manage add-on services like software licenses (LiteSpeed, cPanel, CloudLinux) that attach to main packages.</p>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="px-4 py-3">Addon Name</th>
                        <th className="px-4 py-3">Billing Cycle</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {[
                        { name: 'cPanel Solo License', cycle: 'Monthly', price: '$15.99' },
                        { name: 'LiteSpeed Web Server (2-Worker)', cycle: 'Monthly', price: '$46.00' },
                        { name: 'Softaculous Auto Installer', cycle: 'Annually', price: '$12.00' },
                    ].map((addon, i) => (
                        <tr key={i}>
                            <td className="px-4 py-3 font-medium text-gray-800">{addon.name}</td>
                            <td className="px-4 py-3 text-gray-500">{addon.cycle}</td>
                            <td className="px-4 py-3 text-gray-800 font-bold">{addon.price}</td>
                            <td className="px-4 py-3 text-right">
                                <button className="text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const PromoCodesModule = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Tag className="text-pink-500" /> Promo Coupon Codes
            </h3>
            <button onClick={() => toast('Feature coming soon - UI mockup only', { icon: '🚧' })} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Add Coupon
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { code: 'WINTER26', discount: '20% OFF', type: 'Recurring', expires: '2026-12-31' },
                { code: 'NEWYEAR', discount: '$50.00 OFF', type: 'One-Time', expires: '2027-01-31' },
                { code: 'FREEFREQ', discount: '100% OFF', type: 'First Month', expires: 'No Expiry' },
            ].map((promo, i) => (
                <div key={i} className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-5 flex flex-col items-center justify-center relative">
                    <span className="absolute top-2 right-2 text-xs text-gray-400 cursor-pointer hover:text-red-500"><Trash2 size={14}/></span>
                    <div className="text-2xl font-mono font-bold text-gray-800 tracking-wider mb-2 border-b-2 border-pink-200 pb-1">{promo.code}</div>
                    <div className="text-xl font-bold text-pink-600 mb-1">{promo.discount}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">{promo.type}</div>
                    <div className="text-xs text-gray-400 mt-4">Exp: {promo.expires}</div>
                </div>
            ))}
        </div>
    </div>
);

export const ServersModule = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Server className="text-sky-500" /> Server Configurations
            </h3>
            <button onClick={() => toast('Feature coming soon - UI mockup only', { icon: '🚧' })} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> Add Server
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="px-4 py-3">Server Name</th>
                        <th className="px-4 py-3">Hostname</th>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {[
                        { name: 'US-East Node 1', host: 'node1.inhost.com', ip: '192.168.1.100', status: 'Active' },
                        { name: 'EU-West Node 1', host: 'eu1.inhost.com', ip: '10.0.0.5', status: 'Active' },
                        { name: 'Backup Server', host: 'backup1.inhost.com', ip: '172.16.0.4', status: 'Maintenance' },
                    ].map((svr, i) => (
                        <tr key={i}>
                            <td className="px-4 py-3 font-medium text-gray-800">{svr.name}</td>
                            <td className="px-4 py-3 text-gray-500">{svr.host}</td>
                            <td className="px-4 py-3 font-mono text-xs">{svr.ip}</td>
                            <td className="px-4 py-3">
                                <span className={cn("px-2 py-1 rounded text-xs font-bold", svr.status === 'Active' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                                    {svr.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button className="text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

interface TLDPricing {
    tld: string;
    reg: string;
    trans: string;
    ren: string;
    auto: string;
}

export const DomainPricingModule = () => {
    const [pricingMatrix, setPricingMatrix] = useState<TLDPricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTLD, setNewTLD] = useState<Partial<TLDPricing>>({ tld: '', reg: '', trans: '', ren: '', auto: 'None' });

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'hosting_config', 'domain_pricing'), (docSnap) => {
            if (docSnap.exists() && docSnap.data().matrix) {
                setPricingMatrix(docSnap.data().matrix);
            } else {
                setPricingMatrix([
                    { tld: '.com', reg: '12.99', trans: '11.99', ren: '13.99', auto: 'Namecheap' },
                    { tld: '.net', reg: '10.99', trans: '9.99', ren: '11.99', auto: 'ResellerClub' },
                    { tld: '.org', reg: '11.99', trans: '10.99', ren: '12.99', auto: 'Enom' },
                    { tld: '.io', reg: '39.99', trans: '39.99', ren: '42.99', auto: 'Namecheap' },
                ]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveMatrix = async () => {
        try {
            await setDoc(doc(db, 'hosting_config', 'domain_pricing'), { matrix: pricingMatrix }, { merge: true });
            toast.success('Pricing Matrix Saved successfully', { icon: '💰' });
        } catch (error) {
            console.error('Error saving matrix:', error);
            toast.error('Failed to save pricing matrix');
        }
    };

    const handleAddTLD = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTLD.tld || !newTLD.tld.startsWith('.')) {
            toast.error('TLD must start with a dot (e.g., .com)');
            return;
        }
        if (pricingMatrix.some(p => p.tld === newTLD.tld)) {
            toast.error('TLD already exists');
            return;
        }
        const updatedMatrix = [...pricingMatrix, newTLD as TLDPricing];
        setPricingMatrix(updatedMatrix);
        try {
            await setDoc(doc(db, 'hosting_config', 'domain_pricing'), { matrix: updatedMatrix }, { merge: true });
            toast.success(`Added ${newTLD.tld} successfully`);
            setShowModal(false);
            setNewTLD({ tld: '', reg: '', trans: '', ren: '', auto: 'None' });
        } catch (error) {
            toast.error('Failed to add TLD');
        }
    };

    const updateMatrixItem = (index: number, field: keyof TLDPricing, value: string) => {
        const newMatrix = [...pricingMatrix];
        newMatrix[index] = { ...newMatrix[index], [field]: value };
        setPricingMatrix(newMatrix);
    };

    const deleteTLD = async (index: number) => {
        if (!confirm('Remove this TLD from pricing matrix?')) return;
        const updatedMatrix = pricingMatrix.filter((_, i) => i !== index);
        setPricingMatrix(updatedMatrix);
        try {
            await setDoc(doc(db, 'hosting_config', 'domain_pricing'), { matrix: updatedMatrix }, { merge: true });
            toast.success('TLD removed');
        } catch (error) {
            toast.error('Failed to remove TLD');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="text-emerald-500" /> Domain Price Setting
                </h3>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
                >
                    <Plus size={16} /> Add TLD
                </button>
            </div>
            
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading pricing matrix...</div>
            ) : (
                <div className="overflow-x-auto relative">
                    <table className="w-full text-left text-sm text-gray-600 border">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 border-r">TLD Ext</th>
                                <th className="px-4 py-3 border-r text-center">Register ($)</th>
                                <th className="px-4 py-3 border-r text-center">Transfer ($)</th>
                                <th className="px-4 py-3 border-r text-center">Renew ($)</th>
                                <th className="px-4 py-3 text-center">Auto Reg</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pricingMatrix.map((tld, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-bold text-gray-800 border-r">{tld.tld}</td>
                                    <td className="px-4 py-3 text-center border-r">
                                        <input type="text" value={tld.reg} onChange={(e) => updateMatrixItem(i, 'reg', e.target.value)} className="w-20 px-2 py-1 border rounded text-sm text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </td>
                                    <td className="px-4 py-3 text-center border-r">
                                        <input type="text" value={tld.trans} onChange={(e) => updateMatrixItem(i, 'trans', e.target.value)} className="w-20 px-2 py-1 border rounded text-sm text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </td>
                                    <td className="px-4 py-3 text-center border-r">
                                        <input type="text" value={tld.ren} onChange={(e) => updateMatrixItem(i, 'ren', e.target.value)} className="w-20 px-2 py-1 border rounded text-sm text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                    </td>
                                    <td className="px-4 py-3 text-center border-r">
                                        <select className="border rounded px-2 py-1 text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={tld.auto} onChange={(e) => updateMatrixItem(i, 'auto', e.target.value)}>
                                            <option>None</option>
                                            <option>Namecheap</option>
                                            <option>ResellerClub</option>
                                            <option>Enom</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => deleteTLD(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} className="mx-auto" /></button>
                                    </td>
                                </tr>
                            ))}
                            {pricingMatrix.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No domain extenstions added yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleSaveMatrix} className="bg-emerald-600 text-white px-6 py-2 rounded shadow-sm font-medium hover:bg-emerald-700">Save Pricing Matrix</button>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="font-bold text-lg">Add New TLD</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddTLD} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">TLD Extension</label>
                                    <input required type="text" value={newTLD.tld} onChange={e => setNewTLD({...newTLD, tld: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" placeholder="e.g. .com" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Registration</label>
                                        <input required type="number" step="0.01" value={newTLD.reg} onChange={e => setNewTLD({...newTLD, reg: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Renewal</label>
                                        <input required type="number" step="0.01" value={newTLD.ren} onChange={e => setNewTLD({...newTLD, ren: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Transfer</label>
                                        <input required type="number" step="0.01" value={newTLD.trans} onChange={e => setNewTLD({...newTLD, trans: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Auto Reg</label>
                                        <select className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white" value={newTLD.auto} onChange={e => setNewTLD({...newTLD, auto: e.target.value})}>
                                            <option>None</option>
                                            <option>Namecheap</option>
                                            <option>ResellerClub</option>
                                            <option>Enom</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded font-medium">Cancel</button>
                                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded font-medium shadow-sm hover:bg-emerald-700">Add TLD</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export const DomainRegistrarsModule = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
            <Globe className="text-blue-500" /> Domain Registrars
        </h3>
        <p className="text-sm text-gray-500 mb-6">Configure the registrar APIs used to automatically register, transfer, and renew domains.</p>
        <div className="space-y-6">
            {[
                { name: 'Namecheap', enabled: true, fields: ['API Username', 'API Key', 'Client IP'] },
                { name: 'ResellerClub', enabled: false, fields: ['Reseller ID', 'API Key'] },
                { name: 'Enom', enabled: true, fields: ['Login ID', 'API Password'] },
            ].map((reg, i) => (
                <div key={i} className={cn("border rounded-lg p-5", reg.enabled ? "border-blue-200 bg-blue-50/10" : "border-gray-200 bg-gray-50")}>
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                        <h4 className="font-bold text-gray-800 text-lg">{reg.name}</h4>
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" defaultChecked={reg.enabled} />
                                <div className={cn("block w-10 h-6 rounded-full transition-colors", reg.enabled ? "bg-blue-500" : "bg-gray-300")}></div>
                                <div className={cn("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", reg.enabled ? "transform translate-x-4" : "")}></div>
                            </div>
                        </label>
                    </div>
                    {reg.enabled ? (
                        <div className="space-y-4 relative group">
                            {reg.fields.map((field, j) => (
                                <div key={j}>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{field}</label>
                                    <input type={field.toLowerCase().includes('password') || field.toLowerCase().includes('key') ? 'password' : 'text'} 
                                           placeholder={`Enter ${field}`} 
                                           className="w-full md:w-1/2 px-3 py-2 border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                                           defaultValue={field.includes('Key') ? '*******************' : ''} />
                                </div>
                            ))}
                            <button onClick={() => toast.success('Settings Saved')} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold opacity-0 transition-opacity hover:opacity-90 mt-2 hover:opacity-100 focus:opacity-100! group-hover:opacity-100! active:opacity-100 focus-within:opacity-100">
                                Save Settings
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">This registrar module is currently disabled.</p>
                    )}
                </div>
            ))}
            <div className="pt-4">
                <button onClick={() => toast.success('Registrar Settings Saved', { icon: '🌐' })} className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow-sm hover:bg-blue-700">Save All Registrar Settings</button>
            </div>
        </div>
    </div>
);
