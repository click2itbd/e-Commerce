const fs = require('fs');
let c = fs.readFileSync('src/pages/shop/Checkout.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// The block to move up
const stateBlock = `  const [paymentType, setPaymentType] = useState<'cod' | 'pay_now'>('cod');
  const [advanceDelivery, setAdvanceDelivery] = useState(false);`;

// The logic block that uses it
const logicBlock = `  // If payment is COD and advance delivery is checked, the customer only pays the delivery charge right now
  const isAdvanceCOD = paymentType === 'cod' && advanceDelivery && shippingCost > 0;
  const payNowAmount = isAdvanceCOD ? shippingCost : (total + shippingCost);
  const dueOnDelivery = isAdvanceCOD ? total : 0;
  const grandTotal = total + shippingCost;`;

// Remove the state declarations from their current place
c = c.replace(stateBlock + '\n', '');

// Insert them right before the logic block
c = c.replace(logicBlock, stateBlock + '\n\n' + logicBlock);

fs.writeFileSync('src/pages/shop/Checkout.tsx', c.replace(/\n/g, nl));
console.log('Fixed ReferenceError in Checkout.tsx');