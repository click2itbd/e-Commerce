const fs = require('fs');
let code = fs.readFileSync('src/pages/hosting/HostingCheckout.tsx', 'utf8');

const regexMap = /\{\[\s*\{\s*id:\s*'bkash'.*?\.map\(\(method,?\s*i?\)\s*=>\s*\(/s;
const newMap = `{[
                { id: 'bkash', label: 'bKash', img: 'https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png' },
                { id: 'nagad', label: 'Nagad (Coming Soon)', img: 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png', disabled: true },
                { id: 'card', label: 'Cards (Coming Soon)', img: 'https://cdn-icons-png.flaticon.com/512/196/196578.png', disabled: true },
                { id: 'bank', label: 'Bank Transfer (Coming Soon)', img: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png', disabled: true }
              ].map(method => (`

code = code.replace(regexMap, newMap);

const oldLabelRegex = /<label\s+key=\{method\.id\}\s+className=\{\`relative[^>]+>\s*<input[^>]+className="sr-only"\s*\/>/s;
const newLabel = `<label key={method.id} className={\`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all \${method.disabled ? 'opacity-50 cursor-not-allowed border-slate-100 grayscale bg-slate-50' : 'cursor-pointer'} \${formData.paymentMethod === method.id && !method.disabled ? 'border-[#0E2A47] bg-[#0E2A47]/5' : !method.disabled ? 'border-slate-100 hover:border-slate-200 hover:bg-slate-50' : ''}\`}>
                    <input type="radio" name="paymentMethod" value={method.id} checked={formData.paymentMethod === method.id} onChange={handleChange} disabled={method.disabled} className="sr-only" />`;

code = code.replace(oldLabelRegex, newLabel);

fs.writeFileSync('src/pages/hosting/HostingCheckout.tsx', code);
console.log('Payment method UI replaced.');
