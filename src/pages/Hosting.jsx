import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useHostingApiConfig } from '../hooks/useHostingApiConfig';
import { useAuth } from '../context/AuthContext';
import { getDomainPricing } from '../services/hostingApi';

import HeroSection from './hosting-sections/HeroSection';
import WhyChooseUsSection from './hosting-sections/WhyChooseUsSection';
import DomainPricingSection from './hosting-sections/DomainPricingSection';
import HostingPlansSection from './hosting-sections/HostingPlansSection';
import ServicesGrid from './hosting-sections/ServicesGrid';
import MiddleBannerSection from './hosting-sections/MiddleBannerSection';
import SecureServiceSection from './hosting-sections/SecureServiceSection';
import SecureDomainSection from './hosting-sections/SecureDomainSection';
import LatestNewsSection from './hosting-sections/LatestNewsSection';

export default function Hosting() {
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();
  const { items } = useCart();
  const { config } = useHostingApiConfig();
  const { canAccessAdmin } = useAuth();

  const hasDomainInCart = items.some(item => item.category === 'Hosting & Domains' && item.id.startsWith('domain_'));
  const bundleDiscount = config.bundleDiscountPercent || 0;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'hostingServices'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(s => s.isActive));
      } catch (e) {
        console.error('Error fetching services', e);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, 'hostingPlans'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error('Error fetching plans', e);
      }
    };
    fetchPlans();
  }, []);

  return (
    <Layout fullWidth>
      {/* 1. Hero — dark blue bg, domain search, 3D server graphic */}
      <HeroSection hasDomainInCart={hasDomainInCart} bundleDiscount={bundleDiscount} />

      {/* 2. Why Choose Us — 3 white cards */}
      <WhyChooseUsSection />

      {/* 3. Domain Pricing — TLD cards */}
      <DomainPricingSection />

      {/* 4. Pricing Plans — toggle + 3 cards */}
      <HostingPlansSection
        billingCycle={billingCycle}
        onBillingCycleChange={setBillingCycle}
        onNavigate={navigate}
      />

      {/* 4. Our Services — 3x2 grid */}
      <ServicesGrid
        services={services}
        onNavigate={navigate}
        canAccessAdmin={canAccessAdmin}
      />

      {/* 5. Middle Banner — Click2IT brand section */}
      <MiddleBannerSection />

      {/* 6. Secure Service — text left, image right */}
      <SecureServiceSection />

      {/* 7. Secure Domain — image left, text right */}
      <SecureDomainSection />

      {/* 8. Latest News — 4 cards */}
      <LatestNewsSection />
    </Layout>
  );
}

