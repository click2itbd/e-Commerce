import React from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { CompareBar } from './CompareBar';
import { useCart } from '../context/CartContext';
import { getSiteContext } from '../hooks/useSiteContext';

// Navbars � lazy imported to keep bundle clean
import { HostingNavbar } from './navbars/HostingNavbar';
import { EcommerceNavbar } from './navbars/EcommerceNavbar';
import { PCBuildNavbar } from './navbars/PCBuildNavbar';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

function NavbarSelector() {
  const { pathname } = useLocation();
  const { items } = useCart();
  const siteContext = getSiteContext();

  // ���� Explicitly PC-Build routes ������������������������������������������������������������������������������������
  if (
    pathname.startsWith('/pc-build') ||
    pathname.startsWith('/community-builds')
  ) {
    return <PCBuildNavbar />;
  }

  // ���� Explicitly E-Commerce routes ��������������������������������������������������������������������������������
  if (
    pathname.startsWith('/shop') ||
    pathname.startsWith('/category') ||
    pathname.startsWith('/product') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/pre-book')
  ) {
    return <EcommerceNavbar />;
  }

  // ���� Hosting-own cart & checkout ����������������������������������������������������������������������������������
  if (
    pathname.startsWith('/hosting/cart') ||
    pathname.startsWith('/hosting/checkout')
  ) {
    return <HostingNavbar />;
  }

  // ���� Shared routes: use whichever site the user came from ����������������������������������
  // (cart, checkout, order-success, profile, payment, login)
  if (
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname === '/compare' ||
    pathname.startsWith('/order-success') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/login')
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

  // ���� Hosting routes (default) ������������������������������������������������������������������������������������������
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
