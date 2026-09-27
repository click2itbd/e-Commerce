const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting-dashboard/components/TopNavbar.tsx', 'utf8');

// The bell panel starts with <div className="relative" ref={bellRef}>
// and ends right before {/* Profile & Logout */}
// Let's use regex to replace it
const regex = /{[\s\S]*?\/\* Bell Notification Panel \*\/[\s\S]*?<div className="relative" ref={bellRef}>[\s\S]*?<\/div>[\s\S]*?\/\* Profile & Logout \*\//;

const replacement = `
        {/* Bell Notification Panel (Replaced by Universal AdminNotifications) */}
        <div className="flex items-center gap-2 relative">
          <AdminNotifications setActiveTab={setActiveTab} />
        </div>

        {/* Profile & Logout */}`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/pages/hosting-dashboard/components/TopNavbar.tsx', content, 'utf8');
    console.log('Replaced Bell in TopNavbar!');
} else {
    console.log('Regex did not match!');
}