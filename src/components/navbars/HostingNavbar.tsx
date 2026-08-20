import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Cloud,
  Menu,
  X,
  User,
  LayoutDashboard,
  Server,
  LogOut,
  Phone,
  Mail,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";

export const HostingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, isAdmin } = useAuth();
  const { items } = useCart();
  const cartCount = items.filter(
    (i) => i.category === "Hosting & Domains",
  ).length;
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

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Pricing", path: "/pricing" },
    {
      name: "Domain",
      path: "/domain",
      subLinks: [
        { name: "Domain Registration", path: "/domain" },
        { name: "Domain Transfer", path: "/domain/transfer" },
      ],
    },
    { name: "Support", path: "/support" },
  ];

  const isActive = (path: string) => {
    if (path.includes("#")) {
      return location.hash === path.split("#")[1];
    }
    return location.pathname === path;
  };

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-50 w-full transition-all duration-300`}
    >
      {/* Top Bar */}
      <div className="bg-[#060d1f] text-gray-300 text-xs py-1.5 px-10 hidden sm:block">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Phone size={12} />
              <span>{settings?.contactPhone || "+1 (555) 123-4567"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mail size={12} />
              <span>{settings?.contactEmail || "support@click2it.com"}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 hover:text-white transition-colors"
                >
                  <User size={12} />
                  <span>My Account</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 hover:text-white transition-colors"
                  >
                    <LayoutDashboard size={12} />
                    <span>Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 hover:text-white transition-colors"
                >
                  <LogOut size={12} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <User size={12} />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        className={`transition-all duration-300 ${isScrolled ? "bg-[#0a1628]/95 backdrop-blur-md shadow-lg py-3" : "bg-[#0a1628] py-4"}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Click2IT Logo"
                  className="h-8 md:h-10 object-contain"
                />
              ) : (
                <img
                  src="/logo.png"
                  alt="Click2IT Logo"
                  className="h-8 md:h-10 object-contain"
                />
              )}
              <span className="text-white font-semibold group-hover:text-primary transition-colors">
                CLICK2IT
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) =>
                  link.subLinks ? (
                    <div key={link.name} className="relative group">
                      <button
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                          isActive(link.path) ||
                          link.subLinks.some((sub) => isActive(sub.path))
                            ? "text-blue-400 bg-blue-500/10"
                            : "text-gray-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {link.name}{" "}
                        <ChevronDown
                          size={14}
                          className="group-hover:rotate-180 transition-transform duration-200"
                        />
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#0a1628] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
                        <div className="p-2 space-y-1">
                          {link.subLinks.map((sub) => (
                            <Link
                              key={sub.name}
                              to={sub.path}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(link.path)
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ),
                )}
              </nav>
            </div>

            {/* CTA Button and Cart */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart Icon Desktop */}
              <Link
                to="/hosting/cart"
                className="relative p-2 text-gray-300 hover:text-white transition-colors mr-2"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#0a1628]">
                    {cartCount}
                  </span>
                )}
              </Link>
              {user ? (
                <Link
                  to="/profile"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center gap-2"
                >
                  <User size={16} /> Profile
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30 flex items-center gap-2"
                >
                  <LogOut size={16} className="rotate-180" /> Login
                </Link>
              )}
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
          isMobileMenuOpen
            ? "opacity-100 scale-y-100"
            : "opacity-0 scale-y-0 h-0 overflow-hidden"
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-1 shadow-2xl">
          {navLinks.map((link) =>
            link.subLinks ? (
              <div key={link.name} className="space-y-1">
                <div className="px-3 py-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                  {link.name}
                </div>
                {link.subLinks.map((sub) => (
                  <Link
                    key={sub.name}
                    to={sub.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-3 pl-6 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 border-l-2 border-transparent hover:border-blue-500"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
              >
                {link.name}
              </Link>
            ),
          )}

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
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
                >
                  <User size={18} />
                  <span>My Profile</span>
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
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-lg font-semibold shadow-lg"
              >
                Go to Profile
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-3 rounded-lg font-semibold shadow-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};



