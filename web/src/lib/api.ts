const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://10.0.0.48:8000/api";

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token =
    typeof window === "undefined" ? null : localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Ensure path starts with /
  const p = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${API_BASE}${p}`, { ...opts, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}