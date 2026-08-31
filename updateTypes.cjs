const fs = require('fs');
let file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

const newTypes = `
export interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  createdAt?: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug?: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface ProductSpec {
  group: string;
  key: string;
  value: string;
}
`;

// Inject new types before Product
content = content.replace('export interface ProductVariant {', newTypes + '\nexport interface ProductVariant {');

// Update Product interface
const oldProductRegex = /export interface Product \{[\s\S]*?createdAt: string;\n\}/;
const newProduct = `export interface Product {
  id: string;
  slug?: string;
  name: string;
  brandId?: string;
  subCategoryId?: string;
  category: string; // Keeping for backward compatibility
  model?: string;
  sku?: string;
  mpn?: string;
  
  // E-Commerce Specific
  shortDescription?: string;
  description: string;
  warrantyMonths?: number;
  warranty?: string;
  
  // Pricing
  price: number; // Regular/MRP Price
  discountPrice?: number; // Offer/Web Price
  costPrice?: number; // Average/Latest Buying Price
  
  // Inventory
  stock: number;
  hasSerialTracking?: boolean;
  availableSerials?: string[];
  
  // Status & SEO
  status?: 'In Stock' | 'Out of Stock' | 'Up-coming' | 'Pre-Order';
  isPublished?: boolean;
  seoTitle?: string;
  seoMetaTags?: string;
  
  // Media & Specs
  images: string[];
  specs?: ProductSpec[];
  variants?: ProductVariant[];
  
  // Legacy fields (optional)
  socketType?: string;
  ramType?: string;
  chipset?: string;
  vendorId?: string;
  isAccessory?: boolean;
  
  createdAt: string;
}`;

content = content.replace(oldProductRegex, newProduct);

fs.writeFileSync(file, content, 'utf8');
