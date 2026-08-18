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
  
  const siteName = settings?.companyName || 'Click2IT';
  const defaultTitle = `${siteName} - Premium Hosting & IT Solutions`;
  const defaultDescription = settings?.companyDescription || 'Get premium web hosting, domains, and IT solutions tailored for your business needs.';
  const defaultKeywords = 'web hosting, domain registration, IT services, cloud hosting, VPS, dedicated server';
  
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
