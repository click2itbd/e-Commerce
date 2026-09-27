const fs = require('fs');
let dash = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', 'utf8');

const targetFunction = `  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const toastId = toast.loading('Updating status...');
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Status updated', { id: toastId });
    } catch (error: any) {`;

const newFunction = `  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const toastId = toast.loading('Updating status...');
      const orderRef = doc(db, 'orders', orderId);
      const order = orders.find(o => o.id === orderId);
      
      // Stock Deduction Logic
      if (newStatus === 'delivered' && order && order.status !== 'delivered') {
        // Deduct stock
        for (const item of order.items) {
          if (item.isBundle && item.bundleItems) {
            // Deduct individual bundle items
            for (const bItem of item.bundleItems) {
              const bRef = doc(db, 'products', bItem.productId);
              const bSnap = await getDoc(bRef);
              if (bSnap.exists()) {
                const p = bSnap.data();
                await updateDoc(bRef, { stock: Math.max(0, (p.stock || 0) - (bItem.quantity * item.quantity)) });
              }
            }
          } else {
            // Deduct normal product
            const pRef = doc(db, 'products', item.id);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              const p = pSnap.data();
              await updateDoc(pRef, { stock: Math.max(0, (p.stock || 0) - item.quantity) });
            }
          }
        }
      }

      await updateDoc(orderRef, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Status updated', { id: toastId });
    } catch (error: any) {`;

if (dash.includes(targetFunction)) {
    dash = dash.replace(targetFunction, newFunction);
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', dash, 'utf8');
    console.log('Added stock reduction logic');
} else {
    console.log('Could not find target function in EcommerceDashboard');
}