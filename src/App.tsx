import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WebsitePopup } from './components/WebsitePopup';
import { ReviewRewardPopup } from './components/ReviewRewardPopup';
import { ChatWidget } from './components/ChatWidget';
import { TrackingScripts } from './components/TrackingScripts';
import { ReferralTracker } from './components/ReferralTracker';
import { CompareProvider } from './context/CompareContext';
import { WishlistProvider } from './context/WishlistContext';

const Home = lazy(() => import('./pages/shop/Home').then(m => ({ default: m.Home })));
const ProductDetails = lazy(() => import('./pages/shop/ProductDetails').then(m => ({ default: m.ProductDetails })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const EcommerceDashboard = lazy(() => import('./pages/ecommerceDashboard/EcommerceDashboard'));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const PCBuilder = lazy(() => import('./pages/shop/PCBuilder').then(m => ({ default: m.PCBuilder })));
const Projects = lazy(() => import('./pages/shop/Projects').then(m => ({ default: m.Projects })));
const ComparePage = lazy(() => import('./pages/shop/Compare').then(m => ({ default: m.ComparePage })));
const CategoryPage = lazy(() => import('./pages/shop/CategoryPage').then(m => ({ default: m.CategoryPage })));
const WishlistPage = lazy(() => import('./pages/shop/WishlistPage').then(m => ({ default: m.WishlistPage })));
const SearchPage = lazy(() => import('./pages/shop/SearchPage').then(m => ({ default: m.SearchPage })));
const PreBook = lazy(() => import('./pages/shop/PreBook').then(m => ({ default: m.PreBook })));
const AccountingDashboard = lazy(() => import('./pages/AccountingDashboard').then(m => ({ default: m.AccountingDashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Checkout = lazy(() => import('./pages/shop/Checkout').then(m => ({ default: m.Checkout })));
const OrderSuccess = lazy(() => import('./pages/shop/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const RetailPOS = lazy(() => import('./pages/RetailPOS').then(m => ({ default: m.RetailPOS })));
const Cart = lazy(() => import('./pages/shop/Cart').then(m => ({ default: m.Cart })));
const CampaignLanding = lazy(() => import('./pages/shop/CampaignLanding').then(m => ({ default: m.CampaignLanding })));

const TermsOfService = lazy(() => import('./pages/policies/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/policies/PrivacyPolicy'));
const NotFound = lazy(() => import('./pages/NotFound'));
const RefundPolicy = lazy(() => import('./pages/policies/RefundPolicy'));
const EMITerms = lazy(() => import('./pages/policies/EMITerms'));
const StarPointPolicy = lazy(() => import('./pages/policies/StarPointPolicy'));
const OnlineDelivery = lazy(() => import('./pages/policies/OnlineDelivery'));
const WarrantyPolicy = lazy(() => import('./pages/policies/WarrantyPolicy'));
const Brands = lazy(() => import('./pages/shop/Brands'));
const UsedItems = lazy(() => import('./pages/shop/UsedItems'));
const Blog = lazy(() => import('./pages/shop/Blog'));
const TrackOrder = lazy(() => import('./pages/shop/TrackOrder'));
const BlogPost = lazy(() => import('./pages/shop/BlogPost'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const PaymentSimulation = lazy(() => import('./pages/PaymentSimulation'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));
const PaymentReturn = lazy(() => import('./pages/PaymentReturn').then(m => ({ default: m.default || m.PaymentReturn })));

import { PageLoader } from './components/Loading';

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function SharePhpRedirect() {
  const [params] = useSearchParams();
  const id = params.get('id');
  if (id) {
    return <Navigate to={`/product/${id}`} replace />;
  }
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <HelmetProvider>
      <ConfirmProvider>
      <SettingsProvider>
        <AuthProvider>
          <WishlistProvider>
          <CompareProvider>
            <CartProvider>
              <Router>
                <TrackingScripts />
            <ReferralTracker />
                <WebsitePopup />
                <ReviewRewardPopup />
                <ChatWidget />
                <Routes>
                  {/* --- COMMON ROUTES --- */}
                  <Route path="/login" element={<LazyWrapper><Login /></LazyWrapper>} />
                  <Route path="/pos" element={<ProtectedRoute adminOnly><LazyWrapper><RetailPOS /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute adminOnly><LazyWrapper><AdminDashboard mode="all" /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/admin/e-commerce" element={<ProtectedRoute adminOnly><LazyWrapper><EcommerceDashboard /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/admin/accounting" element={<ProtectedRoute adminOnly><LazyWrapper><AccountingDashboard /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><LazyWrapper><Profile /></LazyWrapper></ProtectedRoute>} />
                  <Route path="/terms" element={<LazyWrapper><TermsOfService /></LazyWrapper>} />
                  <Route path="/privacy" element={<LazyWrapper><PrivacyPolicy /></LazyWrapper>} />
                  <Route path="/refund-policy" element={<LazyWrapper><RefundPolicy /></LazyWrapper>} />
                  <Route path="/about" element={<LazyWrapper><AboutUs /></LazyWrapper>} />
                  <Route path="/about-us" element={<Navigate to="/about" replace />} />
                  <Route path="/contact" element={<LazyWrapper><ContactUs /></LazyWrapper>} />
                  <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
                  <Route path="/payment/simulate" element={<LazyWrapper><PaymentSimulation /></LazyWrapper>} />
                  <Route path="/payment/callback" element={<LazyWrapper><PaymentCallback /></LazyWrapper>} />
                  <Route path="/payment/return" element={<LazyWrapper><PaymentReturn /></LazyWrapper>} />
                  <Route path="/blog" element={<LazyWrapper><Blog /></LazyWrapper>} />
                  <Route path="/blog/:slug" element={<LazyWrapper><BlogPost /></LazyWrapper>} />

                  {/* --- ROOT ROUTE --- */}
                  <Route path="/" element={<LazyWrapper><Home /></LazyWrapper>} />

                  {/* --- REDIRECT OLD HOSTING ROUTES TO HOME --- */}
                  <Route path="/hosting/*" element={<Navigate to="/" replace />} />
                  <Route path="/domain/*" element={<Navigate to="/" replace />} />
                  <Route path="/vps" element={<Navigate to="/" replace />} />
                  <Route path="/cloud-vps" element={<Navigate to="/" replace />} />
                  <Route path="/ssl" element={<Navigate to="/" replace />} />

                  {/* --- E-COMMERCE ROUTES --- */}
                  <Route path="/shop" element={<Navigate to="/" replace />} />
                  <Route path="/deals" element={<LazyWrapper><CampaignLanding /></LazyWrapper>} />
                  <Route path="/projects" element={<LazyWrapper><Projects /></LazyWrapper>} />
                  <Route path="/product/:id" element={<LazyWrapper><ProductDetails /></LazyWrapper>} />
                  <Route path="/cart" element={<LazyWrapper><Cart /></LazyWrapper>} />
                  <Route path="/checkout" element={<LazyWrapper><Checkout /></LazyWrapper>} />
                  <Route path="/order-success/:id" element={<LazyWrapper><OrderSuccess /></LazyWrapper>} />
                  <Route path="/order-success" element={<LazyWrapper><OrderSuccess /></LazyWrapper>} />
                  <Route path="/category/:categorySlug" element={<LazyWrapper><CategoryPage /></LazyWrapper>} />
                  <Route path="/wishlist" element={<LazyWrapper><WishlistPage /></LazyWrapper>} />
                  <Route path="/pre-book" element={<LazyWrapper><PreBook /></LazyWrapper>} />
                  <Route path="/search" element={<LazyWrapper><SearchPage /></LazyWrapper>} />
                  <Route path="/category/:categorySlug/:subCategorySlug" element={<LazyWrapper><CategoryPage /></LazyWrapper>} />
                  <Route path="/category/:categorySlug/:subCategorySlug/:subSubCategorySlug" element={<LazyWrapper><CategoryPage /></LazyWrapper>} />
                  <Route path="/pc-build/*" element={<LazyWrapper><PCBuilder /></LazyWrapper>} />
                  <Route path="/pc-builder/*" element={<Navigate to="/pc-build" replace />} />
                  <Route path="/compare" element={<LazyWrapper><ComparePage /></LazyWrapper>} />
                  <Route path="/brands" element={<LazyWrapper><Brands /></LazyWrapper>} />
                  <Route path="/used-items" element={<LazyWrapper><UsedItems /></LazyWrapper>} />
                  <Route path="/track-order" element={<LazyWrapper><TrackOrder /></LazyWrapper>} />
                  <Route path="/emi-terms" element={<LazyWrapper><EMITerms /></LazyWrapper>} />
                  <Route path="/emi" element={<Navigate to="/emi-terms" replace />} />
                  <Route path="/star-points" element={<LazyWrapper><StarPointPolicy /></LazyWrapper>} />
                  <Route path="/reward-policy" element={<Navigate to="/star-points" replace />} />
                  <Route path="/online-delivery" element={<LazyWrapper><OnlineDelivery /></LazyWrapper>} />
                  <Route path="/delivery-info" element={<Navigate to="/online-delivery" replace />} />
                  <Route path="/warranty-policy" element={<LazyWrapper><WarrantyPolicy /></LazyWrapper>} />
                  <Route path="/warranty" element={<Navigate to="/warranty-policy" replace />} />
                  <Route path="/share.php" element={<SharePhpRedirect />} />

                  <Route path="*" element={<LazyWrapper><NotFound /></LazyWrapper>} />
                </Routes>
              </Router>
            </CartProvider>
          </CompareProvider>
          </WishlistProvider>
        </AuthProvider>
      </SettingsProvider>
      </ConfirmProvider>
    </HelmetProvider>
  );
}
