import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Protected from '@/components/Protected';
import { 
  X, Plus, Search, UserCircle, MessageSquare, 
  Activity, ClipboardCheck, User as UserIcon, MoreVertical 
} from 'lucide-react';

// Relative time helper for the "Monday.com" feel
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
  
  // Inline editing state
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  // Search state for patient association
  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // New Task Form State
  const [newTask, setNewTask] = useState({
    title: '',
    assigned_user_id: '',
    priority: 'MEDIUM',
    outcome_note: '',
    due_at: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      // CRITICAL: We pass category=INTERNAL_TASK to separate from Callbacks
      const [taskData, userData] = await Promise.all([
        api<any[]>('/callbacks?category=INTERNAL_TASK'),
        api<any[]>('/users')
      ]);
      setTasks(taskData);
      setUsers(userData);
    } catch (err) {
      console.error("Failed to load task board:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Patient Search Logic
  useEffect(() => {
    if (patientSearch.length > 1 && !selectedPatient) {
      // Searching unique names from existing data for association
      const uniqueNames = Array.from(new Set(tasks.map(t => t.patient_last_name)));
      const filtered = tasks
        .filter(t => t.patient_last_name?.toLowerCase().includes(patientSearch.toLowerCase()))
        .filter((v, i, a) => a.findIndex(t => t.patient_last_name === v.patient_last_name) === i);
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [patientSearch, selectedPatient, tasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Constructing the payload for Pydantic (CallbackCreate schema)
    const payload = {
      patient_last_name: newTask.title,
      patient_dob: selectedPatient ? selectedPatient.patient_dob : '1900-01-01',
      patient_phone: selectedPatient ? selectedPatient.patient_phone : '',
      category: 'INTERNAL_TASK',
      priority: newTask.priority,
      status: 'NEW',
      assigned_user_id: newTask.assigned_user_id || null, // Ensure empty string becomes null
      outcome_note: newTask.outcome_note,
      due_at: new Date(newTask.due_at).toISOString()
    };

    try {
      await api('/callbacks', { method: 'POST', body: JSON.stringify(payload) });
      setShowModal(false);
      setNewTask({ title: '', assigned_user_id: '', priority: 'MEDIUM', outcome_note: '', due_at: new Date().toISOString().split('T')[0] });
      setSelectedPatient(null);
      setPatientSearch("");
      loadData();
    } catch (err) {
      alert("Failed to assign task. Please ensure all required fields are filled.");
      console.error("422 Error Check:", payload);
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    await api(`/callbacks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadData();
  };

  const handleNoteSubmit = async (id: string) => {
    await api(`/callbacks/${id}`, { method: 'PATCH', body: JSON.stringify({ outcome_note: tempNote }) });
    setEditingNote(null);
    loadData();
  };

  return (
    <Protected>
      <div className="max-w-full mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <ClipboardCheck className="text-blue-600" size={32} />
              Operations Board
            </h1>
            <p className="text-slate-500 font-medium">Internal employee tasks and assignments.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} /> Create Internal Task
          </button>
        </header>

        {/* Task Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-5 px-2">Task Description / Patient</div>
            <div className="col-span-2 text-center">Assigned Staff</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-3">Latest Progress</div>
          </div>

          <div className="divide-y divide-slate-100 min-h-[200px]">
            {tasks.map(task => (
              <div key={task.id} className={`grid grid-cols-12 gap-4 p-5 items-center transition-all ${task.status === 'COMPLETED' ? 'bg-emerald-50/40 opacity-70' : 'hover:bg-slate-50/50'}`}>
                
                {/* Task Context */}
                <div className="col-span-5 px-2">
                  <div className="font-bold text-slate-900 text-lg">{task.patient_last_name}</div>
                  {task.patient_dob !== '1900-01-01' && (
                    <div className="text-[10px] text-blue-500 font-bold uppercase mt-1">Ref: Patient DOB {task.patient_dob}</div>
                  )}
                </div>

                {/* Assignment */}
                <div className="col-span-2 flex justify-center">
                  <div className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <UserIcon size={14} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">
                      {users.find(u => u.id === task.assigned_user_id)?.username || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="col-span-2 flex justify-center">
                  <select 
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className={`w-36 text-[11px] font-black px-3 py-2.5 rounded-xl border-2 appearance-none text-center transition-all cursor-pointer ${
                      task.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <option value="PENDING">STUCK / BLOCKED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                {/* Inline Notes */}
                <div className="col-span-3">
                  {editingNote === task.id ? (
                    <input
                      autoFocus
                      className="w-full px-3 py-2 text-sm border-2 border-blue-400 rounded-xl outline-none"
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      onBlur={() => handleNoteSubmit(task.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNoteSubmit(task.id)}
                    />
                  ) : (
                    <div 
                      onClick={() => { setEditingNote(task.id); setTempNote(task.outcome_note || ""); }}
                      className="group p-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white cursor-pointer transition-all"
                    >
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare size={14} className="text-slate-300 mt-1" />
                        <span className={task.outcome_note ? "text-slate-600 font-medium truncate" : "italic text-slate-300"}>
                          {task.outcome_note || 'Update progress...'}
                        </span>
                      </div>
                      {task.updated_at && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-6 font-bold uppercase">
                          <Activity size={10} className="text-blue-400 animate-pulse" />
                          {formatRelativeTime(task.updated_at)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!loading && tasks.length === 0 && (
              <div className="p-20 text-center text-slate-400 font-bold">No internal tasks found.</div>
            )}
          </div>
        </div>

        {/* CREATE TASK MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">New Internal Task</h2>
                <button onClick={() => setShowModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Task Title / Description</label>
                  <input required placeholder="e.g. Update inventory or Call back Smith"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700"
                    value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Assign To Staff</label>
                  <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 appearance-none"
                    value={newTask.assigned_user_id} onChange={e => setNewTask({...newTask, assigned_user_id: e.target.value})}>
                    <option value="">Select Employee...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Associate Patient (Optional)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input 
                      placeholder="Search patient..."
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700"
                      value={selectedPatient ? selectedPatient.patient_last_name : patientSearch}
                      onChange={e => { setSelectedPatient(null); setPatientSearch(e.target.value); }}
                    />
                  </div>
                  {/* Search Dropdown */}
                  {searchResults.length > 0 && !selectedPatient && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-40 overflow-y-auto">
                      {searchResults.map(p => (
                        <div 
                          key={p.id} 
                          className="p-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-slate-50"
                          onClick={() => { setSelectedPatient(p); setSearchResults([]); }}
                        >
                          <span className="text-sm font-bold text-slate-900">{p.patient_last_name}</span>
                          <UserCircle size={18} className="text-blue-200" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Initial Instructions</label>
                  <textarea 
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium text-slate-600 h-24 resize-none"
                    value={newTask.outcome_note} onChange={e => setNewTask({...newTask, outcome_note: e.target.value})} 
                  />
                </div>

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