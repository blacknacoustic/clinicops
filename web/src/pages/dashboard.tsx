import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardSummary } from '@/lib/types';
import Protected from '@/components/Protected';
import Layout from '@/components/Layout';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api<DashboardSummary>('/dashboard/summary').then(setSummary);
  }, []);

  if (!summary) return <div className="p-8 text-slate-500 animate-pulse">Loading dashboard...</div>;

  const stats = [
    { 
      label: 'Overdue', 
      value: summary.overdue, 
      icon: AlertCircle, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      description: 'Require immediate attention'
    },
    { 
      label: 'Due Today', 
      value: summary.due_today, 
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      description: 'Tasks for current shift'
    },
    { 
      label: 'Completed Today', 
      value: summary.completed_today, 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      description: 'Processed tasks'
    },
    { 
      label: 'Wait Time', 
      value: summary.oldest_open_minutes ? `${summary.oldest_open_minutes}m` : '0m', 
      icon: CalendarCheck, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      description: 'Oldest open request'
    },
  ];

  return (
    <Protected>
      <Layout>
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Operations Overview</h1>
            <p className="text-slate-500">Real-time patient callback and appointment metrics.</p>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <h3 className="font-semibold text-slate-800">{stat.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions / Shortcuts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Pending Callbacks</h3>
              <p className="text-slate-600 mb-6">You have {summary.open} total open callbacks across all categories.</p>
              <Link href="/callbacks" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline">
                Go to Callbacks <ArrowRight size={18} />
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Appointments</h3>
              <p className="text-slate-600 mb-6">Review today's scheduling and manage patient check-ins.</p>
              <Link href="/appointments" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline">
                View Schedule <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </Protected>
  );
}