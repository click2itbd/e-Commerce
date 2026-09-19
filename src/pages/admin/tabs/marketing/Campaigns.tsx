import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';
import { useAuth } from '../../../../context/AuthContext';
import { Mail, Edit, Trash2, Send, Plus, X, Edit2, BarChart } from 'lucide-react';
import { sendEmail } from '../../../../services/emailService';

const CampaignsTab: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [metricsCampaign, setMetricsCampaign] = useState<any>(null);
  const [metricsFormData, setMetricsFormData] = useState<any>({});
  
  const [audienceType, setAudienceType] = useState('all'); // 'all', 'custom'
  const [campaignFormData, setCampaignFormData] = useState<any>({
    title: '',
    channel: 'email',
    subject: '',
    content: '',
    recipients: [], // Array of emails or phones
    bulkEmails: '', // comma separated manual entry
    selectedUserIds: [], // array of customer IDs
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
      
      const custQ = query(collection(db, 'customers'), orderBy('name', 'asc'));
      const custSnap = await getDocs(custQ);
      setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      const payload = { ...campaignFormData };
      if (!payload.createdAt) {
        payload.createdAt = new Date().toISOString();
      }
      
      // Handle Auto Scheduling
      if (payload.scheduledAt && new Date(payload.scheduledAt) > new Date()) {
        payload.status = 'scheduled';
      } else if (!payload.status) {
        payload.status = 'draft';
      }

      // Handle Recipients processing for Email/SMS
      if (payload.channel === 'email' || payload.channel === 'sms' || payload.channel === 'whatsapp') {
        if (audienceType === 'all') {
           payload.targetAudience = 'All Customers';
           payload.recipients = customers.map(c => payload.channel === 'email' ? c.email : c.phone).filter(Boolean);
        } else if (audienceType === 'custom') {
           payload.targetAudience = 'Custom List';
           // Add selected CRM users
           const crmRecipients = customers.filter(c => (payload.selectedUserIds || []).includes(c.id)).map(c => payload.channel === 'email' ? c.email : c.phone).filter(Boolean);
           // Add manual entries
           const manualRecipients = (payload.bulkEmails || '').split(',').map((s: string) => s.trim()).filter(Boolean);
           payload.recipients = Array.from(new Set([...crmRecipients, ...manualRecipients]));
        }
      }
      
      if (editingCampaign) {
        await updateDoc(doc(db, 'campaigns', editingCampaign.id), payload);
        toast.success('Campaign updated successfully');
      } else {
        await addDoc(collection(db, 'campaigns'), payload);
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
      let sentCount = 0;
      let deliveredCount = 0;
      
      // If channel is Email, actually send emails
      if (campaign.channel === 'email' && campaign.recipients?.length > 0) {
        toast.loading(`Sending emails to ${campaign.recipients.length} recipients...`, { id: 'sending-campaign' });
        
        let htmlContent = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">`;
        if (campaign.imageUrl) {
           htmlContent += `<img src="${campaign.imageUrl}" style="width: 100%; border-radius: 8px; margin-bottom: 20px;" alt="Campaign Banner" />`;
        }
        htmlContent += `<div style="white-space: pre-wrap;">${campaign.content}</div>`;
        if (campaign.targetUrl) {
           htmlContent += `<div style="margin-top: 30px;"><a href="${campaign.targetUrl}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Details / Offer</a></div>`;
        }
        htmlContent += `</div>`;

        // Send to each recipient
        for (const email of campaign.recipients) {
          const success = await sendEmail({
            to: email,
            subject: campaign.subject || campaign.title || 'Special Update from Click2IT',
            html: htmlContent,
            category: 'marketing_campaign'
          });
          sentCount++;
          if (success) deliveredCount++;
        }
        
        toast.dismiss('sending-campaign');
      } else if (campaign.channel === 'sms' || campaign.channel === 'whatsapp') {
        // Mock SMS/WhatsApp sending
        toast.loading(`Deploying to ${campaign.channel}...`, { id: 'sending-campaign' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        sentCount = campaign.recipients?.length || 0;
        deliveredCount = sentCount; // assuming 100% delivery for mock
        toast.dismiss('sending-campaign');
      } else {
        // Ads (Facebook, Google)
        sentCount = 0;
        deliveredCount = 0;
      }

      await updateDoc(doc(db, 'campaigns', campaign.id), {
        status: 'sent',
        sentAt: new Date().toISOString(),
        title: campaign.title || '',
        subject: campaign.subject || '',
        content: campaign.content || '',
        recipients: campaign.recipients || [],
        createdAt: campaign.createdAt || new Date().toISOString(),
        sent: sentCount,
        delivered: deliveredCount,
      });
      toast.success('Campaign deployed successfully');
      fetchData();
    } catch (error) {
      toast.dismiss('sending-campaign');
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    }
  };

  const handleUpdateMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'campaigns', metricsCampaign.id), {
        impressions: Number(metricsFormData.impressions || 0),
        clicked: Number(metricsFormData.clicked || 0),
        sent: Number(metricsFormData.sent || 0),
        delivered: Number(metricsFormData.delivered || 0),
        opened: Number(metricsFormData.opened || 0),
      });
      toast.success('Metrics updated successfully');
      setMetricsCampaign(null);
      fetchData();
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast.error('Failed to update metrics');
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
                          {campaign.status !== 'draft' && (
                            <button
                              onClick={() => {
                                setMetricsCampaign(campaign);
                                setMetricsFormData({
                                  impressions: campaign.impressions || '',
                                  clicked: campaign.clicked || '',
                                  sent: campaign.sent || '',
                                  delivered: campaign.delivered || '',
                                  opened: campaign.opened || '',
                                });
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                              title="Update Metrics"
                            >
                              <BarChart size={18} />
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
                {(campaignFormData.channel === 'email' || campaignFormData.channel === 'sms' || campaignFormData.channel === 'whatsapp') ? (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Target Audience</label>
                    <select value={audienceType} onChange={e => setAudienceType(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Customers ({customers.length})</option>
                      <option value="custom">Custom Selection / Manual</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Target Audience</label>
                    <input type="text" value={campaignFormData.targetAudience} onChange={e => setCampaignFormData({...campaignFormData, targetAudience: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="e.g. Active Users" />
                  </div>
                )}
                
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Schedule At</label>
                  <input type="datetime-local" value={campaignFormData.scheduledAt} onChange={e => setCampaignFormData({...campaignFormData, scheduledAt: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              
              {audienceType === 'custom' && (campaignFormData.channel === 'email' || campaignFormData.channel === 'sms' || campaignFormData.channel === 'whatsapp') && (
                <div className="bg-gray-50 p-4 rounded border">
                  <label className="block font-bold text-gray-700 mb-2">Select Customers from CRM</label>
                  <div className="max-h-40 overflow-y-auto border bg-white rounded p-2 mb-4">
                    {customers.length === 0 ? <p className="text-gray-500 text-sm">No customers found.</p> : customers.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50">
                        <input type="checkbox" checked={campaignFormData.selectedUserIds?.includes(c.id)} onChange={e => {
                          const ids = campaignFormData.selectedUserIds || [];
                          if (e.target.checked) setCampaignFormData({...campaignFormData, selectedUserIds: [...ids, c.id]});
                          else setCampaignFormData({...campaignFormData, selectedUserIds: ids.filter((id: string) => id !== c.id)});
                        }} />
                        {c.name} ({campaignFormData.channel === 'email' ? c.email : c.phone})
                      </label>
                    ))}
                  </div>
                  <label className="block font-bold text-gray-700 mb-1">Or Enter Manual {campaignFormData.channel === 'email' ? 'Emails' : 'Phone Numbers'}</label>
                  <textarea rows={2} value={campaignFormData.bulkEmails} onChange={e => setCampaignFormData({...campaignFormData, bulkEmails: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder={`Comma separated (e.g. ${campaignFormData.channel === 'email' ? 'test@test.com, admin@test.com' : '01700000000, 01800000000'})`} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {['facebook', 'instagram', 'google'].includes(campaignFormData.channel) && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Budget (Optional)</label>
                    <input type="number" value={campaignFormData.budget} onChange={e => setCampaignFormData({...campaignFormData, budget: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="1000" />
                  </div>
                )}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target URL / Call-to-Action Link</label>
                  <input type="url" value={campaignFormData.targetUrl} onChange={e => setCampaignFormData({...campaignFormData, targetUrl: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="https://" />
                </div>
              </div>
              
              {(campaignFormData.channel === 'email' || campaignFormData.channel === 'facebook' || campaignFormData.channel === 'whatsapp') && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Image URL (Optional Banner)</label>
                  <input type="url" value={campaignFormData.imageUrl} onChange={e => setCampaignFormData({...campaignFormData, imageUrl: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="https://example.com/banner.jpg" />
                  {campaignFormData.imageUrl && (
                    <div className="mt-2 border rounded overflow-hidden max-w-xs">
                      <img src={campaignFormData.imageUrl} alt="Campaign Banner Preview" className="w-full h-auto object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              )}

              {campaignFormData.content && (
                <div className="mt-4 p-4 border border-blue-100 bg-blue-50 rounded-lg">
                  <h4 className="text-xs font-bold text-blue-800 mb-2 uppercase">Ad / Message Preview</h4>
                  {campaignFormData.subject && <div className="font-bold mb-1">{campaignFormData.subject}</div>}
                  <div className="whitespace-pre-wrap text-sm text-gray-800">{campaignFormData.content}</div>
                  {campaignFormData.targetUrl && (
                    <a href={campaignFormData.targetUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-blue-600 font-bold hover:underline">
                      Learn More / Visit Link &rarr;
                    </a>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setIsAddingCampaign(false); setEditingCampaign(null); }} className="px-4 py-2 border rounded font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-[#EF4444] hover:bg-red-600 text-white px-4 py-2 rounded font-bold">Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {metricsCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-indigo-900">Update Metrics</h3>
              <button onClick={() => setMetricsCampaign(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateMetrics} className="p-4 space-y-4 text-sm">
              {['facebook', 'instagram', 'google'].includes(metricsCampaign.channel || '') ? (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Impressions</label>
                    <input type="number" value={metricsFormData.impressions} onChange={e => setMetricsFormData({...metricsFormData, impressions: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Clicks</label>
                    <input type="number" value={metricsFormData.clicked} onChange={e => setMetricsFormData({...metricsFormData, clicked: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Total Sent</label>
                    <input type="number" value={metricsFormData.sent} onChange={e => setMetricsFormData({...metricsFormData, sent: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Delivered</label>
                    <input type="number" value={metricsFormData.delivered} onChange={e => setMetricsFormData({...metricsFormData, delivered: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Opened</label>
                    <input type="number" value={metricsFormData.opened} onChange={e => setMetricsFormData({...metricsFormData, opened: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Clicked / Responded</label>
                    <input type="number" value={metricsFormData.clicked} onChange={e => setMetricsFormData({...metricsFormData, clicked: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setMetricsCampaign(null)} className="px-3 py-1.5 border rounded text-gray-600">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700">Save Metrics</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsTab;

