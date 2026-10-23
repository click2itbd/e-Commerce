import React from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { CompareBar } from './CompareBar';
import { useCart } from '../context/CartContext';
import { getSiteContext } from '../hooks/useSiteContext';

// Navbars
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

  // --- Explicitly PC-Build routes ---
  if (
    pathname.startsWith('/pc-build') ||
    pathname.startsWith('/community-builds')
  ) {
    return <PCBuildNavbar />;
  }

  // Check if PC build context or contains PC parts
  if (siteContext === 'pc-build') {
    return <PCBuildNavbar />;
  }

  if (items.length > 0) {
    const pcCategories = ['processor', 'cpu', 'motherboard', 'ram', 'storage', 'graphics card', 'gpu', 'power supply', 'psu', 'casing', 'cooler'];
    const hasPcPart = items.some(i => pcCategories.some(cat => i.category?.toLowerCase().includes(cat)));
    if (hasPcPart) return <PCBuildNavbar />;
  }

  // Default to E-Commerce Navbar for all other routes
  return <EcommerceNavbar />;
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
