const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/POS/components/POSModals.tsx', 'utf8');

content = content.replace(/<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone \*/g, '<label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone');
content = content.replace(/<input required type="text" className="w-full rounded-lg border-gray-300 text-sm" \nvalue={customerFormData\.phone}/g, '<input type="text" className="w-full rounded-lg border-gray-300 text-sm" \nvalue={customerFormData.phone}');

// To be safe with newlines:
content = content.replace(/<input required type="text" className="w-full rounded-lg border-gray-300 text-sm"[\s\r\n]*value=\{customerFormData\.phone\}/g, '<input type="text" className="w-full rounded-lg border-gray-300 text-sm" value={customerFormData.phone}');

fs.writeFileSync('src/pages/admin/POS/components/POSModals.tsx', content, 'utf8');
console.log("Fixed POSModals.tsx");
