import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  OrderByDirection,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface PaginationOptions {
  collectionName: string;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  orderByField?: string;
  orderDirection?: OrderByDirection;
  additionalConstraints?: QueryConstraint[];
}

export interface PaginationResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  totalFetched: number;
}

/**
 * Enterprise-grade cursor-based pagination helper for Firestore.
 * Prevents loading entire collections into memory and only fetches the requested page.
 */
export async function fetchPaginatedData<T>({
  collectionName,
  pageSize = 20,
  lastDoc = null,
  orderByField = 'createdAt',
  orderDirection = 'desc',
  additionalConstraints = [],
}: PaginationOptions): Promise<PaginationResult<T>> {
  try {
    const colRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [
      ...additionalConstraints,
      orderBy(orderByField, orderDirection),
    ];

    // Cursor positioning
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // Fetch 1 extra document to accurately determine if there is a next page
    constraints.push(limit(pageSize + 1));

    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const data = pageDocs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as T[];

    const newLastDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

    return {
      data,
      lastDoc: newLastDoc,
      hasMore,
      totalFetched: data.length,
    };
  } catch (error) {
    console.error(`[Pagination] Error fetching paginated ${collectionName}:`, error);
    throw error;
  }
}
