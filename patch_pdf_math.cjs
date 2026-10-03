const fs = require('fs');
let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

// Replace subtotal and discount calculations
const oldLogic = `      const subtotal = o.items.reduce(
        (sum: number, item: any) => sum + (item.price * item.quantity),
        0,
      );
      const discount = o.discountAmount || 0;`;

const newLogic = `      const subtotal = o.items.reduce(
        (sum: number, item: any) => sum + (item.price * item.quantity),
        0,
      );
      const itemDiscounts = o.items.reduce(
        (sum: number, item: any) => sum + (Number(item.discount) || 0),
        0
      );
      const discount = (Number(o.discountAmount) || 0) + itemDiscounts;`;

if (code.includes(oldLogic)) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('src/lib/pdf.ts', code);
  console.log('Successfully updated pdf.ts math logic');
} else {
  console.log('Old logic not found in pdf.ts');
}
