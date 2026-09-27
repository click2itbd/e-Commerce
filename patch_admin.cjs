const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!content.includes('new URLSearchParams(window.location.search).get(')) {
    content = content.replace(
        "const [activeTab, setActiveTab] = useState('dashboard');",
        "const [activeTab, setActiveTab] = useState(new URLSearchParams(window.location.search).get('tab') || 'dashboard');"
    );
    fs.writeFileSync('src/pages/AdminDashboard.tsx', content, 'utf8');
    console.log('Admin Dashboard now reads ?tab= from URL');
}