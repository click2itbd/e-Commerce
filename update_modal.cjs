const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const nl = c.includes('\r\n') ? '\r\n' : '\n';
c = c.replace(/\r\n/g, '\n');

// 1. Change confirmColor for handleSaveProduct
c = c.replace(/confirmColor:\s*"bg-\[#EF4444\] hover:bg-red-700",\s*onConfirm/g, 'confirmColor: "bg-blue-600 hover:bg-blue-700",\n        onConfirm');

// 2. Redesign ConfirmModal
const oldModalStart = `const ConfirmModal = () => {`;
const oldModalEnd = `</button>\n            </div>\n          </div>\n        </div>\n      );\n    };`;

const modalRegex = new RegExp(`const ConfirmModal = \\(\\) => \\{[\\s\\S]*?<\\/button>\\s*<\\/div>\\s*<\\/div>\\s*<\\/div>\\s*\\);\\s*\\};`);

const newModal = `const ConfirmModal = () => {
      const [isConfirming, setIsConfirming] = useState(false);
      if (!confirmModal.isOpen) return null;
      const confirmText = confirmModal.confirmText || "Confirm Delete";
      const confirmColor = confirmModal.confirmColor || "bg-red-600 hover:bg-red-700";
      
      const isRed = confirmColor.includes('red') || confirmColor.includes('EF4444');
      const isBlue = confirmColor.includes('blue');

      return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center pt-8">
              <div className={\`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 \${isRed ? 'bg-red-100 text-red-600' : isBlue ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}\`}>
                {isRed ? <AlertTriangle size={32} strokeWidth={1.5} /> : <CheckCircle size={32} strokeWidth={1.5} />}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {confirmModal.message}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  disabled={isConfirming}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsConfirming(true);
                    try {
                      await confirmModal.onConfirm();
                    } finally {
                      setIsConfirming(false);
                      setConfirmModal({ ...confirmModal, isOpen: false });
                    }
                  }}
                  disabled={isConfirming}
                  className={\`flex-1 py-2.5 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 \${confirmColor}\`}
                >
                  {isConfirming ? <Loader2 size={18} className="animate-spin" /> : confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };`;

if (c.match(modalRegex)) {
  c = c.replace(modalRegex, newModal);
  
  // Make sure CheckCircle is imported from lucide-react
  if (!c.includes('CheckCircle')) {
    c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, CheckCircle } from 'lucide-react';");
  }
  
  fs.writeFileSync('src/pages/AdminDashboard.tsx', c.replace(/\n/g, nl));
  console.log('Successfully updated ConfirmModal UI');
} else {
  console.log('Could not find ConfirmModal in AdminDashboard.tsx');
}