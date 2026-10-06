import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image,
  url 
}) => {
  const { settings } = useSettings();
  
  const currentDomain = window.location.hostname;
  const isHostingDomain = currentDomain === 'click2it.bd' || currentDomain === 'www.click2it.bd' || currentDomain === '127.0.0.1';
  
  const siteName = settings?.companyName || 'Click2IT';
  
  const defaultTitle = isHostingDomain 
    ? `${siteName} - Premium Hosting & IT Solutions`
    : `${siteName} - E-Commerce & Custom PC Builder`;
    
  const defaultDescription = isHostingDomain
    ? settings?.companyDescription || 'Get premium web hosting, domains, and IT solutions tailored for your business needs.'
    : 'Shop the best PC components, laptops, smart gadgets, and build your custom PC at Click2IT.';
    
  const defaultKeywords = isHostingDomain
    ? 'web hosting, domain registration, IT services, cloud hosting, VPS, dedicated server'
    : 'pc builder, e-commerce, laptops, tech shop bd, computer accessories, online shopping bangladesh';
  
  const seoTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || defaultKeywords;
  const seoImage = image || settings?.logoUrl || '/logo.png';
  const seoUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      
      {/* Open Graph tags (Facebook, LinkedIn, etc.) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
    </Helmet>
  );
};
