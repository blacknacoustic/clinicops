import { useRouter } from "next/router";

export default function LogoutButton() {
  const r = useRouter();

  function logout() {
    localStorage.removeItem("token");
    r.push("/login");
  }

  return (
    <button type="button" onClick={logout}>
      Logout
    </button>
  );
}