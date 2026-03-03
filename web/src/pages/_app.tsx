import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import "../styles/globals.css"; // THIS IS THE KEY IMPORT

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

    (async () => {
      try {
        const u = await api<Me>("/auth/me");
        setMe(u);
      } catch (e) {
        logout();
      }
    })();
  }, [isLogin, r.pathname]);

  if (isLogin) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout user={me}>
      <Component {...pageProps} />
    </Layout>
  );
}