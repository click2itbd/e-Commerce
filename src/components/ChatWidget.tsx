import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageCircle,
  X,
  Send,
  ChevronRight,
  RefreshCw,
  Phone,
  CreditCard,
  Cpu,
  Truck,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { apiPost } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import {
  MatchedChatProduct,
  ChatWidgetType,
  ChatProductCards,
  ChatOrderTrackerCard,
  ChatEMICalculatorCard,
  ChatCouponCheckerCard,
  ChatCallbackFormCard,
} from './chat/ChatInteractiveCards';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  products?: MatchedChatProduct[];
  followUps?: string[];
  widget?: ChatWidgetType;
  suggestedAmount?: number;
  feedback?: 'up' | 'down';
}

interface ChatApiResponse {
  reply?: string;
  products?: MatchedChatProduct[];
  followUps?: string[];
  widget?: ChatWidgetType;
  suggestedAmount?: number;
}

const STORAGE_KEY = 'click2it_chat_history_v1';

const ROUTE_LABEL_MAP: Record<string, string> = {
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
};

const ECOMMERCE_STARTER_PROMPTS = [
  {
    icon: Cpu,
    label: 'Custom PC Build & Parts Advice',
    text: 'আমি একটি Custom PC বানাতে চাই। বাজেট অনুযায়ী সেরা পার্টস ও /pc-build সম্পর্কে সাজেস্ট করুন।',
  },
  {
    icon: CreditCard,
    label: 'Credit Card EMI (16 Banks, 3–36M)',
    text: 'Credit Card EMI সুবিধা সম্পর্কে বিস্তারিত জানতে চাই (কোন ব্যাংক ও কত মাসের কিস্তি আছে)?',
  },
  {
    icon: Truck,
    label: 'Order Tracking & Delivery Time',
    text: 'আমার অর্ডার ট্র্যাক করব কীভাবে এবং ঢাকা ও ঢাকার বাইরে ডেলিভারি চার্জ ও সময় কত?',
  },
  {
    icon: ShieldCheck,
    label: 'Product Price, Stock & Warranty',
    text: 'প্রোডাক্টের দাম, স্টক ও অফিশিয়াল ওয়ারেন্টি পলিসি সম্পর্কে জানতে চাই।',
  },
];

function formatWhatsAppPhone(rawPhone?: string): string {
  const digits = (rawPhone || '+8809640887777').replace(/[^0-9]/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  return `880${digits}`;
}

function getContextPrompt(pathname: string): { label: string; text: string } | null {
  if (pathname.startsWith('/pc-build')) {
    return {
      label: 'PC Build Compatibility & PSU Advice',
      text: 'PC Builder এ প্রসেসর, মাদারবোর্ড ও পাওয়ার সাপ্লাই (PSU) নির্বাচন নিয়ে পরামর্শ দিন।',
    };
  }
  if (pathname.startsWith('/checkout') || pathname.startsWith('/cart')) {
    return {
      label: 'Checkout, Delivery & EMI Help',
      text: 'চেকআউটে পেমেন্ট মেথড, ডেলিভারি চার্জ ও Credit Card EMI কীভাবে সিলেক্ট করব?',
    };
  }
  if (pathname.startsWith('/product/')) {
    return {
      label: 'Warranty, Delivery & EMI on this item',
      text: 'প্রোডাক্টের অফিশিয়াল ওয়ারেন্টি, ডেলিভারি সময় ও EMI সুবিধা সম্পর্কে জানতে চাই।',
    };
  }
  return null;
}

export const ChatWidget: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { items: cartItems, total: cartTotal } = useCart();

  const brandName = settings.brandName || 'CLICK2IT BD';
  const contactPhone = settings.contactPhone || '+8809640887777';
  const waNumber = formatWhatsAppPhone(contactPhone);

  const buildWelcomeMessage = (): Message => ({
    id: 'welcome-1',
    sender: 'bot',
    text: `আসসালামু আলাইকুম! 👋 **${brandName}**-এ স্বাগতম।\nপ্রোডাক্টের দাম, স্টক, **Custom PC Build**, **Credit Card EMI** বা অর্ডার সংক্রান্ত যেকোনো প্রশ্ন করতে পারেন।`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (m: any) => m && (m.sender === 'user' || m.sender === 'bot') && typeof m.text === 'string'
          );
          if (valid.length > 0) return valid;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [buildWelcomeMessage()];
  });

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoggedLeadRef = useRef(false);

  const contextStarter = useMemo(
    () => getContextPrompt(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-24)));
    } catch {
      // ignore storage quota errors
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsExpanded(true);
    };
    window.addEventListener('resize', handleResize);

    if (window.innerWidth < 768) {
      const timer = setTimeout(() => setIsExpanded(false), 3500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [messages, loading, isOpen]);

  // Hide widget on Admin Panel and POS routes
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/pos')) {
    return null;
  }

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    }).catch(() => {});
  };

  const navigateFromChat = (path: string) => {
    navigate(path);
    if (window.innerWidth < 640) setIsOpen(false);
  };

  const currentProductId = useMemo(() => {
    const match = location.pathname.match(/^\/product\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }, [location.pathname]);

  const lastUserMessageText = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
    return lastUser?.text || '';
  }, [messages]);

  const waPrefilledUrl = useMemo(() => {
    const baseText = lastUserMessageText
      ? `Assalamu Alaikum ${brandName}, I was chatting on your website regarding: "${lastUserMessageText.slice(0, 140)}"`
      : `Assalamu Alaikum ${brandName}, I need assistance.`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(baseText)}`;
  }, [waNumber, brandName, lastUserMessageText]);

  const handleOpenQuickWidget = (
    widget: Exclude<ChatWidgetType, null>,
    titleText: string,
    suggestedAmount?: number
  ) => {
    const quickMsg: Message = {
      id: `widget-${Date.now()}`,
      sender: 'bot',
      text: titleText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      widget,
      ...(suggestedAmount ? { suggestedAmount } : {}),
    };
    setMessages((prev) => [...prev, quickMsg]);
  };

  const handleMessageFeedback = (id: string, vote: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, feedback: vote } : m))
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historySnapshot = messages.slice(-8).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    // Log lead once per chat session to avoid Firestore spam
    if (!hasLoggedLeadRef.current) {
      hasLoggedLeadRef.current = true;
      try {
        addDoc(collection(db, 'leads'), {
          userId: user?.uid || 'guest',
          name: user?.displayName || 'Live Chat Visitor',
          email: user?.email || '',
          initialMessage: text,
          pagePath: location.pathname,
          source: 'floating_live_chat',
          status: 'new',
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      } catch {
        // ignore lead log error
      }
    }

    try {
      const data = await apiPost<ChatApiResponse>('/api/ai/chat', {
        message: text,
        mode: 'storefront_chat',
        history: historySnapshot,
        context: {
          currentPath: location.pathname,
          pageTitle: document.title,
          cartCount: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
          cartTotal,
          productId: currentProductId,
        },
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text:
          data.reply ||
          `ধন্যবাদ! আমাদের টিম আপনাকে সহায়তা করতে প্রস্তুত। যেকোনো জরুরি প্রয়োজনে **${contactPhone}** নম্বরে কল বা WhatsApp করতে পারেন।`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        products: Array.isArray(data.products) ? data.products : undefined,
        followUps: Array.isArray(data.followUps) ? data.followUps : undefined,
        widget: data.widget || null,
        suggestedAmount: data.suggestedAmount,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `দুঃখিত, এই মুহূর্তে AI সার্ভারে সাময়িক সংযোগ সমস্যা হচ্ছে।\n\nতাৎক্ষণিক সহায়তার জন্য সরাসরি কল করুন **${contactPhone}**, **WhatsApp** বা নিচে থেকে কলব্যাক রিকোয়েস্ট পাঠান:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        widget: 'callback_form',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    hasLoggedLeadRef.current = false;
    const fresh = [buildWelcomeMessage()];
    setMessages(fresh);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const renderInlineTokens = (line: string) => {
    // Match **bold**, external URLs, or internal route paths (/pc-build, /product/xyz, /emi-terms, etc.)
    const tokenRegex =
      /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|\/(?:product\/[a-zA-Z0-9_-]+|pc-build|emi-terms|track-order|shop|deals|online-delivery|warranty-policy|refund-policy|checkout|cart|projects|contact|brands|pre-book))/g;
    const parts = line.split(tokenRegex);

    return parts.map((part, i) => {
      if (!part) return null;

      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5 break-all"
          >
            {part}
            <ExternalLink size={10} className="shrink-0" />
          </a>
        );
      }

      if (part.startsWith('/')) {
        const label = part.startsWith('/product/')
          ? 'View Product'
          : ROUTE_LABEL_MAP[part] || part;
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              navigate(part);
              if (window.innerWidth < 640) setIsOpen(false);
            }}
            className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200/70 transition-colors cursor-pointer align-baseline"
          >
            <span>{label}</span>
            <ChevronRight size={11} />
          </button>
        );
      }

      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const renderBotText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5">
        {lines.map((rawLine, idx) => {
          const trimmed = rawLine.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = trimmed.slice(2);
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <span className="flex-1">{renderInlineTokens(content)}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInlineTokens(rawLine)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 font-sans">
      {!isOpen ? (
        /* Floating Launcher Button */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => {
            if (window.innerWidth < 768) setIsExpanded(false);
          }}
          className={`group flex items-center bg-gradient-to-r from-[#0E2A47] to-[#1d4ed8] hover:from-[#0b223a] hover:to-[#1e40af] text-white rounded-full shadow-lg shadow-blue-900/25 hover:shadow-blue-900/35 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/10 ${
            isExpanded ? 'py-2.5 pl-3.5 pr-4 sm:py-3 sm:pl-4 sm:pr-5' : 'p-2.5 sm:p-3'
          }`}
          aria-label="Open Live Chat"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
          </div>
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              isExpanded ? 'max-w-[130px] opacity-100 ml-2.5' : 'max-w-0 opacity-0 ml-0'
            }`}
          >
            <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap flex items-center gap-1">
              <span>Ask AI / Help</span>
            </span>
          </div>
        </button>
      ) : (
        /* Upgraded Storefront Chat Window */
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-[calc(100vw-24px)] max-w-[395px] sm:w-[400px] h-[min(560px,80dvh)] max-h-[84dvh] flex flex-col border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Branded Header */}
          <div className="bg-gradient-to-r from-[#0E2A47] via-[#123558] to-[#1a4977] px-4 py-3 flex justify-between items-center shrink-0 text-white shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0E2A47] rounded-full" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm leading-tight truncate">
                  {brandName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <a
                href={waPrefilledUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 hover:text-white rounded-lg transition-colors"
                title="Continue on WhatsApp"
                aria-label="Chat on WhatsApp"
              >
                <MessageCircle size={15} />
              </a>
              <a
                href={`tel:${contactPhone}`}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white rounded-lg transition-colors"
                title={`Call ${contactPhone}`}
                aria-label="Call Support"
              >
                <Phone size={14} />
              </a>
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 hover:bg-white/15 text-blue-100 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="New conversation"
                aria-label="Reset conversation"
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 text-blue-100 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/70 text-xs">
            {messages.map((msg, msgIdx) => {
              const isUser = msg.sender === 'user';
              const isLatestBot = !isUser && msgIdx === messages.length - 1;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-[#0E2A47]/10 text-[#0E2A47] flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={13} />
                    </div>
                  )}

                  <div className={`${isUser ? 'max-w-[84%]' : 'max-w-[90%] w-full'} group/msg`}>
                    <div
                      className={`p-3 rounded-2xl leading-relaxed text-xs ${
                        isUser
                          ? 'bg-gradient-to-r from-[#0E2A47] to-[#1a4977] text-white rounded-br-xs whitespace-pre-line shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200/70 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {isUser ? msg.text : renderBotText(msg.text)}
                    </div>

                    {/* Interactive Rich Product Cards */}
                    {!isUser && msg.products && msg.products.length > 0 && (
                      <ChatProductCards
                        products={msg.products}
                        onNavigate={navigateFromChat}
                        onCalculateEmi={(price, name) =>
                          handleOpenQuickWidget(
                            'emi_calculator',
                            `**${name}**-এর জন্য নিচের ১৬ ব্যাংকের EMI কিস্তি হিসাব করুন:`,
                            price
                          )
                        }
                      />
                    )}

                    {/* Inline Interactive Action Card */}
                    {!isUser && msg.widget === 'order_tracker' && (
                      <ChatOrderTrackerCard onNavigate={navigateFromChat} />
                    )}
                    {!isUser && msg.widget === 'emi_calculator' && (
                      <ChatEMICalculatorCard
                        initialAmount={msg.suggestedAmount || (cartTotal >= 5000 ? cartTotal : 50000)}
                        onNavigate={navigateFromChat}
                      />
                    )}
                    {!isUser && msg.widget === 'coupon_checker' && (
                      <ChatCouponCheckerCard />
                    )}
                    {!isUser && msg.widget === 'callback_form' && (
                      <ChatCallbackFormCard
                        initialNote={lastUserMessageText}
                        pagePath={location.pathname}
                        waUrl={waPrefilledUrl}
                      />
                    )}

                    {/* Message Timestamp + Copy + Helpful Feedback */}
                    <div
                      className={`flex items-center gap-2 mt-1 px-1 ${
                        isUser ? 'justify-end' : 'justify-between'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      {!isUser && msg.id !== 'welcome-1' && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMessageFeedback(msg.id, 'up')}
                              className={`p-0.5 rounded transition-colors cursor-pointer ${
                                msg.feedback === 'up'
                                  ? 'text-emerald-600'
                                  : 'text-slate-300 hover:text-slate-500'
                              }`}
                              title="Helpful"
                              aria-label="Helpful reply"
                            >
                              <ThumbsUp size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleMessageFeedback(msg.id, 'down');
                                handleOpenQuickWidget(
                                  'callback_form',
                                  'দুঃখিত, উত্তরটি পর্যাপ্ত না হলে সরাসরি আমাদের সাপোর্ট টিমের সাথে কথা বলুন অথবা কলব্যাক রিকোয়েস্ট পাঠান:'
                                );
                              }}
                              className={`p-0.5 rounded transition-colors cursor-pointer ${
                                msg.feedback === 'down'
                                  ? 'text-rose-500'
                                  : 'text-slate-300 hover:text-slate-500'
                              }`}
                              title="Need human support"
                              aria-label="Request human help"
                            >
                              <ThumbsDown size={11} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="opacity-70 sm:opacity-0 group-hover/msg:opacity-100 focus:opacity-100 text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 transition-opacity cursor-pointer"
                            title="Copy reply"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={10} className="text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={10} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Follow-up Suggestion Chips */}
                    {isLatestBot && !loading && msg.followUps && msg.followUps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.followUps.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleSendMessage(chip)}
                            className="text-[10px] font-semibold text-[#0E2A47] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer text-left"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 justify-start items-center">
                <div className="w-6 h-6 rounded-full bg-[#0E2A47]/10 text-[#0E2A47] flex items-center justify-center shrink-0">
                  <Bot size={13} />
                </div>
                <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-bl-xs border border-slate-200/70 shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0E2A47] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0E2A47] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0E2A47] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            {/* Quick Starter Topics (Shown on fresh conversation) */}
            {messages.length === 1 && (
              <div className="pt-1.5 space-y-2">
                {contextStarter && (
                  <button
                    type="button"
                    onClick={() => handleSendMessage(contextStarter.text)}
                    className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50/70 hover:from-orange-100/80 hover:to-amber-100/60 border border-orange-200 text-orange-900 text-xs font-semibold transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-orange-500 shrink-0" />
                      <span>{contextStarter.label}</span>
                    </span>
                    <ChevronRight
                      size={13}
                      className="text-orange-400 group-hover:translate-x-0.5 transition-transform shrink-0"
                    />
                  </button>
                )}

                <p className="text-[11px] font-semibold text-slate-400 px-1">
                  জনপ্রিয় বিষয়সমূহ (Quick Topics):
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {ECOMMERCE_STARTER_PROMPTS.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleSendMessage(prompt.text)}
                        className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-slate-700 hover:text-[#0E2A47] text-xs font-medium transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-blue-100/80 text-[#0E2A47] flex items-center justify-center shrink-0 transition-colors">
                            <Icon size={13} />
                          </span>
                          <span>{prompt.label}</span>
                        </span>
                        <ChevronRight
                          size={13}
                          className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Instant Action & Store Shortcut Strip */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() =>
                handleOpenQuickWidget(
                  'emi_calculator',
                  'নিচের ক্যালকুলেটরে পরিমাণ ও ব্যাংক সিলেক্ট করে মাসিক EMI কিস্তি দেখে নিন:',
                  cartTotal >= 5000 ? cartTotal : 50000
                )
              }
              className="text-[10px] font-semibold text-slate-700 hover:text-[#0E2A47] bg-orange-50 hover:bg-orange-100 border border-orange-200/70 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              💳 EMI Calc
            </button>
            <button
              type="button"
              onClick={() =>
                handleOpenQuickWidget(
                  'order_tracker',
                  'আপনার Order ID এবং ফোন নম্বর দিয়ে সরাসরি স্ট্যাটাস চেক করুন:'
                )
              }
              className="text-[10px] font-semibold text-slate-700 hover:text-[#0E2A47] bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              📦 Track Order
            </button>
            <button
              type="button"
              onClick={() =>
                handleOpenQuickWidget(
                  'coupon_checker',
                  'আপনার Promo / Coupon কোডটি এখানে যাচাই করে কার্টে যোগ করুন:'
                )
              }
              className="text-[10px] font-semibold text-slate-700 hover:text-[#0E2A47] bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              🎟️ Coupon
            </button>
            <button
              type="button"
              onClick={() => navigateFromChat('/pc-build')}
              className="text-[10px] font-semibold text-slate-700 hover:text-[#0E2A47] bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              🖥️ PC Builder
            </button>
            <button
              type="button"
              onClick={() =>
                handleOpenQuickWidget(
                  'callback_form',
                  'সরাসরি আমাদের টিমের কাছ থেকে কল পেতে আপনার নম্বর দিন:'
                )
              }
              className="text-[10px] font-semibold text-slate-700 hover:text-[#0E2A47] bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              📞 Callback
            </button>
          </div>

          {/* Sleek Input Footer */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-slate-100 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white border border-slate-200 focus-within:border-[#0E2A47] focus-within:ring-2 focus-within:ring-[#0E2A47]/10 rounded-2xl px-3 py-1.5 transition-all"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                maxLength={1000}
                placeholder="প্রোডাক্ট, দাম, EMI বা অর্ডার নিয়ে প্রশ্ন লিখুন..."
                className="flex-1 bg-transparent py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="w-8 h-8 rounded-xl bg-[#0E2A47] hover:bg-[#1a4977] disabled:opacity-30 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                title="Send message"
              >
                <Send size={13} className="translate-x-px" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
