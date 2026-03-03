import { useRouter } from 'next/router';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <button 
      onClick={handleLogout} 
      className={className || "bg-red-600 text-white px-4 py-2 rounded"}
    >
      <LogOut size={18} className="inline mr-2" />
      Logout
    </button>
  );
}