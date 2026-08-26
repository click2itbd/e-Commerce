import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Loader2, ShieldAlert, Trash2, Clock, User, Filter } from 'lucide-react';
import { format, isSameMonth, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(500));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await deleteDoc(doc(db, 'audit_logs', id));
      setLogs(logs.filter(l => l.id !== id));
      toast.success("Log deleted successfully");
    } catch (error) {
      toast.error("Failed to delete log");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL visible logs? This cannot be undone.")) return;
    try {
      setLoading(true);
      for (const log of filteredLogs) {
        await deleteDoc(doc(db, 'audit_logs', log.id));
      }
      setLogs(logs.filter(l => !filteredLogs.find(fl => fl.id === l.id)));
      toast.success("Logs cleared successfully");
    } catch (error) {
      toast.error("Failed to clear logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!log.timestamp) return false;
    const logDate = new Date(log.timestamp);
    if (filterMonth) {
      const [y, m] = filterMonth.split('-');
      const filterDateObj = new Date(Number(y), Number(m) - 1);
      if (!isSameMonth(logDate, filterDateObj)) return false;
    }
    if (filterDate) {
      if (!isSameDay(logDate, new Date(filterDate))) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-red-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Admin Audit Logs (Delete History)</h2>
            <p className="text-sm text-gray-500">Record of all permanent deletions performed by Administrators.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
            <Filter size={16} className="text-gray-400" />
            <input 
              type="month" 
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setFilterDate(''); }}
              className="outline-none text-gray-700 bg-transparent"
              title="Filter by Month"
            />
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
            <Filter size={16} className="text-gray-400" />
            <input 
              type="date" 
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setFilterMonth(''); }}
              className="outline-none text-gray-700 bg-transparent"
              title="Filter by Exact Date"
            />
          </div>
          {(filterMonth || filterDate) && (
            <button 
              onClick={() => { setFilterMonth(''); setFilterDate(''); }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              Clear Filters
            </button>
          )}
          {filteredLogs.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ml-auto"
            >
              <Trash2 size={16} /> Clear Visible Logs
            </button>
          )}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="p-10 text-center text-gray-400">
          <Trash2 size={40} className="mx-auto mb-3 opacity-20" />
          <p>No deletion logs found for the selected criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Action</th>
                <th className="p-4 font-bold">Entity Type</th>
                <th className="p-4 font-bold">Details</th>
                <th className="p-4 font-bold">Performed By</th>
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                      <Trash2 size={12} /> {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-gray-700">{log.entityType}</td>
                  <td className="p-4 text-sm text-gray-600">{log.details}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                      <User size={14} className="text-blue-500" />
                      {log.performedBy}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      {log.timestamp ? format(new Date(log.timestamp), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(log.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete this log"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
