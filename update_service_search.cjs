const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const [serviceSearchQuery')) {
    content = content.replace(
        "const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');",
        "const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');\n  const [serviceSearchQuery, setServiceSearchQuery] = useState('');"
    );
}

const tableSearchUI = `
             {ledgerView === 'products' && (
              <div>
                <div className="p-4 bg-white border-b border-gray-100 flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by Customer Name or Serial Number..."
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:border-[#EF4444] focus:ring-0 text-sm transition-all"
                    />
                  </div>
                </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">`;

content = content.replace(
    /\{\s*ledgerView === 'products' && \(\s*<div className="overflow-x-auto">\s*<table className="w-full text-sm text-left">/,
    tableSearchUI
);

content = content.replace(
    /\{serviceRecords\.map\(\(record\) => \(/,
    `{serviceRecords.filter(r => r.serialNumber?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) || r.customerName?.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((record) => (`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Applied service tracking search updates");
