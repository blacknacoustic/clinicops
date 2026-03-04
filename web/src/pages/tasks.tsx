import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Protected from '@/components/Protected';
import { 
  CheckCircle2, 
  MessageSquare, 
  UserPlus, 
  MoreVertical,
  Plus,
  User as UserIcon,
  Activity,
  X // For closing the modal
} from 'lucide-react';

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
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  // New Task Form State
  const [newTask, setNewTask] = useState({
    patient_last_name: '',
    patient_dob: '',
    patient_phone: '',
    category: 'SCHEDULING',
    priority: 'MEDIUM',
    due_at: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    const [taskData, userData] = await Promise.all([
      api<any[]>('/callbacks?status=NEW'),
      api<any[]>('/users')
    ]);
    setTasks(taskData);
    setUsers(userData);
  };

  useEffect(() => { 
    loadData(); 
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert due_at to full ISO string for the backend
      const payload = { ...newTask, due_at: new Date(newTask.due_at).toISOString() };
      await api('/callbacks', { method: 'POST', body: JSON.stringify(payload) });
      setShowModal(false);
      setNewTask({
        patient_last_name: '',
        patient_dob: '',
        patient_phone: '',
        category: 'SCHEDULING',
        priority: 'MEDIUM',
        due_at: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      alert("Error creating task. Check all fields.");
    }
  };

  const updateTask = async (id: string, payload: any) => {
    await api(`/callbacks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    loadData();
  };

  return (
    <Protected>
      <div className="max-w-full mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Task Board</h1>
            <p className="text-slate-500">Real-time collaboration and patient follow-up tracking.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus size={20} /> New Task
          </button>
        </header>

        {/* TASK BOARD UI (Existing Table) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
            <div className="col-span-4 px-2">Task / Patient Detail</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Latest Progress Update</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.map(task => (
              <div key={task.id} className={`grid grid-cols-12 gap-4 p-5 items-center transition-all ${task.status === 'COMPLETED' ? 'bg-emerald-50/40 opacity-70' : 'hover:bg-slate-50/50'}`}>
                {/* ... (Same Task Row content as before) ... */}
                <div className="col-span-4 px-2">
                  <div className="font-bold text-slate-900 text-lg">{task.patient_last_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase border border-blue-100">{task.category}</span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <UserIcon size={18} className="text-slate-400" />
                  <select 
                    value={task.assigned_user_id || ''}
                    onChange={(e) => updateTask(task.id, { assigned_user_id: e.target.value })}
                    className="bg-transparent text-sm font-semibold text-slate-600 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <select 
                    value={task.status}
                    onChange={(e) => updateTask(task.id, { status: e.target.value })}
                    className={`w-32 text-[11px] font-black px-3 py-2 rounded-lg border-2 appearance-none text-center ${task.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                  >
                    <option value="PENDING">STUCK</option>
                    <option value="IN_PROGRESS">WORKING</option>
                    <option value="COMPLETED">DONE</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <div onClick={() => { setEditingNote(task.id); setTempNote(task.outcome_note || ""); }} className="group p-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white cursor-pointer transition-all">
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare size={14} className="text-slate-300 group-hover:text-blue-500" />
                      <span className={task.outcome_note ? "text-slate-700 font-medium truncate" : "italic text-slate-300"}>{task.outcome_note || 'Update progress...'}</span>
                    </div>
                    {task.updated_at && <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-6 font-semibold uppercase"><Activity size={10} className="text-blue-400 animate-pulse" /> {formatRelativeTime(task.updated_at)}</div>}
                  </div>
                </div>
                <div className="col-span-1 text-right"><MoreVertical size={20} className="text-slate-300 ml-auto" /></div>
              </div>
            ))}
          </div>
        </div>

        {/* NEW TASK MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Create New Task</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Patient Name</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-semibold" 
                      value={newTask.patient_last_name} onChange={e => setNewTask({...newTask, patient_last_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">DOB</label>
                    <input type="date" required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-semibold"
                      value={newTask.patient_dob} onChange={e => setNewTask({...newTask, patient_dob: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Phone</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-semibold"
                      value={newTask.patient_phone} onChange={e => setNewTask({...newTask, patient_phone: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Category</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-semibold"
                      value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value})}>
                      <option value="SCHEDULING">Scheduling</option>
                      <option value="RESULTS">Results</option>
                      <option value="REFILL">Refill</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Priority</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-semibold"
                      value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Protected>
  );
}