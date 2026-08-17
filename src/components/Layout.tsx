import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { CompareBar } from './CompareBar';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F2F4F8]">
      <Header />
      <main className={`flex-grow ${fullWidth ? '' : 'container mx-auto px-4 py-8'}`}>
        {children}
      </main>
      <Footer />
      <Toaster position="bottom-right" />
      <CompareBar />
    </div>
  );
};

