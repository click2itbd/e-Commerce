import React from 'react';
import { PageHeader } from '../../components/hosting/PageHeader';
import DomainPricingSection from '../hosting-sections/DomainPricingSection';
import SecureDomainSection from '../hosting-sections/SecureDomainSection';
import MiddleBannerSection from '../hosting-sections/MiddleBannerSection';

export default function DomainPage() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <PageHeader 
        title="Find Your Perfect Domain" 
        subtitle="Search, register, and manage your domains easily with Click2IT." 
      />
      {/* Search bar could be added here in the future */}
      <div className="py-12">
        <DomainPricingSection />
      </div>
      <MiddleBannerSection />
      <SecureDomainSection />
    </div>
  );
}
