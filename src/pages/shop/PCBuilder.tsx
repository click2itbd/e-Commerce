import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { CommunityBuilds } from '../../components/PCBuilder/CommunityBuilds';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { Layout } from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { coreCategories, peripheralCategories, BuilderCategory } from '../../components/PCBuilder/constants';
import { getCompatibility } from '../../components/PCBuilder/utils';
import { BuilderHeader } from '../../components/PCBuilder/BuilderHeader';
import { BuilderSidebar } from '../../components/PCBuilder/BuilderSidebar';
import { BuilderCategoryRow } from '../../components/PCBuilder/BuilderCategoryRow';
import { BuilderSelectionModal } from '../../components/PCBuilder/BuilderSelectionModal';
import { BuildVisualizer } from '../../components/PCBuilder/BuildVisualizer';
import { AIAssistantModal } from '../../components/PCBuilder/AIAssistantModal';
import { SmartBuilderTemplates } from '../../components/PCBuilder/SmartBuilderTemplates';
import { apiPost } from '../../services/apiClient';
import { generatePDF } from '../../lib/pdf';
import { useSettings } from '../../context/SettingsContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const PCBuilder: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  
  const matchChoose = location.pathname.match(/\/pc-build\/choose\/(.+)/);
  const categoryId = matchChoose ? matchChoose[1] : null;
  const activeCategoryModal = categoryId ? [...coreCategories, ...peripheralCategories].find(c => c.id === categoryId) || null : null;
  const [showAIModal, setShowAIModal] = useState(false);
  const { addToCart } = useCart();
  // searchParams removed

  useEffect(() => {
    const handleOpenAI = () => setShowAIModal(true);
    document.addEventListener('open-ai-assistant', handleOpenAI);
    return () => document.removeEventListener('open-ai-assistant', handleOpenAI);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(500)));
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

  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(location.search);
    const buildParam = params.get('build');
    if (buildParam) {
      try {
        const decoded = atob(buildParam);
        const pairs = decoded.split(',');
        const newSelection: Record<string, Product> = {};
        pairs.forEach(pair => {
          const [cat, id] = pair.split(':');
          const foundProduct = products.find(p => p.id === id);
          if (foundProduct) {
            newSelection[cat] = foundProduct;
          }
        });
        setSelectedComponents(newSelection);
      } catch (e) {
        console.error('Failed to parse shared build', e);
      }
    }
  }, [location.search, products]);

  const handleSelect = (product: Product) => {
    if (!activeCategoryModal) return;
    setSelectedComponents(prev => ({
      ...prev,
      [activeCategoryModal.id]: product
    }));
    toast.success(`${product.name} selected!`, { icon: '✅' });
  };

  const handleRemove = (categoryId: string) => {
    setSelectedComponents(prev => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const handleAddToCart = () => {
    const selectedList = Object.values(selectedComponents).filter(Boolean) as Product[];
    if (selectedList.length === 0) {
      toast.error('Please select at least one component');
      return;
    }
    selectedList.forEach(product => addToCart(product));
    toast.success('Components added to cart!');
  };

  const handleSaveBuild = () => {
    if (Object.keys(selectedComponents).length === 0) {
      toast.error('Add some components to save your build');
      return;
    }
    localStorage.setItem('savedPcBuild', JSON.stringify(selectedComponents));
    toast.success('Build saved locally!');
  };

  const handlePrintBuild = () => {
    window.print();
  };

  const handleEmailBuild = async () => {
    const selectedList = Object.values(selectedComponents).filter(Boolean) as Product[];
    if (selectedList.length === 0) {
      toast.error('Add some components to email your build quote');
      return;
    }
    
    const customerName = window.prompt("Enter your name:");
    if (!customerName) return;
    
    const customerEmail = window.prompt("Enter your email address to receive the quote:");
    if (!customerEmail || !customerEmail.includes('@')) {
      toast.error('Valid email is required');
      return;
    }

    const toastId = toast.loading('Generating quote and sending email...');
    
    try {
      const totalPrice = selectedList.reduce((sum, p) => sum + p.price, 0);
      
      const mockOrder: any = {
        id: 'QUO-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        customerName,
        customerEmail,
        customerPhone: '',
        customerAddress: '',
        items: selectedList.map(p => ({
          ...p,
          quantity: 1
        })),
        total: totalPrice,
        discountAmount: 0,
        createdAt: new Date().toISOString()
      };
      
      const pdfDoc = await generatePDF(mockOrder, 'quotation', settings, 'doc');
      const pdfBase64 = pdfDoc.output('datauristring');
      
      await apiPost('/api/send-email/pc-build-summary', {
        customerName,
        customerEmail,
        totalAmount: totalPrice,
        attachments: [
          {
            filename: 'PC-Build-Quote.pdf',
            content: pdfBase64.split('base64,')[1],
            encoding: 'base64',
            contentType: 'application/pdf'
          }
        ]
      });
      
      toast.success('Quote sent to your email!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to send email. Try again.', { id: toastId });
    }
  };

  const handlePublishBuild = async () => {
    const selectedList = Object.values(selectedComponents).filter(Boolean) as Product[];
    if (selectedList.length === 0) {
      toast.error('Add some components to publish your build');
      return;
    }
    
    const buildName = window.prompt("Enter a name for your build (e.g. Budget Gaming King):");
    if (!buildName) return;

    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'community_builds'), {
        name: buildName,
        components: selectedComponents,
        totalPrice: selectedList.reduce((sum, p) => sum + p.price, 0),
        author: "Anonymous Builder", // In a real app, use auth context
        upvotes: 0,
        createdAt: serverTimestamp()
      });
      toast.success('Build published to the community!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish build');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear your current build?')) {
      setSelectedComponents({});
      toast.success('Build cleared');
    }
  };

  const renderCategoryGroup = (title: string, groupCategories: BuilderCategory[]) => (
    <motion.div variants={itemVariants} className="mb-10">
      <h2 className="text-xl font-black text-[#0E2A47] mb-4 px-2">{title}</h2>
      <div className="space-y-4">
        {groupCategories.map((cat) => {
          const selected = selectedComponents[cat.id];
          const compatibility = selected 
            ? getCompatibility(cat.id, selected, selectedComponents) 
            : { isCompatible: true, reason: '' };

          return (
            <BuilderCategoryRow
              key={cat.id}
              category={cat}
              selectedProduct={selected}
              compatibility={compatibility}
              onRemove={() => handleRemove(cat.id)}
              onChoose={() => navigate(`/pc-build/choose/${cat.id}`)}
            />
          );
        })}
      </div>
    </motion.div>
  );

  const builderContent = (
    <Layout fullWidth>
      <div className="bg-[#f8fafc] min-h-screen pt-8 pb-20 selection:bg-slate-900 selection:text-white print:bg-white print:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="print:hidden">
            <BuilderHeader onReset={handleReset} />
          </div>
          
          <div className="print:block hidden mb-8">
            <h1 className="text-3xl font-black text-slate-900">My PC Build</h1>
            <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <SmartBuilderTemplates 
            products={products} 
            onApplyBuild={(build) => setSelectedComponents(build)} 
          />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Builder Area */}
            <div className="flex-grow min-w-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium animate-pulse">Loading components...</p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {renderCategoryGroup("Core Components", coreCategories)}
                  {renderCategoryGroup("Peripherals & Accessories", peripheralCategories)}
                </motion.div>
              )}
            </div>

            {/* Sidebar Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-[380px] shrink-0 print:hidden"
            >
              <div className="sticky top-24 z-10 transition-all duration-300 space-y-6">
                <BuildVisualizer selectedComponents={selectedComponents} />
                <BuilderSidebar 
                  selectedComponents={selectedComponents}
                  onAddToCart={handleAddToCart}
                  onSaveBuild={handleSaveBuild}
                  onPrintBuild={handlePrintBuild}
                  onEmailBuild={handleEmailBuild}
                  onPublishBuild={handlePublishBuild}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeCategoryModal && (
          <BuilderSelectionModal
            isOpen={!!activeCategoryModal}
            onClose={() => navigate('/pc-build')}
            category={activeCategoryModal}
            products={products}
            selectedComponents={selectedComponents}
            onSelect={handleSelect}
          />
        )}
        <AIAssistantModal 
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          products={products}
          onApplyBuild={(build) => setSelectedComponents(build)}
        />
      </AnimatePresence>
    </Layout>
  );

  return (
    <Routes>
      <Route path="community-builds" element={<CommunityBuilds />} />
      <Route path="*" element={builderContent} />
    </Routes>
  );
};

