'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  TrendingUp, 
  ArrowUpRight, 
  UserPlus, 
  CalendarClock, 
  Sliders, 
  RefreshCw 
} from 'lucide-react';
import { TodayStats, Attendance } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [serverTime, setServerTime] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const res = await fetch('/api/attendance/today');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setAttendances(data.todayAttendances || []);
        setServerTime(data.serverTime);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Presensi Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ringkasan kehadiran karyawan hari ini — {serverTime ? `${serverTime.dayName}, ${serverTime.formattedDateId}` : 'Memuat...'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Segarkan</span>
          </button>
          <a
            href="/admin/employees"
            className="flex items-center space-x-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Kelola Karyawan</span>
          </a>
        </div>
      </div>

      {/* 6 Statistic Cards (Section 7 Specification) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Karyawan */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Karyawan</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {stats ? stats.total_employees : '-'}
          </div>
          <div className="text-[11px] text-slate-500">Karyawan Aktif</div>
        </div>

        {/* Sudah Absen (Hadir) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sudah Absen</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-400">
            {stats ? stats.present_count : '-'}
          </div>
          <div className="text-[11px] text-blue-400/80 font-medium">
            {stats ? `${stats.attendance_rate}% Kehadiran` : '-'}
          </div>
        </div>

        {/* Tepat Waktu */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span>Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300">
            {stats ? stats.on_time_count : '-'}
          </div>
          <div className="text-[11px] text-emerald-500">Sesuai shift kerja</div>
        </div>

        {/* Terlambat */}
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span>Terlambat</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-300">
            {stats ? stats.late_count : '-'}
          </div>
          <div className="text-[11px] text-rose-500">Lewat batas window</div>
        </div>

        {/* Belum Absen */}
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span>Belum Absen</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300">
            {stats ? stats.absent_count : '-'}
          </div>
          <div className="text-[11px] text-amber-500">Belum check-in</div>
        </div>

        {/* Sudah Absen Pulang */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sudah Pulang</span>
            <LogOut className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-400">
            {stats ? stats.checked_out_count : '-'}
          </div>
          <div className="text-[11px] text-slate-500">Check-out selesai</div>
        </div>

      </div>

      {/* Main Table: Absensi Terbaru Hari Ini */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <CalendarClock className="w-5 h-5 text-cyan-400" />
              <span>Aktivitas Presensi Hari Ini (Realtime)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar karyawan yang telah melakukan presensi pada tanggal hari ini.
            </p>
          </div>
          <a
            href="/admin/attendance"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
          >
            <span>Buka Riwayat Lengkap & Ekspor CSV</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">NIP / ID</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Keluar</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Belum ada data presensi untuk hari ini.
                  </td>
                </tr>
              ) : (
                attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    <td className="py-3 px-4 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                        {att.photo ? (
                          <img src={att.photo} alt={att.employee_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                            {att.employee_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{att.employee_name}</div>
                        <div className="text-[10px] text-slate-500">{att.position}</div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-300">
                      {att.employee_code}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {att.department}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {att.shift === 'SHIFT_1' ? 'Shift 1' : 'Shift 2'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                      {att.check_in.substring(0, 5)} WIB
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {att.check_out ? (
                        <span className="font-semibold text-indigo-400">
                          {att.check_out.substring(0, 5)} WIB
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        att.status === 'TEPAT_WAKTU' || att.status === 'ABSEN_LENGKAP'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {att.status === 'TEPAT_WAKTU' && 'Tepat Waktu'}
                        {att.status === 'TERLAMBAT' && 'Terlambat'}
                        {att.status === 'ABSEN_LENGKAP' && 'Absen Lengkap'}
                      </span>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
