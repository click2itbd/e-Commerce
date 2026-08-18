import React from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { CompareBar } from './CompareBar';

// Navbars — lazy imported to keep bundle clean
import { HostingNavbar } from './navbars/HostingNavbar';
import { EcommerceNavbar } from './navbars/EcommerceNavbar';
import { PCBuildNavbar } from './navbars/PCBuildNavbar';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

function NavbarSelector() {
  const { pathname } = useLocation();

  // PC Build routes
  if (pathname.startsWith('/pc-build') || pathname === '/compare') {
    return <PCBuildNavbar />;
  }

  // E-commerce routes
  if (
    pathname.startsWith('/shop') ||
    pathname.startsWith('/product') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/order-success') ||
    pathname.startsWith('/category')
  ) {
    return <EcommerceNavbar />;
  }

  // Hosting routes (default: /, /hosting/*)
  return <HostingNavbar />;
}

export const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F2F4F8]">
      <NavbarSelector />
      <main className={`flex-grow ${fullWidth ? '' : 'container mx-auto px-4 py-8'}`}>
        {children}
      </main>
      <Footer />
      <Toaster position="bottom-right" />
      <CompareBar />
    </div>
  );
};
