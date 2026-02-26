import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../lib/api";

export default function Login() {
  const r = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123!");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function doLogin() {
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("token", res.access_token);
      await r.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h1>ClinicOps Login</h1>

      <div style={{ marginTop: 12 }}>
        <label>Username</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Password</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}

      <button
        type="button"
        onClick={doLogin}
        disabled={loading}
        style={{ marginTop: 16, padding: 10, width: "100%" }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}