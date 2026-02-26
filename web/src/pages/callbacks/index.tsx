import { useEffect, useState } from "react";
import Protected from "../../components/Protected";
import { api } from "../../lib/api";
import Link from "next/link";

export default function Callbacks() {
  const [items, setItems] = useState<any[]>([]);
  const [due, setDue] = useState<string>("overdue");

  useEffect(() => {
    api<any[]>(`/callbacks?due=${due}`).then(setItems).catch(console.error);
  }, [due]);

  return (
    <Protected>
      <div style={{ padding: 20, fontFamily:"sans-serif" }}>
        <h1>Callbacks</h1>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <label>Filter:</label>
          <select value={due} onChange={(e)=>setDue(e.target.value)}>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
          </select>
          <Link href="/callbacks/new"><button>New</button></Link>
        </div>

        <table style={{ width:"100%", marginTop:12, borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th align="left">Patient</th>
              <th align="left">Due</th>
              <th align="left">Priority</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c)=>(
              <tr key={c.id} style={{ borderTop:"1px solid #eee" }}>
                <td>{c.patient_last_name} ({c.patient_dob})</td>
                <td>{new Date(c.due_at).toLocaleString()}</td>
                <td>{c.priority}</td>
                <td>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Protected>
  );
}