import { useEffect, useState } from "react";
import Protected from "../components/Protected";
import { api } from "../lib/api";
import { 
  Calendar, 
  RefreshCcw, 
  Send, 
  CheckCircle, 
  CalendarClock,
  User
} from "lucide-react";

export default function Appointments() {
  const [range, setRange] = useState<"today" | "tomorrow">("tomorrow");
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const data = await api<any[]>(`/appointments?range=${range}`);
    setItems(data);
  }

  useEffect(() => { load().catch(console.error); }, [range]);

  async function send(apptId: string) {
    setBusy(apptId);
    try {
      await api(`/reminders/${apptId}/send`, { method: "POST" });
      alert("Logged reminder attempt (mock mode).");
    } finally { setBusy(null); }
  }

  async function confirm(apptId: string) {
    setBusy(apptId);
    try { await api(`/appointments/${apptId}/confirm`, { method: "POST" }); await load(); }
    finally { setBusy(null); }
  }

  async function resched(apptId: string) {
    setBusy(apptId);
    try { await api(`/appointments/${apptId}/reschedule`, { method: "POST" }); await load(); }
    finally { setBusy(null); }
  }

  return (
    <Protected>
      <div className="max-w-full mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">Appointments</h1>
            <p className="text-slate-500 text-lg text-sm">Schedule management and patient check-ins.</p>
          </div>
          
          <div className="flex gap-3 items-center">
            <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setRange('today')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${range === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setRange('tomorrow')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${range === 'tomorrow' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Tomorrow
              </button>
            </div>
            <button 
              onClick={() => load()}
              className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="p-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="p-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="p-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Calendar size={18} />
                      </div>
                      <span className="font-semibold text-slate-900">
                        {new Date(a.appt_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 underline decoration-blue-100 underline-offset-4 decoration-2">{a.patient_last_name}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <User size={12} /> {a.patient_dob}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-slate-600 font-medium">{a.patient_phone || "—"}</td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      a.confirmed_status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {a.confirmed_status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2 justify-end">
                      <button 
                        disabled={busy === a.id} 
                        onClick={() => send(a.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
                      >
                        <Send size={14} /> Reminder
                      </button>
                      <button 
                        disabled={busy === a.id} 
                        onClick={() => confirm(a.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all"
                      >
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button 
                        disabled={busy === a.id} 
                        onClick={() => resched(a.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all"
                      >
                        <CalendarClock size={14} /> Resched
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-20 text-center">
              <div className="inline-flex p-4 bg-slate-100 text-slate-400 rounded-full mb-4">
                <Calendar size={32} />
              </div>
              <p className="text-slate-500 font-bold">No appointments found for {range}.</p>
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}