import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function cleanup() {
  console.log("Looking for order #INV-00086...");
  
  // 1. Delete Order
  const ordersRef = collection(db, "orders");
  const qOrder = query(ordersRef, where("documentNumber", "==", "INV-00086"));
  const orderDocs = await getDocs(qOrder);
  for (const d of orderDocs.docs) {
    await deleteDoc(doc(db, "orders", d.id));
    console.log("Deleted order:", d.id);
  }

  // 2. Delete Transactions
  const txRef = collection(db, "transactions");
  const qTx = query(txRef, where("documentNumber", "==", "INV-00086"));
  const txDocs = await getDocs(qTx);
  for (const d of txDocs.docs) {
    await deleteDoc(doc(db, "transactions", d.id));
    console.log("Deleted transaction:", d.id);
  }
  
  console.log("Cleanup complete!");
  process.exit(0);
}

cleanup();
