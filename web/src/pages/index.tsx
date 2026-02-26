import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const r = useRouter();
  useEffect(() => {
    const t = localStorage.getItem("token");
    r.replace(t ? "/dashboard" : "/login");
  }, [r]);
  return null;
}