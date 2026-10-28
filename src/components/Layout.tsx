import React from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { CompareBar } from './CompareBar';

// Navbars
import { EcommerceNavbar } from './navbars/EcommerceNavbar';
import { PCBuildNavbar } from './navbars/PCBuildNavbar';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

function NavbarSelector() {
  const { pathname } = useLocation();

  // --- Explicitly PC-Build routes ---
  if (
    pathname.startsWith('/pc-build') ||
    pathname.startsWith('/pc-builder') ||
    pathname.startsWith('/community-builds')
  ) {
    return <PCBuildNavbar />;
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
