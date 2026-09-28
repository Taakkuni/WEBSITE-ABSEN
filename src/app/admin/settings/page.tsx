'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  Clock, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Zap,
  Info
} from 'lucide-react';
import { SystemSettings } from '@/types';
import { playSuccessSound } from '@/lib/sound';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [serverTimeInfo, setServerTimeInfo] = useState<any>(null);

  // Load Settings
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setServerTimeInfo(data.serverTime);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setIsSaving(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        playSuccessSound();
        setSavedSuccess(true);
        setSettings(data.data);
        setServerTimeInfo(data.serverTime);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick preset simulation times
  const applySimulatedTimePreset = (timeStr: string | null) => {
    if (!settings) return;
    const today = new Date().toISOString().split('T')[0];
    const fullIso = timeStr ? `${today}T${timeStr}:00` : null;

    setSettings({
      ...settings,
      simulated_time: fullIso,
    });
  };

  // Reset database to initial seed
  const handleResetDatabase = async () => {
    if (confirm('Yakin ingin mereset database ke data awal (seed default)? Semua absensi baru akan terhapus.')) {
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          playSuccessSound();
          alert('Database berhasil di-reset.');
          window.location.reload();
        }
      } catch (e) {
        alert('Gagal mereset database.');
      }
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Memuat pengaturan sistem...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Pengaturan Sistem & Shift
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Konfigurasi jadwal kerja, batas waktu tepat waktu/terlambat, dan simulasi pengujian biometrik.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Pengaturan sistem berhasil disimpan dan diterapkan ke seluruh server.</span>
        </div>
      )}

      {/* TESTING TIME SIMULATOR CARD */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
          <div className="flex items-center space-x-2.5">
            <Zap className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Simulator Waktu Server (Testing Sandbox)
              </h2>
              <p className="text-xs text-slate-400">
                Uji langsung aturan Shift 1, Shift 2, Tepat Waktu, dan Terlambat tanpa menunggu jam nyata.
              </p>
            </div>
          </div>
          {settings.simulated_time ? (
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold animate-pulse">
              Simulasi Aktif
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold">
              Waktu Nyata
            </span>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div className="text-slate-300 font-medium">Pilih Skenario Pengujian Cepat:</div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Test A & B */}
            <button
              type="button"
              onClick={() => applySimulatedTimePreset('08:30')}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.simulated_time?.includes('08:30')
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-emerald-400 font-mono">08:30 WIB</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Test A: Masuk Tepat Waktu (Check-In)</div>
            </button>

            {/* Test C */}
            <button
              type="button"
              onClick={() => applySimulatedTimePreset('12:00')}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.simulated_time?.includes('12:00')
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-amber-400 font-mono">12:00 WIB</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Test C: Siang Hari (NO CHECK-OUT)</div>
            </button>

            {/* Test D */}
            <button
              type="button"
              onClick={() => applySimulatedTimePreset('15:59')}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.simulated_time?.includes('15:59')
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-rose-400 font-mono">15:59 WIB</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Test D: -1 Menit Pulang (CHECK-OUT DITOLAK)</div>
            </button>

            {/* Test E */}
            <button
              type="button"
              onClick={() => applySimulatedTimePreset('16:00')}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.simulated_time?.includes('16:00')
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-indigo-400 font-mono">16:00 WIB</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Test E: Tepat Jam Pulang (DIPERBOLEHKAN)</div>
            </button>

            {/* Test F */}
            <button
              type="button"
              onClick={() => applySimulatedTimePreset('16:05')}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.simulated_time?.includes('16:05')
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-emerald-400 font-mono">16:05 WIB</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Test F: Jam Pulang (CHECK-OUT SUKSES)</div>
            </button>

            {/* Real Time */}
            <button
              type="button"
              onClick={() => applySimulatedTimePreset(null)}
              className={`p-3 rounded-xl border text-left transition-all ${
                !settings.simulated_time
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-cyan-400 font-mono">Waktu Nyata</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Gunakan Jam Riil PC/Server</div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Shift Configuration */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Konfigurasi Jadwal & Window Shift</h2>
              <p className="text-xs text-slate-400">Atur jam batas absensi tepat waktu dan jam kerja masing-masing shift.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Shift 1 Config */}
            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Shift 1 (Pagi)</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
                  Pagi - Sore
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400">Mulai Jam Masuk (Shift 1):</label>
                  <input
                    type="time"
                    value={settings.shift1_start}
                    onChange={(e) => setSettings({ ...settings, shift1_start: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Batas Akhir Tepat Waktu (Window Cutoff):</label>
                  <input
                    type="time"
                    value={settings.shift1_on_time_end}
                    onChange={(e) => setSettings({ ...settings, shift1_on_time_end: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Check-in sebelum {settings.shift1_on_time_end} = <strong className="text-emerald-400">Tepat Waktu</strong>. Setelah itu = <strong className="text-rose-400">Terlambat</strong>.
                  </span>
                </div>

                <div>
                  <label className="text-slate-400">Jam Pulang Shift 1:</label>
                  <input
                    type="time"
                    value={settings.shift1_end}
                    onChange={(e) => setSettings({ ...settings, shift1_end: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Shift 2 Config */}
            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Shift 2 (Siang)</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Siang - Malam
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400">Mulai Jam Masuk (Shift 2):</label>
                  <input
                    type="time"
                    value={settings.shift2_start}
                    onChange={(e) => setSettings({ ...settings, shift2_start: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Batas Akhir Tepat Waktu (Window Cutoff):</label>
                  <input
                    type="time"
                    value={settings.shift2_on_time_end}
                    onChange={(e) => setSettings({ ...settings, shift2_on_time_end: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Check-in sebelum {settings.shift2_on_time_end} = <strong className="text-emerald-400">Tepat Waktu</strong>. Setelah itu = <strong className="text-rose-400">Terlambat</strong>.
                  </span>
                </div>

                <div>
                  <label className="text-slate-400">Jam Pulang Shift 2:</label>
                  <input
                    type="time"
                    value={settings.shift2_end}
                    onChange={(e) => setSettings({ ...settings, shift2_end: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 mt-1 font-mono"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Face Recognition Biometrics & Security */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Parameter Biometrik Wajah & Keamanan</h2>
              <p className="text-xs text-slate-400">Sesuaikan sensitivitas threshold Euclidean distance dan liveness detection.</p>
            </div>
          </div>

          <div className="space-y-5 text-xs">
            
            {/* Threshold Slider */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">
                  Threshold Kemiripan Wajah (Euclidean Distance):
                </label>
                <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {settings.threshold}
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.70"
                step="0.01"
                value={settings.threshold}
                onChange={(e) => setSettings({ ...settings, threshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.30 (Sangat Ketat)</span>
                <span>0.55 (Standar Industri Direkomendasikan)</span>
                <span>0.70 (Toleransi Tinggi)</span>
              </div>
            </div>

            {/* Liveness & Anti-spoofing Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.liveness_enabled}
                  onChange={(e) => setSettings({ ...settings, liveness_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="font-semibold text-slate-200">Liveness Detection (Deteksi Kedipan/Gerakan)</div>
                  <div className="text-[11px] text-slate-400">Mendeteksi keaktifan wajah manusia asli</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.anti_spoofing}
                  onChange={(e) => setSettings({ ...settings, anti_spoofing: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="font-semibold text-slate-200">Anti-Spoofing Protection</div>
                  <div className="text-[11px] text-slate-400">Mencegah bypass menggunakan foto layar HP/kertas</div>
                </div>
              </label>
            </div>

          </div>
        </div>

        {/* Submit & Reset Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleResetDatabase}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Database ke Data Seed Bawaan</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Semua Perubahan'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
