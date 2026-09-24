import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FolderTree, Plus, Edit2, Trash2, Save, X, Search, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string; // For subcategories
  order: number;
}

export const EcommerceCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({
    name: '', slug: '', description: '', imageUrl: '', parentId: '', order: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'ecommerce_categories'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(data.sort((a, b) => a.order - b.order));
      
      // If empty, set some defaults just for preview
      if (data.length === 0) {
        const defaults: Category[] = [
          { id: 'cat-1', name: 'Electronics', slug: 'electronics', order: 1 },
          { id: 'cat-2', name: 'PC Components', slug: 'pc-components', order: 2 },
          { id: 'cat-3', name: 'Processors', slug: 'processors', parentId: 'cat-2', order: 1 },
          { id: 'cat-4', name: 'Motherboards', slug: 'motherboards', parentId: 'cat-2', order: 2 }
        ];
        setCategories(defaults);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory.name) return toast.error('Category name is required');
    
    // Auto generate slug if empty
    if (!currentCategory.slug) {
      currentCategory.slug = currentCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    try {
      const id = currentCategory.id || `cat-${Date.now()}`;
      await setDoc(doc(db, 'ecommerce_categories', id), {
        ...currentCategory,
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Category saved successfully!');
      setIsEditing(false);
      setCurrentCategory({ name: '', slug: '', description: '', imageUrl: '', parentId: '', order: 0 });
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      
      // Local fallback for preview
      if (currentCategory.id) {
        setCategories(categories.map(c => c.id === currentCategory.id ? { ...currentCategory, id: currentCategory.id } as Category : c));
      } else {
        setCategories([...categories, { ...currentCategory, id: `cat-${Date.now()}` } as Category]);
      }
      toast.success('Category saved locally!');
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    // Check if it has children
    const hasChildren = categories.some(c => c.parentId === id);
    if (hasChildren) {
      return toast.error('Cannot delete a category that has sub-categories.');
    }

    try {
      await deleteDoc(doc(db, 'ecommerce_categories', id));
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error) {
      console.error('Error deleting:', error);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted locally');
    }
  };

  // Helper to build a tree structure for display
  const parentCategories = categories.filter(c => !c.parentId);
  
  const renderCategoryNode = (category: Category, depth: number = 0) => {
    const children = categories.filter(c => c.parentId === category.id).sort((a, b) => a.order - b.order);
    
    // Simple search filter (if search is active, we might flatten or only show matches, but for a tree it's tricky. 
    // We'll just highlight matches or hide non-matching trees)
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
    const hasMatchingChild = children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (searchQuery && !matchesSearch && !hasMatchingChild && depth === 0) return null;

    return (
      <div key={category.id} className="w-full">
        <div className={`flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${depth > 0 ? 'bg-slate-50/30' : ''}`}>
          <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 24}px` }}>
            {depth === 0 ? (
              <FolderTree size={18} className="text-blue-500" />
            ) : (
              <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 rounded-bl-lg mr-1 opacity-50"></div>
            )}
            
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.name} className="w-8 h-8 rounded object-cover border border-gray-200" />
            ) : (
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                <ImageIcon size={14} />
              </div>
            )}
            
            <div>
              <p className="font-medium text-gray-900">{category.name}</p>
              <p className="text-xs text-gray-400">/{category.slug}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium border border-gray-200">
              Order: {category.order}
            </span>
            <button 
              onClick={() => { setCurrentCategory(category); setIsEditing(true); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => handleDelete(category.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {children.length > 0 && (
          <div className="w-full">
            {children.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Category Management</h2>
          <p className="text-gray-500 text-sm mt-1">Organize your products into categories and sub-categories.</p>
        </div>
        
        <button 
          onClick={() => {
            setCurrentCategory({ name: '', slug: '', description: '', imageUrl: '', parentId: '', order: categories.length + 1 });
            setIsEditing(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shrink-0 shadow-sm"
        >
          <Plus size={18} /> Add Category
        </button>
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
            {parentCategories.length > 0 ? (
              parentCategories.map(cat => renderCategoryNode(cat, 0))
            ) : (
              <div className="p-8 text-center text-gray-500">No categories found. Create one to get started.</div>
            )}
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">{currentCategory.id ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input 
                  type="text" 
                  required
                  value={currentCategory.name}
                  onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Laptops"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                  <input 
                    type="text" 
                    value={currentCategory.slug}
                    onChange={e => setCurrentCategory({...currentCategory, slug: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input 
                    type="number" 
                    value={currentCategory.order}
                    onChange={e => setCurrentCategory({...currentCategory, order: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={currentCategory.parentId || ''}
                  onChange={e => setCurrentCategory({...currentCategory, parentId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">None (Top Level)</option>
                  {categories.filter(c => c.id !== currentCategory.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input 
                  type="url" 
                  value={currentCategory.imageUrl || ''}
                  onChange={e => setCurrentCategory({...currentCategory, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={currentCategory.description || ''}
                  onChange={e => setCurrentCategory({...currentCategory, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  placeholder="Category description..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <Save size={18} /> Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
