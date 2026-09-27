const fs = require('fs');

// 5. EcommerceDashboard.tsx - add stock decrement on delivery
let dash = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', 'utf8');

// Check if getDoc is imported
if (!dash.includes('getDoc')) {
  dash = dash.replace(
    "import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy",
    "import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc"
  );
  // If the import doesn't match exactly, try another pattern
  if (!dash.includes('getDoc')) {
    dash = dash.replace(
      "from 'firebase/firestore';",
      "getDoc, } from 'firebase/firestore';"
    );
  }
}

// Find the updateOrderStatus function and add stock decrement logic
const oldUpdateFn = `const updateOrderStatus = async (orderId: string, newStatus: string) => {
      try {
        const toastId = toast.loading('Updating status...');
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success('Status updated', { id: toastId });`;

const newUpdateFn = `const updateOrderStatus = async (orderId: string, newStatus: string) => {
      try {
        const toastId = toast.loading('Updating status...');
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        
        // Stock decrement on delivery
        if (newStatus === 'delivered') {
          const order = orders.find(o => o.id === orderId);
          if (order && order.items) {
            for (const item of order.items) {
              const pid = item.productId || item.id;
              if (pid) {
                try {
                  const productRef = doc(db, 'products', pid);
                  const productSnap = await getDoc(productRef);
                  if (productSnap.exists()) {
                    const currentStock = productSnap.data().stock || 0;
                    const newStock = Math.max(0, currentStock - (item.quantity || 1));
                    await updateDoc(productRef, { stock: newStock });
                  }
                } catch (stockErr) {
                  console.error('Stock decrement error for', pid, stockErr);
                }
              }
            }
          }
        }
        
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success('Status updated', { id: toastId });`;

dash = dash.replace(oldUpdateFn, newUpdateFn);

fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', dash, 'utf8');
console.log('5. EcommerceDashboard.tsx updated with stock decrement on delivery');