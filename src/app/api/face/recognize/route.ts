import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { findBestMatch } from '@/lib/face';
import { getServerTime } from '@/lib/time';
import { evaluateAttendanceDecision } from '@/lib/decision';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { descriptor, snapshot, bypass_shift_lock } = body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json(
        { success: false, message: 'Embedding wajah (128-vektor) tidak valid.' },
        { status: 400 }
      );
    }

    const baseSettings = Database.getSettings();
    const settings = {
      ...baseSettings,
      testing_mode: bypass_shift_lock !== undefined ? Boolean(bypass_shift_lock) : Boolean(baseSettings.testing_mode),
    };
    const employees = Database.getEmployees();
    const serverTime = getServerTime(settings);

    // 1. Perform face matching
    const match = findBestMatch(descriptor, employees, settings.threshold);

    if (!match.isMatch || !match.employee) {
      return NextResponse.json(
        {
          success: false,
          recognized: false,
          distance: match.distance,
          message: 'Wajah tidak dikenali atau belum terdaftar dalam sistem.',
        },
        { status: 404 }
      );
    }

    const employee = match.employee;

    // 2. Fetch today's attendance for this employee
    const todayAttendance = Database.getTodayAttendanceForEmployee(employee.id, serverTime.dateStr);

    // 3. Run Attendance Decision Engine (CORE SECURITY & BUSINESS LOGIC)
    const decision = evaluateAttendanceDecision(employee, todayAttendance, serverTime, settings);

    return NextResponse.json({
      success: true,
      recognized: true,
      confidence: match.confidence,
      distance: match.distance,
      employee: {
        id: employee.id,
        employee_code: employee.employee_code,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        photo: employee.photo,
        default_shift: employee.default_shift,
      },
      decision,
      todayAttendance,
      serverTime: {
        timeStr: serverTime.timeStr,
        shortTimeStr: serverTime.shortTimeStr,
        formattedTimeWib: serverTime.formattedTimeWib,
        dateStr: serverTime.dateStr,
        formattedDateId: serverTime.formattedDateId,
      },
    });
  } catch (error: any) {
    console.error('Face recognition error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memproses pengenalan wajah.' },
      { status: 500 }
    );
  }
}
