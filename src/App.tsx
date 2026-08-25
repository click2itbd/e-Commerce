import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WebsitePopup } from './components/WebsitePopup';
import { ReviewRewardPopup } from './components/ReviewRewardPopup';
import { ChatWidget } from './components/ChatWidget';
import { CompareProvider } from './context/CompareContext';

import Hosting from './pages/Hosting';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const ProductDetails = lazy(() => import('./pages/ProductDetails').then(m => ({ default: m.ProductDetails })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const PCBuilder = lazy(() => import('./pages/PCBuilder').then(m => ({ default: m.PCBuilder })));
const ComparePage = lazy(() => import('./pages/Compare').then(m => ({ default: m.ComparePage })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const HostingDetails = lazy(() => import('./pages/HostingDetails').then(m => ({ default: m.HostingDetails })));
const HostingBillingDashboard = lazy(() => import('./pages/HostingBillingDashboard').then(m => ({ default: m.HostingBillingDashboard })));
const AccountingDashboard = lazy(() => import('./pages/AccountingDashboard').then(m => ({ default: m.AccountingDashboard })));
const MyServices = lazy(() => import('./pages/MyServices').then(m => ({ default: m.MyServices })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const RetailPOS = lazy(() => import('./pages/RetailPOS').then(m => ({ default: m.RetailPOS })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));

const ServicesPage = lazy(() => import('./pages/hosting/ServicesPage'));
const PricingPage = lazy(() => import('./pages/hosting/PricingPage'));
const DomainPage = lazy(() => import('./pages/hosting/DomainPage').then(m => ({ default: m.default || m.DomainPage })));
const DomainSearchResults = lazy(() => import('./pages/hosting/DomainSearchResults'));
const SupportPage = lazy(() => import('./pages/hosting/SupportPage'));
const TermsOfService = lazy(() => import('./pages/policies/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/policies/PrivacyPolicy'));
const NotFound = lazy(() => import('./pages/NotFound'));
const RefundPolicy = lazy(() => import('./pages/policies/RefundPolicy'));
const EMITerms = lazy(() => import('./pages/policies/EMITerms'));
const StarPointPolicy = lazy(() => import('./pages/policies/StarPointPolicy'));
const OnlineDelivery = lazy(() => import('./pages/policies/OnlineDelivery'));
const WarrantyPolicy = lazy(() => import('./pages/policies/WarrantyPolicy'));
const Brands = lazy(() => import('./pages/Brands'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const DomainTransferPage = lazy(() => import('./pages/hosting/DomainTransferPage').then(m => ({ default: m.default || m.DomainTransferPage })));
const PaymentSimulation = lazy(() => import('./pages/PaymentSimulation'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));
const PaymentReturn = lazy(() => import('./pages/PaymentReturn').then(m => ({ default: m.default || m.PaymentReturn })));

const HostingCart = lazy(() => import('./pages/hosting/HostingCart').then(m => ({ default: m.HostingCart })));
const HostingCheckout = lazy(() => import('./pages/hosting/HostingCheckout').then(m => ({ default: m.HostingCheckout })));
const DomainRenewal = lazy(() => import('./pages/hosting/DomainRenewal').then(m => ({ default: m.default || m.DomainRenewal })));

import { PageLoader } from './components/Loading';

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

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
                  <Route path="/services" element={<LazyWrapper><ServicesPage /></LazyWrapper>} />
                  <Route path="/pricing" element={<LazyWrapper><PricingPage /></LazyWrapper>} />
                    <Route path="/domain" element={<LazyWrapper><DomainPage /></LazyWrapper>} />
                    <Route path="/domain/search" element={<LazyWrapper><DomainSearchResults /></LazyWrapper>} />
                    <Route path="/domain/transfer" element={<LazyWrapper><DomainTransferPage /></LazyWrapper>} />
                    <Route path="/domain-renewal" element={<LazyWrapper><DomainRenewal /></LazyWrapper>} />
                  <Route path="/support" element={<LazyWrapper><SupportPage /></LazyWrapper>} />
                  <Route path="/hosting/cart" element={<LazyWrapper><HostingCart /></LazyWrapper>} />
                  <Route path="/hosting/checkout" element={<LazyWrapper><HostingCheckout /></LazyWrapper>} />

                  {/* E-COMMERCE */}
                  <Route path="/shop" element={<LazyWrapper><Home /></LazyWrapper>} />
                  <Route path="/product/:id" element={<LazyWrapper><ProductDetails /></LazyWrapper>} />
                  <Route path="/cart" element={<LazyWrapper><Cart /></LazyWrapper>} />
                  <Route path="/checkout" element={<LazyWrapper><Checkout /></LazyWrapper>} />
                  {/* <Route path="/checkout" element={<Checkout />} /> */}
                  <Route path="/order-success/:id" element={<LazyWrapper><OrderSuccess /></LazyWrapper>} />
                  <Route path="/order-success" element={<LazyWrapper><OrderSuccess /></LazyWrapper>} />
                    <Route path="/payment/simulate" element={<LazyWrapper><PaymentSimulation /></LazyWrapper>} />
                    <Route path="/payment/callback" element={<LazyWrapper><PaymentCallback /></LazyWrapper>} />
                    <Route path="/payment/return" element={<LazyWrapper><PaymentReturn /></LazyWrapper>} />
                  <Route path="/category/:categorySlug" element={<LazyWrapper><CategoryPage /></LazyWrapper>} />
                  <Route path="/category/:categorySlug/:subCategorySlug" element={<LazyWrapper><CategoryPage /></LazyWrapper>} />

                  {/* PC BUILD */}
                  <Route path="/pc-build" element={<LazyWrapper><PCBuilder /></LazyWrapper>} />
                  <Route path="/pc-builder" element={<Navigate to="/pc-build" replace />} />
                  <Route path="/compare" element={<LazyWrapper><ComparePage /></LazyWrapper>} />

                  {/* AUTH */}
                  <Route path="/login" element={<LazyWrapper><Login /></LazyWrapper>} />

                  {/* ADMIN */}
                  <Route path="/pos" element={<ProtectedRoute adminOnly><LazyWrapper><RetailPOS /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute adminOnly><LazyWrapper><AdminDashboard /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/admin/billing" element={<ProtectedRoute adminOnly><LazyWrapper><HostingBillingDashboard /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/admin/accounting" element={<ProtectedRoute adminOnly><LazyWrapper><AccountingDashboard /></LazyWrapper></ProtectedRoute>} />

                  {/* ACCOUNT */}
                  <Route path="/account/services" element={<ProtectedRoute><LazyWrapper><MyServices /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><LazyWrapper><Profile /></LazyWrapper></ProtectedRoute>} />
                    <Route path="/terms" element={<LazyWrapper><TermsOfService /></LazyWrapper>} />
                    <Route path="/privacy" element={<LazyWrapper><PrivacyPolicy /></LazyWrapper>} />
                    <Route path="/refund-policy" element={<LazyWrapper><RefundPolicy /></LazyWrapper>} />
                    <Route path="/emi-terms" element={<LazyWrapper><EMITerms /></LazyWrapper>} />
                    <Route path="/emi" element={<Navigate to="/emi-terms" replace />} />
                    <Route path="/star-points" element={<LazyWrapper><StarPointPolicy /></LazyWrapper>} />
                    <Route path="/reward-policy" element={<Navigate to="/star-points" replace />} />
                    <Route path="/brands" element={<LazyWrapper><Brands /></LazyWrapper>} />
                    <Route path="/contact" element={<LazyWrapper><ContactUs /></LazyWrapper>} />
                    <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
                    <Route path="/online-delivery" element={<LazyWrapper><OnlineDelivery /></LazyWrapper>} />
                    <Route path="/delivery-info" element={<Navigate to="/online-delivery" replace />} />
                    <Route path="/warranty-policy" element={<LazyWrapper><WarrantyPolicy /></LazyWrapper>} />
                    <Route path="/warranty" element={<Navigate to="/warranty-policy" replace />} />
                  <Route path="*" element={<LazyWrapper><NotFound /></LazyWrapper>} />
                </Routes>
              </Router>
            </CartProvider>
          </CompareProvider>
        </AuthProvider>
      </SettingsProvider>
    </HelmetProvider>
  );
}
