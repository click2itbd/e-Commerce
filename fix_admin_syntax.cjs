const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const badInject = `
          {activeTab === 'api_logs' && (
            <ApiLogsTab />
          )}

          {activeTab === 'hostingServices'`;

content = content.replace(badInject, "{activeTab === 'hostingServices'");

// Now inject safely into the main content area.
// Search for exactly:
//         {activeTab === 'hostingServices' && (
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
const target = `{activeTab === 'settings' && (`;

const goodInject = `
          {activeTab === 'api_logs' && (
            <ApiLogsTab />
          )}

          {activeTab === 'settings' && (`;

if (content.includes(target)) {
    content = content.replace(target, goodInject);
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', content, 'utf8');
console.log('Fixed AdminDashboard syntax error');
