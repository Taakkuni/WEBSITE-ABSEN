import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { ShiftType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const shift = (searchParams.get('shift') as ShiftType) || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const list = Database.getAttendanceList({
      date,
      shift,
      status,
      search,
    });

    return NextResponse.json({
      success: true,
      data: list,
      total: list.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat riwayat absensi.' },
      { status: 500 }
    );
  }
}
