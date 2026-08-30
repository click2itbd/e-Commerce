const fs = require('fs');
let file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const wipeCode = `
  useEffect(() => {
    const wipeData = async () => {
      if (localStorage.getItem('wiped_v2')) return;
      try {
        const collections = ['transactions', 'orders', 'purchases', 'quotations', 'sold_serials'];
        for (const col of collections) {
          const snap = await getDocs(collection(db, col));
          for (const docSnap of snap.docs) {
            await deleteDoc(doc(db, col, docSnap.id));
          }
        }
        const prodSnap = await getDocs(collection(db, 'products'));
        for (const docSnap of prodSnap.docs) {
          await updateDoc(doc(db, 'products', docSnap.id), { stock: 0, availableSerials: [] });
        }
        localStorage.setItem('wiped_v2', 'true');
        toast.success('Data fully wiped from client cache & server!');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        console.error(err);
      }
    };
    wipeData();
  }, []);
`;

content = content.replace(
  'const debouncedFetchData = useCallback(',
  wipeCode + '\n  const debouncedFetchData = useCallback('
);

fs.writeFileSync(file, content, 'utf8');
