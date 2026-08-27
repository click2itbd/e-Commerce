import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { Mail, Edit, Trash2, Send, Plus, X, Edit2 } from 'lucide-react';

const CampaignsTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [campaignFormData, setCampaignFormData] = useState<any>({
    title: '',
    channel: 'email',
    subject: '',
    content: '',
    recipients: [],
    bulkEmails: '',
    selectedUserIds: [],
    scheduledAt: '',
    targetAudience: '',
    budget: '',
    targetUrl: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setCampaigns(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await updateDoc(doc(db, 'campaigns', editingCampaign.id), campaignFormData);
        toast.success('Campaign updated successfully');
      } else {
        await addDoc(collection(db, 'campaigns'), campaignFormData);
        toast.success('Campaign created successfully');
      }
      setIsAddingCampaign(false);
      setEditingCampaign(null);
      setCampaignFormData({
        title: '',
        channel: 'email',
        subject: '',
        content: '',
        recipients: [],
        bulkEmails: '',
        selectedUserIds: [],
        scheduledAt: '',
        targetAudience: '',
        budget: '',
        targetUrl: '',
        imageUrl: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  const handleSendCampaign = async (campaign: any) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaign.id), {
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
      toast.success('Campaign deployed successfully');
      fetchData();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Mail className="text-[#EF4444]" /> Marketing Campaigns
              </h2>
              <button
                onClick={() => setIsAddingCampaign(true)}
                className="bg-[#EF4444] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition-all font-bold text-sm"
              >
                <Plus size={18} /> Create Campaign
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-4">Title / Channel</th>
                    <th className="px-6 py-4">Audience / Subject</th>
                    <th className="px-6 py-4">Metrics</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map(campaign => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-sm">
                        <div className="flex flex-col">
                          <span>{campaign.title}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {campaign.channel || 'EMAIL'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {['facebook', 'instagram', 'google'].includes(campaign.channel || '') 
                          ? campaign.targetAudience 
                          : campaign.subject}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {['facebook', 'instagram', 'google'].includes(campaign.channel || '') ? (
                          <div className="flex flex-col text-[11px]">
                            <span>Impressions: {campaign.impressions || 0}</span>
                            <span>Clicks: {campaign.clicked || 0}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col text-[11px]">
                            <span>Sent: {campaign.sent || 0}</span>
                            <span>Del: {campaign.delivered || 0}</span>
                            <span>Open: {campaign.opened || 0}</span>
                            <span>Click: {campaign.clicked || 0}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap",
                          (campaign.status === 'sent' || campaign.status === 'completed') ? "bg-green-100 text-green-700" :
                          campaign.status === 'active' ? "bg-blue-100 text-blue-700 animate-pulse" :
                          campaign.status === 'scheduled' ? "bg-purple-100 text-purple-700" :
                          campaign.status === 'sending' ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {campaign.status === 'scheduled' && campaign.scheduledAt ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-purple-600 uppercase">Scheduled for</span>
                            <span>{new Date(campaign.scheduledAt).toLocaleString()}</span>
                          </div>
                        ) : (campaign.status === 'sent' || campaign.status === 'active') && campaign.sentAt ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-green-600 uppercase">Deployed on</span>
                            <span>{new Date(campaign.sentAt).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => handleSendCampaign(campaign)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-all"
                              title="Deploy Campaign"
                            >
                              <Send size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingCampaign(campaign);
                              setCampaignFormData({
                                title: campaign.title,
                                channel: campaign.channel || 'email',
                                subject: campaign.subject || '',
                                content: campaign.content,
                                recipients: campaign.recipients || [],
                                bulkEmails: campaign.recipients ? campaign.recipients.join('\n') : '',
                                selectedUserIds: [],
                                scheduledAt: campaign.scheduledAt || '',
                                targetAudience: campaign.targetAudience || '',
                                budget: campaign.budget ? String(campaign.budget) : '',
                                targetUrl: campaign.targetUrl || '',
                                imageUrl: campaign.imageUrl || '',
                              });
                              setIsAddingCampaign(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Delete this campaign?')) {
                                
if (!isAdmin) { toast.error('You do not have permission to delete this.'); return; }
await deleteDoc(doc(db, 'campaigns', campaign.id));

                                fetchData();
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>              </table>
            </div>
          {isAddingCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h3>
              <button onClick={() => { setIsAddingCampaign(false); setEditingCampaign(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Campaign Title *</label>
                  <input required type="text" value={campaignFormData.title} onChange={e => setCampaignFormData({...campaignFormData, title: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Summer Sale 2026" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Channel *</label>
                  <select value={campaignFormData.channel} onChange={e => setCampaignFormData({...campaignFormData, channel: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500">
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="in-app">In-App Notification</option>
                    <option value="facebook">Facebook Ads</option>
                    <option value="google">Google Ads</option>
                  </select>
                </div>
              </div>

              {(campaignFormData.channel === 'email' || campaignFormData.channel === 'in-app') && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Subject / Headline</label>
                  <input type="text" value={campaignFormData.subject} onChange={e => setCampaignFormData({...campaignFormData, subject: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Exciting news!" />
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Message Content / Ad Copy *</label>
                <textarea required rows={4} value={campaignFormData.content} onChange={e => setCampaignFormData({...campaignFormData, content: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Type your message here..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target Audience</label>
                  <input type="text" value={campaignFormData.targetAudience} onChange={e => setCampaignFormData({...campaignFormData, targetAudience: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="e.g. Active Users" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Schedule At</label>
                  <input type="datetime-local" value={campaignFormData.scheduledAt} onChange={e => setCampaignFormData({...campaignFormData, scheduledAt: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Budget (Optional)</label>
                  <input type="number" value={campaignFormData.budget} onChange={e => setCampaignFormData({...campaignFormData, budget: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="1000" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target URL (Optional)</label>
                  <input type="url" value={campaignFormData.targetUrl} onChange={e => setCampaignFormData({...campaignFormData, targetUrl: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="https://" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setIsAddingCampaign(false); setEditingCampaign(null); }} className="px-4 py-2 border rounded font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-[#EF4444] hover:bg-red-600 text-white px-4 py-2 rounded font-bold">Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsTab;

