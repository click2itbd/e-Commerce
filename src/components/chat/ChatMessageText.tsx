import React from 'react';
import { ChevronRight, ExternalLink, Info } from 'lucide-react';

export const CHAT_ROUTE_LABEL_MAP: Record<string, string> = {
  '/pc-build': 'Open PC Builder',
  '/emi-terms': 'View EMI Plans',
  '/track-order': 'Track Order',
  '/shop': 'Browse Shop',
  '/deals': 'Hot Deals',
  '/online-delivery': 'Delivery Info',
  '/warranty-policy': 'Warranty Policy',
  '/refund-policy': 'Refund Policy',
  '/checkout': 'Go to Checkout',
  '/cart': 'View Cart',
  '/projects': 'IT Solutions',
  '/contact': 'Contact Us',
  '/brands': 'Top Brands',
  '/pre-book': 'Pre-Book',
};

const KNOWN_ROUTES_PATTERN =
  '\\/(?:product\\/[a-zA-Z0-9_-]+|pc-build|emi-terms|track-order|shop|deals|online-delivery|warranty-policy|refund-policy|checkout|cart|projects|contact|brands|pre-book)';

const INLINE_TOKEN_REGEX = new RegExp(
  `(\\[[^\\]\\n]+\\]\\((?:${KNOWN_ROUTES_PATTERN}|https?:\\/\\/[^)\\s]+)\\)|\\*\\*\\*[^*\\n]+?\\*\\*\\*|\\*\\*[^*\\n]+?\\*\\*|__[^_\\n]+?__|\`[^\`\\n]+\`|\\*[^\\s*\\n](?:[^*\\n]*?[^\\s*\\n])?\\*|https?:\\/\\/[^\\s<>\\u0964]+|${KNOWN_ROUTES_PATTERN})`,
  'g'
);

type ParsedBlock =
  | { type: 'spacer' }
  | { type: 'divider' }
  | { type: 'heading'; text: string }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'ordered'; marker: string; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'paragraph'; text: string };

/**
 * Normalizes raw LLM / markdown output lines before block-level parsing so stray
 * code fences, HTML line breaks, or repeated blank lines never leak visibly.
 */
function preprocessLines(rawText: string): string[] {
  const normalized = rawText
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\n{3,}/g, '\n\n');

  const lines = normalized.split('\n');
  const cleaned: string[] = [];

  for (const line of lines) {
    // Drop fenced code delimiters like ``` or ```markdown cleanly
    if (/^\s*```[a-zA-Z0-9_-]*\s*$/.test(line)) {
      continue;
    }
    cleaned.push(line);
  }

  return cleaned;
}

function splitTableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|') && !trimmed.includes('-')) return false;
  const cells = splitTableCells(trimmed);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function unwrapOuterBold(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
    const inner = trimmed.slice(2, -2);
    if (!inner.includes('**')) return inner.trim();
  }
  return trimmed;
}

function stripLeadingMarkdownNoise(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, '')
    .replace(/^#{2,6}/, '')
    .trim();
}

/**
 * Converts a raw bot response string into structured semantic blocks
 * (headings, dividers, note callouts, lists, tables, and paragraphs).
 */
export function parseMessageBlocks(rawText: string): ParsedBlock[] {
  const lines = preprocessLines(rawText);
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer' });
      }
      i++;
      continue;
    }

    // Horizontal rules (---, ***, ___)
    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'divider') {
        blocks.push({ type: 'divider' });
      }
      i++;
      continue;
    }

    // Markdown headings (# Title, ### Title, ##Title)
    const headingMatch = trimmed.match(/^(?:#{2,6}\s*|#\s+)(.+?)\s*#*$/);
    if (headingMatch) {
      const headingText = unwrapOuterBold(headingMatch[1]);
      if (headingText) {
        blocks.push({ type: 'heading', text: headingText });
      }
      i++;
      continue;
    }

    // Blockquote lines grouped into a clean note callout card
    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        const cleanedLine = stripLeadingMarkdownNoise(lines[i].replace(/^\s*>\s?/, ''));
        if (cleanedLine) quoteLines.push(cleanedLine);
        i++;
      }
      if (quoteLines.length > 0) {
        blocks.push({ type: 'blockquote', lines: quoteLines });
      }
      continue;
    }

    // Markdown table block (Header | Header followed by |---|---|)
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      isTableSeparatorLine(lines[i + 1])
    ) {
      const headers = splitTableCells(trimmed);
      i += 2; // Skip header + separator row
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!isTableSeparatorLine(lines[i])) {
          rows.push(splitTableCells(lines[i]));
        }
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Ordered list item (supports ASCII 1. / 1) and Bengali ১. / ১))
    const orderedMatch = trimmed.match(/^([\d০-৯]{1,2})[.)]\s+(.+)$/);
    if (orderedMatch) {
      blocks.push({ type: 'ordered', marker: orderedMatch[1], text: orderedMatch[2] });
      i++;
      continue;
    }

    // Bullet list item (-, *, +, •)
    const bulletMatch = trimmed.match(/^[-*+•▪◦]\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({ type: 'bullet', text: bulletMatch[1] });
      i++;
      continue;
    }

    blocks.push({ type: 'paragraph', text: stripLeadingMarkdownNoise(trimmed) });
    i++;
  }

  // Trim leading/trailing spacers or trailing dividers
  while (blocks.length > 0 && blocks[blocks.length - 1].type === 'spacer') {
    blocks.pop();
  }
  while (blocks.length > 0 && blocks[0].type === 'spacer') {
    blocks.shift();
  }

  return blocks;
}

/**
 * Strips raw Markdown syntax into clean plain text suitable for Copy-to-Clipboard.
 */
export function stripMarkdownForCopy(rawText: string): string {
  return rawText
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*```[a-zA-Z0-9_-]*\s*$/gm, '')
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, '')
    .replace(/^\s*(?:#{2,6}\s*|#\s+)(.+?)\s*#*$/gm, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[([^\]\n]+)\]\(([^)\n]+)\)/g, '$1 ($2)')
    .replace(/\*\*\*([^*]+?)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/__([^_]+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface InlineRendererProps {
  text: string;
  onNavigateRoute: (path: string) => void;
}

function cleanExternalUrl(url: string): { href: string; trailing: string } {
  const match = url.match(/^(https?:\/\/[^\s<>]+?)([.,;:!?।)]*)$/);
  if (!match) return { href: url, trailing: '' };
  return { href: match[1], trailing: match[2] || '' };
}

function renderRouteChip(path: string, key: React.Key, onNavigateRoute: (p: string) => void, customLabel?: string) {
  const defaultLabel = path.startsWith('/product/')
    ? 'View Product'
    : CHAT_ROUTE_LABEL_MAP[path] || path;
  const label =
    customLabel && !customLabel.startsWith('/') && customLabel.length <= 40
      ? customLabel
      : defaultLabel;

  return (
    <button
      key={key}
      type="button"
      onClick={() => onNavigateRoute(path)}
      className="inline-flex items-center gap-0.5 mx-0.5 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0E2A47] hover:text-blue-800 font-semibold text-[11px] border border-blue-200/80 transition-colors cursor-pointer align-baseline shadow-[0_1px_1px_rgba(15,23,42,0.03)]"
    >
      <span>{label}</span>
      <ChevronRight size={11} className="text-blue-600 shrink-0" />
    </button>
  );
}

const InlineTokens: React.FC<InlineRendererProps> = ({ text, onNavigateRoute }) => {
  // Remove stray unbalanced bold tokens so raw '**' never leaks into UI
  const asteriskPairs = (text.match(/\*\*/g) || []).length;
  const normalizedText = asteriskPairs % 2 === 1 ? text.replace(/\*\*/g, '') : text;
  const parts = normalizedText.split(INLINE_TOKEN_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // 1. Markdown link [Label](target)
        const mdLinkMatch = part.match(/^\[([^\]\n]+)\]\(([^)\n]+)\)$/);
        if (mdLinkMatch) {
          const [, label, target] = mdLinkMatch;
          if (target.startsWith('/')) {
            return renderRouteChip(target, i, onNavigateRoute, label);
          }
          return (
            <a
              key={i}
              href={target}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>{label}</span>
              <ExternalLink size={10} className="shrink-0" />
            </a>
          );
        }

        // 2. Bold + Italic ***text***
        if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
          return (
            <strong key={i} className="font-semibold italic text-slate-900">
              <InlineTokens text={part.slice(3, -3)} onNavigateRoute={onNavigateRoute} />
            </strong>
          );
        }

        // 3. Bold **text** or __text__
        if (
          ((part.startsWith('**') && part.endsWith('**')) ||
            (part.startsWith('__') && part.endsWith('__'))) &&
          part.length > 4
        ) {
          return (
            <strong key={i} className="font-semibold text-slate-900">
              <InlineTokens text={part.slice(2, -2)} onNavigateRoute={onNavigateRoute} />
            </strong>
          );
        }

        // 4. Inline code `text`
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-[#0E2A47] font-mono text-[11px] font-semibold border border-slate-200/70"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // 5. Italic *text*
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <em key={i} className="italic text-slate-800">
              {part.slice(1, -1)}
            </em>
          );
        }

        // 6. Bare external URL
        if (part.startsWith('http://') || part.startsWith('https://')) {
          const { href, trailing } = cleanExternalUrl(part);
          return (
            <React.Fragment key={i}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5 break-all"
              >
                {href}
                <ExternalLink size={10} className="shrink-0" />
              </a>
              {trailing}
            </React.Fragment>
          );
        }

        // 7. Bare internal storefront route
        if (part.startsWith('/')) {
          return renderRouteChip(part, i, onNavigateRoute);
        }

        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

interface ChatMessageTextProps {
  text: string;
  onNavigateRoute: (path: string) => void;
}

/**
 * Renders customer-facing chatbot messages with structured headings, callout
 * notes, aligned lists, tables, and clickable storefront action chips without
 * leaking raw Markdown symbols (#, ---, >, backticks, etc.).
 */
export const ChatMessageText: React.FC<ChatMessageTextProps> = ({ text, onNavigateRoute }) => {
  const blocks = parseMessageBlocks(text);

  return (
    <div className="space-y-1.5 text-[12.5px] leading-[1.6] text-slate-700">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'spacer':
            return <div key={idx} className="h-1" />;

          case 'divider':
            return <div key={idx} className="my-2 border-t border-slate-200/80" role="separator" />;

          case 'heading':
            return (
              <h4
                key={idx}
                className="font-bold text-[#0E2A47] text-[12.5px] leading-snug pt-1.5 first:pt-0 pb-0.5 border-b border-slate-100"
              >
                <InlineTokens text={block.text} onNavigateRoute={onNavigateRoute} />
              </h4>
            );

          case 'blockquote':
            return (
              <div
                key={idx}
                className="my-1.5 rounded-xl bg-amber-50/75 border border-amber-200/80 border-l-[3px] border-l-amber-500 px-3 py-2 text-[12px] leading-relaxed text-slate-700 space-y-1"
              >
                {block.lines.map((line, lIdx) => (
                  <p key={lIdx} className="flex items-start gap-1.5">
                    {lIdx === 0 && !line.startsWith('💡') && !line.startsWith('⚠') && (
                      <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span className="flex-1">
                      <InlineTokens text={line} onNavigateRoute={onNavigateRoute} />
                    </span>
                  </p>
                ))}
              </div>
            );

          case 'ordered':
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-0.5">
                <span className="min-w-[18px] font-bold text-[#0E2A47] text-[11.5px] tabular-nums shrink-0 mt-[1px]">
                  {block.marker}.
                </span>
                <span className="flex-1">
                  <InlineTokens text={block.text} onNavigateRoute={onNavigateRoute} />
                </span>
              </div>
            );

          case 'bullet':
            return (
              <div key={idx} className="flex items-start gap-2 pl-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-[8px] shrink-0" />
                <span className="flex-1">
                  <InlineTokens text={block.text} onNavigateRoute={onNavigateRoute} />
                </span>
              </div>
            );

          case 'table':
            return (
              <div
                key={idx}
                className="my-1.5 overflow-x-auto rounded-lg border border-slate-200/80"
              >
                <table className="w-full text-left border-collapse text-[11.5px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80">
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-2.5 py-1.5 font-semibold text-[#0E2A47]">
                          <InlineTokens text={h} onNavigateRoute={onNavigateRoute} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="bg-white">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-2.5 py-1.5 text-slate-700 align-top">
                            <InlineTokens text={cell} onNavigateRoute={onNavigateRoute} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'paragraph':
          default:
            return (
              <p key={idx}>
                <InlineTokens text={block.text} onNavigateRoute={onNavigateRoute} />
              </p>
            );
        }
      })}
    </div>
  );
};
