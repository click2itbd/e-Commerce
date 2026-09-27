const fs = require('fs');
let content = fs.readFileSync('src/components/AdminNotifications.tsx', 'utf8');

const oldClick = `
    if (setActiveTab && notif.targetTab) {
      setActiveTab(notif.targetTab);
    }
    setIsOpen(false);
  };
`;

const newClick = `
    setIsOpen(false);
    
    // Global Navigation for Universal Usability
    const currentPath = window.location.pathname;
    
    if (notif.category === 'orders') {
      if (currentPath !== '/admin/e-commerce') window.location.href = '/admin/e-commerce?tab=orders';
      else if (setActiveTab) setActiveTab('orders');
    } else if (notif.category === 'hosting' || notif.targetTab === 'domainOffers') {
      if (currentPath !== '/admin/billing') window.location.href = '/admin/billing?tab=all-orders';
      else if (setActiveTab) setActiveTab('all-orders');
    } else if (notif.category === 'support') {
      if (currentPath !== '/admin/billing') window.location.href = '/admin/billing?tab=tickets';
      else if (setActiveTab) setActiveTab('tickets');
    } else if (notif.category === 'stock') {
      if (currentPath !== '/admin/e-commerce') window.location.href = '/admin/e-commerce?tab=inventory';
      else if (setActiveTab) setActiveTab('inventory');
    } else if (setActiveTab && notif.targetTab) {
      setActiveTab(notif.targetTab);
    }
  };
`;

content = content.replace(oldClick.trim(), newClick.trim());
fs.writeFileSync('src/components/AdminNotifications.tsx', content, 'utf8');
console.log('AdminNotifications is now Universal!');