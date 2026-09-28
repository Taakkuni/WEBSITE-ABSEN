import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET() {
  try {
    const employees = Database.getEmployees();
    return NextResponse.json({
      success: true,
      data: employees,
      total: employees.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat data karyawan.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employee_code, name, email, phone, position, department, photo, default_shift, is_active } = body;

    if (!employee_code || !name || !position || !department) {
      return NextResponse.json(
        { success: false, message: 'Kolom NIP/ID, Nama, Jabatan, dan Departemen wajib diisi.' },
        { status: 400 }
      );
    }

    const newEmp = Database.createEmployee({
      employee_code: employee_code.trim().toUpperCase(),
      name: name.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      position: position.trim(),
      department: department.trim(),
      photo: photo || null,
      face_embedding: null,
      is_active: is_active ?? true,
      default_shift: default_shift || 'SHIFT_1',
    });

    return NextResponse.json({
      success: true,
      message: 'Karyawan berhasil ditambahkan.',
      data: newEmp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menambahkan karyawan.' },
      { status: 400 }
    );
  }
}
