import { useState } from "react";
import Protected from "../../components/Protected";
import { api } from "../../lib/api";
import { useRouter } from "next/router";

export default function NewCallback() {
  const r = useRouter();
  const [form, setForm] = useState<any>({
    patient_last_name: "",
    patient_dob: "",
    patient_phone: "",
    category: "SCHEDULING",
    priority: "ROUTINE",
    due_at: new Date(Date.now()+2*60*60*1000).toISOString(),
  });

  async function submit(e:any) {
    e.preventDefault();
    await api("/callbacks", { method:"POST", body: JSON.stringify(form) });
    r.push("/callbacks");
  }

  return (
    <Protected>
      <div style={{ padding:20, fontFamily:"sans-serif", maxWidth:520 }}>
        <h1>New Callback</h1>
        <form onSubmit={submit}>
          <label>Last name</label>
          <input value={form.patient_last_name} onChange={(e)=>setForm({...form, patient_last_name:e.target.value})} style={{ width:"100%", padding:8, margin:"6px 0 12px" }}/>
          <label>DOB (YYYY-MM-DD)</label>
          <input value={form.patient_dob} onChange={(e)=>setForm({...form, patient_dob:e.target.value})} style={{ width:"100%", padding:8, margin:"6px 0 12px" }}/>
          <label>Phone (optional)</label>
          <input value={form.patient_phone} onChange={(e)=>setForm({...form, patient_phone:e.target.value})} style={{ width:"100%", padding:8, margin:"6px 0 12px" }}/>

          <label>Category</label>
          <select value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})}>
            {["RESULTS","SCHEDULING","REFERRAL","MED","BILLING","OTHER"].map(x=><option key={x}>{x}</option>)}
          </select>

          <label style={{ display:"block", marginTop:12 }}>Priority</label>
          <select value={form.priority} onChange={(e)=>setForm({...form, priority:e.target.value})}>
            {["ROUTINE","SAME_DAY","URGENT"].map(x=><option key={x}>{x}</option>)}
          </select>

          <label style={{ display:"block", marginTop:12 }}>Due at (ISO)</label>
          <input value={form.due_at} onChange={(e)=>setForm({...form, due_at:e.target.value})} style={{ width:"100%", padding:8, margin:"6px 0 12px" }}/>

          <button style={{ marginTop:12, padding:10 }}>Create</button>
        </form>
      </div>
    </Protected>
  );
}