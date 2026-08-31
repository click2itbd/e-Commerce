const fs = require('fs');
let file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

const oldNav = `export interface NavigationMenu {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
  order: number;
  createdAt: string;
}`;

const newNav = `export interface NavigationMenu {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  status?: 'Active' | 'Inactive';
  specTemplates?: { name: string; type: string }[];
  subCategories: SubCategory[];
  order: number;
  createdAt: string;
}`;

content = content.replace(oldNav, newNav);
fs.writeFileSync(file, content, 'utf8');
console.log("Replaced NavigationMenu");
