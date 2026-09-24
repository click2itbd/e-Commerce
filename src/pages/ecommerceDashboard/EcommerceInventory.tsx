import React, { useState } from 'react';
import { Product, NavigationMenu } from '../../types';
import { Package, Plus, Search, Edit2, Trash2, X, Upload, Save, XCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';
import { db, storage } from '../../firebase';
import { collection, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface EcommerceInventoryProps {
  products: Product[];
  menus: NavigationMenu[];
  handleDeleteProduct: (id: string) => Promise<void>;
  fetchData: () => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export const EcommerceInventory: React.FC<EcommerceInventoryProps> = ({
  products,
  menus,
  handleDeleteProduct,
  fetchData,
  setActiveTab
}) => {
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialForm: Partial<Product> = {
    name: '', sku: '', description: '', price: 0, stock: 0, categoryId: '', images: [], category: ''
  };
  const [formData, setFormData] = useState<Partial<Product>>(initialForm);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined || formData.stock === undefined) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSaving(true);
    try {
      // Find category name
      const categoryName = menus.find(m => m.id === formData.categoryId)?.title || '';
      
      const productData = {
        ...formData,
        category: categoryName,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        toast.success('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
        toast.success('Product added successfully!');
      }
      
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const loadingToast = toast.loading('Uploading image...');
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', null, 
        (error) => { toast.error('Upload failed'); toast.dismiss(loadingToast); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
          toast.success('Image uploaded!');
          toast.dismiss(loadingToast);
        }
      );
    } catch (error) {
      toast.error('Failed to upload image');
      toast.dismiss(loadingToast);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Product Catalog</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your store products and inventory levels.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Add New Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <select 
          value={categoryFilter} 
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <option value="all">All Categories</option>
          {menus.map(menu => (
            <option key={menu.id} value={menu.id}>{menu.title}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                          <Package size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {menus.find(m => m.id === product.categoryId)?.title || product.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(product.price, settings)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock > (product.lowStockThreshold || 5) ? 'bg-green-100 text-green-800' : 
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(product)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { if(window.confirm('Delete product?')) handleDeleteProduct(product.id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="font-bold text-gray-900 text-lg">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="product-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="col-span-2 md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                      <input type="number" required min="0" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                      <input type="number" required min="0" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select Category</option>
                      {menus.map(menu => <option key={menu.id} value={menu.id}>{menu.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input type="text" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                      <input type="number" min="0" value={formData.discountPrice || ''} onChange={e => setFormData({...formData, discountPrice: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <input type="text" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (Months)</label>
                      <input type="number" min="0" value={formData.warrantyMonths || ''} onChange={e => setFormData({...formData, warrantyMonths: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 px-3 py-2 mt-6 rounded-lg border border-gray-200 w-full h-[42px]">
                        <input type="checkbox" checked={formData.hasSerialTracking || false} onChange={e => setFormData({...formData, hasSerialTracking: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        Enable Serial Tracking
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <input type="checkbox" checked={formData.showInStore !== false} onChange={e => setFormData({...formData, showInStore: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      Show in Store
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <input type="checkbox" checked={formData.isFeatured || false} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      Featured Product
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <input type="checkbox" checked={formData.isFreeShipping || false} onChange={e => setFormData({...formData, isFreeShipping: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      Free Shipping
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <input type="checkbox" checked={formData.isNewArrival || false} onChange={e => setFormData({...formData, isNewArrival: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      New Arrival
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <input type="checkbox" checked={formData.isBestSeller || false} onChange={e => setFormData({...formData, isBestSeller: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      Best Seller
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <input type="checkbox" checked={formData.isFlashSale || false} onChange={e => setFormData({...formData, isFlashSale: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      Flash Sale
                    </label>
                  </div>
                </div>
                
                <div className="col-span-2 md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {formData.images?.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group">
                          <img src={url} alt="Product" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFormData({...formData, images: formData.images?.filter((_, index) => index !== i)})} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <XCircle size={14} />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer">
                        <Upload size={20} className="mb-1" />
                        <span className="text-xs font-medium">Upload</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={5} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
                  </div>
                </div>
                
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="product-form" disabled={isSaving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                {isSaving ? 'Saving...' : <><Save size={18} /> Save Product</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
