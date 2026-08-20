import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import { HostingDetails } from './pages/HostingDetails';
import { HostingBillingDashboard } from './pages/HostingBillingDashboard';
import { AccountingDashboard } from './pages/AccountingDashboard';
import { MyServices } from './pages/MyServices';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WebsitePopup } from './components/WebsitePopup';
import { ReviewRewardPopup } from './components/ReviewRewardPopup';
import { ChatWidget } from './components/ChatWidget';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { RetailPOS } from './pages/RetailPOS';
import { CompareProvider } from './context/CompareContext';
import Hosting from './pages/Hosting';

import ServicesPage from './pages/hosting/ServicesPage';
import PricingPage from './pages/hosting/PricingPage';
import DomainPage from './pages/hosting/DomainPage';
import DomainSearchResults from './pages/hosting/DomainSearchResults';
import SupportPage from './pages/hosting/SupportPage';
import TermsOfService from './pages/policies/TermsOfService';
import PrivacyPolicy from './pages/policies/PrivacyPolicy';
import NotFound from './pages/NotFound';
import RefundPolicy from './pages/policies/RefundPolicy';
import DomainTransferPage from './pages/hosting/DomainTransferPage';
import PaymentSimulation from './pages/PaymentSimulation';
import PaymentCallback from './pages/PaymentCallback';
import PaymentReturn from './pages/PaymentReturn';

import { HostingCart } from './pages/hosting/HostingCart';
import { HostingCheckout } from './pages/hosting/HostingCheckout';
import DomainRenewal from './pages/hosting/DomainRenewal';

export default function App() {
  return (
    <HelmetProvider>
      <SettingsProvider>
        <AuthProvider>
          <CompareProvider>
            <CartProvider>
              <Router>
                <WebsitePopup />
                <ReviewRewardPopup />
                <ChatWidget />
                <Routes>
                  {/* HOSTING - Default Home */}
                  <Route path="/" element={<Hosting />} />
                  <Route path="/hosting/:serviceId" element={<HostingDetails />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                   <Route path="/domain" element={<DomainPage />} />
                   <Route path="/domain/search" element={<DomainSearchResults />} />
                   <Route path="/domain/transfer" element={<DomainTransferPage />} />
                   <Route path="/domain-renewal" element={<DomainRenewal />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/hosting/cart" element={<HostingCart />} />
                  <Route path="/hosting/checkout" element={<HostingCheckout />} />

                  {/* E-COMMERCE */}
                  <Route path="/shop" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Navigate to="/hosting/cart" replace />} />
                  <Route path="/checkout" element={<Navigate to="/hosting/checkout" replace />} />
                  {/* <Route path="/checkout" element={<Checkout />} /> */}
                  <Route path="/order-success/:id" element={<OrderSuccess />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                   <Route path="/payment/simulate" element={<PaymentSimulation />} />
                   <Route path="/payment/callback" element={<PaymentCallback />} />
                   <Route path="/payment/return" element={<PaymentReturn />} />
                   <Route path="/category/:categorySlug" element={<CategoryPage />} />
                  <Route path="/category/:categorySlug/:subCategorySlug" element={<CategoryPage />} />

                  {/* PC BUILD */}
                  <Route path="/pc-build" element={<PCBuilder />} />
                  <Route path="/pc-builder" element={<Navigate to="/pc-build" replace />} />
                  <Route path="/compare" element={<ComparePage />} />

                  {/* AUTH */}
                  <Route path="/login" element={<Login />} />

                  {/* ADMIN */}
                  <Route path="/pos" element={<ProtectedRoute adminOnly><RetailPOS /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/billing" element={<ProtectedRoute adminOnly><HostingBillingDashboard /></ProtectedRoute>} />
                  <Route path="/admin/accounting" element={<ProtectedRoute adminOnly><AccountingDashboard /></ProtectedRoute>} />

                  {/* ACCOUNT */}
                  <Route path="/account/services" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                   <Route path="/terms" element={<TermsOfService />} />
                   <Route path="/privacy" element={<PrivacyPolicy />} />
                   <Route path="/refund-policy" element={<RefundPolicy />} />
                   <Route path="*" element={<NotFound />} />
                 </Routes>
              </Router>
            </CartProvider>
          </CompareProvider>
        </AuthProvider>
      </SettingsProvider>
    </HelmetProvider>
  );
}





