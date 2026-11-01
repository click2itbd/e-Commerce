import { db } from '../firebase';
import { doc, setDoc, deleteField, WriteBatch } from 'firebase/firestore';

/**
 * Splits sensitive cost/vendor fields out of public product payloads
 * and stores them in the admin-only `product_costs/{productId}` collection.
 */
export function sanitizePublicProductData(productData: Record<string, any>, isUpdate: boolean = false): {
  publicData: Record<string, any>;
  privateCostData: Record<string, any>;
} {
  const publicData: Record<string, any> = { ...productData };
  const privateCostData: Record<string, any> = {};

  if ('costPrice' in publicData) {
    privateCostData.costPrice = Number(publicData.costPrice) || 0;
    if (isUpdate) {
      publicData.costPrice = deleteField();
    } else {
      delete publicData.costPrice;
    }
  }

  if ('vendorId' in publicData) {
    privateCostData.vendorId = publicData.vendorId || '';
    if (isUpdate) {
      publicData.vendorId = deleteField();
    } else {
      delete publicData.vendorId;
    }
  }

  if (Array.isArray(publicData.variants)) {
    const variantCosts: Record<string, number> = {};
    publicData.variants = publicData.variants.map((v: any) => {
      if (!v || typeof v !== 'object') return v;
      const cleanVariant = { ...v };
      if ('costPrice' in cleanVariant) {
        if (cleanVariant.id) {
          variantCosts[cleanVariant.id] = Number(cleanVariant.costPrice) || 0;
        }
        delete cleanVariant.costPrice;
      }
      return cleanVariant;
    });
    if (Object.keys(variantCosts).length > 0) {
      privateCostData.variantCosts = variantCosts;
    }
  }

  privateCostData.updatedAt = new Date().toISOString();

  return { publicData, privateCostData };
}

export async function saveProductPrivateCost(productId: string, privateCostData: Record<string, any>) {
  if (!productId || Object.keys(privateCostData).length <= 1) return; // only updatedAt
  await setDoc(doc(db, 'product_costs', productId), privateCostData, { merge: true });
}

export function addProductPrivateCostToBatch(batch: WriteBatch, productId: string, privateCostData: Record<string, any>) {
  if (!productId || Object.keys(privateCostData).length <= 1) return;
  batch.set(doc(db, 'product_costs', productId), privateCostData, { merge: true });
}

export function mergeProductsWithPrivateCosts<T extends { id: string }>(
  products: T[],
  costDocsMap: Map<string, any>
): T[] {
  return products.map(p => {
    const priv = costDocsMap.get(p.id);
    if (!priv) return p;
    const merged: any = { ...p };
    if (priv.costPrice !== undefined) {
      merged.costPrice = Number(priv.costPrice) || 0;
    }
    if (priv.vendorId !== undefined && !merged.vendorId) {
      merged.vendorId = priv.vendorId;
    }
    if (priv.variantCosts && Array.isArray(merged.variants)) {
      merged.variants = merged.variants.map((v: any) => ({
        ...v,
        costPrice: priv.variantCosts[v.id] ?? v.costPrice ?? 0,
      }));
    }
    return merged as T;
  });
}
