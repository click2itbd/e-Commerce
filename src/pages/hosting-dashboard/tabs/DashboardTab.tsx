import React from 'react';
import { 
  Globe, Server, FileText, HeadphonesIcon, TrendingUp, DollarSign, CheckCircle2, User, Search, RefreshCw, Plus, Edit2, Shield, ShieldOff, Trash2, ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { formatCurrency, cn } from '../../../lib/utils';
import SupportTickets from '../../admin/tabs/hosting/SupportTickets';
import {
  PagesEditorModule, CategoriesModule, PlanPackagesModule, ExtraServicesModule, 
  AddonPackagesModule, PromoCodesModule, ServersModule, DomainPricingModule, DomainRegistrarsModule
} from '../modules';

export function DashboardTab({ state }) {
  const {
    activeTab, setActiveTab, pendingDomainCount, pendingHostingCount, unpaidInvoicesCount,
    activeTicketsCount, thisMonthRevenue, lastMonthRevenue, dynamicPieData, totalOutstanding,
    totalPaid, selectedYear, setSelectedYear, yearOptions, areaData, orders, PAID_STATUSES, 
    tickets, domainQuery, COLORS, setDomainQuery, handleDomainSearch, isSearchingDomain, domainResults,
    pagedDomainOrders, domainOrdersPages, domainOrderPage, setDomainOrderPage, domainStatusEdits,
    setDomainStatusEdits, saveDomainOrderStatus, savingDomainStatus, showNewAccountModal,
    setShowNewAccountModal, newAccountForm, setNewAccountForm, handleProvisionAccount,
    provisioningAccount, hostingAccounts, handleAccountAction, accountActionLoading,
    orderStatusFilter, setOrderStatusFilter, PENDING_STATUSES, pagedOrders, orderPages,
    orderPage, setOrderPage, orderStatusEdits, setOrderStatusEdits, saveOrderStatus,
    savingOrderStatus, userSearch, setUserSearch, filteredUsers, userRoleEdits, setUserRoleEdits,
    saveUserRole, savingUserRole, settingsFormData, setSettingsFormData, saveSettings
  } = state;

  const currentYear = new Date().getFullYear();

  return (
    <>
      {/*  */}
      {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Top Modern Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Pending Domains', count: pendingDomainCount, icon: Globe, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-200', onClick: () => setActiveTab('domain-list') },
                    { title: 'Pending Hosting', count: pendingHostingCount, icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-200', onClick: () => setActiveTab('server-accounts') },
                    { title: 'Unpaid Invoices', count: unpaidInvoicesCount, icon: FileText, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-200', onClick: () => setActiveTab('all-orders') },
                    { title: 'Active Tickets', count: activeTicketsCount, icon: HeadphonesIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-200', onClick: () => setActiveTab('tickets') },
                  ].map((stat, idx) => (
                    <div key={idx} onClick={stat.onClick}
                      className="bg-white rounded-2xl border border-slate-100 p-6 cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 group flex items-center gap-5 relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300 z-10`}>
                        <stat.icon size={28} strokeWidth={1.5} />
                      </div>
                      <div className="z-10">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.title}</h3>
                        <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{stat.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Middle Section */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left Column: Revenue & Donut */}
                  <div className="xl:col-span-1 flex flex-col gap-6">
                    
                    {/* Modern Revenue Snippet */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full filter blur-[60px] opacity-40"></div>
                      <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-wider mb-4 relative z-10">Revenue Snapshot</h3>
                      
                      <div className="space-y-5 relative z-10">
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-1">THIS MONTH</p>
                          <div className="flex items-end gap-3">
                            <p className="text-4xl font-extrabold tracking-tight">{formatCurrency(thisMonthRevenue)}</p>
                            <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold pb-1">
                              <TrendingUp size={16} />
                            </div>
                          </div>
                        </div>
                        <div className="h-px w-full bg-slate-700/50"></div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 mb-1">LAST MONTH</p>
                          <p className="text-2xl font-bold text-slate-200">{formatCurrency(lastMonthRevenue)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-800 mb-2">Invoice Distribution</h3>
                      <div className="flex-1 flex items-center justify-center min-h-[220px]">
                        {totalOutstanding > 0 || totalPaid > 0 ? (
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={dynamicPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" cornerRadius={4}>
                                {dynamicPieData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-100 flex items-center justify-center">
                              <span className="text-xs font-semibold">No Data</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-6 mt-2">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Outstanding</span>
                          </div>
                          <span className="text-lg font-bold text-slate-800">{formatCurrency(totalOutstanding)}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Paid</span>
                          </div>
                          <span className="text-lg font-bold text-slate-800">{formatCurrency(totalPaid)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Area Chart */}
                  <div className="xl:col-span-2">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-800">Revenue Analytics</h3>
                          <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold p-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700">
                            {[currentYear-1, currentYear, currentYear+1].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Paid</div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500" /> Invoiced</div>
                        </div>
                      </div>
                      <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} tickFormatter={val => `৳${val}`} />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(value), '']} 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="paid" stroke="#3B82F6" fillOpacity={1} fill="url(#colorPaid)" strokeWidth={3} activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
                            <Area type="monotone" dataKey="invoiced" stroke="#F43F5E" fillOpacity={1} fill="url(#colorInvoiced)" strokeWidth={3} activeDot={{ r: 6, fill: '#F43F5E', stroke: '#fff', strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Recently Paid */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[250px]">
                    <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-500" /> Recently Paid Invoices
                    </h3>
                    <div className="space-y-4">
                      {orders.filter(o => PAID_STATUSES.includes(o.status) || o.paymentStatus === 'paid').slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                              <DollarSign size={18} className="text-emerald-600" />
                            </div>
                            <div>
                              <span className="font-bold text-sm text-slate-800">{order.customerName || order.userId || 'Customer'}</span>
                              <div className="text-xs text-slate-400 font-medium">
                                {order.createdAt ? new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString() : '—'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-sm text-slate-900">{formatCurrency(order.total || 0)}</div>
                            <div className="text-xs font-bold text-blue-500 hover:text-blue-700 cursor-pointer">#{order.id.substring(0, 6)}</div>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => PAID_STATUSES.includes(o.status) || o.paymentStatus === 'paid').length === 0 && (
                        <div className="text-sm text-slate-500 text-center py-6">No recently paid invoices</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Tickets */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[250px]">
                    <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                      <HeadphonesIcon size={18} className="text-indigo-500" /> Recent Support Tickets
                    </h3>
                    <div className="space-y-4">
                      {tickets.slice(0, 5).map(ticket => (
                        <div key={ticket.id} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                            <User size={18} className="text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm text-slate-800 truncate">{ticket.customerName || 'Customer'}</span>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '—'}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-blue-500 text-sm font-medium truncate hover:underline cursor-pointer">
                                [{ticket.id.substring(0, 6)}] {ticket.subject || 'No subject'}
                              </span>
                              <span className={`text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${ticket.status === 'open' || ticket.status === 'customer-reply' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                {(ticket.status || 'open')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {tickets.length === 0 && <div className="text-sm text-slate-500 text-center py-6">No recent tickets</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}
