import { doc, runTransaction, getDocs, query, collection, where, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function generateDocumentNumber(type: 'INV' | 'QUO' | 'CHA' | 'REC' | 'SR' | 'PR' | 'PUR' | 'purchase' | 'invoice' | 'sale_return'): Promise<string> {
  // Normalize types so different callers never fragment counters
  const normType = 
    type === 'invoice' ? 'INV' :
    type === 'purchase' ? 'PUR' :
    type === 'sale_return' ? 'SR' :
    type;

  const counterRef = doc(db, 'counters', normType);
  const collName = normType === 'PUR' ? 'purchases' : 'orders';
  const prefixRegex = new RegExp(`^${normType}-0*(\\d+)$`, 'i');

  // Check highest existing document number in Firestore so serial numbers never go backwards
  let maxExisting = 0;
  try {
    const [byDocNumSnap, byRecentSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, collName),
          where('documentNumber', '>=', `${normType}-`),
          where('documentNumber', '<=', `${normType}-\uf8ff`),
          orderBy('documentNumber', 'desc'),
          limit(20)
        )
      ),
      getDocs(
        query(
          collection(db, collName),
          orderBy('createdAt', 'desc'),
          limit(50)
        )
      ),
    ]);

    const extractMax = (snap: any) => {
      snap.forEach((d: any) => {
        const dn = String(d.data().documentNumber || d.data().invoiceNumber || '').trim();
        const match = dn.match(prefixRegex);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxExisting) maxExisting = n;
        }
      });
    };

    extractMax(byDocNumSnap);
    extractMax(byRecentSnap);
  } catch (err) {
    console.warn('Could not query highest existing document number, using counter:', err);
  }

  let candidateNumber = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let counterNumber = 0;

    if (counterDoc.exists()) {
      counterNumber = Number(counterDoc.data().lastNumber || 0);
    }

    // Always take the maximum between current counter and database so numbers are strictly ascending
    const baseNumber = Math.max(counterNumber, maxExisting);
    const newNumber = baseNumber + 1;

    transaction.set(counterRef, { lastNumber: newNumber }, { merge: true });

    return newNumber;
  });

  // Final collision guard: ensure no existing document already has this exact documentNumber
  let candidateDocNumber = `${normType}-${String(candidateNumber).padStart(5, '0')}`;
  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      const existingSnap = await getDocs(
        query(
          collection(db, collName),
          where('documentNumber', '==', candidateDocNumber),
          limit(1)
        )
      );
      if (existingSnap.empty) {
        break;
      }
      candidateNumber += 1;
      candidateDocNumber = `${normType}-${String(candidateNumber).padStart(5, '0')}`;
      await setDoc(counterRef, { lastNumber: candidateNumber }, { merge: true });
    }
  } catch (err) {
    console.warn('Collision check warning:', err);
  }

  return candidateDocNumber;
}
