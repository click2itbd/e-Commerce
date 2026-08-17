import React, { useState } from 'react';
import { db, storage } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
// import BulkEditForm from '../../../../components/BulkEditForm';
import { List, Plus, Edit, Trash2, Tag, Layers, Settings, ChevronRight, Menu as MenuIcon, Cpu, Edit2 } from 'lucide-react';

interface MenusTabProps { menus: any[]; isAddingMenu: boolean; setIsAddingMenu: (v: boolean) => void; editingMenu: any; setEditingMenu: (v: any) => void; menuFormData: any; setMenuFormData: (v: any) => void; isAddingSubCategory: boolean; setIsAddingSubCategory: (v: boolean) => void; subCategoryFormData: any; setSubCategoryFormData: (v: any) => void; handleSaveMenu: (e: any) => void; handleDeleteMenu: (id: string) => void; handleSaveSubCategory: (e: any) => void; fetchData: () => Promise<void>; }

const MenusTab: React.FC<MenusTabProps> = ({ menus, isAddingMenu, setIsAddingMenu, editingMenu, setEditingMenu, menuFormData, setMenuFormData, isAddingSubCategory, setIsAddingSubCategory, subCategoryFormData, setSubCategoryFormData, handleSaveMenu, handleDeleteMenu, handleSaveSubCategory, fetchData }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MenuIcon className="text-[#EF4444]" /> Categories & Menus
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const pcBuilderCategories = [
                      { id: 'cpu', name: 'CPU', slug: 'cpu' },
                      { id: 'cooler', name: 'CPU Cooler', slug: 'cpu-cooler' },
                      { id: 'motherboard', name: 'Motherboard', slug: 'motherboard' },
                      { id: 'ram', name: 'RAM', slug: 'ram' },
                      { id: 'storage', name: 'Storage', slug: 'storage' },
                      { id: 'gpu', name: 'Graphics Card', slug: 'graphics-card' },
                      { id: 'psu', name: 'Power Supply', slug: 'power-supply' },
                      { id: 'casing', name: 'Casing', slug: 'casing' },
                      { id: 'monitor', name: 'Monitor', slug: 'monitor' },
                      { id: 'casing_cooler', name: 'Casing Cooler', slug: 'casing-cooler' },
                      { id: 'keyboard', name: 'Keyboard', slug: 'keyboard' },
                      { id: 'mouse', name: 'Mouse', slug: 'mouse' },
                      { id: 'speaker', name: 'Speaker & Home Theater', slug: 'speaker' },
                      { id: 'headphone', name: 'Headphone', slug: 'headphone' },
                      { id: 'wifi', name: 'Wifi Adapter / LAN Card', slug: 'wifi-adapter' },
                      { id: 'antivirus', name: 'Anti Virus', slug: 'anti-virus' },
                      { id: 'ups', name: 'UPS', slug: 'ups' }
                    ];

                    let componentsMenu = menus.find(m => m.name.toLowerCase() === 'components');
                    
                    try {
                      if (!componentsMenu) {
                        const docRef = await addDoc(collection(db, 'menus'), {
                          name: 'Components',
                          slug: 'components',
                          order: 1,
                          subCategories: [],
                          createdAt: new Date().toISOString()
                        });
                        componentsMenu = { id: docRef.id, name: 'Components', slug: 'components', order: 1, subCategories: [] };
                      }

                      const existingSubs = componentsMenu.subCategories || [];
                      const newSubs = [...existingSubs];
                      
                      pcBuilderCategories.forEach(cat => {
                        if (!existingSubs.some(s => s.slug === cat.slug)) {
                          newSubs.push({ id: Math.random().toString(36).substr(2, 9), name: cat.name, slug: cat.slug });
                        }
                      });

                      await updateDoc(doc(db, 'menus', componentsMenu.id), {
                        subCategories: newSubs
                      });
                      
                      toast.success('Categories seeded to Components menu');
                      fetchData();
                    } catch (error) {
                      console.error('Error seeding categories:', error);
                      toast.error('Failed to seed categories');
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-all font-bold text-sm"
                >
                  <Cpu size={18} /> Seed Builder Categories
                </button>
                <button
                  onClick={() => setIsAddingSubCategory(true)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Add Sub Category
                </button>
                <button
                  onClick={() => setIsAddingMenu(true)}
                  className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
                >
                  <Plus size={18} /> Add Parent Category
                </button>
              </div>
            </div>

            {isAddingSubCategory && (
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <form onSubmit={handleSaveSubCategory} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Category</label>
                      <select
                        required
                        value={subCategoryFormData.parentId}
                        onChange={e => setSubCategoryFormData({ ...subCategoryFormData, parentId: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      >
                        <option value="">Select Category</option>
                        {menus.map(menu => (
                          <option key={menu.id} value={menu.id}>{menu.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sub Category Name</label>
                      <input
                        type="text"
                        required
                        value={subCategoryFormData.name}
                        onChange={e => setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. Gaming Laptops"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug</label>
                      <input
                        type="text"
                        required
                        value={subCategoryFormData.slug}
                        onChange={e => setSubCategoryFormData({ ...subCategoryFormData, slug: e.target.value })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                        placeholder="e.g. gaming-laptops"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-[#EF4444] text-white px-8 py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                    >
                      Add Sub Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSubCategory(false)}
                      className="bg-gray-200 text-gray-700 px-8 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {(isAddingMenu || editingMenu) && (
              <form onSubmit={handleSaveMenu} className="p-6 bg-gray-50 border-b border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Category Name</label>
                    <input
                      type="text"
                      required
                      value={menuFormData.name}
                      onChange={e => setMenuFormData({ ...menuFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      value={menuFormData.slug}
                      onChange={e => setMenuFormData({ ...menuFormData, slug: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Order</label>
                    <input
                      type="number"
                      required
                      value={menuFormData.order}
                      onChange={e => setMenuFormData({ ...menuFormData, order: parseInt(e.target.value) })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase">Sub Categories</h3>
                    <button
                      type="button"
                      onClick={() => setMenuFormData({
                        ...menuFormData,
                        subCategories: [...menuFormData.subCategories, { id: Math.random().toString(36).substr(2, 9), name: '', slug: '' }]
                      })}
                      className="text-[#EF4444] text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> Add Sub Category
                    </button>
                  </div>
                  <div className="space-y-3">
                    {menuFormData.subCategories.map((sub, idx) => (
                      <div key={sub.id} className="flex items-center gap-4 bg-white p-3 rounded-md border border-gray-200">
                        <div className="flex-grow grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Sub Category Name"
                            value={sub.name}
                            onChange={e => {
                              const newSubs = [...menuFormData.subCategories];
                              newSubs[idx].name = e.target.value;
                              newSubs[idx].slug = e.target.value.toLowerCase().replace(/\s+/g, '-');
                              setMenuFormData({ ...menuFormData, subCategories: newSubs });
                            }}
                            className="text-sm border-gray-200 rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Slug"
                            value={sub.slug}
                            onChange={e => {
                              const newSubs = [...menuFormData.subCategories];
                              newSubs[idx].slug = e.target.value;
                              setMenuFormData({ ...menuFormData, subCategories: newSubs });
                            }}
                            className="text-sm border-gray-200 rounded-md"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSubs = menuFormData.subCategories.filter((_, i) => i !== idx);
                            setMenuFormData({ ...menuFormData, subCategories: newSubs });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-[#EF4444] text-white px-8 py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                  >
                    {editingMenu ? 'Update Menu' : 'Save Menu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingMenu(false); setEditingMenu(null); }}
                    className="bg-gray-200 text-gray-700 px-8 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="p-6 space-y-4">
              {menus.map(menu => (
                <div key={menu.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#EF4444] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-md text-gray-500 font-bold text-xs">#{menu.order}</div>
                      <div>
                        <h3 className="font-bold text-lg">{menu.name}</h3>
                        <p className="text-xs text-gray-400">/{menu.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingMenu(menu); setMenuFormData({ ...menu }); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {menu.subCategories && menu.subCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {menu.subCategories.map(sub => (
                        <span key={sub.id} className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs border border-gray-100 flex items-center gap-1">
                          {sub.name} <ChevronRight size={10} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {menus.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic">No menus created yet.</div>
              )}
            </div>
          </div>
  );
};

export default MenusTab;
