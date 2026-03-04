import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Callback, CallbackStatus } from '@/lib/types';
import Protected from '@/components/Protected';
import { 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';

export default function CallbacksPage() {
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = async () => {
    const data = await api<Callback[]>(`/callbacks?filter=${filter}`);
    setCallbacks(data);
  };

  useEffect(() => { load(); }, [filter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} items?`)) return;
    for (const id of selectedIds) {
      await api(`/callbacks/${id}`, { method: 'DELETE' });
    }
    setSelectedIds([]);
    load();
  };

  const handleBulkStatus = async (status: CallbackStatus) => {
    for (const id of selectedIds) {
      await api(`/callbacks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }
    setSelectedIds([]);
    load();
  };

  return (
    <Protected>
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Patient Callbacks</h1>
            <p className="text-slate-500">Manage and track patient follow-up requests.</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <select 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Open Tasks</option>
                <option value="overdue">Overdue Only</option>
                <option value="today">Due Today</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="mb-4 p-3 bg-blue-600 rounded-lg shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-white font-medium px-2">{selectedIds.length} items selected</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkStatus('COMPLETED')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors">
                <CheckCircle size={16} /> Mark Done
              </button>
              <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => setSelectedIds(e.target.checked ? callbacks.map(c => c.id) : [])}
                    checked={selectedIds.length === callbacks.length && callbacks.length > 0}
                  />
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Patient</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Category</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Priority</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {callbacks.map(c => (
                <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(c.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.includes(c.id)} 
                      onChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{c.patient_last_name}</div>
                    <div className="text-xs text-slate-500">{c.patient_phone}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{c.category}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      c.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.priority === 'HIGH' && <AlertCircle size={12} />}
                      {c.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 
                      c.status === 'ATTEMPTED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {callbacks.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium">
              No active callbacks found for this filter.
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}