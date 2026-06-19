import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { PCBuilder } from './pages/PCBuilder';
import { ComparePage } from './pages/Compare';
import { CategoryPage } from './pages/CategoryPage';
import { Hosting } from './pages/Hosting';
import { HostingDetails } from './pages/HostingDetails';
import { HostingBillingDashboard } from './pages/HostingBillingDashboard';
import { AccountingDashboard } from './pages/AccountingDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WebsitePopup } from './components/WebsitePopup';
import { ChatWidget } from './components/ChatWidget';

import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { RetailPOS } from './pages/RetailPOS';
import { CompareProvider } from './context/CompareContext';

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CompareProvider>
          <CartProvider>
            <WebsitePopup />
          <ChatWidget />
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:id" element={<OrderSuccess />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pc-builder" element={<PCBuilder />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/category/:categorySlug" element={<CategoryPage />} />
              <Route path="/category/:categorySlug/:subCategorySlug" element={<CategoryPage />} />
              <Route path="/hosting" element={<Hosting />} />
              <Route path="/hosting/:serviceId" element={<HostingDetails />} />
              <Route
                path="/pos"
                element={
                  <ProtectedRoute adminOnly>
                    <RetailPOS />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing"
                element={
                  <ProtectedRoute adminOnly>
                    <HostingBillingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/accounting"
                element={
                  <ProtectedRoute adminOnly>
                    <AccountingDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
          </CartProvider>
        </CompareProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
