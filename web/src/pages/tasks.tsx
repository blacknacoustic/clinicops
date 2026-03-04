import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Protected from '@/components/Protected';
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  UserPlus, 
  MoreVertical,
  Plus,
  User as UserIcon,
  Activity
} from 'lucide-react';

// Helper for Monday-style timestamps
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return '';
  const now = new Date();
  const updated = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return updated.toLocaleDateString();
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  const loadData = async () => {
    const [taskData, userData] = await Promise.all([
      api<any[]>('/callbacks?status=open'),
      api<any[]>('/users')
    ]);
    setTasks(taskData);
    setUsers(userData);
  };

  useEffect(() => { 
    loadData(); 
    const interval = setInterval(loadData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const updateTask = async (id: string, payload: any) => {
    await api(`/callbacks/${id}`, { 
      method: 'PATCH', 
      body: JSON.stringify(payload) 
    });
    loadData();
  };

  const handleNoteSubmit = async (id: string) => {
    if (tempNote.trim() !== "") {
      await updateTask(id, { outcome_note: tempNote });
    }
    setEditingNote(null);
  };

  return (
    <Protected>
      <div className="max-w-full mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Task Board</h1>
            <p className="text-slate-500">Real-time collaboration and patient follow-up tracking.</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
            <Plus size={20} /> New Task
          </button>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
            <div className="col-span-4 px-2">Task / Patient Detail</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Latest Progress Update</div>
            <div className="col-span-1 text-right"></div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-slate-100">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className={`grid grid-cols-12 gap-4 p-5 items-center transition-all ${
                  task.status === 'COMPLETED' ? 'bg-emerald-50/40 opacity-70' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Task Info */}
                <div className="col-span-4 px-2">
                  <div className="font-bold text-slate-900 text-lg">{task.patient_last_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-100">
                      {task.category}
                    </span>
                    {task.priority === 'HIGH' && (
                      <span className="text-[10px] font-extrabold bg-red-50 text-red-600 px-2 py-0.5 rounded uppercase tracking-wider border border-red-100">
                        High Priority
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignment Dropdown */}
                <div className="col-span-2">
                  <div className="relative group flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <UserIcon size={18} />
                    </div>
                    <select 
                      value={task.assigned_user_id || ''}
                      onChange={(e) => updateTask(task.id, { assigned_user_id: e.target.value })}
                      className="bg-transparent text-sm font-semibold text-slate-600 outline-none cursor-pointer hover:text-blue-600 appearance-none"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Picker */}
                <div className="col-span-2 text-center">
                  <select 
                    value={task.status}
                    onChange={(e) => updateTask(task.id, { status: e.target.value })}
                    className={`w-32 text-[11px] font-black px-3 py-2 rounded-lg border-2 transition-all cursor-pointer appearance-none text-center ${
                      task.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <option value="PENDING">STUCK</option>
                    <option value="IN_PROGRESS">WORKING</option>
                    <option value="COMPLETED">DONE</option>
                  </select>
                </div>

                {/* Inline Progress Note with Pulse */}
                <div className="col-span-3">
                  {editingNote === task.id ? (
                    <input
                      autoFocus
                      className="w-full px-3 py-2 text-sm border-2 border-blue-400 rounded-xl outline-none shadow-sm shadow-blue-100"
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      onBlur={() => handleNoteSubmit(task.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNoteSubmit(task.id)}
                    />
                  ) : (
                    <div 
                      onClick={() => { setEditingNote(task.id); setTempNote(task.outcome_note || ""); }}
                      className="group flex flex-col gap-1 p-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare size={14} className="text-slate-300 group-hover:text-blue-500" />
                        <span className={task.outcome_note ? "text-slate-700 font-medium truncate" : "italic text-slate-300"}>
                          {task.outcome_note || 'Update progress...'}
                        </span>
                      </div>
                      {task.updated_at && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-6 font-semibold uppercase tracking-tighter">
                          <Activity size={10} className="text-blue-400 animate-pulse" />
                          {formatRelativeTime(task.updated_at)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Menu */}
                <div className="col-span-1 text-right">
                  <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Protected>
  );
}