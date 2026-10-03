import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function cleanup() {
  console.log("Looking for transactions for MD Muntasir Alam Resti...");
  const txRef = collection(db, "transactions");
  const qTx = query(txRef, where("entityName", "==", "MD Muntasir Alam Resti"));
  const txDocs = await getDocs(qTx);
  for (const d of txDocs.docs) {
    if (d.data().type === "payment_received" && d.data().amount === 7000) {
      console.log("Found transaction:", d.id, d.data());
      // UNCOMMENT TO DELETE
      // await deleteDoc(doc(db, "transactions", d.id));
      // console.log("Deleted.");
    }
  }
  process.exit(0);
}

cleanup();
