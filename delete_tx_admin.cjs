const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = JSON.parse(fs.readFileSync("./backend/firebase-service-account.json", "utf8"));
const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.settings({ databaseId: config.firestoreDatabaseId });

async function cleanup() {
  console.log("Searching for SALE transactions for Muntasir...");
  
  const snap = await db.collection("transactions")
    .where("type", "==", "sale")
    .where("entityName", "==", "MD Muntasir Alam Resti")
    .get();

  console.log("Found:", snap.size, "transactions");
  for (const d of snap.docs) {
    const data = d.data();
    console.log("  -", d.id, "|", data.description, "|", data.amount);
    await d.ref.delete();
    console.log("  Deleted:", d.id);
  }

  console.log("Done!");
  process.exit(0);
}
cleanup().catch(e => { console.error(e.message); process.exit(1); });
