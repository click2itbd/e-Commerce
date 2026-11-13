import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
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
import supportAvatar1 from '../assets/support-avatar.jpg';
import supportAvatar2 from '../assets/support-avatar-2.jpg';
import supportAvatar3 from '../assets/support-avatar-3.jpg';
import {
  MatchedChatProduct,
  ChatWidgetType,
  ChatProductCards,
  ChatOrderTrackerCard,
  ChatEMICalculatorCard,
  ChatCouponCheckerCard,
  ChatCallbackFormCard,
} from './chat/ChatInteractiveCards';
import { ChatMessageText, stripMarkdownForCopy } from './chat/ChatMessageText';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  agentIndex?: number;
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

export interface SupportAgent {
  id: string;
  bnName: string;
  enName: string;
  shortName: string;
  avatar: string;
}

export const SUPPORT_AGENTS: SupportAgent[] = [
  {
    id: 'nusrat',
    bnName: 'নুসরাত জাহান',
    enName: 'Nusrat Jahan',
    shortName: 'নুসরাত',
    avatar: supportAvatar1,
  },
  {
    id: 'tanvir',
    bnName: 'তানভীর আহমেদ',
    enName: 'Tanvir Ahmed',
    shortName: 'তানভীর',
    avatar: supportAvatar2,
  },
  {
    id: 'farhana',
    bnName: 'ফারহানা ইসলাম',
    enName: 'Farhana Islam',
    shortName: 'ফারহানা',
    avatar: supportAvatar3,
  },
];

const STORAGE_KEY = 'click2it_chat_history_v2';
const GREETING_DISMISSED_KEY = 'click2it_chat_greeting_dismissed_v1';

const ECOMMERCE_STARTER_PROMPTS = [
  {
    icon: Cpu,
    label: 'Custom PC Build & Parts Advice',
    text: 'আমি একটি Custom PC বানাতে চাই। বাজেট অনুযায়ী সেরা কনফিগারেশন ও পার্টস সাজেস্ট করুন।',
  },
  {
    icon: CreditCard,
    label: 'Credit Card EMI (16 Banks, 3–36M)',
    text: 'Credit Card EMI সুবিধা সম্পর্কে বিস্তারিত জানতে চাই (ব্যাংক তালিকা, মেয়াদ ও চার্জ)।',
  },
  {
    icon: Truck,
    label: 'Order Tracking & Delivery Time',
    text: 'আমার অর্ডারটি কীভাবে ট্র্যাক করব এবং ঢাকা ও ঢাকার বাইরে ডেলিভারি চার্জ ও সময়সীমা কত?',
  },
  {
    icon: ShieldCheck,
    label: 'Product Price, Stock & Warranty',
    text: 'প্রোডাক্টের মূল্য, স্টক এবং অফিশিয়াল ওয়ারেন্টি পলিসি সম্পর্কে জানতে চাই।',
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

  const buildWelcomeMessage = (agentIdx = 0): Message => {
    const normalizedIdx = Math.abs(agentIdx) % SUPPORT_AGENTS.length;
    const agent = SUPPORT_AGENTS[normalizedIdx];
    return {
      id: 'welcome-1',
      sender: 'bot',
      agentIndex: normalizedIdx,
      text: `আসসালামু আলাইকুম! **${brandName}**-এ আপনাকে আন্তরিক স্বাগতম। 😊\nআমি **${agent.bnName}** বলছি—আপনার যেকোনো সহায়তায় পাশে আছি।\n\nপ্রোডাক্টের মূল্য ও স্টক, **Custom PC Build**, **Credit Card EMI** কিংবা আপনার অর্ডার সংক্রান্ত যেকোনো বিষয়ে নির্দ্বিধায় জিজ্ঞাসা করুন।`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

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
    return [buildWelcomeMessage(0)];
  });

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGreeting, setShowGreeting] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(GREETING_DISMISSED_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [avatarIndex, setAvatarIndex] = useState(0);
  const currentSupportAgent = SUPPORT_AGENTS[avatarIndex % SUPPORT_AGENTS.length];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoggedLeadRef = useRef(false);

  const contextStarter = useMemo(
    () => getContextPrompt(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    if (isOpen) return;
    const timer = setInterval(() => {
      setAvatarIndex((prev) => (prev + 1) % SUPPORT_AGENTS.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-24)));
    } catch {
      // ignore storage quota errors
    }
  }, [messages]);

  const handleDismissGreeting = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGreeting(false);
    try {
      sessionStorage.setItem(GREETING_DISMISSED_KEY, '1');
    } catch {
      // ignore storage errors
    }
  };

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
    const cleanText = stripMarkdownForCopy(text);
    navigator.clipboard?.writeText(cleanText).then(() => {
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

  const handleOpenChat = () => {
    setIsOpen(true);
    setMessages((prev) =>
      prev.length === 1 && prev[0].id === 'welcome-1'
        ? [buildWelcomeMessage(avatarIndex)]
        : prev
    );
  };

  const handleOpenQuickWidget = (
    widget: Exclude<ChatWidgetType, null>,
    titleText: string,
    suggestedAmount?: number
  ) => {
    const quickMsg: Message = {
      id: `widget-${Date.now()}`,
      sender: 'bot',
      agentIndex: avatarIndex,
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
          agentName: currentSupportAgent.bnName,
          agentEnName: currentSupportAgent.enName,
        },
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        agentIndex: avatarIndex,
        text:
          data.reply ||
          `ধন্যবাদ! আমি **${currentSupportAgent.bnName}** বলছি—আপনাকে সহায়তা করতে প্রস্তুত। যেকোনো জরুরি প্রয়োজনে **${contactPhone}** নম্বরে কল বা WhatsApp করতে পারেন।`,
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
        agentIndex: avatarIndex,
        text: `দুঃখিত, এই মুহূর্তে তাৎক্ষণিক সংযোগে সাময়িক বিলম্ব হচ্ছে।\n\nদ্রুত সহায়তার জন্য সরাসরি কল করুন **${contactPhone}**, **WhatsApp** করুন অথবা নিচে থেকে কলব্যাক রিকোয়েস্ট পাঠান:`,
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
    const nextIdx = (avatarIndex + 1) % SUPPORT_AGENTS.length;
    setAvatarIndex(nextIdx);
    const fresh = [buildWelcomeMessage(nextIdx)];
    setMessages(fresh);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed bottom-4 right-3 sm:bottom-5 sm:right-5 z-50 font-sans">
      {!isOpen ? (
        /* Floating Support Avatar & Greeting Speech Bubble */
        <div className="flex items-center gap-2.5 sm:gap-3">
          {showGreeting && (
            <div className="relative animate-in fade-in slide-in-from-right-3 duration-300">
              <button
                type="button"
                onClick={handleDismissGreeting}
                className="absolute -top-2 -left-2 z-10 w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/90 shadow-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
                aria-label="Close greeting bubble"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleOpenChat}
                className="relative bg-white hover:bg-slate-50/90 text-slate-800 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-[0_6px_24px_rgba(15,23,42,0.14)] border border-slate-200/70 text-center leading-snug cursor-pointer transition-all hover:shadow-[0_8px_28px_rgba(15,23,42,0.18)]"
                aria-label="Open support chat"
              >
                <span className="block text-[12px] sm:text-[13px] font-semibold text-slate-800 whitespace-nowrap">
                  স্যার, কিভাবে সহযোগিতা
                </span>
                <span className="block text-[12px] sm:text-[13px] font-semibold text-slate-800">
                  করতে পারি?
                </span>
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-r border-t border-slate-200/70 rotate-45"
                />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleOpenChat}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.22)] hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0"
            aria-label={`Open ${brandName} Live Support — ${currentSupportAgent.bnName}`}
            title={`${currentSupportAgent.bnName} — ${brandName}`}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden">
              {SUPPORT_AGENTS.map((agent, idx) => (
                <img
                  key={agent.id}
                  src={agent.avatar}
                  alt={`${agent.bnName} — ${brandName}`}
                  className={`absolute inset-0 w-full h-full rounded-full object-cover object-top transition-all duration-700 ease-in-out ${
                    idx === avatarIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                />
              ))}
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-500 border-2 border-white shadow-xs" />
            </span>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-[1px] rounded-full bg-[#0E2A47] text-white text-[10px] font-semibold leading-tight tracking-tight border border-white shadow-xs whitespace-nowrap pointer-events-none">
              {currentSupportAgent.shortName}
            </span>
          </button>
        </div>
      ) : (
        /* Upgraded Storefront Chat Window */
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-[calc(100vw-24px)] max-w-[395px] sm:w-[400px] h-[min(560px,80dvh)] max-h-[84dvh] flex flex-col border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Branded Header */}
          <div className="bg-gradient-to-r from-[#0E2A47] via-[#123558] to-[#1a4977] px-4 py-3 flex justify-between items-center shrink-0 text-white shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={currentSupportAgent.avatar}
                  alt={currentSupportAgent.bnName}
                  title={`${currentSupportAgent.bnName} (${brandName})`}
                  className="w-9 h-9 rounded-full object-cover object-top border border-white/25 bg-white"
                />
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
              const resolvedAgentIdx =
                typeof msg.agentIndex === 'number'
                  ? Math.abs(msg.agentIndex) % SUPPORT_AGENTS.length
                  : avatarIndex;
              const msgAgent = SUPPORT_AGENTS[resolvedAgentIdx] || currentSupportAgent;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <img
                      src={msgAgent.avatar}
                      alt={msgAgent.bnName}
                      className="w-6 h-6 rounded-full object-cover object-top border border-slate-200 shrink-0 mt-4 bg-white"
                    />
                  )}

                  <div className={`${isUser ? 'max-w-[84%]' : 'max-w-[90%] w-full'} group/msg`}>
                    {!isUser && (
                      <span className="block text-[10px] font-semibold text-[#0E2A47]/80 mb-0.5 px-1">
                        {msgAgent.bnName}
                      </span>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-[1.6] ${
                        isUser
                          ? 'bg-gradient-to-r from-[#0E2A47] to-[#1a4977] text-white rounded-br-xs whitespace-pre-line shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200/70 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {isUser ? (
                        msg.text
                      ) : (
                        <ChatMessageText text={msg.text} onNavigateRoute={navigateFromChat} />
                      )}
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
                <img
                  src={currentSupportAgent.avatar}
                  alt={currentSupportAgent.bnName}
                  className="w-6 h-6 rounded-full object-cover object-top border border-slate-200 shrink-0 bg-white"
                />
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
                  সহায়তার বিষয়সমূহ:
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
                  'নিচের ক্যালকুলেটরে পরিমাণ ও ব্যাংক নির্বাচন করে আপনার মাসিক EMI কিস্তি হিসাব করুন:',
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
                  'আপনার Order ID ও ফোন নম্বর দিয়ে সরাসরি অর্ডারের সর্বশেষ স্ট্যাটাস যাচাই করুন:'
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
                  'আপনার Promo / Coupon কোডটি যাচাই করে সরাসরি কার্টে প্রয়োগ করুন:'
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
                  'সরাসরি আমাদের সাপোর্ট টিমের কল পেতে আপনার নাম ও নম্বর দিন:'
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
