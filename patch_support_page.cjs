const fs = require('fs');
let content = fs.readFileSync('src/pages/hosting/SupportPage.tsx', 'utf8');

if (!content.includes('useAuth')) {
    content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useAuth } from '../../context/AuthContext';\nimport { collection, addDoc } from 'firebase/firestore';\nimport { db } from '../../firebase';\nimport { toast } from 'react-hot-toast';\nimport { useNavigate } from 'react-router-dom';");
    
    // Add hooks inside component
    content = content.replace("const [activeFaq, setActiveFaq] = useState<number | null>(null);", "const [activeFaq, setActiveFaq] = useState<number | null>(null);\n  const { user } = useAuth();\n  const navigate = useNavigate();\n  const [isSubmitting, setIsSubmitting] = useState(false);");
    
    // Form fields
    content = content.replace("<form className=\"space-y-6\" onSubmit={(e) => e.preventDefault()}>", `<form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user) {
                    toast.error('Please login to submit a ticket');
                    navigate('/login?redirect=/support');
                    return;
                  }
                  
                  const formData = new FormData(e.currentTarget);
                  const subject = formData.get('subject') as string;
                  const priority = formData.get('priority') as string;
                  const message = formData.get('message') as string;
                  
                  if (!subject || !message) {
                    toast.error('Please fill in all required fields');
                    return;
                  }

                  try {
                    setIsSubmitting(true);
                    const now = new Date().toISOString();
                    const ticketData = {
                      userId: user.uid,
                      customerName: user.displayName || formData.get('firstName') + ' ' + formData.get('lastName'),
                      customerEmail: user.email || formData.get('email'),
                      subject,
                      status: 'open',
                      priority: priority.split(' ')[0].toLowerCase(),
                      createdAt: now,
                      updatedAt: now
                    };

                    const docRef = await addDoc(collection(db, 'tickets'), ticketData);
                    
                    await addDoc(collection(db, 'tickets', docRef.id, 'messages'), {
                      sender: 'customer',
                      message,
                      createdAt: now
                    });

                    toast.success('Ticket submitted successfully!');
                    e.currentTarget.reset();
                    navigate('/profile?tab=tickets');
                  } catch (error) {
                    console.error('Error submitting ticket:', error);
                    toast.error('Failed to submit ticket');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}>`);
                
    // Add name attributes to inputs
    content = content.replace('placeholder="John"', 'name="firstName" placeholder="John" defaultValue={user?.displayName?.split(" ")[0] || ""}');
    content = content.replace('placeholder="Doe"', 'name="lastName" placeholder="Doe" defaultValue={user?.displayName?.split(" ")[1] || ""}');
    content = content.replace('placeholder="john@example.com"', 'name="email" placeholder="john@example.com" defaultValue={user?.email || ""}');
    content = content.replace('<select className="w-full', '<select name="priority" className="w-full');
    content = content.replace('placeholder="How do I..."', 'name="subject" placeholder="How do I..." required');
    content = content.replace('placeholder="Describe your issue in detail..."', 'name="message" placeholder="Describe your issue in detail..." required');
    
    content = content.replace('<span>Submit Ticket</span>', '<span>{isSubmitting ? "Submitting..." : "Submit Ticket"}</span>');
    content = content.replace('disabled={isSubmitting}', ''); // Just in case
    content = content.replace('<button type="submit" className="bg-blue-600', '<button type="submit" disabled={isSubmitting} className="bg-blue-600 disabled:opacity-70');

    // Add a button to view existing tickets
    const myTicketsBtn = `<div className="mt-8 flex justify-center">
            <button onClick={() => navigate('/profile?tab=tickets')} className="bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition">
              View My Existing Tickets
            </button>
          </div>`;
          
    content = content.replace('</section>\n\n        {/* Support FAQs */}', myTicketsBtn + '\n        </section>\n\n        {/* Support FAQs */}');

    fs.writeFileSync('src/pages/hosting/SupportPage.tsx', content, 'utf8');
    console.log('Patched SupportPage.tsx to work with DB');
}
