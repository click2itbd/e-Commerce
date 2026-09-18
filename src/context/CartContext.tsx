import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product | any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  promoDiscount: number;
  promoMessage: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [promoSettings, setPromoSettings] = useState<{ isFreeDomainEnabled: boolean; eligibleTlds: string[] }>({
    isFreeDomainEnabled: false,
    eligibleTlds: []
  });

  useEffect(() => {
    // Listen for promo changes
    const unsub = onSnapshot(doc(db, 'settings', 'hostingPromos'), (snap) => {
      if (snap.exists()) {
        setPromoSettings(snap.data() as any);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const updateCartItem = (productId: string, updates: Partial<CartItem>) => {
    setItems(prev => prev.map(item => item.id === productId ? { ...item, ...updates } : item));
  };

  const clearCart = () => setItems([]);

  // Apply Promo Logic: Set eligible domain price to 0
  let promoMessage = null;
  const processedItems = items.map(item => ({ ...item })); // Deep copy

  if (promoSettings.isFreeDomainEnabled) {
    let isValid = true;
    const now = new Date();
    if (promoSettings.startDate && new Date(promoSettings.startDate) > now) isValid = false;
    if (promoSettings.endDate && new Date(promoSettings.endDate) < now) isValid = false;

    if (isValid) {
      const eligibleCycles = promoSettings.eligibleBillingCycles || ['yearly'];
      const hasEligibleHosting = processedItems.some(item => item.itemType === 'hosting' && eligibleCycles.includes(item.billingCycle));
      
      if (hasEligibleHosting) {
        // Find an eligible domain
        const eligibleDomain = processedItems.find(item => item.itemType === 'domain' && (promoSettings.eligibleTlds || ['.com']).includes('.' + (item.domainTld || '').replace('.', '')));
        if (eligibleDomain && eligibleDomain.price > 0) {
          promoMessage = `100% discount applied on ${eligibleDomain.name} (Promo!)`;
          eligibleDomain.originalPrice = eligibleDomain.price; // Save original for reference if needed
          eligibleDomain.price = 0; // Make it free
        }
      }
    }
  }

  // Calculate Subtotal & Total based on processed items
  const subtotal = processedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal);
  const promoDiscount = 0; // We don't need a separate promoDiscount subtraction since it's built into the item price

  return (
    <CartContext.Provider value={{ items: processedItems, addToCart, removeFromCart, updateQuantity, updateCartItem, clearCart, subtotal, total, promoDiscount, promoMessage }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
