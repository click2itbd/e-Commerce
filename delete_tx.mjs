import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function cleanup() {
  console.log("Looking for SALE transaction for INV-00086...");
  const txRef = collection(db, "transactions");
  const q = query(txRef, where("type", "==", "sale"), where("documentNumber", "==", "INV-00086"));
  const snap = await getDocs(q);
  console.log("Found:", snap.size, "transactions");
  for (const d of snap.docs) {
    console.log("Deleting:", d.id, d.data());
    await deleteDoc(doc(db, "transactions", d.id));
    console.log("Deleted successfully");
  }
  process.exit(0);
}
cleanup().catch(e => { console.error(e); process.exit(1); });
