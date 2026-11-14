import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';

import type { ProductMetaProps } from '../utils/seoSearchRegex';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'product';
  schema?: Record<string, any> | Array<Record<string, any>>;
  noindex?: boolean;
  productMeta?: ProductMetaProps;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image,
  url,
  canonical,
  type = 'website',
  schema,
  noindex = false,
  productMeta
}) => {
  const { settings } = useSettings();
  
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isHostingDomain = currentDomain === 'click2it.bd' || currentDomain === 'www.click2it.bd' || currentDomain === '127.0.0.1' || pathname.startsWith('/hosting') || pathname.startsWith('/domain') || pathname.startsWith('/vps') || pathname.startsWith('/ssl') || pathname.startsWith('/services') || pathname.startsWith('/pricing');
  
  const siteName = settings?.companyName || (isHostingDomain ? 'Click2IT Hosting' : 'Click2IT');
  const baseDomain = isHostingDomain ? 'https://click2it.bd' : 'https://click2itbd.com';
  
  const defaultTitle = isHostingDomain 
    ? `${siteName} - High-Speed Web Hosting, VPS & Domain in Bangladesh`
    : `${siteName} - Computer, Laptop, Component & Custom PC Builder in Bangladesh`;
    
  const defaultDescription = isHostingDomain
    ? settings?.companyDescription || 'Fast, reliable NVMe cPanel web hosting, KVM Cloud VPS, .BD domain registration and website security services in Bangladesh with 99.9% uptime.'
    : 'Shop best price laptops, desktop computers, gaming PC components, CCTV and tech accessories in Bangladesh at Click2IT. Build your dream custom PC with warranty.';
    
  const defaultKeywords = isHostingDomain
    ? 'web hosting bangladesh, cpanel hosting, nvme hosting, vps server bd, buy domain bangladesh, bd domain registration, ssl certificate, cloud hosting'
    : 'computer shop bd, pc builder bangladesh, gaming laptop price bd, desktop pc, intel amd processor, monitor, cctv camera, tech accessories dhaka';
  
  const seoTitle = title 
    ? (title.includes(siteName) ? title : `${title} | ${siteName}`) 
    : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || defaultKeywords;
  const seoImage = image || settings?.logoUrl || `${baseDomain}/logo.png`;
  const seoUrl = url || (typeof window !== 'undefined' ? window.location.href : baseDomain);
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? `${baseDomain}${window.location.pathname}` : baseDomain);

  // Default LocalBusiness / ComputerStore Schema (Rich Snippets for Google Local Pack)
  const defaultStoreSchema = {
    '@context': 'https://schema.org',
    '@type': 'ComputerStore',
    'name': siteName,
    'alternateName': ['CLICK2IT BD', 'Click2IT Computer Shop', 'Click2IT'],
    'url': baseDomain,
    'logo': `${baseDomain}/logo.png`,
    'image': `${baseDomain}/logo.png`,
    'description': defaultDescription,
    'telephone': settings?.contactPhone || '+8809640887777',
    'email': settings?.contactEmail || 'info@click2itbd.com',
    'priceRange': '৳৳',
    'currenciesAccepted': 'BDT',
    'paymentAccepted': 'Cash, Credit Card, Debit Card, bKash, Nagad, Rocket, EMI',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Shop No. 1072, Level 10, Multiplan Center, 69-71 New Elephant Road',
      'addressLocality': 'Dhaka',
      'postalCode': '1205',
      'addressCountry': 'BD'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': 23.7390,
      'longitude': 90.3869
    },
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        'opens': '10:00',
        'closes': '20:00'
      }
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': settings?.contactPhone || '+8809640887777',
      'contactType': 'Customer Support & Sales',
      'areaServed': 'BD',
      'availableLanguage': ['English', 'Bengali']
    },
    'sameAs': [
      settings?.facebook || 'https://facebook.com/click2itbd',
      'https://youtube.com/@click2itbd',
      'https://instagram.com/click2itbd'
    ]
  };

  const defaultWebSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': siteName,
    'alternateName': ['CLICK2IT', 'CLICK2IT BD'],
    'url': baseDomain,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${baseDomain}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const finalSchema = schema 
    ? [defaultStoreSchema, defaultWebSiteSchema, ...(Array.isArray(schema) ? schema : [schema])]
    : [defaultStoreSchema, defaultWebSiteSchema];

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      {canonicalUrl && (
        <>
          <link rel="canonical" href={canonicalUrl} />
          <link rel="alternate" hrefLang="en-bd" href={canonicalUrl} />
          <link rel="alternate" hrefLang="bn-bd" href={canonicalUrl} />
          <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
        </>
      )}
      
      {/* Search Engine Robots Directives */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        </>
      )}

      {/* Geo-Targeting Tags for Bangladesh & Dhaka Local Search */}
      <meta name="geo.region" content="BD-13" />
      <meta name="geo.placename" content="Dhaka, Bangladesh" />
      <meta name="geo.position" content="23.7390;90.3869" />
      <meta name="ICBM" content="23.7390, 90.3869" />

      {/* Open Graph tags (Facebook, LinkedIn, Discord, etc.) */}
      <meta property="og:type" content={type === 'product' ? 'product' : type === 'article' ? 'article' : 'website'} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:secure_url" content={seoImage} />
      <meta property="og:image:alt" content={seoTitle} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="bn_BD" />

      {/* Product OpenGraph & Merchant tags */}
      {type === 'product' && productMeta && (
        <>
          {productMeta.priceAmount !== undefined && (
            <meta property="product:price:amount" content={String(productMeta.priceAmount)} />
          )}
          <meta property="product:price:currency" content={productMeta.priceCurrency || 'BDT'} />
          {productMeta.availability && (
            <meta property="product:availability" content={productMeta.availability} />
          )}
          {productMeta.brand && <meta property="product:brand" content={productMeta.brand} />}
          {productMeta.condition && (
            <meta property="product:condition" content={productMeta.condition} />
          )}
          {productMeta.retailerItemId && (
            <meta property="product:retailer_item_id" content={productMeta.retailerItemId} />
          )}
        </>
      )}

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@click2itbd" />
      <meta name="twitter:creator" content="@click2itbd" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:image:alt" content={seoTitle} />

      {/* Structured Data (JSON-LD) */}
      {finalSchema.map((item, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};
