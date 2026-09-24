import React from 'react';
import { 
  Users, Search, Shield, ShieldOff, CheckCircle2, User as UserIcon
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Spinner } from '../components/SharedUI';

export function UsersTab({ state }) {
  const {
    activeTab, userSearch, setUserSearch, filteredUsers, userRoleEdits, setUserRoleEdits,
    saveUserRole, savingUserRole
  } = state;

  if (activeTab !== 'users') return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Users Management Panel */}
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200/60 p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
              <Users className="text-white" size={24} />
            </div>
            User Management <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold ml-2">{filteredUsers.length}</span>
          </h2>
          
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search name or email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full md:w-72 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Users className="text-slate-300" size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No users found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">Joined</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {user.displayName?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || <UserIcon size={14}/>}
                        </div>
                        {user.displayName || user.name || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {user.email || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium text-xs">
                        {user.createdAt ? new Date(user.createdAt.toDate ? user.createdAt.toDate() : user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <select
                          defaultValue={user.role || 'customer'}
                          onChange={e => setUserRoleEdits(prev => ({ ...prev, [user.id]: e.target.value }))}
                          className={cn(
                            "w-28 border-2 border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold bg-white focus:ring-2 focus:border-blue-500 outline-none transition-all shadow-sm",
                            userRoleEdits[user.id] === 'admin' || (!userRoleEdits[user.id] && user.role === 'admin') ? "text-purple-700" : "text-slate-700"
                          )}
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => saveUserRole(user.id)}
                          disabled={savingUserRole[user.id] || (!userRoleEdits[user.id] || userRoleEdits[user.id] === (user.role || 'customer'))}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 flex items-center gap-1.5 ml-auto shadow-sm transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
                        >
                          {savingUserRole[user.id] ? <Spinner /> : (userRoleEdits[user.id] === 'admin' ? <Shield size={14}/> : <ShieldOff size={14}/>)} Update Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
