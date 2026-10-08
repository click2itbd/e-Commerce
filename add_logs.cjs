const fs = require('fs');
let c = fs.readFileSync('src/components/AnalyticsDashboard.tsx', 'utf8');

const logCode = `
            if (knownCost > 10000) {
              console.log('High cost item:', item, 'knownCost:', knownCost, 'qty:', item.quantity);
            }
            hardwareCOGS += knownCost * (Number(item.quantity) || 1);
`;

const logOrderCode = `
          if ((order as any).totalCost > 10000) {
              console.log('High cost order:', order.id, 'totalCost:', (order as any).totalCost);
          }
          hardwareCOGS += (order as any).totalCost || (orderTotal * 0.82);
`;

if (!c.includes('High cost item')) {
  c = c.replace(/hardwareCOGS \+= knownCost \* \(Number\(item\.quantity\) \|\| 1\);/, logCode);
  c = c.replace(/hardwareCOGS \+= \(order as any\)\.totalCost \|\| \(orderTotal \* 0\.82\);/, logOrderCode);
  fs.writeFileSync('src/components/AnalyticsDashboard.tsx', c);
  console.log('Injected console logs');
}