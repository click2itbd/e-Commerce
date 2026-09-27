const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/tabs/sales/Orders.tsx', 'utf8');

// The button has:
// className="text-sm font-bold text-[#EF4444] hover:underline text-left" onClick={(e) => e.stopPropagation()}
// And also an earlier onClick in the source.

content = content.replace(/className="text-sm font-bold text-\[\#EF4444\] hover:underline text-left" onClick=\{\(e\) => e\.stopPropagation\(\)\}/g, 'className="text-sm font-bold text-[#EF4444] hover:underline text-left"');

// And we need to add e.stopPropagation() to the original onClick of that button.
content = content.replace(/onClick=\{\(\) => \{\s*const customer/g, 'onClick={(e) => { e.stopPropagation(); const customer');

// Let's also check if the select tag has duplicate onClick
content = content.replace(/onClick=\{\(e\)=>e\.stopPropagation\(\)\}\s+onChange=/g, 'onClick={(e)=>e.stopPropagation()} onChange=');

fs.writeFileSync('src/pages/admin/tabs/sales/Orders.tsx', content, 'utf8');
console.log('Fixed duplicate onClick');