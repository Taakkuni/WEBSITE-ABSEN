import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { getServerTime } from '@/lib/time';

export async function GET(req: NextRequest) {
  try {
    const settings = Database.getSettings();
    const serverTime = getServerTime(settings);
    const stats = Database.getTodayStats();
    const todayAttendances = Database.getAttendanceList({ date: serverTime.dateStr });

    return NextResponse.json({
      success: true,
      stats,
      todayAttendances,
      serverTime: {
        timeStr: serverTime.timeStr,
        shortTimeStr: serverTime.shortTimeStr,
        formattedTimeWib: serverTime.formattedTimeWib,
        dateStr: serverTime.dateStr,
        dayName: serverTime.dayName,
        formattedDateId: serverTime.formattedDateId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat ringkasan absensi hari ini.' },
      { status: 500 }
    );
  }
}
