import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PromoBentoGrid } from '@/components/home/HomeSections';

vi.mock('@/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  onSnapshot: vi.fn((_q: any, cb: (snap: any) => void) => {
    // Simulate legacy seed store_banners in Firestore
    cb({
      docs: [
        {
          id: 'legacy-left',
          data: () => ({
            position: 'promo_banner',
            order: 0,
            isActive: true,
            title: 'Premium Gaming Laptops',
            imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1000',
            targetUrl: '/category/laptop',
          }),
        },
        {
          id: 'legacy-right',
          data: () => ({
            position: 'promo_banner',
            order: 1,
            isActive: true,
            title: 'Gaming Accessories',
            imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=1000',
            targetUrl: '/category/accessories',
          }),
        },
      ],
    });
    return () => {};
  }),
}));

describe('PromoBentoGrid featured product banners', () => {
  it('renders Monitor & WD Purple 4TB text overlays and connects directly to product pages', () => {
    render(
      <MemoryRouter>
        <PromoBentoGrid />
      </MemoryRouter>
    );

    expect(screen.getByText(/Value-Top X22IFR100/i)).toBeInTheDocument();
    expect(screen.getByText(/100Hz FHD IPS Monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/8,600/)).toBeInTheDocument();
    expect(screen.getByText(/WD Purple 4TB/i)).toBeInTheDocument();
    expect(screen.getByText(/Surveillance Hard Disk/i)).toBeInTheDocument();
    expect(screen.getByText(/25,500/)).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/product/NklFu19GnV9irMMt2q7X');
    expect(hrefs).toContain('/product/CY4nYT9KsuJzrwGh0NfF');
  });
});
