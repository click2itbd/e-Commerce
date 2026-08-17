const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import { initializeApp }")) {
    content = content.replace(
        "import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';",
        "import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';\nimport { initializeApp } from 'firebase/app';\nimport { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';\nimport firebaseConfig from '../firebase-applet-config.json';"
    );
}

const stateReplacement = `  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [employeeFormData, setEmployeeFormData] = useState<any>({ name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, status: 'active', joinDate: '', confirmDate: '', dateOfBirth: '', nidNumber: '', certificateUrl: '', nidUrl: '', cvUrl: '' });`;

if (content.match(/const \[employeeFormData, setEmployeeFormData\] = useState<any>\(\{.*?\}\);/)) {
    content = content.replace(
        /const \[employeeFormData, setEmployeeFormData\] = useState<any>\(\{.*?\}\);/,
        stateReplacement
    );
}

// Add default values on 'Add Employee' logic
content = content.replace(
    /setEmployeeFormData\(\{ name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, status: 'active' \}\);/g,
    `setEmployeeFormData({ name: '', email: '', phone: '', role: 'Staff', baseSalary: 0, status: 'active', joinDate: '', confirmDate: '', dateOfBirth: '', nidNumber: '', certificateUrl: '', nidUrl: '', cvUrl: '' });`
);

const injectedFuncs = `
  const handleFileUpload = async (file: File | null) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, \`hr/\${Date.now()}_\${file.name}\`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setIsUploading(false);
      return url;
    } catch (err) {
      setIsUploading(false);
      toast.error('File upload failed');
      return null;
    }
  };

  const handleAddPortalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userFormData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, userFormData.email, userFormData.password);
      
      await addDoc(collection(db, 'users'), {
        uid: userCred.user.uid,
        email: userFormData.email,
        displayName: userFormData.name || userFormData.email.split('@')[0],
        role: userFormData.role,
        createdAt: new Date().toISOString(),
      });
      
      await secondaryAuth.signOut();
      
      toast.success('User added successfully');
      setIsAddingUser(false);
      fetchData();
    } catch (err: any) {
      toast.error('Error adding user: ' + err.message);
    }
  };
`;

if (!content.includes('handleAddPortalUser')) {
    content = content.replace(
        "const handleImageUpload = async",
        injectedFuncs + "\n  const handleImageUpload = async"
    );
}

// User tab injection:
const userTabFind = `<h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-[#EF4444]" /> User Management
              </h2>`;
const userTabReplace = `<h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-[#EF4444]" /> User Management
              </h2>
              <button onClick={() => {
                setUserFormData({ name: '', email: '', password: '', role: 'user' });
                setIsAddingUser(true);
              }} className="bg-[#081621] text-white px-4 py-2 rounded-md hover:bg-[#EF4444] transition-all font-bold text-sm">
                 + Add User
              </button>`;
content = content.replace(userTabFind, userTabReplace);

fs.writeFileSync(path, content, 'utf8');
console.log('Script completed phase 1 updates.');
