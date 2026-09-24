import React from 'react';
import { Layout } from '../../components/Layout';
import { SEO } from '../../components/SEO';
import { CreditCard, Clock } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const EMITerms = () => {
  const { settings } = useSettings();

  return (
    <Layout fullWidth>
      <SEO 
        title={`EMI Terms - ${settings.brandName}`} 
        description="EMI service is coming soon to our platform." 
      />
      <div className="bg-gray-50 min-h-[60vh] py-16 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white p-10 md:p-16 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            
            <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-6 relative">
              <CreditCard className="w-12 h-12" />
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              EMI Service <span className="text-orange-500">Coming Soon!</span>
            </h1>
            
            <p className="text-gray-500 text-lg leading-relaxed max-w-lg mx-auto">
              We are currently working on integrating EMI (Equated Monthly Installment) services for our customers. This feature will be available very soon. 
              Stay tuned for updates!
            </p>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EMITerms;
