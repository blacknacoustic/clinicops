import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Protected from '@/components/Protected';
import { 
  X, Plus, Search, UserCircle, MessageSquare, Activity, ClipboardCheck, User as UserIcon
} from 'lucide-react';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const [newTask, setNewTask] = useState({
    title: '', // Temporary UI field
    assigned_user_id: '',
    priority: 'MEDIUM',
    outcome_note: '',
    due_at: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    // FIX: Filter by our new 'INTERNAL_TASK' category to keep them separate
    const [taskData, userData] = await Promise.all([
      api<any[]>('/callbacks?category=INTERNAL_TASK'),
      api<any[]>('/users')
    ]);
    setTasks(taskData);
    setUsers(userData);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the payload to fit your existing Callback schema
    const payload = {
      patient_last_name: newTask.title, // Task Subject goes here
      patient_dob: selectedPatient ? selectedPatient.patient_dob : '1900-01-01',
      patient_phone: selectedPatient ? selectedPatient.patient_phone : '',
      category: 'INTERNAL_TASK', // The "Flag" that keeps these separate
      priority: newTask.priority,
      assigned_user_id: newTask.assigned_user_id || null,
      outcome_note: newTask.outcome_note,
      due_at: new Date(newTask.due_at).toISOString()
    };

    try {
      await api('/callbacks', { method: 'POST', body: JSON.stringify(payload) });
      setShowModal(false);
      setNewTask({ title: '', assigned_user_id: '', priority: 'MEDIUM', outcome_note: '', due_at: new Date().toISOString().split('T')[0] });
      setSelectedPatient(null);
      loadData();
    } catch (err) {
      console.error("Create failed", err);
    }
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
            <p className="text-slate-500 font-medium">Internal team tasks - separate from patient callbacks.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg active:scale-95">
            <Plus size={20} /> Create Internal Task
          </button>
        </header>

        {/* Board Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-5 px-2">Task / Patient Context</div>
            <div className="col-span-2 text-center">Assigned Staff</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-3">Latest Progress</div>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.map(task => (
              <div key={task.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50/50 transition-colors">
                <div className="col-span-5 px-2">
                  <div className="font-bold text-slate-900 text-lg">{task.patient_last_name}</div>
                  {task.patient_dob !== '1900-01-01' && (
                    <div className="text-[10px] text-blue-500 font-bold uppercase mt-1">Patient: {task.patient_dob}</div>
                  )}
                </div>
                <div className="col-span-2 flex justify-center">
                   <div className="text-sm font-bold text-slate-600">
                     {users.find(u => u.id === task.assigned_user_id)?.username || 'Unassigned'}
                   </div>
                </div>
                {/* ... existing status & notes columns ... */}
              </div>
            ))}
          </div>
        </div>

        {/* THE MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase">New Team Task</h2>
                <button onClick={() => setShowModal(false)} className="bg-slate-100 p-2 rounded-full"><X size={20}/></button>
              </div>

              <form onSubmit={handleCreateTask} className="p-8 space-y-5">
                {/* Task Title */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Task Description</label>
                  <input required placeholder="e.g. Update inventory or Call back Patient Smith"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-700"
                    value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                </div>

                {/* Employee Dropdown */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Assign To Employee</label>
                  <select 
                    required
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                    value={newTask.assigned_user_id} 
                    onChange={e => setNewTask({...newTask, assigned_user_id: e.target.value})}
                  >
                    <option value="">Select Employee...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>

                {/* Patient Association */}
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Associate Patient (Optional)</label>
                  <input placeholder="Search name..." className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                    value={selectedPatient ? selectedPatient.patient_last_name : patientSearch}
                    onChange={e => { setSelectedPatient(null); setPatientSearch(e.target.value); }} />
                </div>

                {/* Initial Comments */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Initial Comments / Instructions</label>
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