const fs = require('fs');
let file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

// Update NavigationMenu to include specTemplates, icon, status
const oldNavRegex = /export interface NavigationMenu \{[\s\S]*?createdAt: string;\n  \}/;
const newNav = `export interface NavigationMenu {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  status?: 'Active' | 'Inactive';
  order: number;
  specTemplates?: { name: string; type: string }[];
  subCategories: SubCategory[];
  createdAt: string;
}`;

if(oldNavRegex.test(content)) {
  content = content.replace(oldNavRegex, newNav);
} else {
  console.log("Failed to match NavigationMenu");
}

// Update SubCategory to include slug and status
const oldSubRegex = /export interface SubCategory \{[\s\S]*?slug\?: string;\n\}/;
const newSub = `export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug?: string;
  status?: 'Active' | 'Inactive';
}`;

if(oldSubRegex.test(content)) {
  content = content.replace(oldSubRegex, newSub);
} else {
  console.log("Failed to match SubCategory");
}

fs.writeFileSync(file, content, 'utf8');
console.log("Updated types.ts");
