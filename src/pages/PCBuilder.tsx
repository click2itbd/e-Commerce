import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { Layout } from '../components/Layout';
import { useCart } from '../context/CartContext';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, ShoppingCart, Monitor, Cpu, Laptop, MousePointer2, HardDrive, Keyboard, Speaker, Server, Database, Fan, Mouse, Headphones, Wifi, ShieldCheck, BatteryCharging, Plug } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BuilderCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  required?: boolean;
}

export const PCBuilder: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const coreCategories: BuilderCategory[] = [
    { id: 'cpu', name: 'CPU', icon: <Cpu size={24} />, required: true },
    { id: 'cooler', name: 'CPU Cooler', icon: <Fan size={24} /> },
    { id: 'motherboard', name: 'Motherboard', icon: <Server size={24} />, required: true },
    { id: 'ram', name: 'RAM', icon: <Database size={24} />, required: true },
    { id: 'storage', name: 'Storage', icon: <HardDrive size={24} />, required: true },
    { id: 'gpu', name: 'Graphics Card', icon: <Monitor size={24} /> },
    { id: 'psu', name: 'Power Supply', icon: <Plug size={24} />, required: true },
    { id: 'casing', name: 'Casing', icon: <Server size={24} />, required: true },
  ];

  const peripheralCategories: BuilderCategory[] = [
    { id: 'monitor', name: 'Monitor', icon: <Monitor size={24} /> },
    { id: 'casing_cooler', name: 'Casing Cooler', icon: <Fan size={24} /> },
    { id: 'keyboard', name: 'Keyboard', icon: <Keyboard size={24} /> },
    { id: 'mouse', name: 'Mouse', icon: <Mouse size={24} /> },
    { id: 'speaker', name: 'Speaker & Home Theater', icon: <Speaker size={24} /> },
    { id: 'headphone', name: 'Headphone', icon: <Headphones size={24} /> },
    { id: 'wifi', name: 'Wifi Adapter / LAN Card', icon: <Wifi size={24} /> },
    { id: 'antivirus', name: 'Anti Virus', icon: <ShieldCheck size={24} /> },
    { id: 'ups', name: 'UPS', icon: <BatteryCharging size={24} /> },
  ];

  const allCategories = [...coreCategories, ...peripheralCategories];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSelect = (categoryId: string, product: Product) => {
    setSelectedComponents(prev => ({
      ...prev,
      [categoryId]: product
    }));
    toast.success(`${product.name} selected for ${categoryId}`);
  };

  const handleAddToCart = () => {
    const selectedList = Object.values(selectedComponents).filter(Boolean) as Product[];
    if (selectedList.length === 0) {
      toast.error('Please select at least one component');
      return;
    }
    selectedList.forEach(product => addToCart(product));
    toast.success('All selected components added to cart!');
  };

  const totalPrice = (Object.values(selectedComponents).filter(Boolean) as Product[]).reduce((sum, p) => sum + p.price, 0);

  const getCompatibility = (categoryId: string, product: Product, allSelected: Record<string, Product>) => {
    if (categoryId === 'motherboard') {
      const cpu = allSelected['cpu'];
      const ram = allSelected['ram'];
      if (cpu && product.socketType && cpu.socketType && product.socketType !== cpu.socketType) {
        return { isCompatible: false, reason: `Requires ${cpu.socketType} socket (Selected CPU: ${cpu.name})` };
      }
      if (ram && product.ramType && ram.ramType && product.ramType !== ram.ramType) {
        return { isCompatible: false, reason: `Requires ${ram.ramType} RAM (Selected RAM: ${ram.name})` };
      }
    } else if (categoryId === 'cpu') {
      const mb = allSelected['motherboard'];
      if (mb && product.socketType && mb.socketType && product.socketType !== mb.socketType) {
        return { isCompatible: false, reason: `Requires ${mb.socketType} socket (Selected MB: ${mb.name})` };
      }
    } else if (categoryId === 'ram') {
      const mb = allSelected['motherboard'];
      if (mb && product.ramType && mb.ramType && product.ramType !== mb.ramType) {
        return { isCompatible: false, reason: `Requires ${mb.ramType} slot (Selected MB: ${mb.name})` };
      }
    }
    return { isCompatible: true, reason: '' };
  };

  const renderCategoryGroup = (title: string, groupCategories: BuilderCategory[]) => (
    <div className="space-y-4 mb-8">
      <div className="bg-[#8C98A4] text-white px-4 py-1.5 font-bold text-sm tracking-wide rounded-t">
        {title}
      </div>
      {groupCategories.map((cat) => {
        const selected = selectedComponents[cat.id];
        const compatibility = selected ? getCompatibility(cat.id, selected, selectedComponents) : { isCompatible: true, reason: '' };

        return (
          <div key={cat.id} className={cn(
            "bg-white rounded-lg shadow-sm border overflow-hidden transition-all",
            !compatibility.isCompatible ? "border-red-500 ring-1 ring-red-500" : "border-gray-200"
          )}>
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 flex items-center justify-center transition-colors",
                  !compatibility.isCompatible ? "bg-red-50 text-red-500 rounded-full" : "text-[#4A5568]"
                )}>
                  {cat.icon}
                </div>
                <div className="w-48">
                  <h3 className="font-bold text-[#4A5568]">{cat.name}</h3>
                  <div className="flex gap-2 items-center mt-1">
                    {cat.required && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase font-bold">Required</span>}
                    {!compatibility.isCompatible && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase font-bold">Incompatible</span>
                    )}
                  </div>
                </div>
              </div>

              {selected ? (
                <div className="flex-grow flex items-center gap-4 px-4 bg-[#F8F9FA] py-2 rounded border border-gray-100">
                  <div className="h-10 w-10 bg-white rounded p-1 shrink-0">
                    <img src={selected.images?.[0] || undefined} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{selected.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-[#081621] font-bold">{formatCurrency(selected.price)}</p>
                      {!compatibility.isCompatible && (
                        <p className="text-[10px] text-red-500 font-bold italic line-clamp-1">
                          {compatibility.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex flex-col justify-center px-4">
                   <div className="h-2.5 bg-gray-100 rounded-full w-full max-w-sm"></div>
                </div>
              )}

              <div className="flex items-center gap-4 shrink-0">
                {selected && (
                  <button
                    onClick={() => setSelectedComponents(prev => {
                      const next = { ...prev };
                      delete next[cat.id];
                      return next;
                    })}
                    className="text-gray-400 hover:text-[#EF4444] transition-colors p-1"
                    title="Remove component"
                  >
                    <Plus className="rotate-45" size={20} />
                  </button>
                )}
                <button
                  onClick={() => {
                    const modal = document.getElementById(`modal-${cat.id}`);
                    if (modal) modal.classList.remove('hidden');
                  }}
                  className="border border-[#061626] text-[#061626] px-8 py-2 rounded text-sm font-bold hover:bg-[#061626] hover:text-white transition-all w-[120px]"
                >
                  Choose
                </button>
              </div>
            </div>

            {/* Selection Modal (Simplified for this demo) */}
            <div id={`modal-${cat.id}`} className="hidden fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#081621] text-white">
                  <h2 className="text-xl font-bold">Select {cat.name}</h2>
                  <button onClick={() => document.getElementById(`modal-${cat.id}`)?.classList.add('hidden')} className="text-gray-400 hover:text-white transition-colors">
                    Close
                  </button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products
                    .filter(p => p.category.toLowerCase().includes(cat.id.toLowerCase()) || p.name.toLowerCase().includes(cat.id.toLowerCase()))
                    .map(product => {
                      const { isCompatible, reason } = getCompatibility(cat.id, product, selectedComponents);

                      return (
                        <div key={product.id} className={cn(
                          "border rounded-lg p-4 flex gap-4 transition-all group relative",
                          isCompatible ? "border-gray-100 hover:border-[#EF4444]" : "border-red-100 bg-red-50/30 opacity-75"
                        )}>
                          <div className="h-16 w-16 bg-gray-50 rounded p-1 shrink-0">
                            <img src={product.images?.[0] || undefined} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className="text-sm font-bold line-clamp-2">{product.name}</h4>
                              {!isCompatible && (
                                <span className="shrink-0 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  Incompatible
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[#EF4444] font-bold text-sm">{formatCurrency(product.price)}</p>
                              {product.socketType && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">{product.socketType}</span>}
                              {product.ramType && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold">{product.ramType}</span>}
                            </div>
                            
                            {!isCompatible && (
                              <p className="text-[10px] text-red-500 font-bold mb-2 italic">
                                {reason}
                              </p>
                            )}

                            <button
                              disabled={!isCompatible}
                              onClick={() => {
                                handleSelect(cat.id, product);
                                document.getElementById(`modal-${cat.id}`)?.classList.add('hidden');
                              }}
                              className={cn(
                                "mt-2 w-full text-xs font-bold py-1.5 rounded transition-all",
                                isCompatible 
                                  ? "bg-[#081621] text-white hover:bg-[#EF4444]" 
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              )}
                            >
                              {isCompatible ? 'Select Component' : 'Incompatible'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {products.filter(p => p.category.toLowerCase().includes(cat.id.toLowerCase()) || p.name.toLowerCase().includes(cat.id.toLowerCase())).length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <p>No products found for this category.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#081621]">PC Builder</h1>
            <p className="text-sm text-gray-500">Select components to build your custom PC</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase font-bold">Total Price</p>
              <p className="text-2xl font-bold text-[#EF4444]">{formatCurrency(totalPrice)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-[#081621] text-white px-8 py-3 rounded-md font-bold hover:bg-[#EF4444] transition-all flex items-center gap-2"
            >
              <ShoppingCart size={20} />
              Add to Cart
            </button>
          </div>
        </div>

        <div>
          {renderCategoryGroup("Core Components", coreCategories)}
          {renderCategoryGroup("Peripherals & Others", peripheralCategories)}
        </div>
      </div>
    </Layout>
  );
};
