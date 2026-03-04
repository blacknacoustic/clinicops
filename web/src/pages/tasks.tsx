import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Protected from '@/components/Protected';
import { 
  X, Plus, Search, UserCircle, MessageSquare, 
  Activity, ClipboardCheck, User as UserIcon, MoreVertical 
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    assigned_user_id: '',
    priority: 'MEDIUM',
    outcome_note: '',
    due_at: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      const [taskData, userData] = await Promise.all([
        api<any[]>('/callbacks?category=INTERNAL_TASK'),
        api<any[]>('/users')
      ]);
      setTasks(taskData || []);
      setUsers(userData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // FIXED: Search now looks at the appointments endpoint to find real patients
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (patientSearch.length > 1 && !selectedPatient) {
        try {
          // We query appointments to find existing patients in your system
          const data = await api<any[]>(`/appointments?range=tomorrow`); 
          const filtered = data.filter(a => 
            a.patient_last_name?.toLowerCase().includes(patientSearch.toLowerCase())
          );
          setSearchResults(filtered.slice(0, 5));
        } catch (err) {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearch, selectedPatient]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      patient_last_name: newTask.title,
      patient_dob: selectedPatient ? selectedPatient.patient_dob : '1900-01-01',
      patient_phone: selectedPatient ? (selectedPatient.patient_phone || '') : '',
      category: 'INTERNAL_TASK',
      priority: newTask.priority,
      status: 'NEW',
      assigned_user_id: newTask.assigned_user_id || null,
      outcome_note: newTask.outcome_note,
      due_at: new Date(newTask.due_at).toISOString()
    };

    try {
      await api('/callbacks', { method: 'POST', body: JSON.stringify(payload) });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      alert("Error: Check console for 422 details.");
    }
  };

  const resetForm = () => {
    setNewTask({ title: '', assigned_user_id: '', priority: 'MEDIUM', outcome_note: '', due_at: new Date().toISOString().split('T')[0] });
    setSelectedPatient(null);
    setPatientSearch("");
  };

  const updateTaskStatus = async (id: string, status: string) => {
    await api(`/callbacks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadData();
  };

  return (
    <Protected>
      <div className="max-w-full mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <ClipboardCheck className="text-blue-600" size={32} /> Operations Board
            </h1>
            <p className="text-slate-500 font-medium">Internal employee tasks.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95">
            <Plus size={20} /> Create Internal Task
          </button>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-5 px-2">Task / Patient</div>
            <div className="col-span-2 text-center">Assigned Staff</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-3 text-center">Update</div>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.map(task => (
              <div key={task.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50">
                <div className="col-span-5 px-2">
                  <div className="font-bold text-slate-900">{task.patient_last_name}</div>
                  {task.patient_dob !== '1900-01-01' && <div className="text-[10px] text-blue-500 font-bold uppercase">Patient: {task.patient_dob}</div>}
                </div>
                <div className="col-span-2 text-center font-bold text-slate-600">
                  {users.find(u => u.id === task.assigned_user_id)?.username || '—'}
                </div>
                <div className="col-span-2 flex justify-center">
                  <select 
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className="w-32 text-[11px] font-black px-3 py-2 rounded-lg border-2 bg-slate-50 border-slate-200"
                  >
                    <option value="NEW">NEW</option>
                    <option value="IN_PROGRESS">WORKING</option>
                    <option value="COMPLETED">DONE</option>
                  </select>
                </div>
                <div className="col-span-3 text-center text-xs text-slate-400 italic">
                  {task.outcome_note || 'No notes...'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 uppercase">New Internal Task</h2>
                <button onClick={() => setShowModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateTask} className="p-8 space-y-5">
                <input required placeholder="Task Subject" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold"
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-1">Assign To Staff</label>
                  <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none"
                    value={newTask.assigned_user_id} onChange={e => setNewTask({...newTask, assigned_user_id: e.target.value})}>
                    <option value="">Select Employee...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-1">Search Patient</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input placeholder="Search name..." className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none"
                      value={selectedPatient ? selectedPatient.patient_last_name : patientSearch}
                      onChange={e => { setSelectedPatient(null); setPatientSearch(e.target.value); }} />
                  </div>
                  
                  {searchResults.length > 0 && !selectedPatient && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                      <div className="p-4 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-400 border-b"
                        onClick={() => setSelectedPatient({ patient_last_name: "N/A - General", patient_dob: "1900-01-01" })}>
                        N/A - General (No Patient)
                      </div>
                      {searchResults.map(p => (
                        <div key={p.id} className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between border-b"
                          onClick={() => { setSelectedPatient(p); setSearchResults([]); }}>
                          <span className="font-bold text-slate-900">{p.patient_last_name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{p.patient_dob}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <textarea placeholder="Instructions" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-24 font-medium"
                  value={newTask.outcome_note} onChange={e => setNewTask({...newTask, outcome_note: e.target.value})} />

                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl transition-all">
                  Assign Task
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Protected>
  );
}