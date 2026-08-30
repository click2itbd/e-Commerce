const fs = require('fs');

const fixResponsiveContainer = (file) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<ResponsiveContainer width="100%" height="100%">/g, '<ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={0}>');
  content = content.replace(/<ResponsiveContainer width="100%" height={200}>/g, '<ResponsiveContainer width="100%" height={200} minHeight={200} minWidth={0}>');
  fs.writeFileSync(file, content, 'utf8');
};

fixResponsiveContainer('src/components/AnalyticsDashboard.tsx');
fixResponsiveContainer('src/pages/HostingBillingDashboard.tsx');
