/**
 * CLICK2IT - High-Performance Dynamic Sitemap & Google Merchant Feed Generator
 * Queries Firestore directly for all live products, categories, brands, and blogs,
 * and generates:
 * 1) public/sitemap.xml (Google compliant with Image Extension)
 * 2) public/feed.xml (Google Merchant Center RSS 2.0 Product Feed)
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { initializeFirestore, getDocs, collection, query, where } = require('firebase/firestore');

const firebaseConfig = require('../firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

const BASE_URL = 'https://click2itbd.com';

// Escape XML special characters
function escapeXml(unsafe) {
  if (!unsafe || typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generate() {
  console.log('🚀 Starting Sitemap & Feed Generation for click2itbd.com...');
  const urls = [];
  const feedItems = [];
  const today = new Date().toISOString().split('T')[0];

  // 1. Static Core Storefront Pages
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/shop', priority: '0.9', changefreq: 'daily' },
    { loc: '/deals', priority: '0.9', changefreq: 'daily' },
    { loc: '/pc-build', priority: '0.9', changefreq: 'weekly' },
    { loc: '/projects', priority: '0.8', changefreq: 'weekly' },
    { loc: '/brands', priority: '0.8', changefreq: 'weekly' },
    { loc: '/used-items', priority: '0.8', changefreq: 'weekly' },
    { loc: '/blog', priority: '0.8', changefreq: 'daily' },
    { loc: '/compare', priority: '0.7', changefreq: 'weekly' },
    { loc: '/about', priority: '0.6', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
    { loc: '/warranty-policy', priority: '0.5', changefreq: 'monthly' },
    { loc: '/refund-policy', priority: '0.5', changefreq: 'monthly' },
    { loc: '/online-delivery', priority: '0.5', changefreq: 'monthly' },
    { loc: '/emi-terms', priority: '0.6', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.4', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.4', changefreq: 'monthly' },
    // Hosting Pages
    { loc: '/hosting', priority: '0.9', changefreq: 'weekly' },
    { loc: '/services', priority: '0.8', changefreq: 'weekly' },
    { loc: '/pricing', priority: '0.8', changefreq: 'weekly' },
    { loc: '/vps', priority: '0.8', changefreq: 'weekly' },
  ];

  staticPages.forEach(p => {
    urls.push(`  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`);
  });

  // 2. Fetch All Products
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    let productCount = 0;
    productsSnap.forEach(docSnap => {
      const p = docSnap.data();
      // Skip draft or soft-deleted products
      if (p.isDraft || p.deletedAt) return;

      const pId = docSnap.id;
      const pUrl = `${BASE_URL}/product/${pId}`;
      const title = escapeXml(p.name || 'Product');
      const rawDesc = p.shortDescription || p.description || p.name || '';
      const cleanDesc = escapeXml(rawDesc.slice(0, 1000));
      const img = p.imageUrl || (Array.isArray(p.images) && p.images[0]) || '';
      const price = Number(p.discountPrice || p.price || 0);
      const isOutOfStock = p.isOutOfStock || (typeof p.stock === 'number' && p.stock <= 0);
      const availability = isOutOfStock ? 'out of stock' : 'in stock';
      const condition = p.condition === 'used' ? 'used' : 'new';
      const brand = escapeXml(p.brand || 'Click2IT');

      // Sitemap URL with Image extension
      let imgXml = '';
      if (img && img.startsWith('http')) {
        imgXml = `\n    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
      <image:title>${title}</image:title>
    </image:image>`;
      }

      urls.push(`  <url>
    <loc>${pUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>${imgXml}
  </url>`);

      // Google Merchant Center Feed item
      feedItems.push(`    <item>
      <g:id>${pId}</g:id>
      <g:title>${title}</g:title>
      <g:description>${cleanDesc}</g:description>
      <g:link>${pUrl}</g:link>
      <g:image_link>${escapeXml(img)}</g:image_link>
      <g:condition>${condition}</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} BDT</g:price>
      <g:brand>${brand}</g:brand>
      <g:identifier_exists>${p.sku ? 'yes' : 'no'}</g:identifier_exists>
      ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ''}
    </item>`);

      productCount++;
    });
    console.log(`✅ Added ${productCount} live products to sitemap & Google Merchant feed.`);
  } catch (err) {
    console.warn('⚠️ Could not fetch products:', err.message);
  }

  // 3. Fetch Categories / Menus
  try {
    const menusSnap = await getDocs(collection(db, 'menus'));
    let catCount = 0;
    menusSnap.forEach(docSnap => {
      const m = docSnap.data();
      const slug = (m.slug || m.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      if (!slug) return;

      urls.push(`  <url>
    <loc>${BASE_URL}/category/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
      catCount++;

      // Subcategories if present
      if (Array.isArray(m.subCategories)) {
        m.subCategories.forEach(sub => {
          const subName = typeof sub === 'string' ? sub : (sub.name || sub.slug || '');
          const subSlug = subName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
          if (subSlug) {
            urls.push(`  <url>
    <loc>${BASE_URL}/category/${slug}/${subSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
            catCount++;
          }
        });
      }
    });
    console.log(`✅ Added ${catCount} categories/subcategories to sitemap.`);
  } catch (err) {
    console.warn('⚠️ Could not fetch menus:', err.message);
  }

  // 4. Fetch Brands
  try {
    const brandsSnap = await getDocs(collection(db, 'brands'));
    let brandCount = 0;
    brandsSnap.forEach(docSnap => {
      const b = docSnap.data();
      const bName = b.name || b.brandName || '';
      if (!bName) return;
      const bSlug = encodeURIComponent(bName.toLowerCase().trim());
      urls.push(`  <url>
    <loc>${BASE_URL}/brands?brand=${bSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      brandCount++;
    });
    console.log(`✅ Added ${brandCount} brands to sitemap.`);
  } catch (err) {
    console.warn('⚠️ Could not fetch brands:', err.message);
  }

  // 5. Fetch Blog Posts
  try {
    const blogSnap = await getDocs(query(collection(db, 'ecommerce_blog'), where('status', '==', 'published')));
    let blogCount = 0;
    blogSnap.forEach(docSnap => {
      const post = docSnap.data();
      const slug = post.slug || docSnap.id;
      urls.push(`  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      blogCount++;
    });
    console.log(`✅ Added ${blogCount} published blog posts to sitemap.`);
  } catch (err) {
    console.warn('⚠️ Could not fetch blogs:', err.message);
  }

  // Assemble full Sitemap XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

  const publicSitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(publicSitemapPath, sitemapXml, 'utf8');
  console.log(`📄 Saved sitemap to: ${publicSitemapPath}`);

  const distSitemapPath = path.resolve(__dirname, '../dist/sitemap.xml');
  if (fs.existsSync(path.resolve(__dirname, '../dist'))) {
    fs.writeFileSync(distSitemapPath, sitemapXml, 'utf8');
    console.log(`📄 Saved sitemap to: ${distSitemapPath}`);
  }

  // Assemble Google Merchant Center RSS Feed
  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Click2IT - Computer, Laptop &amp; Tech Accessories in Bangladesh</title>
    <link>${BASE_URL}</link>
    <description>Shop best price laptops, desktop computers, gaming PC components, CCTV and tech accessories in Bangladesh at Click2IT.</description>
${feedItems.join('\n')}
  </channel>
</rss>`;

  const publicFeedPath = path.resolve(__dirname, '../public/feed.xml');
  fs.writeFileSync(publicFeedPath, feedXml, 'utf8');
  console.log(`📦 Saved Google Merchant Feed to: ${publicFeedPath}`);

  const distFeedPath = path.resolve(__dirname, '../dist/feed.xml');
  if (fs.existsSync(path.resolve(__dirname, '../dist'))) {
    fs.writeFileSync(distFeedPath, feedXml, 'utf8');
    console.log(`📦 Saved Google Merchant Feed to: ${distFeedPath}`);
  }

  console.log(`🎉 Success! Total URLs in sitemap: ${urls.length}, Products in Merchant feed: ${feedItems.length}`);
}

generate().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error during generation:', err);
  process.exit(1);
});
