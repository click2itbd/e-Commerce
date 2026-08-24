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

            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-2 items-center">
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

            {isAddingProduct || editingProduct ? (
              <form onSubmit={handleSaveProduct} className="p-6 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (BDT)</label>
                      <input
                        type="number"
                        required
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock</label>
                      <input
                        type="number"
                        required
                        readOnly={formData.hasSerialTracking}
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className={`w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] ${formData.hasSerialTracking ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase">Category</label>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('menus'); setIsAddingMenu(true); }}
                        className="text-[#EF4444] text-[10px] font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus size={10} /> Add New
                      </button>
                    </div>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    >
                      <option value="">Select Category</option>
                      {menus.map(menu => (
                        <optgroup key={menu.id} label={menu.name}>
                          <option value={menu.name}>{menu.name} (Main)</option>
                          {menu.subCategories?.map(sub => (
                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Has Serial Tracking</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.hasSerialTracking}
                        onChange={e => setFormData({ ...formData, hasSerialTracking: e.target.checked })}
                        className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                      />
                      <span className="text-sm font-medium">Require scanning individual serial numbers</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Is Accessory</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.isAccessory}
                        onChange={e => setFormData({ ...formData, isAccessory: e.target.checked })}
                        className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                      />
                      <span className="text-sm font-medium">Mark this product as an accessory</span>
                    </div>
                  </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-1">
                        <input 
                            type="checkbox" 
                            checked={(formData.warrantyMonths || 0) > 0} 
                            onChange={(e) => setFormData({...formData, warrantyMonths: e.target.checked ? (formData.warrantyMonths || 12) : 0})}
                            className="rounded border-gray-300 text-[#EF4444] focus:ring-[#EF4444]"
                        />
                        Warranty Included
                      </label>
                      
                      {(formData.warrantyMonths || 0) > 0 && (
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={Math.max(1, Math.round((formData.warrantyMonths || 0) / 12))}
                            onChange={e => setFormData({ ...formData, warrantyMonths: Math.max(1, Number(e.target.value)) * 12 })}
                            className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                          />
                          <span className="text-xs text-gray-500 uppercase font-bold">Years</span>
                        </div>
                      )}
                    </div>
                  {formData.hasSerialTracking && !editingProduct && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opening Stock Serials (Barcode scan / 1 per line)</label>
                      <textarea
                        value={formData.availableSerials?.join('\n') || ''}
                        onChange={e => {
                          const lines = e.target.value.split('\n').map(s => s.trim()).filter(s => s);
                          setFormData({ 
                            ...formData, 
                            availableSerials: lines,
                            stock: lines.length // Auto-update stock based on serial count
                          });
                        }}
                        className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444] h-32 font-mono text-sm"
                        placeholder="SN-001&#10;SN-002&#10;SN-003"
                      />
                      <p className="text-xs text-gray-500 mt-1">Found {formData.availableSerials?.length || 0} serials. Quantity will be set automatically.</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Specifications</label>
                    <div className="space-y-2">
                      {Object.entries(formData.specs || {}).map(([key, value], index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Key"
                            value={key}
                            onChange={e => {
                              const newSpecs = { ...formData.specs };
                              delete newSpecs[key];
                              newSpecs[e.target.value] = value;
                              setFormData({ ...formData, specs: newSpecs });
                            }}
                            className="flex-1 border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={value}
                            onChange={e => {
                              const newSpecs = { ...formData.specs };
                              newSpecs[key] = e.target.value;
                              setFormData({ ...formData, specs: newSpecs });
                            }}
                            className="flex-1 border-gray-200 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSpecs = { ...formData.specs };
                              delete newSpecs[key];
                              setFormData({ ...formData, specs: newSpecs });
                            }}
                            className="text-red-500 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, specs: { ...formData.specs, '': '' } })}
                        className="text-xs font-bold text-[#EF4444] hover:underline"
                      >
                        + Add Specification
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Variants</label>
                    <div className="space-y-2">
                       {formData.variants?.map((variant, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Name (e.g. Red)"
                            value={variant.name}
                            onChange={e => {
                              const newVariants = [...formData.variants || []];
                              newVariants[index].name = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="flex-1 border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            placeholder="SKU"
                            value={variant.sku}
                            onChange={e => {
                              const newVariants = [...formData.variants || []];
                              newVariants[index].sku = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-20 border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={variant.price}
                            onChange={e => {
                              const newVariants = [...formData.variants || []];
                              newVariants[index].price = Number(e.target.value);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-20 border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={variant.stock}
                            onChange={e => {
                              const newVariants = [...formData.variants || []];
                              newVariants[index].stock = Number(e.target.value);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-20 border-gray-200 rounded-md text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = [...formData.variants || []];
                              newVariants.splice(index, 1);
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="text-red-500 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, variants: [...(formData.variants || []), { id: Date.now().toString(), name: '', sku: '', price: 0, stock: 0 }] })}
                        className="text-xs font-bold text-[#EF4444] hover:underline"
                      >
                        + Add Variant
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vendor</label>
                    <select
                      value={formData.vendorId}
                      onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Images</label>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer",
                        dragOver ? "border-[#EF4444] bg-red-50" : "border-gray-200 hover:border-gray-300"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleImageUpload(e.dataTransfer.files);
                      }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = 'image/*';
                        input.onchange = (e) => handleImageUpload((e.target as HTMLInputElement).files);
                        input.click();
                      }}
                    >
                      <Upload className={cn("text-gray-400", isUploading && "animate-bounce")} />
                      <p className="text-xs text-gray-500 font-medium">
                        {isUploading ? 'Uploading...' : 'Drag & drop or click to upload'}
                      </p>
                    </div>

                    {formData.images.length > 0 && formData.images[0] !== '' && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {formData.images.map((url, index) => (
                          <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-gray-100">
                            <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XCircle size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border-gray-200 rounded-md focus:ring-[#EF4444] focus:border-[#EF4444]"
                    />
                  </div>

                  {/* Variants Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase">Product Variants</h3>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="text-xs bg-[#EF4444] text-white px-3 py-1 rounded-md font-bold hover:bg-red-700 transition-all flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Variant
                      </button>
                    </div>
                    
                    {(formData.variants || []).length > 0 ? (
                      <div className="space-y-3">
                        {(formData.variants || []).map((variant) => (
                          <div key={variant.id} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                placeholder="Variant Name (e.g. Red, XL)"
                                value={variant.name}
                                onChange={e => updateVariant(variant.id, 'name', e.target.value)}
                                className="text-sm font-bold border-none focus:ring-0 p-0 w-full"
                              />
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">SKU</label>
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={e => updateVariant(variant.id, 'sku', e.target.value)}
                                  className="w-full text-xs border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Price</label>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={e => updateVariant(variant.id, 'price', Number(e.target.value))}
                                  className="w-full text-xs border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Stock</label>
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={e => updateVariant(variant.id, 'stock', Number(e.target.value))}
                                  className="w-full text-xs border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No variants defined for this product.</p>
                    )}
                  </div>

                  {/* Specs Section */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase">Technical Specifications</h3>
                      <button
                        type="button"
                        onClick={addSpec}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-bold hover:bg-gray-200 transition-all flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Spec
                      </button>
                    </div>
                    
                    {Object.keys(formData.specs || {}).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(formData.specs || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <div className="w-1/3 text-xs font-bold text-gray-500 uppercase truncate">{key}:</div>
                            <input
                              type="text"
                              value={value}
                              onChange={e => updateSpec(key, e.target.value)}
                              className="w-full text-xs border-gray-200 rounded focus:ring-[#EF4444] focus:border-[#EF4444]"
                            />
                            <button
                              type="button"
                              onClick={() => removeSpec(key)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No technical specifications added.</p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[#EF4444] text-white py-2 rounded-md font-bold hover:bg-red-600 transition-all"
                    >
                      {editingProduct ? 'Update Product' : 'Save Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
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
              totalItems={products.filter(p => inventoryCategoryFilter === 'all' || p.category === inventoryCategoryFilter).length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
  );
};

export default InventoryTab;
