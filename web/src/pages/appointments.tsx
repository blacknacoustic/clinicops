import { useEffect, useState } from "react";
import Protected from "../components/Protected";
import { api } from "../lib/api";

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
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h1>Appointments</h1>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <label>Range:</label>
          <select value={range} onChange={(e) => setRange(e.target.value as any)}>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
          </select>
          <button onClick={() => load()}>Refresh</button>
        </div>

        <table style={{ width:"100%", marginTop:12, borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th align="left">Time</th>
              <th align="left">Patient</th>
              <th align="left">Phone</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} style={{ borderTop:"1px solid #eee" }}>
                <td>{new Date(a.appt_start).toLocaleString()}</td>
                <td>{a.patient_last_name} ({a.patient_dob})</td>
                <td>{a.patient_phone || "—"}</td>
                <td>{a.confirmed_status}</td>
                <td style={{ display:"flex", gap:8, padding:6 }}>
                  <button disabled={busy===a.id} onClick={() => send(a.id)}>Send Reminder</button>
                  <button disabled={busy===a.id} onClick={() => confirm(a.id)}>Confirm</button>
                  <button disabled={busy===a.id} onClick={() => resched(a.id)}>Reschedule</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Protected>
  );
}