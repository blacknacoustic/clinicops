import { useEffect, useState } from "react";
import Protected from "../../components/Protected";
import { api } from "../../lib/api";

const NAME = "flexmedical_appointments";

export default function ImportAppointments() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<any>({});
  const [saved, setSaved] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api<{mapping:any}>(`/imports/appointments/mapping?name=${NAME}`)
      .then((x)=>{ if (x.mapping) { setMapping(x.mapping); setSaved(true); }})
      .catch(()=>{});
  }, []);

  async function loadHeaders() {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + "/imports/appointments/headers", {
      method:"POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd
    });
    const data = await res.json();
    setHeaders(data.headers || []);
  }

  async function saveMap() {
    await api(`/imports/appointments/save-mapping?name=${NAME}`, {
      method:"POST",
      body: JSON.stringify(mapping)
    });
    setSaved(true);
  }

  async function doImport() {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + `/imports/appointments/import?name=${NAME}`, {
      method:"POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd
    });
    setResult(await res.json());
  }

  const fields = [
    "patient_last_name","patient_dob","appt_start","patient_phone","patient_email","external_ref","appt_type"
  ];

  return (
    <Protected>
      <div style={{ padding:20, fontFamily:"sans-serif", maxWidth: 900 }}>
        <h1>Import Appointments (CSV)</h1>

        <input type="file" accept=".csv" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
        <div style={{ marginTop:10, display:"flex", gap:10 }}>
          <button onClick={loadHeaders} disabled={!file}>Load headers</button>
          <button onClick={saveMap} disabled={headers.length===0}>Save mapping</button>
          <button onClick={doImport} disabled={!saved || !file}>Import</button>
        </div>

        {headers.length > 0 && (
          <div style={{ marginTop:14 }}>
            <h3>Column Mapping</h3>
            <p style={{ opacity:.7 }}>Required: patient_last_name, patient_dob, appt_start.</p>
            <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:10 }}>
              {fields.map((f)=>(
                <div key={f} style={{ display:"contents" }}>
                  <div style={{ paddingTop:6 }}>{f}</div>
                  <select value={mapping[f] || ""} onChange={(e)=>setMapping({...mapping, [f]: e.target.value})}>
                    <option value="">(none)</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <pre style={{ marginTop:16, background:"#f7f7f7", padding:12, borderRadius:10 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </Protected>
  );
}