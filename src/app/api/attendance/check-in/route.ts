import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { getServerTime, determineShift, evaluateCheckInStatus } from '@/lib/time';
import { findBestMatch } from '@/lib/face';
import { ShiftType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employee_id, descriptor, snapshot, shiftOverride, notes } = body;

    const settings = Database.getSettings();
    const serverTime = getServerTime(settings);

    let targetEmployee = null;

    // 1. If employee_id provided, verify employee
    if (employee_id) {
      targetEmployee = Database.getEmployeeById(employee_id);
    } else if (descriptor && Array.isArray(descriptor)) {
      // Find employee by face descriptor
      const employees = Database.getEmployees();
      const match = findBestMatch(descriptor, employees, settings.threshold);
      if (match.isMatch && match.employee) {
        targetEmployee = match.employee;
      }
    }

    if (!targetEmployee) {
      return NextResponse.json(
        { success: false, message: 'Identitas karyawan tidak ditemukan atau belum diverifikasi.' },
        { status: 404 }
      );
    }

    if (!targetEmployee.is_active) {
      return NextResponse.json(
        { success: false, message: 'Status karyawan tidak aktif. Hubungi bagian HR/Admin.' },
        { status: 403 }
      );
    }

    // 2. Check if already checked in today
    const existing = Database.getTodayAttendanceForEmployee(targetEmployee.id, serverTime.dateStr);
    if (existing) {
      const formattedPrevTime = `${existing.check_in.substring(0, 5)} WIB`;
      return NextResponse.json(
        {
          success: false,
          alreadyCheckedIn: true,
          message: `Anda sudah melakukan absensi masuk hari ini pada ${formattedPrevTime}.`,
          attendance: existing,
          employee: {
            id: targetEmployee.id,
            employee_code: targetEmployee.employee_code,
            name: targetEmployee.name,
            position: targetEmployee.position,
            department: targetEmployee.department,
            photo: targetEmployee.photo,
          },
        },
        { status: 400 }
      );
    }

    // 3. Determine Shift
    const shift: ShiftType = shiftOverride || determineShift(serverTime.hour, serverTime.minute, targetEmployee.default_shift);

    // 4. Evaluate Status (TEPAT_WAKTU vs TERLAMBAT)
    const statusEval = evaluateCheckInStatus(shift, serverTime.hour, serverTime.minute, settings);

    // 5. Record Attendance in Database
    const newRecord = Database.recordCheckIn({
      employee_id: targetEmployee.id,
      employee_code: targetEmployee.employee_code,
      employee_name: targetEmployee.name,
      department: targetEmployee.department,
      position: targetEmployee.position,
      photo: targetEmployee.photo,
      attendance_date: serverTime.dateStr,
      shift,
      check_in: serverTime.timeStr,
      check_out: null,
      status: statusEval.status,
      check_in_snapshot: snapshot || null,
      notes: notes || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Absensi Masuk Berhasil!',
      attendance: newRecord,
      employee: {
        id: targetEmployee.id,
        employee_code: targetEmployee.employee_code,
        name: targetEmployee.name,
        position: targetEmployee.position,
        department: targetEmployee.department,
        photo: targetEmployee.photo,
      },
      shift,
      checkInTimeFormatted: `${serverTime.shortTimeStr} WIB`,
      status: statusEval.status,
      statusDescription: statusEval.description,
      serverTime: {
        timeStr: serverTime.timeStr,
        formattedTimeWib: serverTime.formattedTimeWib,
        dateStr: serverTime.dateStr,
        formattedDateId: serverTime.formattedDateId,
      },
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memproses absensi masuk.' },
      { status: 500 }
    );
  }
}
