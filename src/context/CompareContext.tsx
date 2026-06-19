import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { toast } from 'react-hot-toast';

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  const addToCompare = (product: Product) => {
    if (compareItems.length >= 4) {
      toast.error('You can compare up to 4 products at a time');
      return;
    }
    
    if (compareItems.find(item => item.id === product.id)) {
      removeFromCompare(product.id);
      return;
    }

    // Optional: Check if products are in the same category
    if (compareItems.length > 0 && compareItems[0].category !== product.category) {
      toast.error('It is better to compare products from the same category');
    }

    setCompareItems(prev => [...prev, product]);
    toast.success(`Added ${product.name} to compare`);
  };

  const removeFromCompare = (productId: string) => {
    setCompareItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (productId: string) => {
    return compareItems.some(item => item.id === productId);
  };

  return (
    <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
