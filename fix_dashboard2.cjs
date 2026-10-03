const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const regex = /onClick=\{\(\) =>[\s\S]*?setConfirmModal\(\{ \.\.\.confirmModal, isOpen: false \}\)[\s\S]*?\{hasPermission\("manage_finances"\) && \([\s\S]*?<span className="truncate">Day Book<\/span>[\s\S]*?\}[\s\S]*?\}[\s\S]*?disabled=\{isConfirming\}/;

code = code.replace(regex, `onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              disabled={isConfirming}`);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Fixed syntax error via regex');
