import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, ShoppingCart, User, Menu, X, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useSettings } from '../../context/SettingsContext';

const CATEGORIES = [
  { name: 'CPU', slug: 'cpu' },
  { name: 'CPU Cooler', slug: 'cpu-cooler' },
  { name: 'Motherboard', slug: 'motherboard' },
  { name: 'RAM', slug: 'ram' },
  { name: 'Storage', slug: 'storage' },
  { name: 'Graphics Card', slug: 'graphics-card' },
  { name: 'Power Supply', slug: 'power-supply' },
  { name: 'Casing', slug: 'casing' },
  { name: 'Monitor', slug: 'monitor' },
  { name: 'Keyboard', slug: 'keyboard' },
  { name: 'Mouse', slug: 'mouse' },
  { name: 'Headphone', slug: 'headphone' },
  { name: 'UPS', slug: 'ups' }
];

export const PCBuildNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isComponentsOpen, setIsComponentsOpen] = useState(false);
  const { cartItems } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSettings();
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsComponentsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 bg-[#111827] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Cpu className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white tracking-wider">Click2IT</span>
            </Link>
          </div>

          {/* Center: Nav Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/shop" className="hover:text-blue-500 transition-colors px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/pc-build" className="hover:text-blue-500 transition-colors px-3 py-2 rounded-md text-sm font-medium">
                PC Builder
              </Link>
              <Link to="/compare" className="hover:text-blue-500 transition-colors px-3 py-2 rounded-md text-sm font-medium">
                Compare
              </Link>
              
              {/* Components Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsComponentsOpen(!isComponentsOpen)}
                  className="flex items-center hover:text-blue-500 transition-colors px-3 py-2 rounded-md text-sm font-medium focus:outline-none"
                >
                  Components <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isComponentsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isComponentsOpen && (
                  <div className="absolute left-0 mt-2 w-96 rounded-md shadow-lg bg-[#1f2937] ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-2 grid grid-cols-2 gap-x-2 gap-y-1 px-4" role="menu" aria-orientation="vertical">
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.slug}
                          to={`/category/${cat.slug}`}
                          className="block px-2 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-blue-400 rounded-md transition-colors"
                          role="menuitem"
                          onClick={() => setIsComponentsOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Cart, Account */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-blue-500 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link to="/admin" className="text-gray-300 hover:text-blue-500 transition-colors" title="Admin Dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                )}
                <Link to="/profile" className="flex items-center space-x-2 text-gray-300 hover:text-blue-500 transition-colors">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">Account</span>
                </Link>
                <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center space-x-2 text-gray-300 hover:text-blue-500 transition-colors">
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-4">
            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-blue-500">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1f2937] border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/shop" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Home</Link>
            <Link to="/pc-build" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">PC Builder</Link>
            <Link to="/compare" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Compare</Link>
            
            <div className="px-3 py-2">
              <div className="text-base font-medium text-white mb-2">Components</div>
              <div className="grid grid-cols-2 gap-2 pl-4">
                {CATEGORIES.map(cat => (
                  <Link key={cat.slug} to={`/category/${cat.slug}`} className="block py-1 text-sm text-gray-400 hover:text-blue-400">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {user ? (
              <div className="border-t border-gray-700 pt-4 pb-1">
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Account</Link>
                {isAdmin && <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Dashboard</Link>}
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 text-red-400">Logout</button>
              </div>
            ) : (
              <div className="border-t border-gray-700 pt-4 pb-1">
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Login</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
