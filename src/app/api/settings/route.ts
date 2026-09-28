import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { getServerTime } from '@/lib/time';

export async function GET() {
  try {
    const settings = Database.getSettings();
    const serverTime = getServerTime(settings);

    return NextResponse.json({
      success: true,
      data: settings,
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
      { success: false, message: error.message || 'Gagal memuat pengaturan sistem.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = Database.updateSettings(body);
    const serverTime = getServerTime(updated);

    return NextResponse.json({
      success: true,
      message: 'Pengaturan sistem berhasil disimpan.',
      data: updated,
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
      { success: false, message: error.message || 'Gagal menyimpan pengaturan sistem.' },
      { status: 400 }
    );
  }
}
