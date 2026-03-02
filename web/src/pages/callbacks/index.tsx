import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Callback, CallbackStatus } from '@/lib/types';
import Protected from '@/components/Protected';

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
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
      await api(`/callbacks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    }
    setSelectedIds([]);
    load();
  };

  return (
    <Protected>
      <div className="p-6">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Patient Callbacks</h1>
          <div className="flex gap-2">
            <select 
              className="border p-2 rounded"
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Open</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
            </select>
            
            {selectedIds.length > 0 && (
              <div className="flex gap-2 bg-blue-50 p-1 rounded border border-blue-200">
                <button onClick={() => handleBulkStatus('COMPLETED')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Mark Done</button>
                <button onClick={handleBulkDelete} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
              </div>
            )}
          </div>
        </div>

        <table className="w-full border-collapse bg-white shadow-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-2 text-left w-10">
                <input 
                  type="checkbox" 
                  onChange={(e) => setSelectedIds(e.target.checked ? callbacks.map(c => c.id) : [])}
                  checked={selectedIds.length === callbacks.length && callbacks.length > 0}
                />
              </th>
              <th className="p-2 text-left">Patient</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Priority</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {callbacks.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(c.id)} 
                    onChange={() => toggleSelect(c.id)}
                  />
                </td>
                <td className="p-2 font-medium">{c.patient_last_name}</td>
                <td className="p-2">{c.category}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${c.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                    {c.priority}
                  </span>
                </td>
                <td className="p-2 text-sm">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Protected>
  );
}