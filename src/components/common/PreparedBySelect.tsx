import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, Edit2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PreparedBySelectProps {
  value: string;
  onChange: (val: string) => void;
  users?: any[];
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const PreparedBySelect: React.FC<PreparedBySelectProps> = ({
  value,
  onChange,
  className,
  disabled = false
}) => {
  const { user, profile } = useAuth();
  const [isCustomEditing, setIsCustomEditing] = useState(false);

  // Auto-detect currently logged in user
  const currentUserName = useMemo(() => {
    return (
      profile?.displayName?.trim() ||
      user?.displayName?.trim() ||
      (profile?.email ? profile.email.split('@')[0] : '') ||
      (user?.email ? user.email.split('@')[0] : '') ||
      'Admin'
    );
  }, [profile, user]);

  // Automatically assign currently logged in user if value is not set
  useEffect(() => {
    if (!value && currentUserName) {
      onChange(currentUserName);
    }
  }, [value, currentUserName, onChange]);

  const activeName = value || currentUserName;

  return (
    <div className="relative w-full">
      {!isCustomEditing ? (
        <div 
          className={cn(
            "w-full h-10 border border-slate-200 bg-slate-50/90 rounded-xl px-2.5 flex items-center justify-between shadow-2xs transition-all",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0 pr-1">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
              {(activeName || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="font-extrabold text-xs text-slate-800 truncate" title={activeName}>
              {activeName}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto
            </span>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => setIsCustomEditing(true)}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer shrink-0"
              title="Change prepared by name"
            >
              <Edit2 size={12} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="Enter staff name..."
            className="w-full h-10 border border-indigo-400 bg-white rounded-xl px-3 font-extrabold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              if (!value) onChange(currentUserName);
              setIsCustomEditing(false);
            }}
            className="h-10 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Done"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(currentUserName);
              setIsCustomEditing(false);
            }}
            className="h-10 px-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 text-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Reset to current user"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PreparedBySelect;
