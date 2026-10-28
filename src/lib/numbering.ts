import { doc, runTransaction, getDocs, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export async function generateDocumentNumber(type: 'INV' | 'QUO' | 'CHA' | 'REC' | 'SR' | 'PR' | 'PUR' | 'purchase' | 'invoice' | 'sale_return'): Promise<string> {
  // Normalize types so different callers never fragment counters
  const normType = 
    type === 'invoice' ? 'INV' :
    type === 'purchase' ? 'PUR' :
    type === 'sale_return' ? 'SR' :
    type;

  const counterRef = doc(db, 'counters', normType);

  // Check highest existing document number in Firestore so serial numbers never go backwards
  let maxExisting = 0;
  try {
    const collName = normType === 'PUR' ? 'purchases' : 'orders';
    const qSnap = await getDocs(
      query(
        collection(db, collName),
        where('documentNumber', '>=', `${normType}-`),
        where('documentNumber', '<=', `${normType}-\uf8ff`),
        orderBy('documentNumber', 'desc'),
        limit(5)
      )
    );
    qSnap.forEach(d => {
      const dn = (d.data().documentNumber || '').trim();
      const match = dn.match(new RegExp(`^${normType}-(\\d+)`, 'i'));
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxExisting) maxExisting = n;
      }
    });
  } catch (err) {
    console.warn('Could not query highest existing document number, using counter:', err);
  }

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let counterNumber = 0;

    if (counterDoc.exists()) {
      counterNumber = Number(counterDoc.data().lastNumber || 0);
    }

    // Always take the maximum between current counter and database so numbers are strictly ascending
    const baseNumber = Math.max(counterNumber, maxExisting);
    const newNumber = baseNumber + 1;

    transaction.set(counterRef, { lastNumber: newNumber }, { merge: true });

    return `${normType}-${String(newNumber).padStart(5, '0')}`;
  });
}
