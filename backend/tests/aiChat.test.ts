import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

const sampleProducts = [
  {
    id: 'mon-lg-24',
    data: () => ({
      name: 'LG 24MK600M 24-Inch IPS Full HD Monitor',
      category: 'Monitor',
      brand: 'LG',
      price: 18500,
      discountPrice: 16900,
      stock: 6,
      warrantyMonths: 36,
      warrantyUnit: 'months',
      imageUrl: 'https://example.com/lg-monitor.jpg',
      specs: { Panel: 'IPS', RefreshRate: '75Hz' },
    }),
  },
  {
    id: 'ssd-samsung-980',
    data: () => ({
      name: 'Samsung 980 500GB NVMe M.2 SSD',
      category: 'SSD',
      brand: 'Samsung',
      price: 5500,
      discountPrice: 0,
      stock: 0,
      isOutOfStock: true,
      warrantyMonths: 3,
      warrantyUnit: 'years',
      imageUrl: 'https://example.com/ssd.jpg',
    }),
  },
];

vi.mock('../src/firebase/admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn((name: string) => {
      if (name === 'products') {
        return {
          get: vi.fn(async () => ({
            forEach: (cb: (doc: any) => void) => sampleProducts.forEach(cb),
          })),
        };
      }
      return {
        doc: vi.fn(() => ({
          get: vi.fn(async () => ({ exists: false, data: () => null })),
        })),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(async () => ({ empty: true, docs: [] })),
      };
    }),
  })),
  getAdminDocument: vi.fn(async (col: string, id: string) => {
    if (col === 'settings' && id === 'site') {
      return {
        exists: true,
        data: {
          brandName: 'CLICK2IT BD',
          contactPhone: '+8809640887777',
          contactEmail: 'info@click2itbd.com',
          address: 'Dhaka, Bangladesh',
        },
      };
    }
    return { exists: false, data: null };
  }),
  isUserAdmin: vi.fn(async () => false),
  isStaffOrAdmin: vi.fn(async () => false),
  isAdminDbAvailable: vi.fn(() => true),
  getAdminAuth: vi.fn(),
  setAdminDocument: vi.fn(),
}));

describe('Storefront AI Chat API (/api/ai/chat)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGenerateContent.mockReset();
    app = createApp();
  });

  it('matches Bengali Unicode product queries and returns rich product cards + Bengali follow-ups', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: 'আপনার বাজেটে **LG 24MK600M Monitor** রয়েছে মাত্র **৳16,900**। বিস্তারিত দেখুন: /product/mon-lg-24',
    });

    const res = await request(app)
      .post('/api/ai/chat')
      .send({
        message: '২০,০০০ টাকার মধ্যে ভালো মনিটর দেখাও',
        mode: 'storefront_chat',
        context: { currentPath: '/shop' },
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('/product/mon-lg-24');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products[0]).toMatchObject({
      id: 'mon-lg-24',
      finalPrice: 16900,
      inStock: true,
    });
    expect(res.body.followUps.length).toBeGreaterThan(0);
    expect(res.body.widget).toBeNull();
  });

  it('activates inline EMI calculator widget with extracted Bengali numeral amount', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: '১৬টি ব্যাংকের ক্রেডিট কার্ডে EMI সুবিধা রয়েছে। নিচে কিস্তির হিসাব দেখুন।',
    });

    const res = await request(app)
      .post('/api/ai/chat')
      .send({
        message: '৮০,০০০ টাকার পিসিতে EMI কিস্তি কত হবে?',
        mode: 'storefront_chat',
      });

    expect(res.status).toBe(200);
    expect(res.body.widget).toBe('emi_calculator');
    expect(res.body.suggestedAmount).toBe(80000);
  });

  it('activates inline order_tracker, coupon_checker, and callback_form intents', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'অবশ্যই, নিচে দেখুন।' });

    const trackRes = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'আমার অর্ডার ট্র্যাক করতে চাই', mode: 'storefront_chat' });
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.widget).toBe('order_tracker');

    const couponRes = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'check coupon code', mode: 'storefront_chat' });
    expect(couponRes.status).toBe(200);
    expect(couponRes.body.widget).toBe('coupon_checker');

    const cbRes = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'একজন মানুষের সাথে কথা বলতে চাই, কল করুন', mode: 'storefront_chat' });
    expect(cbRes.status).toBe(200);
    expect(cbRes.body.widget).toBe('callback_form');
  });

  it('uses viewed productId context and attaches that product card on price/warranty query', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: 'এই Samsung 980 SSD-র ওয়ারেন্টি ৩ বছর। বর্তমানে এটি স্টক আউট রয়েছে।',
    });

    const res = await request(app)
      .post('/api/ai/chat')
      .send({
        message: 'এটার ওয়ারেন্টি কতদিন এবং স্টক আছে?',
        mode: 'storefront_chat',
        context: {
          currentPath: '/product/ssd-samsung-980',
          productId: 'ssd-samsung-980',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].id).toBe('ssd-samsung-980');
    expect(res.body.products[0].inStock).toBe(false);
  });

  it('keeps backwards compatibility for mode=general (CRM callers)', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: 'High-intent B2B lead.',
    });

    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'Analyze lead: Corporate CCTV inquiry' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: 'High-intent B2B lead.' });
  });
});
