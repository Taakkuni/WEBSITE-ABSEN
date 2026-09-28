'use client';

import React, { useEffect, useState } from 'react';
import { 
  CalendarClock, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  Eye, 
  X, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { Attendance, ShiftType } from '@/types';

export default function AttendanceHistoryPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Detail Modal
  const [detailItem, setDetailItem] = useState<Attendance | null>(null);

  // Fetch Attendance records
  const loadAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedShift !== 'ALL') params.append('shift', selectedShift);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (search) params.append('search', search);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAttendances(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load attendance history', e);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedShift, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAttendance();
  };

  // Sorting
  const sortedData = [...attendances].sort((a, b) => {
    const keyA = `${a.attendance_date} ${a.check_in}`;
    const keyB = `${b.attendance_date} ${b.check_in}`;
    return sortOrder === 'desc' ? keyB.localeCompare(keyA) : keyA.localeCompare(keyB);
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Tanggal', 'NIP/ID', 'Nama', 'Departemen', 'Shift', 'Jam Masuk', 'Jam Keluar', 'Status'];
    const rows = sortedData.map((a) => [
      a.attendance_date,
      a.employee_code,
      `"${a.employee_name}"`,
      `"${a.department}"`,
      a.shift,
      a.check_in,
      a.check_out || '-',
      a.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Riwayat_Absensi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Riwayat Absensi Karyawan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Data rekapitulasi presensi face recognition, status tepat waktu, dan verifikasi shift.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Ekspor CSV / Excel</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama, NIP, Departemen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Semua Shift</option>
              <option value="SHIFT_1">Shift 1 (08:00 - 09:00)</option>
              <option value="SHIFT_2">Shift 2 (12:00 - 13:00)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="TEPAT_WAKTU">Tepat Waktu</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="ABSEN_LENGKAP">Absen Lengkap</option>
            </select>
          </div>

        </form>

        {/* Clear Filters helper */}
        {(selectedDate || selectedShift !== 'ALL' || selectedStatus !== 'ALL' || search) && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Filter Aktif:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedDate('');
                setSelectedShift('ALL');
                setSelectedStatus('ALL');
                setSearch('');
              }}
              className="text-cyan-400 underline hover:text-cyan-300"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4 cursor-pointer select-none" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
                  <div className="flex items-center space-x-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">NIP / ID</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Keluar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Tidak ada rekaman data absensi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedData.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Tanggal */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      {att.attendance_date}
                    </td>

                    {/* Karyawan */}
                    <td className="py-3.5 px-4 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                        {att.photo ? (
                          <img src={att.photo} alt={att.employee_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                            {att.employee_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{att.employee_name}</div>
                        <div className="text-[10px] text-slate-400">{att.department}</div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {att.employee_code}
                    </td>

                    {/* Shift */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {att.shift === 'SHIFT_1' ? 'Shift 1' : 'Shift 2'}
                      </span>
                    </td>

                    {/* Jam Masuk */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                      {att.check_in.substring(0, 5)} WIB
                    </td>

                    {/* Jam Keluar */}
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {att.check_out ? (
                        <span className="text-indigo-400">{att.check_out.substring(0, 5)} WIB</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        att.status === 'TEPAT_WAKTU' || att.status === 'ABSEN_LENGKAP'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {att.status === 'TEPAT_WAKTU' && 'Tepat Waktu'}
                        {att.status === 'TERLAMBAT' && 'Terlambat'}
                        {att.status === 'ABSEN_LENGKAP' && 'Absen Lengkap'}
                      </span>
                    </td>

                    {/* Detail Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailItem(att)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Lihat Detail Presensi"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Menampilkan <strong className="text-white">{sortedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> -{' '}
            <strong className="text-white">{Math.min(currentPage * itemsPerPage, sortedData.length)}</strong> dari{' '}
            <strong className="text-white">{sortedData.length}</strong> data absensi
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">
              Halaman {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <CalendarClock className="w-4 h-4 text-cyan-400" />
                <span>Detail Rekaman Presensi</span>
              </h3>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                  {detailItem.photo ? (
                    <img src={detailItem.photo} alt={detailItem.employee_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                      {detailItem.employee_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{detailItem.employee_name}</div>
                  <div className="font-mono text-cyan-400">{detailItem.employee_code}</div>
                  <div className="text-[11px] text-slate-400">{detailItem.department} • {detailItem.position}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Tanggal Presensi</div>
                  <div className="font-mono font-bold text-slate-200 mt-0.5">{detailItem.attendance_date}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Shift Kerja</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {detailItem.shift === 'SHIFT_1' ? 'Shift 1 (08:00 - 09:00)' : 'Shift 2 (12:00 - 13:00)'}
                  </div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Jam Masuk Server</div>
                  <div className="font-mono font-bold text-cyan-400 mt-0.5">{detailItem.check_in} WIB</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Jam Keluar Server</div>
                  <div className="font-mono font-bold text-indigo-400 mt-0.5">
                    {detailItem.check_out ? `${detailItem.check_out} WIB` : 'Belum Pulang'}
                  </div>
                </div>
              </div>

              {/* Snapshot image if captured */}
              {detailItem.check_in_snapshot && (
                <div className="space-y-1">
                  <div className="text-slate-400 text-[10px]">Tangkapan Wajah Saat Presensi:</div>
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={detailItem.check_in_snapshot}
                      alt="Biometric Snapshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
