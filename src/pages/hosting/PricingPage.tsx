import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/hosting/PageHeader';
import HostingPlansSection from '../hosting-sections/HostingPlansSection';
import SecureServiceSection from '../hosting-sections/SecureServiceSection';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <PageHeader 
        title="Simple, Transparent Pricing" 
        subtitle="No hidden fees. Choose the perfect plan for your website." 
      />
      <div className="py-12">
        <HostingPlansSection
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
          onNavigate={navigate}
        />
      </div>
      <SecureServiceSection />
    </div>
  );
}
