import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Check, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { polishText, PolishContext, PolishTargetLang } from '../../services/textPolishService';

interface AIPolishButtonProps {
  value?: string;
  text?: string;
  onPolished: (newValue: string) => void;
  context?: PolishContext;
  className?: string;
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  disabled?: boolean;
}

export const AIPolishButton: React.FC<AIPolishButtonProps> = ({
  value,
  text,
  onPolished,
  context = 'general',
  className = '',
  compact = false,
  size,
  label = 'AI Polish',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const rawValue = value ?? text ?? '';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handlePolish = async (targetLang: PolishTargetLang = 'english') => {
    const cleanText = (rawValue || '').trim();
    if (!cleanText) {
      toast.error('দয়া করে আগে কিছু লিখুন!');
      return;
    }

    setMenuOpen(false);
    setLoading(true);
    const originalText = rawValue;

    try {
      const polished = await polishText(cleanText, { context, targetLang });
      if (!polished || polished === cleanText) {
        toast.success('টেক্সট ইতোমধ্যে নিখুঁত রয়েছে!', { icon: '✨' });
      } else {
        onPolished(polished);
        toast(
          (t) => (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-800">
                ✨ {targetLang === 'bangla' ? 'বাংলা রূপান্তর সম্পন্ন!' : 'সঠিক ইংরেজিতে রূপান্তর সম্পন্ন!'}
              </span>
              <button
                type="button"
                onClick={() => {
                  onPolished(originalText);
                  toast.dismiss(t.id);
                  toast('পূর্বের টেক্সট ফিরিয়ে আনা হয়েছে', { icon: '↩️' });
                }}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[11px] flex items-center gap-1 transition-all"
              >
                <RotateCcw size={12} /> Undo
              </button>
            </div>
          ),
          { duration: 5000 }
        );
      }
    } catch (err: any) {
      toast.error(err?.message || 'পলিশ করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const options: { label: string; desc: string; targetLang: PolishTargetLang; icon: string }[] = [
    {
      label: 'Professional English',
      desc: 'বাংলিশ, বাংলা বা ভুল ইংরেজি সব সঠিক English হবে',
      targetLang: 'english',
      icon: '🇬🇧',
    },
    {
      label: 'Title Case Format',
      desc: 'প্রোডাক্টের নাম, মডেল ও ব্র্যান্ড ফরম্যাট (English)',
      targetLang: 'english',
      icon: '🏷️',
    },
    {
      label: 'Formal Bengali (প্রমিত বাংলা)',
      desc: 'প্রমিত বাংলা ব্যাকরণ ও বানান শুদ্ধি',
      targetLang: 'bangla',
      icon: '🇧🇩',
    },
  ];

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
      <div className="inline-flex items-center rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 text-purple-700 shadow-2xs hover:shadow-xs hover:border-purple-300 transition-all">
        {/* Main Polish Trigger Button */}
        <button
          type="button"
          disabled={loading || disabled}
          onClick={() => handlePolish('english')}
          title="Click to polish into correct English (Fixes Banglish, Bangla & spelling mistakes)"
          className={`inline-flex items-center gap-1.5 font-bold text-xs transition-colors hover:text-purple-900 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
            compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
          }`}
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin text-purple-600" />
          ) : (
            <Sparkles size={13} className="text-purple-600 animate-pulse" />
          )}
          {!compact && <span>{loading ? 'Polishing...' : label}</span>}
        </button>

        {/* Dropdown Options Toggle */}
        <button
          type="button"
          disabled={loading || disabled}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          title="Select polish language/mode"
          className="border-l border-purple-200/80 px-1 py-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100/50 rounded-r-lg transition-colors focus:outline-none"
        >
          <ChevronDown size={11} className={`transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-left animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> AI Text Polish Mode
            </span>
          </div>
          {options.map((opt) => (
            <button
              key={opt.targetLang}
              type="button"
              onClick={() => handlePolish(opt.targetLang)}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors flex items-start gap-2.5 group"
            >
              <span className="text-sm shrink-0 mt-0.5">{opt.icon}</span>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-800 group-hover:text-purple-900">
                  {opt.label}
                </span>
                <span className="block text-[10px] text-slate-500 truncate">
                  {opt.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIPolishButton;
