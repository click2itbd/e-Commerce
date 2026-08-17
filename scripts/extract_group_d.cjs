const fs = require('fs');
const path = require('path');

const adminDashboardPath = path.join(__dirname, '../src/pages/AdminDashboard.tsx');
let adminDashboardCode = fs.readFileSync(adminDashboardPath, 'utf8');

function extractComponent(config) {
  const { name, dirPath, fileName, startMarker, endMarker, interfaceDef, propsString, componentProps, localStates, imports } = config;
  
  const startIndex = adminDashboardCode.indexOf(startMarker);
  if (startIndex === -1) {
    console.error(`Could not find start marker for ${name}`);
    return;
  }
  
  const endIndex = adminDashboardCode.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex === -1) {
    console.error(`Could not find end marker for ${name}`);
    return;
  }

  // Extract the JSX block, removing the leading marker part and trailing newline
  // startMarker looks like: "        ) : activeTab === 'campaigns' && hasPermission('manage_marketing') ? ("
  // We want the content inside.
  let jsxBlock = adminDashboardCode.substring(startIndex + startMarker.length, endIndex).trim();
  
  // Create component content
  const componentContent = `import React from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
${imports || ''}

${interfaceDef}

const ${name}: React.FC<${name}Props> = (${propsString}) => {
  const { isAdmin, hasPermission } = useAuth();
${localStates ? '  ' + localStates.split('\\n').join('\\n  ') : ''}

  return (
    ${jsxBlock}
  );
};

export default ${name};
`;

  // Create directory if not exists
  const fullDirPath = path.join(__dirname, '..', dirPath);
  if (!fs.existsSync(fullDirPath)) {
    fs.mkdirSync(fullDirPath, { recursive: true });
  }

  // Write component file
  fs.writeFileSync(path.join(fullDirPath, fileName), componentContent);
  console.log(`Created ${fileName}`);

  // Replace block in AdminDashboard
  const replaceStr = `${startMarker}\n          <${name} ${componentProps} />`;
  adminDashboardCode = adminDashboardCode.substring(0, startIndex) + replaceStr + adminDashboardCode.substring(endIndex);
  
  // Add import to AdminDashboard
  const importStatement = `import ${name} from '${dirPath.replace('src/pages/', './')}/${fileName.replace('.tsx', '')}';`;
  if (!adminDashboardCode.includes(importStatement)) {
    adminDashboardCode = adminDashboardCode.replace(/import { Settings } from '.\/admin\/tabs\/others\/Settings';/, `import { Settings } from './admin/tabs/others/Settings';\n${importStatement}`);
  }
}

const configs = [
  {
    name: 'CampaignsTab',
    dirPath: 'src/pages/admin/tabs/marketing',
    fileName: 'Campaigns.tsx',
    startMarker: "        ) : activeTab === 'campaigns' && hasPermission('manage_marketing') ? (",
    endMarker: "\n        ) : activeTab === 'discountCodes'",
    interfaceDef: `interface CampaignsTabProps {
  campaigns: any[];
  isAddingCampaign: boolean;
  setIsAddingCampaign: (v: boolean) => void;
  editingCampaign: any;
  setEditingCampaign: (v: any) => void;
  campaignFormData: any;
  setCampaignFormData: (v: any) => void;
  handleSaveCampaign: (e: React.FormEvent) => void;
  handleSendCampaign: (campaign: any) => void;
  fetchData: () => Promise<void>;
}`,
    propsString: `{ campaigns, isAddingCampaign, setIsAddingCampaign, editingCampaign, setEditingCampaign, campaignFormData, setCampaignFormData, handleSaveCampaign, handleSendCampaign, fetchData }`,
    componentProps: `campaigns={campaigns} isAddingCampaign={isAddingCampaign} setIsAddingCampaign={setIsAddingCampaign} editingCampaign={editingCampaign} setEditingCampaign={setEditingCampaign} campaignFormData={campaignFormData} setCampaignFormData={setCampaignFormData} handleSaveCampaign={handleSaveCampaign} handleSendCampaign={handleSendCampaign} fetchData={fetchData}`,
    imports: `import { Mail, Edit, Trash2, Send, Plus, X } from 'lucide-react';`
  },
  {
    name: 'DiscountCodesTab',
    dirPath: 'src/pages/admin/tabs/marketing',
    fileName: 'DiscountCodes.tsx',
    startMarker: "        ) : activeTab === 'discountCodes' && hasPermission('manage_marketing') ? (",
    endMarker: "\n        ) : activeTab === 'hostingPlans'",
    interfaceDef: `interface DiscountCodesTabProps {
  discountCodes: any[];
  isAddingDiscountCode: boolean;
  setIsAddingDiscountCode: (v: boolean) => void;
  editingDiscountCode: any;
  setEditingDiscountCode: (v: any) => void;
  discountCodeFormData: any;
  setDiscountCodeFormData: (v: any) => void;
  handleSaveDiscountCode: (e: React.FormEvent) => void;
  handleDeleteDiscountCode: (id: string) => void;
}`,
    propsString: `{ discountCodes, isAddingDiscountCode, setIsAddingDiscountCode, editingDiscountCode, setEditingDiscountCode, discountCodeFormData, setDiscountCodeFormData, handleSaveDiscountCode, handleDeleteDiscountCode }`,
    componentProps: `discountCodes={discountCodes} isAddingDiscountCode={isAddingDiscountCode} setIsAddingDiscountCode={setIsAddingDiscountCode} editingDiscountCode={editingDiscountCode} setEditingDiscountCode={setEditingDiscountCode} discountCodeFormData={discountCodeFormData} setDiscountCodeFormData={setDiscountCodeFormData} handleSaveDiscountCode={handleSaveDiscountCode} handleDeleteDiscountCode={handleDeleteDiscountCode}`,
    imports: `import { Tag, Edit, Trash2, Plus, X } from 'lucide-react';`
  },
  {
    name: 'HostingPlansTab',
    dirPath: 'src/pages/admin/tabs/hosting',
    fileName: 'HostingPlans.tsx',
    startMarker: "        ) : activeTab === 'hostingPlans' && isAdmin ? (",
    endMarker: "\n        ) : activeTab === 'hostingServices'",
    interfaceDef: `interface HostingPlansTabProps {
  hostingPlans: any[];
  isAddingHostingPlan: boolean;
  setIsAddingHostingPlan: (v: boolean) => void;
  editingHostingPlan: any;
  setEditingHostingPlan: (v: any) => void;
  hostingPlanFormData: any;
  setHostingPlanFormData: (v: any) => void;
  handleSaveHostingPlan: (e: React.FormEvent) => void;
  handleDeleteHostingPlan: (id: string) => void;
}`,
    propsString: `{ hostingPlans, isAddingHostingPlan, setIsAddingHostingPlan, editingHostingPlan, setEditingHostingPlan, hostingPlanFormData, setHostingPlanFormData, handleSaveHostingPlan, handleDeleteHostingPlan }`,
    componentProps: `hostingPlans={hostingPlans} isAddingHostingPlan={isAddingHostingPlan} setIsAddingHostingPlan={setIsAddingHostingPlan} editingHostingPlan={editingHostingPlan} setEditingHostingPlan={setEditingHostingPlan} hostingPlanFormData={hostingPlanFormData} setHostingPlanFormData={setHostingPlanFormData} handleSaveHostingPlan={handleSaveHostingPlan} handleDeleteHostingPlan={handleDeleteHostingPlan}`,
    imports: `import { Server, Edit, Trash2, Plus, X } from 'lucide-react';`
  },
  {
    name: 'HostingServicesTab',
    dirPath: 'src/pages/admin/tabs/hosting',
    fileName: 'HostingServices.tsx',
    startMarker: "        ) : activeTab === 'hostingServices' && isAdmin ? (",
    endMarker: "\n        ) : activeTab === 'settings'",
    interfaceDef: `interface HostingServicesTabProps {
  hostingServices: any[];
  isAddingHostingService: boolean;
  setIsAddingHostingService: (v: boolean) => void;
  editingHostingService: any;
  setEditingHostingService: (v: any) => void;
  hostingServiceFormData: any;
  setHostingServiceFormData: (v: any) => void;
  handleSaveHostingService: (e: React.FormEvent) => void;
  handleDeleteHostingService: (id: string) => void;
}`,
    propsString: `{ hostingServices, isAddingHostingService, setIsAddingHostingService, editingHostingService, setEditingHostingService, hostingServiceFormData, setHostingServiceFormData, handleSaveHostingService, handleDeleteHostingService }`,
    componentProps: `hostingServices={hostingServices} isAddingHostingService={isAddingHostingService} setIsAddingHostingService={setIsAddingHostingService} editingHostingService={editingHostingService} setEditingHostingService={setEditingHostingService} hostingServiceFormData={hostingServiceFormData} setHostingServiceFormData={setHostingServiceFormData} handleSaveHostingService={handleSaveHostingService} handleDeleteHostingService={handleDeleteHostingService}`,
    imports: `import { Database, Edit, Trash2, Plus, X } from 'lucide-react';`
  }
];

configs.forEach(extractComponent);

fs.writeFileSync(adminDashboardPath, adminDashboardCode);
console.log('AdminDashboard.tsx refactored successfully.');
