import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Protected from '@/components/Protected';
import { 
  X, Plus, Search, UserCircle, MessageSquare, 
  Activity, ClipboardCheck, User as UserIcon, MoreVertical 
} from 'lucide-react';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
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
    setLoading(true);
    try {
      // Explicitly request INTERNAL_TASK to separate from patient callbacks
      const [taskData, userData] = await Promise.all([
        api<any[]>('/callbacks?category=INTERNAL_TASK'),
        api<any[]>('/users')
      ]);
      setTasks(taskData || []);
      setUsers(userData || []);
    } catch (err) {
      console.error("Failed to load task board data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Search Logic - Queries appointments to find patients
  useEffect(() => {
    const searchPatients = async () => {
      if (patientSearch.length > 1 && !selectedPatient) {
        try {
          const data = await api<any[]>(`/appointments`);
          const filtered = data.filter(a => 
            a.patient_last_name?.toLowerCase().includes(patientSearch.toLowerCase())
          );
          // Deduplicate
          const unique = filtered.filter((v, i, a) => a.findIndex(t => t.patient_last_name === v.patient_last_name) === i);
          setSearchResults(unique.slice(0, 5));
        } catch (err) {
          console.error("Patient search failed:", err);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timer = setTimeout(searchPatients, 300);
    return () => clearTimeout(timer);
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
      console.error("Create Task Error:", err);
      alert("Failed to assign task. Check console for details.");
    }
  };

  const resetForm = () => {
    setNewTask({ title: '', assigned_user_id: '', priority: 'MEDIUM', outcome_note: '', due_at: new Date().toISOString().split('T')[0] });
    setSelectedPatient(null);
    setPatientSearch("");
  };

  return (
    <Protected>
      <div className="max-w-full mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <ClipboardCheck className="text-blue-600" size={32} />
              Operations Board
            </h1>
            <p className="text-slate-500 font-medium font-bold uppercase tracking-tighter">Internal Workflow</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
            <Plus size={20} /> New Task
          </button>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-5 px-2">Task / Context</div>
            <div className="col-span-2 text-center">Assigned</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-3 text-center">Progress</div>
          </div>
          <div className="divide-y divide-slate-100 min-h-[100px]">
            {tasks.map(task => (
              <div key={task.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50">
                <div className="col-span-5 px-2 font-bold text-slate-900 text-lg">{task.patient_last_name}</div>
                <div className="col-span-2 text-center text-sm font-bold text-slate-600">
                  {users.find(u => u.id === task.assigned_user_id)?.username || '—'}
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter">
                    {task.status}
                  </span>
                </div>
                <div className="col-span-3 text-sm text-slate-400 italic px-4 truncate">
                  {task.outcome_note || 'Waiting for update...'}
                </div>
              </div>
            ))}
            {tasks.length === 0 && !loading && (
              <div className="p-10 text-center text-slate-400 font-medium">No internal tasks found.</div>
            )}
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 uppercase">New Internal Task</h2>
                <button onClick={() => setShowModal(false)}><X size={24} className="text-slate-400" /></button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <input required placeholder="Task Title" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold"
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Assign To Staff</label>
                  <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold"
                    value={newTask.assigned_user_id} onChange={e => setNewTask({...newTask, assigned_user_id: e.target.value})}>
                    <option value="">Select Employee...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">Patient Ref (Optional)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input placeholder="Search name..." className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none"
                      value={selectedPatient ? selectedPatient.patient_last_name : patientSearch}
                      onChange={e => { setSelectedPatient(null); setPatientSearch(e.target.value); }} />
                  </div>
                  
                  {searchResults.length > 0 && !selectedPatient && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                      <div className="p-4 hover:bg-slate-50 cursor-pointer text-xs font-bold text-blue-600 border-b"
                        onClick={() => setSelectedPatient({ patient_last_name: "N/A - General", patient_dob: "1900-01-01" })}>
                        N/A - Internal/General
                      </div>
                      {