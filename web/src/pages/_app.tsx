import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import "../styles/globals.css";

type Me = {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
};

export default function App({ Component, pageProps }: AppProps) {
  const r = useRouter();
  const isLogin = r.pathname === "/login";
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    if (isLogin) return;
    const token = localStorage.getItem("token");
    if (!token) { r.replace("/login"); return; }

    (async () => {
      try {
        const u = await api<any>("/auth/me");
        setMe(u);
      } catch (e) {
        localStorage.removeItem("token");
        r.push("/login");
      }
    })();
  }, [isLogin, r.pathname]);

  if (isLogin) return <Component {...pageProps} />;

  return (
    <Layout user={me}>
      <Component {...pageProps} />
    </Layout>
  );
}