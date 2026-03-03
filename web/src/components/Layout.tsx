import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  Users, 
  FileInput, 
  LogOut,
  Stethoscope
} from 'lucide-react';
import LogoutButton from './LogoutButton';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Callbacks', href: '/callbacks', icon: ClipboardList },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Import Data', href: '/imports/appointments', icon: FileInput },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
          <Stethoscope className="text-blue-400" size={28} />
          <span className="text-xl font-bold tracking-tight">ClinicOps</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <LogoutButton className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium italic">Highlands County Medical System</span>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}