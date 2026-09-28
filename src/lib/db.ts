import fs from 'fs';
import path from 'path';
import { Employee, Attendance, SystemSettings, AdminUser, TodayStats, ShiftType } from '@/types';
import { getServerTime } from './time';

interface DatabaseSchema {
  employees: Employee[];
  attendance: Attendance[];
  settings: SystemSettings;
  admin: AdminUser;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Default initial system settings
const DEFAULT_SETTINGS: SystemSettings = {
  threshold: 0.58,
  shift1_start: '08:00',
  shift1_on_time_end: '09:00',
  shift1_end: '16:00',
  shift2_start: '12:00',
  shift2_on_time_end: '13:00',
  shift2_end: '20:00',
  liveness_enabled: true,
  anti_spoofing: true,
  simulated_time: null,
};

// Initial admin account
const DEFAULT_ADMIN: AdminUser = {
  id: 'admin-001',
  name: 'Administrator HR',
  email: 'admin@company.com',
  role: 'admin',
};

// Initial seed employees
const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    employee_code: 'EMP001',
    name: 'Budi Santoso',
    email: 'budi.santoso@perusahaan.co.id',
    phone: '081234567890',
    position: 'Senior Software Engineer',
    department: 'Teknologi & Informasi',
    face_embedding: null,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    is_active: true,
    default_shift: 'SHIFT_1',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'emp-002',
    employee_code: 'EMP002',
    name: 'Andi Wijaya',
    email: 'andi.wijaya@perusahaan.co.id',
    phone: '081234567891',
    position: 'UI/UX Designer',
    department: 'Product & Design',
    face_embedding: null,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    is_active: true,
    default_shift: 'SHIFT_1',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'emp-003',
    employee_code: 'EMP003',
    name: 'Siti Aminah',
    email: 'siti.aminah@perusahaan.co.id',
    phone: '081234567892',
    position: 'Human Resources Specialist',
    department: 'Human Capital',
    face_embedding: null,
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    is_active: true,
    default_shift: 'SHIFT_2',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'emp-004',
    employee_code: 'EMP004',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@perusahaan.co.id',
    phone: '081234567893',
    position: 'Finance Manager',
    department: 'Finance & Accounting',
    face_embedding: null,
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    is_active: true,
    default_shift: 'SHIFT_1',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'emp-005',
    employee_code: 'EMP005',
    name: 'Rian Pratama',
    email: 'rian.pratama@perusahaan.co.id',
    phone: '081234567894',
    position: 'DevOps Engineer',
    department: 'Teknologi & Informasi',
    face_embedding: null,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    is_active: true,
    default_shift: 'SHIFT_2',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'emp-006',
    employee_code: 'EMP006',
    name: 'Maya Kartika',
    email: 'maya.kartika@perusahaan.co.id',
    phone: '081234567895',
    position: 'Marketing Lead',
    department: 'Marketing & Growth',
    face_embedding: null,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    is_active: true,
    default_shift: 'SHIFT_1',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// Initial seed attendance history
const createInitialAttendance = (): Attendance[] => {
  const today = getServerTime().dateStr;
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  return [
    // Yesterday records
    {
      id: 'att-seed-01',
      employee_id: 'emp-001',
      employee_code: 'EMP001',
      employee_name: 'Budi Santoso',
      department: 'Teknologi & Informasi',
      position: 'Senior Software Engineer',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      attendance_date: yesterday,
      shift: 'SHIFT_1',
      check_in: '08:23:14',
      check_out: '17:02:40',
      status: 'TEPAT_WAKTU',
      created_at: `${yesterday}T08:23:14.000Z`,
      updated_at: `${yesterday}T17:02:40.000Z`,
    },
    {
      id: 'att-seed-02',
      employee_id: 'emp-002',
      employee_code: 'EMP002',
      employee_name: 'Andi Wijaya',
      department: 'Product & Design',
      position: 'UI/UX Designer',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      attendance_date: yesterday,
      shift: 'SHIFT_1',
      check_in: '09:17:02',
      check_out: '17:10:55',
      status: 'TERLAMBAT',
      created_at: `${yesterday}T09:17:02.000Z`,
      updated_at: `${yesterday}T17:10:55.000Z`,
    },
    {
      id: 'att-seed-03',
      employee_id: 'emp-003',
      employee_code: 'EMP003',
      employee_name: 'Siti Aminah',
      department: 'Human Capital',
      position: 'Human Resources Specialist',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      attendance_date: yesterday,
      shift: 'SHIFT_2',
      check_in: '12:15:20',
      check_out: '18:03:11',
      status: 'TEPAT_WAKTU',
      created_at: `${yesterday}T12:15:20.000Z`,
      updated_at: `${yesterday}T18:03:11.000Z`,
    },
    // Today records
    {
      id: 'att-seed-04',
      employee_id: 'emp-001',
      employee_code: 'EMP001',
      employee_name: 'Budi Santoso',
      department: 'Teknologi & Informasi',
      position: 'Senior Software Engineer',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      attendance_date: today,
      shift: 'SHIFT_1',
      check_in: '08:24:10',
      check_out: null,
      status: 'TEPAT_WAKTU',
      created_at: `${today}T08:24:10.000Z`,
      updated_at: `${today}T08:24:10.000Z`,
    },
    {
      id: 'att-seed-05',
      employee_id: 'emp-004',
      employee_code: 'EMP004',
      employee_name: 'Dewi Lestari',
      department: 'Finance & Accounting',
      position: 'Finance Manager',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      attendance_date: today,
      shift: 'SHIFT_1',
      check_in: '08:45:00',
      check_out: null,
      status: 'TEPAT_WAKTU',
      created_at: `${today}T08:45:00.000Z`,
      updated_at: `${today}T08:45:00.000Z`,
    },
  ];
};

export class Database {
  private static ensureDataDir() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  public static read(): DatabaseSchema {
    this.ensureDataDir();

    if (!fs.existsSync(DB_FILE)) {
      const initialData: DatabaseSchema = {
        employees: SEED_EMPLOYEES,
        attendance: createInitialAttendance(),
        settings: DEFAULT_SETTINGS,
        admin: DEFAULT_ADMIN,
      };
      this.write(initialData);
      return initialData;
    }

    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content) as DatabaseSchema;
      // Merge with defaults if new fields were added
      data.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      return data;
    } catch (err) {
      console.error('Error reading database file, returning initial schema:', err);
      return {
        employees: SEED_EMPLOYEES,
        attendance: createInitialAttendance(),
        settings: DEFAULT_SETTINGS,
        admin: DEFAULT_ADMIN,
      };
    }
  }

  public static write(data: DatabaseSchema): void {
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // --- Employees ---

  public static getEmployees(): Employee[] {
    const db = this.read();
    return db.employees;
  }

  public static getEmployeeById(id: string): Employee | null {
    const db = this.read();
    return db.employees.find((e) => e.id === id || e.employee_code === id) || null;
  }

  public static getEmployeeByCode(code: string): Employee | null {
    const db = this.read();
    return db.employees.find((e) => e.employee_code.toLowerCase() === code.toLowerCase()) || null;
  }

  public static createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Employee {
    const db = this.read();
    
    // Check code duplication
    const exists = db.employees.some(
      (e) => e.employee_code.toLowerCase() === employee.employee_code.toLowerCase()
    );
    if (exists) {
      throw new Error(`Karyawan dengan NIP/ID ${employee.employee_code} sudah terdaftar.`);
    }

    const newEmp: Employee = {
      ...employee,
      id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.employees.push(newEmp);
    this.write(db);
    return newEmp;
  }

  public static updateEmployee(id: string, updates: Partial<Employee>): Employee {
    const db = this.read();
    const index = db.employees.findIndex((e) => e.id === id || e.employee_code === id);
    if (index === -1) {
      throw new Error(`Karyawan dengan ID ${id} tidak ditemukan.`);
    }

    db.employees[index] = {
      ...db.employees[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.write(db);
    return db.employees[index];
  }

  public static deleteEmployee(id: string): boolean {
    const db = this.read();
    const initialLen = db.employees.length;
    db.employees = db.employees.filter((e) => e.id !== id && e.employee_code !== id);
    if (db.employees.length !== initialLen) {
      this.write(db);
      return true;
    }
    return false;
  }

  public static updateFaceEmbedding(id: string, embedding: number[], photoBase64?: string): Employee {
    const db = this.read();
    const index = db.employees.findIndex((e) => e.id === id || e.employee_code === id);
    if (index === -1) {
      throw new Error(`Karyawan dengan ID ${id} tidak ditemukan.`);
    }

    db.employees[index].face_embedding = embedding;
    if (photoBase64) {
      db.employees[index].photo = photoBase64;
    }
    db.employees[index].updated_at = new Date().toISOString();

    this.write(db);
    return db.employees[index];
  }

  // --- Attendance ---

  public static getAttendanceList(filters?: {
    date?: string;
    shift?: ShiftType;
    status?: string;
    search?: string;
  }): Attendance[] {
    const db = this.read();
    let list = [...db.attendance];

    if (filters?.date) {
      list = list.filter((a) => a.attendance_date === filters.date);
    }
    if (filters?.shift) {
      list = list.filter((a) => a.shift === filters.shift);
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.employee_name.toLowerCase().includes(q) ||
          a.employee_code.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q)
      );
    }

    // Sort descending by date and check_in time
    list.sort((a, b) => {
      const keyA = `${a.attendance_date} ${a.check_in}`;
      const keyB = `${b.attendance_date} ${b.check_in}`;
      return keyB.localeCompare(keyA);
    });

    return list;
  }

  public static getTodayAttendanceForEmployee(employeeId: string, dateStr: string): Attendance | null {
    const db = this.read();
    return db.attendance.find(
      (a) =>
        (a.employee_id === employeeId || a.employee_code === employeeId) &&
        a.attendance_date === dateStr
    ) || null;
  }

  public static recordCheckIn(entry: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>): Attendance {
    const db = this.read();

    // Check if already checked in today for this employee
    const existing = db.attendance.find(
      (a) =>
        (a.employee_id === entry.employee_id || a.employee_code === entry.employee_code) &&
        a.attendance_date === entry.attendance_date
    );

    if (existing) {
      throw new Error(
        `Anda sudah melakukan absensi masuk hari ini pada ${existing.check_in.substring(0, 5)} WIB.`
      );
    }

    const newAttendance: Attendance = {
      ...entry,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.attendance.push(newAttendance);
    this.write(db);
    return newAttendance;
  }

  public static recordCheckOut(
    employeeId: string,
    dateStr: string,
    checkOutTime: string,
    snapshot?: string
  ): Attendance {
    const db = this.read();

    const index = db.attendance.findIndex(
      (a) =>
        (a.employee_id === employeeId || a.employee_code === employeeId) &&
        a.attendance_date === dateStr
    );

    if (index === -1) {
      throw new Error('Anda belum melakukan absensi masuk hari ini.');
    }

    if (db.attendance[index].check_out) {
      const prevCheckOut = db.attendance[index].check_out?.substring(0, 5) || '';
      throw new Error(
        `Anda sudah melakukan absensi pulang hari ini pada ${prevCheckOut} WIB.`
      );
    }

    db.attendance[index].check_out = checkOutTime;
    db.attendance[index].status = 'ABSEN_LENGKAP';
    if (snapshot) {
      db.attendance[index].check_out_snapshot = snapshot;
    }
    db.attendance[index].updated_at = new Date().toISOString();

    this.write(db);
    return db.attendance[index];
  }

  // --- Statistics ---

  public static getTodayStats(): TodayStats {
    const db = this.read();
    const serverTime = getServerTime(db.settings);
    const today = serverTime.dateStr;

    const total_employees = db.employees.filter((e) => e.is_active).length;
    const todayAttendances = db.attendance.filter((a) => a.attendance_date === today);

    const present_count = todayAttendances.length;
    const on_time_count = todayAttendances.filter((a) => a.status === 'TEPAT_WAKTU').length;
    const late_count = todayAttendances.filter((a) => a.status === 'TERLAMBAT').length;
    const checked_out_count = todayAttendances.filter((a) => a.check_out !== null).length;
    const absent_count = Math.max(0, total_employees - present_count);
    const attendance_rate = total_employees > 0 ? Math.round((present_count / total_employees) * 100) : 0;

    return {
      total_employees,
      present_count,
      on_time_count,
      late_count,
      checked_out_count,
      absent_count,
      attendance_rate,
    };
  }

  // --- Settings ---

  public static getSettings(): SystemSettings {
    const db = this.read();
    return db.settings;
  }

  public static updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    const db = this.read();
    db.settings = {
      ...db.settings,
      ...settings,
    };
    this.write(db);
    return db.settings;
  }
}
