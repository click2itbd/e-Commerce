const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/tabs/services/Services.tsx', 'utf8');

const targetStr = "  const printServiceReceipt = async (record: ServiceRecord) => {";
const injectStr = `  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this service record?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success('Service record deleted successfully');
    } catch (err) {
      console.error('Error deleting service:', err);
      toast.error('Failed to delete service record');
    }
  };

  const printServiceReceipt = async (record: ServiceRecord) => {`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, injectStr);
    
    // Also make sure deleteDoc is imported
    if (!code.includes('deleteDoc')) {
        code = code.replace("import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';", "import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';");
    }
    
    fs.writeFileSync('src/pages/admin/tabs/services/Services.tsx', code);
    console.log('Added handleDeleteService successfully');
} else {
    console.log('Could not find target string');
}
