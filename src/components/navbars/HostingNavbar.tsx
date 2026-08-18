import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cloud, Menu, X, User, LayoutDashboard, Server, LogOut, Phone, Mail, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

export const HostingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, isAdmin } = useAuth();
  const { items } = useCart();
  const cartCount = items.filter(i => i.category === 'Hosting & Domains').length;
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Domain', path: '/domain' },
    { name: 'Support', path: '/support' },
  ];

  const isActive = (path: string) => {
    if (path.includes('#')) {
       return location.hash === path.split('#')[1];
    }
    return location.pathname === path;
  };

  return (
    <header className={`sticky top-0 left-0 right-0 z-50 w-full transition-all duration-300`}>
      {/* Top Bar */}
      <div className="bg-[#060d1f] text-gray-300 text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Phone size={12} />
              <span>{settings?.contactPhone || '+1 (555) 123-4567'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mail size={12} />
              <span>{settings?.contactEmail || 'support@click2it.com'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center space-x-1 hover:text-white transition-colors">
                  <User size={12} />
                  <span>My Account</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-1 hover:text-white transition-colors">
                    <LayoutDashboard size={12} />
                    <span>Admin</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center space-x-1 hover:text-white transition-colors">
                  <LogOut size={12} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center space-x-1 hover:text-white transition-colors">
                <User size={12} />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className={`transition-all duration-300 ${isScrolled ? 'bg-[#0a1628]/95 backdrop-blur-md shadow-lg py-3' : 'bg-[#0a1628] py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Click2IT Logo" className="h-8 md:h-10 object-contain" />
              ) : (
                <>
                  <div className="bg-gradient-to-tr from-blue-600 to-cyan-400 p-1.5 rounded-lg text-white">
                    <Cloud size={24} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-white font-bold text-xl md:text-2xl tracking-tight">
                    Click2<span className="text-blue-500">IT</span>
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path) 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {!user && (
                 <Link
                  to="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/login') 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Login
                </Link>
              )}
            </nav>

              {/* Cart Icon Desktop */}
              <Link to="/hosting/cart" className="relative p-2 text-gray-300 hover:text-white transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/#pricing"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none p-2"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Slide-down */}
      <div 
        className={`md:hidden absolute w-full bg-[#0a1628] border-t border-gray-800 transition-all duration-300 ease-in-out origin-top ${
          isMobileMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 overflow-hidden'
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-1 shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
            >
              {link.name}
            </Link>
          ))}
          
          <div className="border-t border-gray-800 my-4 pt-4">

              <Link
                to="/hosting/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
              >
                <div className="relative">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span>Cart</span>
              </Link>
            {user ? (
               <>
                 <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
                >
                  <User size={18} />
                  <span>My Account</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    <LayoutDashboard size={18} />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-white/5"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
               </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
              >
                <User size={18} />
                <span>Login</span>
              </Link>
            )}
          </div>
          
          <div className="mt-4 px-3">
            <Link
              to="/#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-3 rounded-lg font-semibold shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
