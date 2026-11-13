import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChatWidget, SUPPORT_AGENTS } from '@/components/ChatWidget';
import { apiPost } from '@/services/apiClient';

vi.mock('@/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  apiPost: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      brandName: 'CLICK2IT BD',
      contactPhone: '+8809640887777',
    },
  }),
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    items: [],
    total: 0,
  }),
}));

describe('ChatWidget 3 named support specialists & polished greeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defines 3 distinct Bangladeshi support specialists and rotates their name pill every 6.5s', () => {
    expect(SUPPORT_AGENTS).toHaveLength(3);
    expect(SUPPORT_AGENTS.map((a) => a.bnName)).toEqual([
      'নুসরাত জাহান',
      'তানভীর আহমেদ',
      'ফারহানা ইসলাম',
    ]);

    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatWidget />
      </MemoryRouter>
    );

    expect(screen.getByText('নুসরাত')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6500);
    });
    expect(screen.getByText('তানভীর')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6500);
    });
    expect(screen.getByText('ফারহানা')).toBeInTheDocument();
  });

  it('syncs the friendly welcome message to the active rotating specialist, keeps header strictly CLICK2IT BD, and forwards agentName to API', async () => {
    (apiPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      reply: 'অবশ্যই! আপনার জন্য সেরা অপশনগুলো দেখাচ্ছি।',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatWidget />
      </MemoryRouter>
    );

    // Advance to the 2nd specialist (তানভীর আহমেদ) before opening chat
    act(() => {
      vi.advanceTimersByTime(6500);
    });

    fireEvent.click(screen.getByRole('button', { name: /Open CLICK2IT BD Live Support/i }));

    // Blue header stays clean (no Assistant / AI labels)
    expect(screen.getByRole('heading', { name: 'CLICK2IT BD' })).toBeInTheDocument();

    // Active specialist name shown as sender label & warmly inside the welcome greeting
    const tanvirLabels = screen.getAllByText('তানভীর আহমেদ');
    expect(tanvirLabels.length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/আন্তরিক স্বাগতম/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/আপনার যেকোনো সহায়তায় পাশে আছি/i)
    ).toBeInTheDocument();

    // Send a customer message and verify context carries active specialist identity
    const input = screen.getByPlaceholderText(/প্রোডাক্ট, দাম, EMI বা অর্ডার নিয়ে প্রশ্ন লিখুন/i);
    fireEvent.change(input, { target: { value: 'SSD দাম কত?' } });
    await act(async () => {
      fireEvent.submit(input.closest('form')!);
    });

    expect(apiPost).toHaveBeenCalledWith(
      '/api/ai/chat',
      expect.objectContaining({
        message: 'SSD দাম কত?',
        context: expect.objectContaining({
          agentName: 'তানভীর আহমেদ',
          agentEnName: 'Tanvir Ahmed',
        }),
      })
    );

    // Resetting conversation transitions to the 3rd specialist (ফারহানা ইসলাম)
    fireEvent.click(screen.getByRole('button', { name: /Reset conversation/i }));
    const farhanaLabels = screen.getAllByText('ফারহানা ইসলাম');
    expect(farhanaLabels.length).toBeGreaterThanOrEqual(2);
  });
});
