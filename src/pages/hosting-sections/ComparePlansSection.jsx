import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ComparePlansSection() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, 'hostingPlans'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        const fetchedPlans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fetchedPlans.length > 0) {
          setPlans(fetchedPlans);
        } else {
          setPlans([
            { id: '1', name: 'SHARED HOSTING', features: [{name: 'Storage', value: '10 GB SSD'}, {name: 'Bandwidth', value: '100 GB'}, {name: 'Databases', value: '2 MySQL'}, {name: 'Free Domain (1st Year)', value: 'no'}] },
            { id: '2', name: 'VPS HOSTING', features: [{name: 'Storage', value: '50 GB NVMe'}, {name: 'Bandwidth', value: 'Unmetered'}, {name: 'Databases', value: 'Unlimited'}, {name: 'Free Domain (1st Year)', value: 'yes'}] },
            { id: '3', name: 'DEDICATED SERVER', features: [{name: 'Storage', value: 'Unlimited NVMe'}, {name: 'Bandwidth', value: 'Unmetered'}, {name: 'Databases', value: 'Unlimited'}, {name: 'Free Domain (1st Year)', value: 'yes'}] }
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

  const allFeatureNames = [];
  plans.forEach(plan => {
    (plan.features || []).forEach(feature => {
      const fName = typeof feature === 'string' ? feature : feature.name;
      if (fName && !allFeatureNames.includes(fName)) {
        allFeatureNames.push(fName);
      }
    });
  });

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
              <th className="py-5 px-6 font-semibold text-gray-900 min-w-[200px]">Feature</th>
              {plans.map((plan, idx) => (
                <th key={plan.id} className={`py-5 px-6 font-semibold text-gray-900 text-center min-w-[150px] ${idx === plans.length - 1 ? 'bg-blue-50' : ''}`}>
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allFeatureNames.map((featureName, fIdx) => (
              <tr key={fIdx} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-700 font-medium">{featureName}</td>
                {plans.map((plan, pIdx) => {
                  const isLast = pIdx === plans.length - 1;
                  let featureVal = null;
                  const f = (plan.features || []).find(feat => {
                     const fn = typeof feat === 'string' ? feat : feat.name;
                     return fn === featureName;
                  });

                  if (f) {
                    featureVal = typeof f === 'string' ? 'yes' : f.value;
                  }

                  let displayElement;
                  if (!featureVal || featureVal === 'no' || featureVal === 'false') {
                    displayElement = <X className="w-5 h-5 mx-auto text-gray-300" />;
                  } else if (featureVal === 'yes' || featureVal === 'true') {
                    displayElement = <Check className="w-5 h-5 mx-auto text-green-500" />;
                  } else {
                    displayElement = <span className="text-gray-600">{featureVal}</span>;
                  }

                  return (
                    <td key={plan.id} className={`py-4 px-6 text-center ${isLast ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex justify-center items-center h-full">
                        {displayElement}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
