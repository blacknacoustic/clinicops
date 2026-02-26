export type DashboardSummary = {
  open: number;
  due_today: number;
  overdue: number;
  completed_today: number;
  oldest_open_minutes: number | null;
};