'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { 
  Camera, 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  Sliders, 
  Clock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Sync clock every 1 second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const parts = formatter.format(now);
      const timePart = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
      });
      const datePart = now.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      setTimeStr(`${timePart} WIB`);
      setDateStr(datePart);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if simulated server time is active
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.simulated_time) {
          setIsSimulated(true);
        } else {
          setIsSimulated(false);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    { label: 'Kios Absensi', href: '/', icon: Camera },
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Karyawan', href: '/admin/employees', icon: Users },
    { label: 'Riwayat Absensi', href: '/admin/attendance', icon: CalendarClock },
    { label: 'Pengaturan & Shift', href: '/admin/settings', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    PRESENSI<span className="text-cyan-400">PRO</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded">
                    AI Face
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">
                  Sistem Presensi Karyawan Terpadu
                </p>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Realtime Clock & Date Widget */}
          <div className="flex items-center space-x-3">
            {isSimulated && (
              <a
                href="/admin/settings"
                title="Waktu server sedang disimulasikan untuk pengujian"
                className="hidden sm:flex items-center space-x-1.5 px-2 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-md text-xs font-semibold animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulasi Waktu Aktif</span>
              </a>
            )}

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-1.5 text-right shadow-inner">
              <div className="flex items-center justify-end space-x-1.5 text-cyan-400 font-mono text-sm sm:text-base font-bold tracking-wider">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{timeStr || '--:--:-- WIB'}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {dateStr || '...'}
              </div>
            </div>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 overflow-x-auto text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-2 rounded-md ${
                  isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
}
