import React, { useState } from 'react';
import { db, storage } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { useSettings } from '../../../../context/SettingsContext';
import { BulkEditForm } from '../../../../components/BulkEditForm';
import { Package, Plus, Upload, Download, Search, Edit, Trash2, X, AlertTriangle, Play, Loader2, Image as ImageIcon, FileText, XCircle, Edit2, ArrowRight } from 'lucide-react';
import { Pagination } from '../../../../components/common/Pagination';

interface InventoryTabProps { products: any[]; vendors: any[]; menus: any[]; isAddingProduct: boolean; setIsAddingProduct: (v: boolean) => void; editingProduct: any; setEditingProduct: (v: any) => void; formData: any; setFormData: (v: any) => void; inventoryCategoryFilter: string; setInventoryCategoryFilter: (v: string) => void; selectedProductIds: string[]; setSelectedProductIds: (v: string[]) => void; isBulkEditing: boolean; setIsBulkEditing: (v: boolean) => void; bulkEditData: any; setBulkEditData: (v: any) => void; isUploading: boolean; dragOver: boolean; setDragOver: (v: boolean) => void; loading: boolean; handleSaveProduct: (e: any) => void; handleDeleteProduct: (id: string) => void; handleImportProductsCSV: (e: any) => void; handleDownloadCSVTemplate: () => void; handleExportAllProducts: () => void; handleBulkExportProducts: () => void; handleBulkDeleteProducts: () => void; handleBulkUpdate: (e: any) => void; handleImageUpload: (f: any) => void; removeImage: (i: number) => void; addVariant: () => void; updateVariant: (i: number, f: string, v: any) => void; removeVariant: (i: number) => void; addSpec: () => void; updateSpec: (i: number, f: string, v: any) => void; removeSpec: (i: number) => void; setActiveTab: (v: string) => void; fetchData: () => Promise<void>; fileInputRef?: any; setIsAddingMenu?: (v: boolean) => void; }

import { useRef } from 'react';

const InventoryTab: React.FC<InventoryTabProps> = ({ products, vendors, menus, isAddingProduct, setIsAddingProduct, editingProduct, setEditingProduct, formData, setFormData, inventoryCategoryFilter, setInventoryCategoryFilter, selectedProductIds, setSelectedProductIds, isBulkEditing, setIsBulkEditing, bulkEditData, setBulkEditData, isUploading, dragOver, setDragOver, loading, handleSaveProduct, handleDeleteProduct, handleImportProductsCSV, handleDownloadCSVTemplate, handleExportAllProducts, handleBulkExportProducts, handleBulkDeleteProducts, handleBulkUpdate, handleImageUpload, removeImage, addVariant, updateVariant, removeVariant, addSpec, updateSpec, removeSpec, setActiveTab, fetchData, setIsAddingMenu }) => {
  const { isAdmin, hasPermission } = useAuth();
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="text-[#EF4444]" /> Product Inventory
              </h2>
              <div className="flex items-center gap-2">
                {hasPermission('manage_inventory') && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportProductsCSV}
                      accept=".csv"
                      className="hidden"
                    />
                    <button
                      onClick={handleDownloadCSVTemplate}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                      title="Download CSV Template"
                    >
                      <FileText size={18} /> Template
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                      title="Import Products from CSV"
                    >
                      <Upload size={18} /> Import
                    </button>
                  </>
                )}
                <button
                  onClick={handleExportAllProducts}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-all font-bold text-sm"
                  title="Export All Products to CSV"
                >
                  <Download size={18} /> Export All
                </button>
                {hasPermission('manage_inventory') && (
                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="bg-[#081621] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#EF4444] transition-all font-bold text-sm"
                  >
                    <Plus size={18} /> Add Product
                  </button>
                )}
              </div>
            </div>

            
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-4">
              <div className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search products by name, SKU, model..."
                  value={inventorySearchQuery}
                  onChange={(e) => { setInventorySearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#EF4444]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
              <div className="flex flex-wrap gap-2 items-center">

              <span className="text-xs font-bold text-gray-400 uppercase mr-2">Filter by Category:</span>
              <button
                onClick={() => setInventoryCategoryFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                  inventoryCategoryFilter === 'all' 
                    ? "bg-[#EF4444] text-white border-[#EF4444]" 
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                All
              </button>
              {Array.from(new Set(products.map(p => p.category))).sort().map(category => (
                <button
                  key={category}
                  onClick={() => setInventoryCategoryFilter(category)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                    inventoryCategoryFilter === category 
                      ? "bg-[#EF4444] text-white border-[#EF4444]" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            </div>
            {isAddingProduct || editingProduct ? (
              <form onSubmit={handleSaveProduct} className="p-6 bg-slate-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-xl font-black text-slate-800">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                  </h3>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                      className="px-6 py-2 bg-white text-slate-600 border border-slate-200 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      {editingProduct ? 'Update Product' : 'Save Product'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Basic Info & Pricing */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Basic Information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Product Name</label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. iPhone 15 Pro Max"
                          />
                        </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Model Number</label>
                            <input
                              type="text"
                              value={formData.model || ''}
                              onChange={e => setFormData({ ...formData, model: e.target.value })}
                              className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g. A2849"
                            />
                          </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase">Category</label>
                            {setIsAddingMenu && (
                              <button
                                type="button"
                                onClick={() => { setActiveTab('menus'); setIsAddingMenu(true); }}
                                className="text-blue-600 text-[10px] font-bold hover:underline flex items-center gap-1"
                              >
                                <Plus size={10} /> Add New
                              </button>
                            )}
                          </div>
                          <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Category</option>
                            {menus.map(menu => (
                              <optgroup key={menu.id} label={menu.name}>
                                <option value={menu.name}>{menu.name} (Main)</option>
                                {menu.subCategories?.map((sub: any) => (
                                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                                ))}
                              </optgroup>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Description</label>
                          <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full font-medium text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Detailed product description..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pricing, Stock & Settings */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Pricing, Stock & Setup</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Purchase Price (BDT)</label>
                          <input
                            type="number"
                            value={formData.costPrice || 0}
                            onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                            className="w-full font-black text-sm text-slate-700 border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Sales Price (BDT)</label>
                          <input
                            type="number"
                            required
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                            className="w-full font-black text-sm text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Base Stock</label>
                          <input
                            type="number"
                            required
                            value={formData.stock}
                            onChange={e => {
                              const newStock = Math.max(0, parseInt(e.target.value) || 0);
                              if (formData.hasSerialTracking && !editingProduct) {
                                const currentSerials = formData.availableSerials || [];
                                let newSerials = [...currentSerials];
                                if (newStock > currentSerials.length) {
                                  const diff = newStock - currentSerials.length;
                                  const prefix = Date.now().toString(36).toUpperCase().slice(-4);
                                  for(let i=0; i<diff; i++) {
                                    const seq = String(currentSerials.length + i + 1).padStart(3, '0');
                                    newSerials.push(`SN-${prefix}-${seq}`);
                                  }
                                } else if (newStock < currentSerials.length) {
                                  newSerials = newSerials.slice(0, newStock);
                                }
                                setFormData({ ...formData, stock: newStock, availableSerials: newSerials });
                              } else {
                                setFormData({ ...formData, stock: newStock });
                              }
                            }}
                            className={`w-full font-black text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-800`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.hasSerialTracking}
                              onChange={e => {
                                const checked = e.target.checked;
                                if (checked && !editingProduct && formData.stock > 0) {
                                  // Auto-generate based on existing stock
                                  const currentSerials = formData.availableSerials || [];
                                  let newSerials = [...currentSerials];
                                  if (formData.stock > currentSerials.length) {
                                    const diff = formData.stock - currentSerials.length;
                                    const prefix = Date.now().toString(36).toUpperCase().slice(-4);
                                    for(let i=0; i<diff; i++) {
                                      const seq = String(currentSerials.length + i + 1).padStart(3, '0');
                                      newSerials.push(`SN-${prefix}-${seq}`);
                                    }
                                  }
                                  setFormData({ ...formData, hasSerialTracking: checked, availableSerials: newSerials });
                                } else {
                                  setFormData({ ...formData, hasSerialTracking: checked });
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <div>
                              <span className="block text-sm font-bold text-slate-800">Serial Tracking</span>
                              <span className="block text-[10px] text-slate-500">Require scanning individual SNs</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.isAccessory}
                              onChange={e => setFormData({ ...formData, isAccessory: e.target.checked })}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <div>
                              <span className="block text-sm font-bold text-slate-800">Is Accessory</span>
                              <span className="block text-[10px] text-slate-500">Mark as a peripheral/accessory</span>
                            </div>
                          </label>
                        </div>

                        <div className="flex flex-col gap-3">
                           <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={(formData.warrantyMonths || 0) > 0} 
                                onChange={(e) => setFormData({...formData, warrantyMonths: e.target.checked ? (formData.warrantyMonths || 12) : 0})}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <span className="block text-sm font-bold text-slate-800">Warranty Included</span>
                          </label>
                          
                          {(formData.warrantyMonths || 0) > 0 && (
                            <div className="flex items-center gap-2 px-1">
                              <input
                                  type="number"
                                  min="1"
                                  value={formData.warrantyMonths || 0}
                                  onChange={e => setFormData({ ...formData, warrantyMonths: Math.max(1, Number(e.target.value)) })}
                                  className="w-20 font-black text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center"
                                />
                                <span className="text-xs font-bold text-slate-500 uppercase">Months</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {formData.hasSerialTracking && !editingProduct && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Opening Stock Serials (Barcode scan / 1 per line)</label>
                          <textarea
                            value={formData.availableSerials?.join('\n') || ''}
                            onChange={e => {
                              const lines = e.target.value.split('\n').map(s => s.trim()).filter(s => s);
                              setFormData({ 
                                ...formData, 
                                availableSerials: lines,
                                stock: lines.length 
                              });
                            }}
                            className="w-full border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-32 font-mono text-xs bg-slate-50"
                            placeholder="SN-001&#10;SN-002&#10;SN-003"
                          />
                          <p className="text-[11px] font-bold text-amber-600 mt-1">Found {formData.availableSerials?.length || 0} serials. Stock qty is locked to this count.</p>
                        </div>
                      )}
                    </div>

                    {/* Specifications */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Specifications</h4>
                        <button
                          type="button"
                          onClick={addSpec}
                          className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-all flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Spec
                        </button>
                      </div>
                      
                      {Object.keys(formData.specs || {}).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(formData.specs || {}).map(([key, value], index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Property (e.g. RAM)"
                                value={key}
                                onChange={e => {
                                  const newSpecs = { ...formData.specs };
                                  delete newSpecs[key];
                                  newSpecs[e.target.value] = value;
                                  setFormData({ ...formData, specs: newSpecs });
                                }}
                                className="w-1/3 text-sm font-bold border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                              />
                              <input
                                type="text"
                                placeholder="Value (e.g. 16GB)"
                                value={value as string}
                                onChange={e => updateSpec(key, e.target.value)}
                                className="flex-1 text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeSpec(key)}
                                className="text-red-400 hover:text-red-600 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                          <p className="text-xs text-slate-400 font-bold">No technical specifications added.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Media & Variants */}
                  <div className="space-y-6">
                    
                    {/* Media */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Product Media</h4>
                      
                      <div className="space-y-4">
                        <div
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'}`}
                          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={e => {
                            e.preventDefault();
                            setDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleImageUpload(e.dataTransfer.files);
                            }
                          }}
                        >
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            id="product-images"
                            onChange={e => handleImageUpload(e.target.files)}
                          />
                          <label htmlFor="product-images" className="cursor-pointer flex flex-col items-center">
                            {isUploading ? (
                              <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                            ) : (
                              <ImageIcon className="text-slate-400 mb-2" size={32} />
                            )}
                            <span className="text-sm font-bold text-blue-600">Click to upload</span>
                            <span className="text-xs text-slate-500 font-medium mt-1">or drag and drop</span>
                          </label>
                        </div>

                        {formData.images?.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {formData.images.map((url: string, index: number) => (
                              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                                <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                  className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                  <XCircle size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Variants */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Variants</h4>
                        <button
                          type="button"
                          onClick={addVariant}
                          className="text-[11px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 transition-all flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Variant
                        </button>
                      </div>
                      
                      {(formData.variants || []).length > 0 ? (
                        <div className="space-y-4">
                          {(formData.variants || []).map((variant: any) => (
                            <div key={variant.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative group">
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                              
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Variant Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Red, XL"
                                  value={variant.name}
                                  onChange={e => updateVariant(variant.id, 'name', e.target.value)}
                                  className="w-full text-sm font-bold border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SKU</label>
                                  <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={e => updateVariant(variant.id, 'sku', e.target.value)}
                                    className="w-full text-xs font-mono border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Purchase Price</label>
                                  <input
                                    type="number"
                                    value={variant.costPrice || 0}
                                    onChange={e => updateVariant(variant.id, 'costPrice', Number(e.target.value))}
                                    className="w-full text-xs font-bold text-slate-700 border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sales Price</label>
                                  <input
                                    type="number"
                                    value={variant.price}
                                    onChange={e => updateVariant(variant.id, 'price', Number(e.target.value))}
                                    className="w-full text-xs font-bold text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stock</label>
                                  <input
                                    type="number"
                                    value={variant.stock}
                                    onChange={e => updateVariant(variant.id, 'stock', Number(e.target.value))}
                                    className="w-full text-xs font-bold border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                          <p className="text-xs text-slate-400 font-bold mb-2">No variants defined.</p>
                          <span className="text-[10px] text-slate-400 max-w-[200px] inline-block">Use variants for products that have different colors, sizes, or capacities.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            ) : null}

            {isBulkEditing && selectedProductIds.length > 0 && (
              <BulkEditForm
                selectedCount={selectedProductIds.length}
                bulkEditData={bulkEditData}
                setBulkEditData={setBulkEditData}
                handleBulkUpdate={handleBulkUpdate}
                setIsBulkEditing={setIsBulkEditing}
                menus={menus}
                vendors={vendors}
                loading={loading}
              />
            )}
            {selectedProductIds.length > 0 && (
              <div className="bg-[#081621] text-white p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">{selectedProductIds.length} items selected</span>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <button
                    onClick={handleBulkExportProducts}
                    className="flex items-center gap-2 text-sm hover:text-[#EF4444] transition-colors font-bold"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button
                    onClick={handleBulkDeleteProducts}
                    className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors font-bold"
                  >
                    <Trash2 size={16} /> Delete Selected
                  </button>
                  <button
                    onClick={() => setIsBulkEditing(!isBulkEditing)}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-colors font-bold",
                      isBulkEditing ? "text-[#EF4444]" : "hover:text-[#EF4444]"
                    )}
                  >
                    <Edit2 size={16} /> Bulk Edit
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelectedProductIds([]);
                    setIsBulkEditing(false);
                  }}
                  className="text-xs uppercase tracking-wider font-bold hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === products.length && products.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(products.map(p => p.id));
                          } else {
                            setSelectedProductIds([]);
                            setIsBulkEditing(false);
                          }
                        }}
                        className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                      />
                    </th>
                    <th className="px-6 py-4 w-10">#</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    const filtered = [...products]
                      .filter(p => inventoryCategoryFilter === 'all' || p.category === inventoryCategoryFilter)
                      .filter(p => {
                        if (!inventorySearchQuery.trim()) return true;
                        const q = inventorySearchQuery.toLowerCase();
                        return (p.name || '').toLowerCase().includes(q) ||
                               (p.sku || p.id || '').toLowerCase().includes(q) ||
                               (p.model || '').toLowerCase().includes(q);
                      })
                      .sort((a, b) => a.name.localeCompare(b.name));
                    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product, index) => (
                    <tr key={product.id} className={cn(
                      "hover:bg-gray-50 transition-colors",
                      selectedProductIds.includes(product.id) && "bg-red-50/50"
                    )}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds([...selectedProductIds, product.id]);
                            } else {
                              setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                            }
                          }}
                          className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                        />
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            <img src={product.images?.[0] || undefined} alt="" className="object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-[#081621]">{product.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase">ID: {product.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {vendors.find(v => v.id === product.vendorId)?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#EF4444]">{formatCurrency(product.price, settings)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit",
                            product.stock >= 10 ? "bg-green-100 text-green-700" : 
                            product.stock > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          )}>
                            {product.stock} {product.stock > 0 ? 'in stock' : 'stock out'}
                          </span>
                          {product.stock < 10 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
                              <AlertTriangle size={12} /> LOW STOCK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {settings.externalStoreEnabled && (
                            <button
                              onClick={async () => {
                                try {
                                  toast.loading(`Pushing ${product.name} to ${settings.externalStoreType}...`, { id: 'sync' });
                                  
                                  // Simulation of external API call
                                  if (settings.externalStoreType === 'webhook' && settings.externalStoreUrl) {
                                     // In a real app, this would be a fetch() call
                                     console.log('Pushing to Webhook:', {
                                       url: settings.externalStoreUrl,
                                       product: {
                                         id: product.id,
                                         name: product.name,
                                         price: product.price,
                                         stock: product.stock
                                       }
                                     });
                                  }
                                  
                                  await new Promise(resolve => setTimeout(resolve, 1500));
                                  toast.success(`Product synced successfully to ${settings.externalStoreType || 'external store'}`, { id: 'sync' });
                                } catch (error) {
                                  toast.error('Failed to sync product', { id: 'sync' });
                                }
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-all"
                              title="Push to External Store"
                            >
                              <ArrowRight size={18} />
                            </button>
                          )}
                          {hasPermission('manage_inventory') && (
                            <button
                              onClick={() => { setEditingProduct(product); setFormData({ ...product, variants: product.variants || [], specs: product.specs || {} }); setIsAddingProduct(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={products.filter(p => inventoryCategoryFilter === 'all' || p.category === inventoryCategoryFilter).filter(p => !inventorySearchQuery.trim() || (p.name || "").toLowerCase().includes(inventorySearchQuery.toLowerCase()) || (p.sku || p.id || "").toLowerCase().includes(inventorySearchQuery.toLowerCase()) || (p.model || "").toLowerCase().includes(inventorySearchQuery.toLowerCase())).length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
  );
};

export default InventoryTab;
