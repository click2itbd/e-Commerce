const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('imageUrl?: string;')) {
    // Find NavigationMenu interface
    code = code.replace(
        "export interface NavigationMenu {",
        "export interface NavigationMenu {\n  imageUrl?: string;"
    );
    // Find SubCategory interface
    code = code.replace(
        "export interface SubCategory {",
        "export interface SubCategory {\n  imageUrl?: string;"
    );
    fs.writeFileSync('src/types.ts', code);
    console.log('Fixed types in types.ts');
} else {
    console.log('Types already fixed');
}
