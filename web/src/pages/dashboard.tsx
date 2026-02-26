import { useEffect, useState } from "react";
import Protected from "../components/Protected";
import { api } from "../lib/api";
import { DashboardSummary } from "../lib/types";
import Link from "next/link";

export default function Dashboard() {
  const [s, setS] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api<DashboardSummary>("/dashboard/summary").then(setS).catch(console.error);
  }, []);

  return (
    <Protected>
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h1>Daily Ops Dashboard</h1>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {["open","due_today","overdue","completed_today"].map((k)=>(
            <div key={k} style={{ border:"1px solid #ddd", borderRadius:12, padding:14, minWidth:160 }}>
              <div style={{ fontSize:12, opacity:.7 }}>{k.replaceAll("_"," ").toUpperCase()}</div>
              <div style={{ fontSize:32, fontWeight:700 }}>{(s as any)?.[k] ?? "—"}</div>
            </div>
          ))}
          <div style={{ border:"1px solid #ddd", borderRadius:12, padding:14, minWidth:220 }}>
            <div style={{ fontSize:12, opacity:.7 }}>OLDEST OPEN (MIN)</div>
            <div style={{ fontSize:32, fontWeight:700 }}>{s?.oldest_open_minutes ?? "—"}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, display:"flex", gap:12, flexWrap:"wrap" }}>
          <Link href="/callbacks"><button>Callbacks</button></Link>
          <Link href="/callbacks/new"><button>New Callback</button></Link>
          <Link href="/imports/appointments"><button>Import Appointments</button></Link>
          <Link href="/appointments"><button>Appointments</button></Link>
        </div>
      </div>
    </Protected>
  );
}