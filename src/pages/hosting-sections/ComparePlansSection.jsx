import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useSettings } from '../../context/SettingsContext';

export default function ComparePlansSection() {
  const { settings } = useSettings();
  const [plans, setPlans] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const calculatePlanPrice = (plan) => {
    if (!plan) return { monthly: 0, annually: 0 };
    
    const licenseCostUsd = plan.pricing?.licenseCostUsd || 0;
    const exchangeRate = settings.apiSettings?.usdToBdtRate || settings.usdToBdtRate || 120;
    const markupPercent = settings.apiSettings?.hostingMarkupPercent || settings.hostingMarkupPercent || 35;
    
    const calculatedMonthly = Math.round(licenseCostUsd * exchangeRate * (1 + markupPercent / 100));
    const calculatedAnnually = Math.round(calculatedMonthly * 12 * 0.8);
    
    if (plan.priceOverride && plan.overridePrice > 0) {
      return { monthly: plan.overridePrice, annually: Math.round(plan.overridePrice * 12 * 0.8) };
    }
    
    return { monthly: calculatedMonthly, annually: calculatedAnnually };
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const [plansSnap, featsSnap] = await Promise.all([
          getDocs(query(collection(db, 'hostingPlans'), orderBy('order', 'asc'))),
          getDocs(query(collection(db, 'hosting_features'), orderBy('order', 'asc')))
        ]);
        const fetchedPlans = plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.status === 'published');
        const fetchedFeatures = featsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (fetchedPlans.length > 0) {
          setPlans(fetchedPlans);
          setFeatures(fetchedFeatures);
        } else {
          setPlans([
            { id: '1', name: 'SHARED HOSTING', comparisonValues: { disk_space: '10 GB SSD', bandwidth: '100 GB', databases: '2 MySQL', free_domain: 'no' }, pricing: { licenseCostUsd: 5 } },
            { id: '2', name: 'VPS HOSTING', comparisonValues: { disk_space: '50 GB NVMe', bandwidth: 'Unmetered', databases: 'Unlimited', free_domain: 'yes' }, pricing: { licenseCostUsd: 15 } },
            { id: '3', name: 'DEDICATED SERVER', comparisonValues: { disk_space: 'Unlimited NVMe', bandwidth: 'Unmetered', databases: 'Unlimited', free_domain: 'yes' }, pricing: { licenseCostUsd: 50 } }
          ]);
          setFeatures([
            { id: 'disk_space', name: 'Storage' },
            { id: 'bandwidth', name: 'Bandwidth' },
            { id: 'databases', name: 'Databases' },
            { id: 'free_domain', name: 'Free Domain (1st Year)' }
          ]);
        }
      } catch (error) {
        console.error("Error fetching compare plans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading || plans.length === 0) return null;

  const allFeatureIds = features.map(f => f.id);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Compare Plan Features</h2>
        <p className="mt-4 text-lg text-gray-600">A detailed breakdown of what's included in every plan.</p>
      </div>
      
      <div className="overflow-x-auto shadow-xl rounded-2xl ring-1 ring-gray-200 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-5 px-6 font-semibold text-gray-900 min-w-[120px] sm:min-w-[200px]">Feature</th>
              {plans.map((plan, idx) => {
                const price = calculatePlanPrice(plan);
                return (
                  <th key={plan.id} className={`py-5 px-6 font-semibold text-gray-900 text-center min-w-[100px] sm:min-w-[150px] ${idx === plans.length - 1 ? 'bg-blue-50' : ''}`}>
                    <div>{plan.name}</div>
                    <div className="text-sm font-normal text-gray-500 mt-1">
                      {price.monthly > 0 ? `৳${price.monthly}/mo` : 'Contact us'}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allFeatureIds.map((featureId) => {
              const feature = features.find(f => f.id === featureId);
              return (
                <tr key={featureId} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-gray-700 font-medium">{feature?.name || featureId}</td>
                  {plans.map((plan, pIdx) => {
                    const isLast = pIdx === plans.length - 1;
                    const value = plan.comparisonValues?.[featureId];
                    const isIncluded = value === true || value === 'yes' || value === 'true';
                    
                    return (
                      <td key={plan.id} className="py-4 px-6 text-center border-r border-gray-100 last:border-0">
                        {value ? (
                          isIncluded ? <Check size={18} className="mx-auto text-green-500" /> : <X size={18} className="mx-auto text-gray-300" />
                        ) : (
                          <span className="text-sm text-gray-500">{value || '-'}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
