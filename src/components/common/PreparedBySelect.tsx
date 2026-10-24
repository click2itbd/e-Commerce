import React, { useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Sparkles } from 'lucide-react';
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
  users = [],
  className,
  disabled = false,
  required = false
}) => {
  const { user, profile } = useAuth();

  // Determine current active user's name
  const currentUserName = useMemo(() => {
    return (
      profile?.displayName?.trim() ||
      user?.displayName?.trim() ||
      (profile?.email ? profile.email.split('@')[0] : '') ||
      (user?.email ? user.email.split('@')[0] : '') ||
      'Admin'
    );
  }, [profile, user]);

  // Auto-detect & pre-fill currently logged in admin/staff if unset
  useEffect(() => {
    if (!value && currentUserName) {
      onChange(currentUserName);
    }
  }, [value, currentUserName, onChange]);

  // Build unified, deduplicated list of staff options
  const staffOptions = useMemo(() => {
    const map = new Map<string, { name: string; isCurrent: boolean; role?: string }>();

    // 1. Always include the currently logged in user at the very top
    if (currentUserName) {
      map.set(currentUserName.toLowerCase(), {
        name: currentUserName,
        isCurrent: true,
        role: profile?.role || 'admin'
      });
    }

    // 2. Add all staff, admins, and managers from users collection
    if (Array.isArray(users)) {
      users
        .filter(u => {
          const r = (u.role || '').toLowerCase();
          return (
            r === 'admin' ||
            r === 'staff' ||
            r === 'manager' ||
            r === 'employee' ||
            (Array.isArray(u.permissions) && u.permissions.length > 0)
          );
        })
        .forEach(u => {
          const name = u.displayName?.trim() || u.email?.trim() || '';
          if (name) {
            const key = name.toLowerCase();
            const isCurr =
              key === currentUserName.toLowerCase() ||
              (u.email && user?.email && u.email.toLowerCase() === user.email.toLowerCase());

            if (!map.has(key)) {
              map.set(key, {
                name,
                isCurrent: isCurr,
                role: u.role || 'staff'
              });
            } else if (isCurr) {
              map.get(key)!.isCurrent = true;
            }
          }
        });
    }

    // 3. If currently passed value is set (e.g., editing an older record with a custom name), preserve it
    if (value && value.trim()) {
      const vKey = value.trim().toLowerCase();
      if (!map.has(vKey)) {
        map.set(vKey, {
          name: value.trim(),
          isCurrent: vKey === currentUserName.toLowerCase()
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      // Keep current user on top
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [users, currentUserName, profile, user, value]);

  const isCurrentActive = Boolean(
    value && currentUserName && value.toLowerCase() === currentUserName.toLowerCase()
  );

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <select
          value={value || currentUserName}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={cn(
            "w-full h-10 border border-slate-200 bg-white rounded-xl pl-3 pr-8 font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs appearance-none",
            isCurrentActive && "bg-indigo-50/20 border-indigo-200 text-indigo-950 font-black",
            className
          )}
        >
          {staffOptions.map(opt => (
            <option key={opt.name} value={opt.name}>
              {opt.name} {opt.isCurrent ? '★ (You - Active)' : ''}
            </option>
          ))}
        </select>

        {/* Status Indicator Icon & Chevron */}
        <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-none text-slate-400">
          {isCurrentActive && (
            <span 
              className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" 
              title="Auto-detected as currently logged-in user"
            />
          )}
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PreparedBySelect;
