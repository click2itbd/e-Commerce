export type SiteContext = 'ecommerce' | 'pc-build' | 'hosting';

const STORAGE_KEY = 'lastSiteContext';
let memoryContext: SiteContext | null = null;

export function getSiteContext(): SiteContext {
  if (memoryContext) return memoryContext;
  return (localStorage.getItem(STORAGE_KEY) as SiteContext) || 'hosting';
}

export function setSiteContext(ctx: SiteContext): void {
  memoryContext = ctx;
  localStorage.setItem(STORAGE_KEY, ctx);
}

export function useSiteContext(): SiteContext {
  return getSiteContext();
}
