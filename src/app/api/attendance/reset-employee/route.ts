import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { getServerTime } from '@/lib/time';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employee_id } = body;

    if (!employee_id) {
      return NextResponse.json(
        { success: false, message: 'ID Karyawan wajib disertakan.' },
        { status: 400 }
      );
    }

    const settings = Database.getSettings();
    const serverTime = getServerTime(settings);
    const db = Database.read();

    const initialLen = db.attendance.length;
    // Remove today's attendance for this employee
    db.attendance = db.attendance.filter(
      (a) =>
        !(
          (a.employee_id === employee_id || a.employee_code === employee_id) &&
          a.attendance_date === serverTime.dateStr
        )
    );

    Database.write(db);

    return NextResponse.json({
      success: true,
      message: 'Rekaman absensi hari ini berhasil di-reset untuk pengujian ulang.',
      deletedCount: initialLen - db.attendance.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mereset absensi karyawan.' },
      { status: 500 }
    );
  }
}
