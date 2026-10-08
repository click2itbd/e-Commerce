import React from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { CompareBar } from './CompareBar';
import { useCart } from '../context/CartContext';
import { getSiteContext } from '../hooks/useSiteContext';

// Navbars ï¿½ lazy imported to keep bundle clean
import { HostingNavbar } from './navbars/HostingNavbar';
import { EcommerceNavbar } from './navbars/EcommerceNavbar';
import { PCBuildNavbar } from './navbars/PCBuildNavbar';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

function NavbarSelector() {
  const currentDomain = window.location.hostname;
  const isHostingDomain = currentDomain === 'click2it.bd' || currentDomain === 'www.click2it.bd' || currentDomain === '127.0.0.1';
  const { pathname } = useLocation();
  const { items } = useCart();
  const siteContext = getSiteContext();

  // ï¿½ï¿½ï¿½ï¿½ Explicitly PC-Build routes ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½
  if (
    pathname.startsWith('/pc-build') ||
    pathname.startsWith('/community-builds')
  ) {
    return <PCBuildNavbar />;
  }

  // ï¿½ï¿½ï¿½ï¿½ Explicitly E-Commerce routes ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½
  if (
    pathname.startsWith('/shop') ||
    pathname.startsWith('/category') ||
    pathname.startsWith('/product') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/pre-book') ||
    pathname.startsWith('/track-order') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/projects') ||
    (!isHostingDomain && pathname === '/')
  ) {
    return <EcommerceNavbar />;
  }

  // ï¿½ï¿½ï¿½ï¿½ Hosting-own cart & checkout ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½
  if (
    pathname.startsWith('/hosting/cart') ||
    pathname.startsWith('/hosting/checkout')
  ) {
    if (pathname.startsWith('/hosting') || pathname.startsWith('/domain') || pathname.startsWith('/web') || (isHostingDomain && pathname === '/')) {
    return <HostingNavbar />;
  }

  // Generic routes (/contact, /about, /terms, etc)
  if (siteContext === 'pc-build') return <PCBuildNavbar />;
  if (siteContext === 'ecommerce') return <EcommerceNavbar />;
  
  return <HostingNavbar />;
}

  // ï¿½ï¿½ï¿½ï¿½ Shared routes: use whichever site the user came from ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½
  // (cart, checkout, order-success, profile, payment, login)
  if (
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname === '/compare' ||
    pathname.startsWith('/order-success') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/login') ||
    pathname === '/track-order'
  ) {
    // Smart deduction based on cart items (bulletproof for cart/checkout)
    if (items.length > 0) {
      const hasHosting = items.some(i => i.category === 'Hosting & Domains' || i.itemType === 'domain');
      const pcCategories = ['processor', 'cpu', 'motherboard', 'ram', 'storage', 'graphics card', 'gpu', 'power supply', 'psu', 'casing', 'cooler'];
      const hasPcPart = items.some(i => pcCategories.some(cat => i.category?.toLowerCase().includes(cat)));
      
      if (hasHosting && !hasPcPart) return <HostingNavbar />;
      if (hasPcPart) return <PCBuildNavbar />;
      return <EcommerceNavbar />; // Default to ecommerce for other items
    }

    if (siteContext === 'pc-build') return <PCBuildNavbar />;
    if (siteContext === 'ecommerce') return <EcommerceNavbar />;
    return <HostingNavbar />;
  }

  // ï¿½ï¿½ï¿½ï¿½ Hosting routes (default) ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½
  if (pathname.startsWith('/hosting') || pathname.startsWith('/domain') || pathname.startsWith('/web') || (isHostingDomain && pathname === '/')) {
    return <HostingNavbar />;
  }

  // Generic routes (/contact, /about, /terms, etc)
  if (siteContext === 'pc-build') return <PCBuildNavbar />;
  if (siteContext === 'ecommerce') return <EcommerceNavbar />;
  
  return <HostingNavbar />;
}

export const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavbarSelector />
      <main className={`flex-grow overflow-x-hidden ${fullWidth ? '' : 'w-full max-w-[1440px] mx-auto px-2 sm:px-4 md:px-[50px] py-8'}`}>
        {children}
      </main>
      <Footer />
      <Toaster position="bottom-right" />
      <CompareBar />
    </div>
  );
};




