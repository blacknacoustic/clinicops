import { useEffect, useState } from "react";
import Protected from "../../components/Protected";
import { api } from "../../lib/api";
import { 
  UploadCloud, 
  Settings, 
  CheckCircle, 
  FileText, 
  Database,
  AlertCircle
} from "lucide-react";

const NAME = "flexmedical_appointments";

export default function ImportAppointments() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<any>({});
  const [saved, setSaved] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{mapping:any}>(`/imports/appointments/mapping?name=${NAME}`)
      .then((x)=>{ if (x.mapping) { setMapping(x.mapping); setSaved(true); }})
      .catch(()=>{});
  }, []);

  async function loadHeaders() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + "/imports/appointments/headers", {
      method:"POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd
    });
    const data = await res.json();
    setHeaders(data.headers || []);
    setLoading(false);
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
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + `/imports/appointments/import?name=${NAME}`, {
      method:"POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd
    });
    setResult(await res.json());
    setLoading(false);
  }

  const fields = [
    "patient_last_name","patient_dob","appt_start","patient_phone","patient_email","external_ref","appt_type"
  ];

  return (
    <Protected>
      <div className="max-w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Import Appointments</h1>
          <p className="text-slate-500">Map your CSV columns to the ClinicOps database.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step 1: File Upload */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-500" />
                1. Upload CSV
              </h3>
              
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                <input 
                  type="file" 
                  accept=".csv" 
                  id="csv-upload"
                  className="hidden"
                  onChange={(e)=>setFile(e.target.files?.[0] || null)} 
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <UploadCloud size={40} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">
                    {file ? file.name : "Select appointment CSV"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Click to browse files</p>
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button 
                  onClick={loadHeaders} 
                  disabled={!file || loading}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  Load CSV Headers
                </button>
                <button 
                  onClick={saveMap} 
                  disabled={headers.length===0 || loading}
                  className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  Save Mapping Configuration
                </button>
                <button 
                  onClick={doImport} 
                  disabled={!saved || !file || loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-md hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Database size={18} />
                  Start Import
                </button>
              </div>
            </div>

            {result && (
              <div className="bg-slate-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto shadow-inner text-xs font-mono">
                <div className="flex items-center gap-2 text-white font-bold mb-3 border-b border-slate-700 pb-2 uppercase tracking-widest">
                  <CheckCircle size={14} /> Import Results
                </div>
                {JSON.stringify(result, null, 2)}
              </div>
            )}
          </div>

          {/* Step 2: Mapping Grid */}
          <div className="lg:col-span-2">
            {headers.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Settings size={20} className="text-blue-500" />
                    2. Column Mapping
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex">
                    <AlertCircle size={14} /> Required fields: last_name, dob, appt_start
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {fields.map((f)=>(
                      <div key={f} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="mb-2 md:mb-0">
                          <code className="text-sm font-bold text-slate-700">{f}</code>
                        </div>
                        <select 
                          className="w-full md:w-64 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                          value={mapping[f] || ""} 
                          onChange={(e)=>setMapping({...mapping, [f]: e.target.value})}
                        >
                          <option value="">(skip column)</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-400">
                <Settings size={48} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">Load a file to see column mapping</p>
                <p className="text-sm">We need the headers before you can link them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Protected>
  );
}