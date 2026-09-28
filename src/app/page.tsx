'use client';

import React, { useEffect, useState } from 'react';
import FaceScanner from '@/components/FaceScanner';
import { 
  Clock, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Attendance } from '@/types';

export default function HomePage() {
  const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<any>(null);

  const fetchTodayData = async () => {
    try {
      const res = await fetch('/api/attendance/today');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentAttendances(data.todayAttendances?.slice(0, 5) || []);
      }
    } catch (e) {
      console.error('Failed to load today feed', e);
    }
  };

  useEffect(() => {
    fetchTodayData();
    const interval = setInterval(fetchTodayData, 4000);

    // Instant update when any employee checks in or checks out
    const handleUpdate = () => {
      fetchTodayData();
    };
    window.addEventListener('attendance-updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('attendance-updated', handleUpdate);
    };
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Biometric Face Recognition System • WIB Asia/Jakarta</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Kios Presensi Cerdas <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Face Recognition</span>
        </h1>
        <p className="text-sm text-slate-400">
          Silakan posisikan wajah di dalam frame kamera. Sistem akan secara otomatis mendeteksi identitas, menentukan shift, dan mencatat absensi Anda.
        </p>
      </div>

      {/* Main Content Grid: Scanner (Left/Center) + Live Info Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Scanner Column (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <FaceScanner />
        </div>

        {/* Live Sidebar Column (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Shift Schedule Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Jadwal Shift Kerja</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span>Shift 1 (Pagi)</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Tepat Waktu: 08:00 - 09:00
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Masuk &gt; 09:00 WIB: Terhitung <strong>Terlambat</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span>Shift 2 (Siang)</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Tepat Waktu: 12:00 - 13:00
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Masuk &gt; 13:00 WIB: Terhitung <strong>Terlambat</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Validasi jam dilakukan secara ketat di sisi server.</span>
            </div>
          </div>

          {/* Today Live Feed Activity */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Absensi Terbaru Hari Ini</span>
              </h3>
              <a
                href="/admin/attendance"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            {/* Quick mini stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Hadir</div>
                  <div className="text-base font-bold text-white">{stats.present_count}</div>
                </div>
                <div className="bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/30">
                  <div className="text-emerald-400 text-[10px]">Tepat Waktu</div>
                  <div className="text-base font-bold text-emerald-300">{stats.on_time_count}</div>
                </div>
                <div className="bg-rose-950/40 p-2 rounded-xl border border-rose-800/30">
                  <div className="text-rose-400 text-[10px]">Terlambat</div>
                  <div className="text-base font-bold text-rose-300">{stats.late_count}</div>
                </div>
              </div>
            )}

            {/* Feed List */}
            <div className="space-y-2.5">
              {recentAttendances.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Belum ada karyawan yang absen hari ini.
                </div>
              ) : (
                recentAttendances.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                        {item.photo ? (
                          <img src={item.photo} alt={item.employee_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                            {item.employee_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{item.employee_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.employee_code} • {item.shift === 'SHIFT_1' ? 'Shift 1' : 'Shift 2'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-cyan-400">
                        {item.check_in.substring(0, 5)} WIB
                      </div>
                      <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        item.status === 'TEPAT_WAKTU'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.status === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
