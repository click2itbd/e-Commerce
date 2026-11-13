import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ChatMessageText,
  parseMessageBlocks,
  stripMarkdownForCopy,
} from '@/components/chat/ChatMessageText';

describe('ChatMessageText formatting & sanitization', () => {
  it('renders headings, dividers, blockquotes, ordered steps, and route chips without raw #, ---, or >', () => {
    const rawReply = [
      '### 🏦 অনুমোদিত ১৬টি ব্যাংক:',
      '1. City Bank',
      '2. BRAC Bank',
      '---',
      '### 💳 কীভাবে EMI অর্ডার করবেন?',
      '1. সরাসরি আমাদের /checkout পেজে যান।',
      '2. পেমেন্ট মেথড হিসেবে **Credit Card EMI** নির্বাচন করুন।',
      '> 💡 নোট: নিচের ক্যালকুলেটরে কিস্তি দেখে নিতে পারেন। বিস্তারিত: /emi-terms।',
    ].join('\n');

    const onNavigate = vi.fn();
    const { container } = render(
      <ChatMessageText text={rawReply} onNavigateRoute={onNavigate} />
    );

    const renderedText = container.textContent || '';
    expect(renderedText).not.toContain('###');
    expect(renderedText).not.toContain('---');
    expect(renderedText).not.toContain('> ');
    expect(renderedText).toContain('অনুমোদিত ১৬টি ব্যাংক:');
    expect(renderedText).toContain('কীভাবে EMI অর্ডার করবেন?');
    expect(renderedText).toContain('Credit Card EMI');

    expect(container.querySelectorAll('h4')).toHaveLength(2);
    expect(container.querySelectorAll('[role="separator"]')).toHaveLength(1);

    const checkoutBtn = screen.getByRole('button', { name: /Go to Checkout/i });
    fireEvent.click(checkoutBtn);
    expect(onNavigate).toHaveBeenCalledWith('/checkout');

    const emiBtn = screen.getByRole('button', { name: /View EMI Plans/i });
    fireEvent.click(emiBtn);
    expect(onNavigate).toHaveBeenCalledWith('/emi-terms');
  });

  it('renders markdown links, inline code, tables, and strips unmatched bold markers safely', () => {
    const rawReply = [
      'কুপন কোড `SAVE500` ব্যবহার করে [চেকআউটে যান](/checkout) এবং অর্ডার করুন।',
      '',
      '| মেয়াদ | চার্জ |',
      '|---|---|',
      '| 6 মাস | 5.75% |',
      '| 12 মাস | 10.25% |',
      '',
      'অসম্পূর্ণ **বোল্ড টেক্সট',
    ].join('\n');

    const { container } = render(
      <ChatMessageText text={rawReply} onNavigateRoute={vi.fn()} />
    );

    expect(container.querySelector('code')?.textContent).toBe('SAVE500');
    expect(screen.getByRole('button', { name: /চেকআউটে যান/i })).toBeInTheDocument();
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.textContent).not.toContain('**');
    expect(container.textContent).not.toContain('[');
  });

  it('parses blocks cleanly and strips markdown artifacts when copying text', () => {
    const raw = '### শর্তাবলি\n---\n> নোট: **অফিশিয়াল ওয়ারেন্টি** প্রযোজ্য।\n1. প্রথম ধাপ `/shop` ভিজিট করুন [Shop](/shop)';
    const blocks = parseMessageBlocks(raw);
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'divider', 'blockquote', 'ordered']);

    const copied = stripMarkdownForCopy(raw);
    expect(copied).not.toContain('###');
    expect(copied).not.toContain('---');
    expect(copied).not.toContain('>');
    expect(copied).not.toContain('**');
    expect(copied).not.toContain('`');
    expect(copied).toContain('শর্তাবলি');
    expect(copied).toContain('অফিশিয়াল ওয়ারেন্টি');
  });
});
