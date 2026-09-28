export type ShiftType = 'SHIFT_1' | 'SHIFT_2';

export type AttendanceStatus = 
  | 'TEPAT_WAKTU' 
  | 'TERLAMBAT' 
  | 'BELUM_ABSEN' 
  | 'SUDAH_ABSEN' 
  | 'ABSEN_LENGKAP';

export type AttendanceState = 
  | 'NO_ATTENDANCE' 
  | 'CHECKED_IN' 
  | 'WAITING_FOR_CHECKOUT' 
  | 'CHECKOUT_ALLOWED' 
  | 'COMPLETED';

export type AllowedAttendanceAction = 'CHECK_IN' | 'CHECK_OUT' | 'NONE';

export interface AttendanceDecision {
  state: AttendanceState;
  allowedAction: AllowedAttendanceAction;
  canCheckIn: boolean;
  canCheckOut: boolean;
  reason: string;
  message: string;
  shift: ShiftType;
  shiftStartTime: string;
  shiftEndTime: string;
  currentServerTime: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

export interface Employee {
  id: string;
  employee_code: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  face_embedding: number[] | null; // 128 float values
  photo: string | null; // Data URL or URL
  is_active: boolean;
  default_shift: ShiftType | 'AUTO';
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  department: string;
  position: string;
  photo: string | null;
  attendance_date: string; // YYYY-MM-DD
  shift: ShiftType;
  check_in: string; // HH:mm:ss
  check_out: string | null; // HH:mm:ss
  status: AttendanceStatus;
  check_in_snapshot?: string | null;
  check_out_snapshot?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  threshold: number; // Face recognition distance threshold (default 0.58)
  shift1_start: string; // "08:00"
  shift1_on_time_end: string; // "09:00"
  shift1_end: string; // "16:00"
  shift2_start: string; // "12:00"
  shift2_on_time_end: string; // "13:00"
  shift2_end: string; // "20:00"
  liveness_enabled: boolean;
  anti_spoofing: boolean;
  simulated_time: string | null; // For testing custom hours (e.g. "2026-09-28T08:23:00")
  testing_mode?: boolean; // When true, allows instant check-out anytime without waiting for 16:00
  bypass_shift_lock?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface TodayStats {
  total_employees: number;
  present_count: number;
  on_time_count: number;
  late_count: number;
  checked_out_count: number;
  absent_count: number;
  attendance_rate: number;
}
