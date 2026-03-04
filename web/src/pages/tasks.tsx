import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Protected from '@/components/Protected';
import { X, Plus, Search, UserCircle, ClipboardCheck } from 'lucide-react';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Search States
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
    // We explicitly ask for the internal category here
    const [taskData, userData] = await Promise.all([
      api<any[]>('/callbacks?category=INTERNAL_TASK'),
      api<any[]>('/users')
    ]);
    setTasks(taskData);
    setUsers(userData);
  };

  useEffect(() => { loadData(); }, []);

  // Patient Search Logic - Searching across existing data
  useEffect(() => {
    if (patientSearch.length > 1 && !selectedPatient) {
      const results = tasks.filter(t => 
        t.patient_last_name?.toLowerCase().includes(patientSearch.toLowerCase())
      );
      // Unique results only
      const unique = results.filter((v, i, a) => a.findIndex(t => t.patient_last_name === v.patient_last_name) === i);
      setSearchResults(unique.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [patientSearch, selectedPatient, tasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // IMPORTANT: Mapping the UI fields to the Backend Schema
    const payload = {
      patient_last_name: newTask.title, // Title goes into name field
      patient_dob: selectedPatient ? selectedPatient.patient_dob : '1900-01-01',
      patient_phone: selectedPatient ? selectedPatient.patient_phone : '',
      category: 'INTERNAL_TASK', 
      priority: newTask.priority,
      status: 'PENDING',
      assigned_user_id: newTask.assigned_user_id || null, // Must be null, not ""
      outcome_note: newTask.outcome_note,
      due_at: new Date(newTask.due_at).toISOString()
    };

    try {
      await api('/callbacks', { method: 'POST', body: JSON.stringify(payload) });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error("Payload sent:", payload);
      alert("Failed to assign task. Check if all fields are correct.");
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
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardCheck className="text-blue-600" size={32} /> Operations Board
          </h1>
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
            <Plus size={20} /> Create Internal Task
          </button>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Headers */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-5 px-2">Task / Patient Context</div>
            <div className="col-span-2 text-center">Assigned Staff</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-3">Update</div>
          </div>

          <div className="divide-y divide-slate-100">
            {tasks.map(task => (
              <div key={task.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50 transition-colors">
                <div className="col-span-5 px-2 font-bold text-slate-900">{task.patient_last_name}</div>
                <div className="col-span-2 text-center text-sm font-semibold text-slate-600">
                  {users.find(u => u.id === task.assigned_user_id)?.username || '—'}
                </div>
                {/* ... other cols ... */}
              </div>
            ))}
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8 space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 uppercase">New Team Task</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400"><X size={24}/></button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <input required placeholder="Task Title (e.g. Update inventory)" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold"
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />

                <select required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold"
                  value={newTask.assigned_user_id} onChange={e => setNewTask({...newTask, assigned_user_id: e.target.value})}>
                  <option value="">Assign to Employee...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>

                <div className="relative">
                   <div className="relative">
                    <Search className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input placeholder="Associate with Patient (Optional)" className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold"
                      value={selectedPatient ? selectedPatient.patient_last_name : patientSearch}
                      onChange={e => { setSelectedPatient(null); setPatientSearch(e.target.value); }} />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                      {searchResults.map(p => (
                        <div key={p.id} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50"
                          onClick={() => { setSelectedPatient(p); setSearchResults([]); }}>
                          <span className="text-sm font-bold text-slate-800">{p.patient_last_name}</span>
                          <UserCircle size={16} className="text-blue-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <textarea placeholder="Initial Comments / Instructions" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl h-24 font-medium"
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