import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/hosting/PageHeader';
import ServicesGrid from '../hosting-sections/ServicesGrid';
import WhyChooseUsSection from '../hosting-sections/WhyChooseUsSection';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const navigate = useNavigate();
  const { canAccessAdmin } = useAuth();

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

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <PageHeader 
        title="Our Hosting Services" 
        subtitle="Powerful, reliable, and secure hosting solutions for your business. Managed directly from our central infrastructure." 
      />
      <div className="py-12">
        <ServicesGrid
          services={services}
          onNavigate={navigate}
          canAccessAdmin={canAccessAdmin}
        />
      </div>
      <WhyChooseUsSection />
    </div>
  );
}
