const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting-dashboard/components/TopNavbar.tsx', 'utf8');

// 1. Add import
content = content.replace(
    "import { Menu, ChevronDown, Bell, User, LogOut, Settings2, Server, Ticket, RefreshCw, Globe, CheckCheck } from 'lucide-react';",
    "import { Menu, ChevronDown, Bell, User, LogOut, Settings2, Server, Ticket, RefreshCw, Globe, CheckCheck } from 'lucide-react';\nimport { AdminNotifications } from '../../../../components/AdminNotifications';"
);

// 2. Replace the Bell Notification Panel
// We will look for `{/* Bell Notification Panel */}` and exactly replace the surrounding block.
const searchStr = `        {/* Bell Notification Panel */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setBellOpen(v => !v); setUnreadCount(0); }}
            title="Notifications"
            className={cn(
              "relative p-2 rounded-lg transition-colors",
              bellOpen ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none border border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (`;

// We don't want to write a fragile regex. Let's just find the start and end of the div.
const startIdx = content.indexOf('{/* Bell Notification Panel */}');
const endIdx = content.indexOf('{/* Profile & Logout */}');

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);
    
    const replacement = `        {/* Bell Notification Panel */}
        <div className="relative flex items-center justify-center mr-2">
          <AdminNotifications setActiveTab={setActiveTab} />
        </div>

        `;
        
    content = before + replacement + after;
    fs.writeFileSync('src/pages/hosting-dashboard/components/TopNavbar.tsx', content, 'utf8');
    console.log('Successfully patched TopNavbar without regex!');
} else {
    console.log('Failed to find markers');
}