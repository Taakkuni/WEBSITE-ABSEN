import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const employee = Database.getEmployeeById(params.id);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Karyawan tidak ditemukan.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat detail karyawan.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = Database.updateEmployee(params.id, body);
    return NextResponse.json({
      success: true,
      message: 'Data karyawan berhasil diperbarui.',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui data karyawan.' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = Database.deleteEmployee(params.id);
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Karyawan tidak ditemukan.' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Karyawan berhasil dihapus dari sistem.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus karyawan.' },
      { status: 500 }
    );
  }
}
