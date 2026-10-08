const fs = require('fs');
let c = fs.readFileSync('src/components/AnalyticsDashboard.tsx', 'utf8');

c = c.replace(/serviceBreakdown\.push\(\{ source: 'Order ' \+ order\.documentNumber, name: item\.name \|\| 'Custom Service', amount: itemPrice, date: order\.createdAt \}\);/g, 
  "serviceBreakdown.push({ source: 'Order ' + order.documentNumber, name: item.name || 'Custom Service', amount: itemPrice, date: order.createdAt });");

// Instead of replacing, let's just push high costs to serviceBreakdown as well, so the user sees it in the table
const hackCode = `
            if (knownCost * (Number(item.quantity) || 1) > 10000) {
               serviceBreakdown.push({ source: 'HIGH COST ITEM (Bug)', name: item.name + ' (Order: ' + order.documentNumber + ')', amount: knownCost * (Number(item.quantity) || 1), date: order.createdAt });
            }
`;

c = c.replace(/if \(knownCost > 10000\) \{[\s\S]*?\}[\s\n]*hardwareCOGS \+= knownCost \* \(Number\(item\.quantity\) \|\| 1\);/, 
  hackCode + "\nhardwareCOGS += knownCost * (Number(item.quantity) || 1);");

const hackOrderCode = `
          if ((order as any).totalCost > 10000) {
              serviceBreakdown.push({ source: 'HIGH COST ORDER (Bug)', name: 'Order: ' + order.id, amount: (order as any).totalCost, date: order.createdAt });
          }
`;

c = c.replace(/if \(\(order as any\)\.totalCost > 10000\) \{[\s\S]*?\}[\s\n]*hardwareCOGS \+= \(order as any\)\.totalCost \|\| \(orderTotal \* 0\.82\);/, 
  hackOrderCode + "\nhardwareCOGS += (order as any).totalCost || (orderTotal * 0.82);");

fs.writeFileSync('src/components/AnalyticsDashboard.tsx', c);
console.log('Injected high cost to diagnostic table');