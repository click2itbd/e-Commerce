const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/modals/EditOrderModal.tsx', 'utf8');

// Imports
if (!code.includes("useSettings")) {
  code = code.replace(/import \{ useAuth \} from '\.\.\/\.\.\/\.\.\/context\/AuthContext';/, "import { useAuth } from '../../../context/AuthContext';\nimport { useSettings } from '../../../context/SettingsContext';\nimport { formatCurrency } from '../../../lib/utils';");
}

// Hooks
if (!code.includes("const { settings } = useSettings();")) {
  code = code.replace(/const \{ profile \} = useAuth\(\);/, "const { profile } = useAuth();\n  const { settings } = useSettings();");
}

// Logic
code = code.replace(/item\.salePrice/g, "item.price");
code = code.replace(/'salePrice'/g, "'price'");

// UI replacements for Currency. 
// We will replace anything that looks like "currency_symbol{total.toFixed(2)}"
code = code.replace(/[^>]*?\{subtotal\.toFixed\(2\)\}/g, "{formatCurrency(subtotal, settings)}");
code = code.replace(/[^>]*?\{total\.toFixed\(2\)\}/g, "{formatCurrency(total, settings)}");

fs.writeFileSync('src/pages/admin/modals/EditOrderModal.tsx', code, 'utf8');
console.log("Fixed EditOrderModal logic and currency");
