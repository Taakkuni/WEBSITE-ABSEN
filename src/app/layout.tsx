import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'PRESENSI PRO — Sistem Absensi Face Recognition',
  description: 'Sistem Absensi Karyawan Berbasis Face Recognition & Multi-Shift Realtime',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950/70 text-slate-400 py-4 text-xs text-center">
          <p>© 2026 PT Solusi Prima Nusantara — Sistem Presensi Biometrik Wajah Cerdas (WIB Asia/Jakarta)</p>
        </footer>
      </body>
    </html>
  );
}
