import React, { useState } from 'react';
import { Bot, MessageCircle, X, Send } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot', text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'leads'), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.phone,
        company: '',
        industry: '',
        source: 'web_chat',
        status: 'new',
        createdAt: new Date().toISOString(),
      });
      setChatStarted(true);
      setMessages([{ sender: 'bot', text: `Hi ${formData.firstName}, how can I help you?` }]);
      toast.success('Chat started!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to start chat.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = { sender: 'user' as const, text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI service error');
      }

      const botMessage = { sender: 'bot' as const, text: data.reply || 'Sorry, I had trouble processing that.' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error communicating with AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#081621] text-white p-4 rounded-full shadow-lg"
        >
          <MessageCircle size={24} />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-gray-200">
          <div className="bg-[#081621] text-white p-4 flex justify-between items-center rounded-t-lg">
            <h3 className="font-bold flex items-center gap-2"><Bot size={20} /> Support Chat</h3>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>

          {!chatStarted ? (
            <form onSubmit={handleStartChat} className="p-4 space-y-4">
              <input type="text" placeholder="First Name" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full border p-2 rounded text-sm" />
              <input type="text" placeholder="Last Name" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full border p-2 rounded text-sm" />
              <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded text-sm" />
              <input type="tel" placeholder="Mobile Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded text-sm" />
              <button type="submit" className="w-full bg-[#081621] text-white p-2 rounded font-bold">Start Chat</button>
            </form>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 flex-1 overflow-y-auto space-y-2">
                {messages.map((msg, i) => (
                    <div key={i} className={`p-2 rounded text-xs ${msg.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100 mr-auto'}`}>
                        {msg.text}
                    </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="p-2 border-t flex gap-2">
                <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type a message..." className="flex-1 border rounded p-2 text-sm" />
                <button type="submit" className="bg-[#081621] text-white p-2 rounded"><Send size={16} /></button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
