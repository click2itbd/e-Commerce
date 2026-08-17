const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexFetch = /const serviceRecordsSnap = await getDocs\(query\(collection\(db, 'service_records'\), orderBy\('receivedAt', 'desc'\)\)\);/;
if(content.includes('payment_accounts') && content.includes('const paymentAccountsSnap')) {
  // Already there
} else if (regexFetch.test(content)) {
  content = content.replace(regexFetch, `const serviceRecordsSnap = await getDocs(query(collection(db, 'service_records'), orderBy('receivedAt', 'desc')));
      const paymentAccountsSnap = await getDocs(query(collection(db, 'payment_accounts'), orderBy('createdAt', 'desc')));`);
      
  content = content.replace(
    `setServiceRecords(serviceRecordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceRecord[]);`,
    `setServiceRecords(serviceRecordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceRecord[]);
      setPaymentAccounts(paymentAccountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));`
  );
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully added fetching of payment_accounts');
} else {
  console.log('Could not find fetch injection point');
}
