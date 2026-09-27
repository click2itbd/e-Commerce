const fs = require('fs');
let content = fs.readFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', 'utf8');

if (!content.includes('new URLSearchParams(location.search).get(')) {
    content = content.replace(
        "const [activeTab, setActiveTab] = useState('dashboard');",
        "const [activeTab, setActiveTab] = useState(new URLSearchParams(window.location.search).get('tab') || 'dashboard');"
    );
    fs.writeFileSync('src/pages/ecommerceDashboard/EcommerceDashboard.tsx', content, 'utf8');
    console.log('EcommerceDashboard now reads ?tab= from URL');
}