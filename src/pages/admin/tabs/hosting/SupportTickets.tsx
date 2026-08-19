import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { useAuth } from '../../../../context/AuthContext';
import { MessageSquare, X, Send, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../../../lib/utils';

interface TicketMessage {
  id?: string;
  sender: 'customer' | 'admin';
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  serviceId?: string;
  status: 'open' | 'answered' | 'customer-reply' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export default function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const q = query(collection(db, 'tickets'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ticket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      if (!import.meta.env.DEV) {
        toast.error('Failed to load tickets');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    const messagesRef = collection(db, 'tickets', ticket.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    // Use onSnapshot for real-time messages
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TicketMessage[]);
    });

    return () => unsubscribe();
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    setSendingReply(true);
    
    try {
      // Add message
      await addDoc(collection(db, 'tickets', selectedTicket.id, 'messages'), {
        sender: 'admin',
        message: replyMessage.trim(),
        createdAt: new Date().toISOString()
      });

      // Update ticket status
      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        status: 'answered',
        updatedAt: new Date().toISOString()
      });

      setReplyMessage('');
      fetchTickets(); // Refresh list to update status
      toast.success('Reply sent successfully');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        status: 'closed',
        updatedAt: new Date().toISOString()
      });
      setSelectedTicket(null);
      fetchTickets();
      toast.success('Ticket closed');
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast.error('Failed to close ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'customer-reply': return 'bg-yellow-100 text-yellow-800';
      case 'answered': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No support tickets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                  <th className="p-4 font-semibold text-gray-600">Customer</th>
                  <th className="p-4 font-semibold text-gray-600">Subject</th>
                  <th className="p-4 font-semibold text-gray-600">Priority</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600">Updated</th>
                  <th className="p-4 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{ticket.customerName}</p>
                      <p className="text-xs text-gray-500">{ticket.customerEmail}</p>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{ticket.subject}</td>
                    <td className="p-4">
                      <span className={cn("px-2 py-1 text-[10px] uppercase font-bold rounded-full", getPriorityColor(ticket.priority))}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn("px-2 py-1 text-[10px] uppercase font-bold rounded-full", getStatusColor(ticket.status))}>
                        {ticket.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket View Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-500">Ticket from {selectedTicket.customerName}</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedTicket.status !== 'closed' && (
                  <button onClick={handleCloseTicket} className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition">
                    Close Ticket
                  </button>
                )}
                <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No messages yet.</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={cn("flex", msg.sender === 'admin' ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-2xl p-4 shadow-sm", msg.sender === 'admin' ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none")}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm opacity-90">{msg.sender === 'admin' ? 'Support Team' : selectedTicket.customerName}</span>
                        <span className="text-[10px] opacity-70 ml-4">{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input */}
            {selectedTicket.status !== 'closed' ? (
              <div className="p-4 bg-white border-t border-gray-100">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 mb-3"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition"
                  >
                    {sendingReply ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 border-t border-gray-200 text-center text-sm font-medium text-gray-600 flex justify-center items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                This ticket has been closed.
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
