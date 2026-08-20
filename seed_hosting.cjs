const PROJECT_ID = 'ai-studio-422fbad2-d827-4e69-8599-aed85390d277';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const features = [
  { id: 'disk_space', name: 'Storage Space', category: 'Standard Features', type: 'text', order: 1 },
  { id: 'bandwidth', name: 'Bandwidth', category: 'Standard Features', type: 'text', order: 2 },
  { id: 'addon_domains', name: 'Addon Domains', category: 'Standard Features', type: 'text', order: 3 },
  { id: 'subdomains', name: 'Subdomains', category: 'Standard Features', type: 'text', order: 4 },
  { id: 'emails', name: 'Email Accounts', category: 'Email & DB', type: 'text', order: 5 },
  { id: 'databases', name: 'MySQL Databases', category: 'Email & DB', type: 'text', order: 6 },
  { id: 'free_ssl', name: 'Free SSL Certificate', category: 'Security', type: 'boolean', order: 7 },
  { id: 'litespeed', name: 'Litespeed Web Server', category: 'Server', type: 'boolean', order: 8 },
  { id: 'daily_backup', name: 'Daily Backup', category: 'Security', type: 'boolean', order: 9 },
  { id: 'cpanel', name: 'cPanel Control Panel', category: 'Server', type: 'boolean', order: 10 },
  { id: 'softaculous', name: 'Softaculous', category: 'Server', type: 'boolean', order: 11 },
];

const plans = [
  {
    id: 'plan_starter',
    name: 'Starter', slug: 'starter', status: 'published', order: 1, allowCustomization: true,
    pricing: { monthly: 150, annually: 1500 },
    cloudLinuxLimits: { cpu: '100', pmem: '1024', vmem: '2048', io: '10', iops: '1024', ep: '20', nproc: '100', inodes: '250000' },
    comparisonValues: {
      disk_space: '5 GB NVMe SSD', bandwidth: '100 GB', addon_domains: '0', subdomains: 'Unlimited', emails: '5', databases: '5', free_ssl: true, litespeed: true, daily_backup: false, cpanel: true, softaculous: true
    }
  },
  {
    id: 'plan_standard',
    name: 'Standard', slug: 'standard', status: 'published', order: 2, popular: true, allowCustomization: true,
    pricing: { monthly: 250, annually: 2500 },
    cloudLinuxLimits: { cpu: '100', pmem: '2048', vmem: '4096', io: '20', iops: '2048', ep: '30', nproc: '120', inodes: '350000' },
    comparisonValues: {
      disk_space: '10 GB NVMe SSD', bandwidth: 'Unlimited', addon_domains: '3', subdomains: 'Unlimited', emails: '20', databases: '20', free_ssl: true, litespeed: true, daily_backup: true, cpanel: true, softaculous: true
    }
  },
  {
    id: 'plan_professional',
    name: 'Professional', slug: 'professional', status: 'published', order: 3, allowCustomization: true,
    pricing: { monthly: 400, annually: 4000 },
    cloudLinuxLimits: { cpu: '200', pmem: '3072', vmem: '6144', io: '30', iops: '3072', ep: '40', nproc: '150', inodes: '500000' },
    comparisonValues: {
      disk_space: '20 GB NVMe SSD', bandwidth: 'Unlimited', addon_domains: '10', subdomains: 'Unlimited', emails: 'Unlimited', databases: 'Unlimited', free_ssl: true, litespeed: true, daily_backup: true, cpanel: true, softaculous: true
    }
  },
  {
    id: 'plan_premium',
    name: 'Premium', slug: 'premium', status: 'published', order: 4, allowCustomization: true,
    pricing: { monthly: 600, annually: 6000 },
    cloudLinuxLimits: { cpu: '300', pmem: '4096', vmem: '8192', io: '50', iops: '4096', ep: '50', nproc: '200', inodes: '1000000' },
    comparisonValues: {
      disk_space: '50 GB NVMe SSD', bandwidth: 'Unlimited', addon_domains: 'Unlimited', subdomains: 'Unlimited', emails: 'Unlimited', databases: 'Unlimited', free_ssl: true, litespeed: true, daily_backup: true, cpanel: true, softaculous: true
    }
  }
];

function convertToFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(convertToFirestoreValue) } };
  if (typeof val === 'object' && val !== null) {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = convertToFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

async function writeDoc(collection, id, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (k !== 'id') fields[k] = convertToFirestoreValue(v);
  }
  const payload = { fields };
  
  const res = await fetch(`${BASE_URL}/${collection}?documentId=${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (res.status === 409) { // ALREADY_EXISTS -> Patch
    const patchRes = await fetch(`${BASE_URL}/${collection}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`PATCH ${collection}/${id}: ${patchRes.status}`);
  } else {
    console.log(`POST ${collection}/${id}: ${res.status}`);
  }
}

async function run() {
  for (const f of features) {
    await writeDoc('hosting_features', f.id, f);
  }
  for (const p of plans) {
    await writeDoc('hosting_plans', p.id, p);
  }
  // pricing
  await writeDoc('custom_hosting_pricing', 'global_pricing', {
    perGbDisk: 50, perGbBandwidth: 10, perEmailAccount: 5, perDatabase: 10, perCoreCpu: 200, perGbRam: 150
  });
  console.log("Done");
}
run();
