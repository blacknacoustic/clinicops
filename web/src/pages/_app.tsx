import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api } from "../lib/api";

type Me = {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
};

export default function App({ Component, pageProps }: AppProps) {
  const r = useRouter();
  const isLogin = r.pathname === "/login";

  const [me, setMe] = useState<Me | null>(null);

  function logout() {
    localStorage.removeItem("token");
    setMe(null);
    r.push("/login");
  }

  useEffect(() => {
    if (isLogin) return;

    const token = localStorage.getItem("token");
    if (!token) {
      r.replace("/login");
      return;
    }

    // Fetch current user for the header
    (async () => {
      try {
        const u = await api<Me>("/auth/me");
        setMe(u);
      } catch (e) {
        // token bad/expired -> force logout
        logout();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin, r.pathname]);

  return (
    <>
      {!isLogin && (
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, color: "#444" }}>
            {me ? (
              <>
                Signed in as <b>{me.username}</b> <span style={{ opacity: 0.7 }}>({me.role})</span>
              </>
            ) : (
              "Signed in"
            )}
          </div>

          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      )}
      <Component {...pageProps} />
    </>
  );
}