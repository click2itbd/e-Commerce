import React, { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { FolderTree, Plus, Edit2, Trash2, Save, X, Search, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  brands?: string[];
}

interface Menu {
  id: string;
  name: string;
  slug: string;
  order: number;
  imageUrl?: string;
  subCategories: SubCategory[];
  createdAt?: string;
}

export const EcommerceCategories: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState<Partial<Menu>>({
    id: '', name: '', slug: '', order: 0, imageUrl: '', subCategories: []
  });

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subForm, setSubForm] = useState<{
    menuId: string;
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    brands: string;
  }>({
    menuId: '', id: '', name: '', slug: '', imageUrl: '', brands: ''
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'menus'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Menu));
      setMenus(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error('Failed to load categories');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isSub: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const folder = isSub ? 'subcategories' : 'menus';
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    toast.promise(
      new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => reject(error),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            if (isSub) {
              setSubForm(prev => ({ ...prev, imageUrl: url }));
            } else {
              setMenuForm(prev => ({ ...prev, imageUrl: url }));
            }
            resolve(url);
          }
        );
      }),
      {
        loading: 'Uploading image...',
        success: 'Image uploaded successfully!',
        error: 'Failed to upload image',
      }
    );
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name) return toast.error('Category name is required');
    
    const slug = menuForm.slug || menuForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    try {
      if (menuForm.id) {
        await updateDoc(doc(db, 'menus', menuForm.id), {
          name: menuForm.name,
          slug,
          order: menuForm.order || 0,
          imageUrl: menuForm.imageUrl || '',
          updatedAt: new Date().toISOString()
        });
        toast.success('Category updated successfully');
      } else {
        await addDoc(collection(db, 'menus'), {
          name: menuForm.name,
          slug,
          order: menuForm.order || 0,
          imageUrl: menuForm.imageUrl || '',
          subCategories: [],
          createdAt: new Date().toISOString()
        });
        toast.success('Category created successfully');
      }
      setIsMenuModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error saving category');
    }
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.menuId || !subForm.name) return toast.error('Parent category and name are required');
    
    const menu = menus.find(m => m.id === subForm.menuId);
    if (!menu) return toast.error('Parent category not found');

    const slug = subForm.slug || subForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    let updatedSubs = [...(menu.subCategories || [])];
    const brandsArray = subForm.brands ? subForm.brands.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    if (subForm.id) {
      updatedSubs = updatedSubs.map(s => s.id === subForm.id ? {
        ...s,
        name: subForm.name,
        slug,
        imageUrl: subForm.imageUrl,
        brands: brandsArray
      } : s);
    } else {
      updatedSubs.push({
        id: Math.random().toString(36).substr(2, 9),
        name: subForm.name,
        slug,
        imageUrl: subForm.imageUrl,
        brands: brandsArray
      });
    }

    try {
      await updateDoc(doc(db, 'menus', menu.id), {
        subCategories: updatedSubs,
        updatedAt: new Date().toISOString()
      });
      toast.success(subForm.id ? 'Sub-category updated' : 'Sub-category added');
      setIsSubModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error saving sub-category');
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'menus', id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error('Error deleting category');
    }
  };

  const handleDeleteSub = async (menuId: string, subId: string) => {
    if (!window.confirm('Are you sure you want to delete this sub-category?')) return;
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;
    
    const updatedSubs = (menu.subCategories || []).filter(s => s.id !== subId);
    try {
      await updateDoc(doc(db, 'menus', menuId), {
        subCategories: updatedSubs
      });
      toast.success('Sub-category deleted');
    } catch (err) {
      toast.error('Error deleting sub-category');
    }
  };

  const filteredMenus = menus.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.subCategories?.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Category Management</h2>
          <p className="text-gray-500 text-sm mt-1">Organize your shop products using Menus and Sub-Categories.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setSubForm({ menuId: '', id: '', name: '', slug: '', imageUrl: '', brands: '' });
              setIsSubModalOpen(true);
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shrink-0 shadow-sm"
          >
            <Plus size={18} /> Add Sub Category
          </button>
          <button 
            onClick={() => {
              setMenuForm({ id: '', name: '', slug: '', order: menus.length + 1, imageUrl: '', subCategories: [] });
              setIsMenuModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shrink-0 shadow-sm"
          >
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50/80 border-b border-gray-200">
            <span className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Category Tree</span>
            <span className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</span>
          </div>
          
          <div className="divide-y divide-gray-100 flex flex-col">
            {filteredMenus.length > 0 ? (
              filteredMenus.map(menu => (
                <div key={menu.id} className="w-full">
                  <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FolderTree size={18} className="text-blue-500" />
                      {menu.imageUrl ? (
                        <img src={menu.imageUrl} alt={menu.name} className="w-8 h-8 rounded object-cover border border-gray-200 bg-white" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                          <ImageIcon size={14} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{menu.name}</p>
                        <p className="text-xs text-gray-400">/{menu.slug}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium border border-gray-200">
                        Order: {menu.order || 0}
                      </span>
                      <button 
                        onClick={() => { setMenuForm(menu); setIsMenuModalOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {menu.subCategories && menu.subCategories.length > 0 && (
                    <div className="w-full bg-slate-50/30">
                      {menu.subCategories.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 pl-10 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 rounded-bl-lg mr-1 opacity-50"></div>
                            {sub.imageUrl ? (
                              <img src={sub.imageUrl} alt={sub.name} className="w-8 h-8 rounded object-cover border border-gray-200 bg-white" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                                <ImageIcon size={14} />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{sub.name}</p>
                              <p className="text-xs text-gray-400">/{sub.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => { setSubForm({ menuId: menu.id, ...sub, brands: (sub.brands || []).join(', ') }); setIsSubModalOpen(true); }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSub(menu.id, sub.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No categories found. Create one to get started.</div>
            )}
          </div>
        </div>
      )}

      {/* Menu Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">{menuForm.id ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveMenu} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input 
                  type="text" 
                  required
                  value={menuForm.name}
                  onChange={e => setMenuForm({...menuForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Laptops"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                  <input 
                    type="text" 
                    value={menuForm.slug}
                    onChange={e => setMenuForm({...menuForm, slug: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input 
                    type="number" 
                    value={menuForm.order}
                    onChange={e => setMenuForm({...menuForm, order: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
                <div className="flex items-center gap-4">
                  {menuForm.imageUrl && (
                    <img src={menuForm.imageUrl} alt="Preview" className="w-12 h-12 rounded object-cover border border-gray-200 bg-gray-50" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <input 
                  type="url" 
                  value={menuForm.imageUrl || ''}
                  onChange={e => setMenuForm({...menuForm, imageUrl: e.target.value})}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Or paste image URL..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <Save size={18} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SubCategory Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">{subForm.id ? 'Edit Sub Category' : 'New Sub Category'}</h3>
              <button onClick={() => setIsSubModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSub} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category *</label>
                <select
                  required
                  value={subForm.menuId}
                  onChange={e => setSubForm({...subForm, menuId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a parent category...</option>
                  {menus.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category Name *</label>
                <input 
                  type="text" 
                  required
                  value={subForm.name}
                  onChange={e => setSubForm({...subForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Gaming Laptops"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <input 
                  type="text" 
                  value={subForm.slug}
                  onChange={e => setSubForm({...subForm, slug: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brands</label>
                <input 
                  type="text" 
                  value={subForm.brands}
                  onChange={e => setSubForm({...subForm, brands: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Comma separated brands (e.g. Asus, MSI)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category Image</label>
                <div className="flex items-center gap-4">
                  {subForm.imageUrl && (
                    <img src={subForm.imageUrl} alt="Preview" className="w-12 h-12 rounded object-cover border border-gray-200 bg-gray-50" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <input 
                  type="url" 
                  value={subForm.imageUrl || ''}
                  onChange={e => setSubForm({...subForm, imageUrl: e.target.value})}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Or paste image URL..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <Save size={18} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
