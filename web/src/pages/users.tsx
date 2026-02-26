import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "../lib/api";

type Role = "ADMIN" | "MANAGER" | "PROVIDER" | "STAFF";
type UserOut = { id: string; username: string; role: Role; is_active: boolean };

export default function UsersPage() {
  const r = useRouter();
  const [users, setUsers] = useState<UserOut[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr(null);
    try {
      const data = await api<UserOut[]>("/users");
      setUsers(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load users");
    }
  }

  async function createUser() {
    setErr(null);
    setLoading(true);
    try {
      await api<UserOut>("/users", {
        method: "POST",
        body: JSON.stringify({ username, password, role, is_active: isActive }),
      });
      setUsername("");
      setPassword("");
      setRole("STAFF");
      setIsActive(true);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // if not logged in, go login
    const token = localStorage.getItem("token");
    if (!token) r.push("/login");
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <h1>Users (Admin)</h1>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}

      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Create User</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label>Username</label>
            <input style={{ width: "100%", padding: 10, marginTop: 6 }}
              value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div>
            <label>Password</label>
            <input style={{ width: "100%", padding: 10, marginTop: 6 }}
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div>
            <label>Role</label>
            <select style={{ width: "100%", padding: 10, marginTop: 6 }}
              value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="PROVIDER">PROVIDER</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {" "}Active
          </label>
        </div>

        <button
          type="button"
          onClick={createUser}
          disabled={loading || !username || !password}
          style={{ marginTop: 12, padding: 10 }}
        >
          {loading ? "Creating..." : "Create user"}
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Existing Users</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Username</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Role</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{u.username}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{u.role}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{u.is_active ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}