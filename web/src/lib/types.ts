// web/src/lib/types.ts

export type Role = "ADMIN" | "MANAGER" | "PROVIDER" | "STAFF";

export type CallbackStatus = "OPEN" | "ATTEMPTED" | "COMPLETED" | "CANCELLED";

export type Callback = {
  id: string;
  patient_last_name: string;
  patient_dob: string;
  patient_phone: string;
  category: string;
  priority: "NORMAL" | "HIGH";
  status: CallbackStatus;
  due_at: string;
  created_at: string;
  created_by: string;
  assigned_user_id?: string;
  outcome_note?: string;
  next_step?: string;
};

export type DashboardSummary = {
  open: number;
  due_today: number;
  overdue: number;
  completed_today: number;
  oldest_open_minutes: number | null;
};