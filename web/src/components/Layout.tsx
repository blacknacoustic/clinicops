import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  Users, 
  FileInput, 
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
      {/* Sidebar - Fixed width */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-20">
        <div className="p-8 flex items-center gap-3 text-white border-b border-slate-800">
          <Stethoscope className="text-blue-400" size={32} />
          <span className="text-2xl font-bold tracking-tight">ClinicOps</span>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={22} />
                <span className="font-semibold text-lg">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <LogoutButton className="w-full flex items-center justify-center gap-3 px-4 py-3 text-md font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors" />
        </div>
      </aside>

      {/* Main Content Area - Added margin to match sidebar width */}
      <div className="flex-1 ml-72 flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
           <div className="text-slate-400 font-medium tracking-wide">
             {router.pathname.replace('/', '').toUpperCase() || 'DASHBOARD'}
           </div>
           <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium">Highlands County Medical</span>
          </div>
        </header>

        {/* This container prevents the "scrunched" look */}
        <main className="p-10 flex-1">
          <div className="max-w-screen-2xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}