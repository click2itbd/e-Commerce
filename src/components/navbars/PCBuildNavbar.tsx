import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, ChevronDown, Cpu, Server } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { setSiteContext } from '../../hooks/useSiteContext';

export const PCBuildNavbar: React.FC = () => {
  const { items } = useCart();
  const { user, canAccessAdmin } = useAuth();
  const { settings } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setSiteContext('pc-build');
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full text-white shadow-md bg-[#0E2A47]">
      <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-4 md:px-[50px]">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/pc-build" className="flex items-center gap-2 shrink-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.brandName} className="h-10 w-auto" referrerPolicy="no-referrer" />
            ) : (
              <img src="/logo.png" alt={settings.brandName || "Click2IT BD"} className="h-10 md:h-12 w-auto object-contain" />
            )}
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <input
              type="text"
              placeholder="Search components..."
              className="w-full border-none rounded-md py-2 px-4 focus:ring-2 transition-all bg-[#1a3a5f] text-white placeholder-gray-400"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <Search size={20} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <Link to="/cart" className="relative group">
              <ShoppingCart className="transition-colors" style={{ color: 'white' }} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: settings.accentColor, borderColor: settings.primaryColor }}>
                  {cartItemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="hidden sm:flex items-center gap-1 hover:text-[#EF4444] transition-colors">
                  <User size={20} />
                  <span className="text-sm font-medium">My Profile</span>
                </Link>
                <button onClick={handleLogout} className="hidden sm:flex items-center gap-1 hover:text-[#EF4444] transition-colors">
                  <LogOut size={20} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1 hover:text-[#EF4444] transition-colors">
                <User size={20} />
                <span className="hidden sm:block text-sm font-medium">Login</span>
              </Link>
            )}

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white text-[#081621] border-b border-gray-200">
        <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-4 md:px-[50px]">
          <ul className="flex items-center gap-8 h-12">
            <li className="h-full">
              <Link 
                to="/shop" 
                className="flex items-center gap-1 h-full text-sm font-bold transition-colors"
                style={{ color: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.color = settings.accentColor}
                onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
              >
                Home
              </Link>
            </li>
            
            <li className="h-full">
              <Link 
                to="/pc-build" 
                className="flex items-center gap-2 h-full text-sm font-bold hover:underline" 
                style={{ color: settings.accentColor }}
              >
                <Cpu size={16} /> PC Builder
              </Link>
            </li>

            <li className="h-full">
              <Link 
                to="/compare" 
                className="flex items-center gap-1 h-full text-sm font-bold transition-colors"
                style={{ color: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.color = settings.accentColor}
                onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
              >
                Compare
              </Link>
            </li>
            <li className="h-full">
              <Link to="/" className="flex items-center gap-1 h-full text-sm font-bold transition-colors text-gray-500 hover:text-gray-900">
                 Hosting
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-700 p-4 bg-[#081621]">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full border-none rounded-md py-2 px-4 bg-[#0E2A47] text-white"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
            {canAccessAdmin && (
              <Link to="/admin" className="flex items-center gap-2 py-2" onClick={() => setIsMenuOpen(false)}>
                <LayoutDashboard size={20} /> Admin Dashboard
              </Link>
            )}
            
            {/* Dynamic Menus in Mobile */}
            <div className="border-t border-gray-700 pt-4">
              <Link to="/shop" className="block py-2 text-sm font-bold" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/pc-build" className="block py-2 text-sm font-bold" onClick={() => setIsMenuOpen(false)}>PC Builder</Link>
              <Link to="/compare" className="block py-2 text-sm font-bold" onClick={() => setIsMenuOpen(false)}>Compare</Link>
              
            </div>

            {user ? (
              <div className="flex flex-col gap-2">
                <Link to="/profile" className="flex items-center gap-2 py-2" onClick={() => setIsMenuOpen(false)}>
                  <User size={20} /> My Profile
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 py-2 text-left">
                  <LogOut size={20} /> Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 py-2" onClick={() => setIsMenuOpen(false)}>
                <User size={20} /> Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
