'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Camera, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  X,
  Upload,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Employee, ShiftType } from '@/types';
import { playSuccessSound, playErrorSound } from '@/lib/sound';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form Modal State (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    default_shift: 'SHIFT_1' as ShiftType,
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Face Registration Modal State
  const [faceModalEmp, setFaceModalEmp] = useState<Employee | null>(null);
  const [faceDetectionStatus, setFaceDetectionStatus] = useState<string>('Menyiapkan Kamera...');
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [capturedEmbedding, setCapturedEmbedding] = useState<number[] | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load Employees
  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.employee_code.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingEmp(null);
    setFormData({
      employee_code: `EMP00${employees.length + 1}`,
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      default_shift: 'SHIFT_1',
      is_active: true,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      employee_code: emp.employee_code,
      name: emp.name,
      email: emp.email || '',
      phone: emp.phone || '',
      position: emp.position,
      department: emp.department,
      default_shift: (emp.default_shift as ShiftType) || 'SHIFT_1',
      is_active: emp.is_active,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Submit Form (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const url = editingEmp ? `/api/employees/${editingEmp.id}` : '/api/employees';
      const method = editingEmp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setIsFormOpen(false);
        loadEmployees();
      } else {
        setFormError(data.message || 'Gagal menyimpan data karyawan.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Employee
  const handleDelete = async (emp: Employee) => {
    if (confirm(`Yakin ingin menghapus karyawan "${emp.name}" (${emp.employee_code})?`)) {
      try {
        const res = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          loadEmployees();
        } else {
          alert(data.message || 'Gagal menghapus karyawan.');
        }
      } catch (err) {
        alert('Gagal menghapus karyawan.');
      }
    }
  };

  // Open Face Enrollment Modal
  const handleOpenFaceEnroll = (emp: Employee) => {
    setFaceModalEmp(emp);
    setCapturedEmbedding(null);
    setCapturedPhoto(null);
    setIsFaceDetected(false);
    setFaceDetectionStatus('Menyiapkan Kamera & Model Biometrik...');
    startEnrollCamera();
  };

  // Close Face Enrollment Modal
  const handleCloseFaceEnroll = () => {
    stopEnrollCamera();
    setFaceModalEmp(null);
  };

  // Camera handling for Face Enrollment
  const startEnrollCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      setFaceDetectionStatus('Kamera tidak dapat diakses atau izin ditolak.');
    }
  };

  const stopEnrollCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // Continuous face detection for enrollment
  useEffect(() => {
    if (!faceModalEmp || !cameraActive) return;

    let animId: number;
    let isDetecting = false;

    const detectLoop = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animId = requestAnimationFrame(detectLoop);
        return;
      }

      if (isDetecting) {
        animId = requestAnimationFrame(detectLoop);
        return;
      }

      try {
        isDetecting = true;
        const faceapi = await import('@vladmandic/face-api');

        if (videoRef.current.readyState === 4) {
          const detection = await faceapi
            .detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            )
            .withFaceLandmarks(true)
            .withFaceDescriptor();

          if (detection) {
            setIsFaceDetected(true);
            setFaceDetectionStatus('Wajah Terdeteksi dengan Sempurna ✓');

            // Draw bounding box
            if (faceCanvasRef.current && videoRef.current) {
              const displaySize = {
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
              };
              faceapi.matchDimensions(faceCanvasRef.current, displaySize);
              const resized = faceapi.resizeResults(detection, displaySize);
              const ctx = faceCanvasRef.current.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, faceCanvasRef.current.width, faceCanvasRef.current.height);
                faceapi.draw.drawDetections(faceCanvasRef.current, resized);
              }
            }
          } else {
            setIsFaceDetected(false);
            setFaceDetectionStatus('Mencari Wajah di Frame Kamera...');
            if (faceCanvasRef.current) {
              const ctx = faceCanvasRef.current.getContext('2d');
              if (ctx) ctx.clearRect(0, 0, faceCanvasRef.current.width, faceCanvasRef.current.height);
            }
          }
        }
      } catch (err) {
        // ignore
      } finally {
        isDetecting = false;
        animId = requestAnimationFrame(detectLoop);
      }
    };

    animId = requestAnimationFrame(detectLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [faceModalEmp, cameraActive]);

  // Capture face and extract embedding
  const handleCaptureFace = async () => {
    if (!videoRef.current) return;
    try {
      const faceapi = await import('@vladmandic/face-api');
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!detection) {
        alert('Wajah tidak terdeteksi secara valid. Posisikan wajah tepat di tengah frame kamera.');
        return;
      }

      // Capture snapshot
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = videoRef.current.videoWidth;
      snapCanvas.height = videoRef.current.videoHeight;
      const ctx = snapCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const photoData = snapCanvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(photoData);
      }

      setCapturedEmbedding(Array.from(detection.descriptor));
      playSuccessSound();
    } catch (err: any) {
      alert('Gagal mengambil sampel wajah: ' + err.message);
    }
  };

  // Save registered face to backend
  const handleSaveFaceEnrollment = async () => {
    if (!faceModalEmp || !capturedEmbedding) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/employees/${faceModalEmp.id}/face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedding: capturedEmbedding,
          photo: capturedPhoto,
        }),
      });

      const data = await res.json();
      if (data.success) {
        playSuccessSound();
        handleCloseFaceEnroll();
        loadEmployees();
      } else {
        alert(data.message || 'Gagal mendaftarkan data wajah.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Manajemen Karyawan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola data staf, jadwal shift, dan pendaftaran profil biometrik wajah.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan Baru</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIP, atau departemen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs text-slate-400">
          <span>Total: <strong className="text-white">{employees.length}</strong> Karyawan</span>
          <span>
            Wajah Terdaftar:{' '}
            <strong className="text-cyan-400">
              {employees.filter((e) => e.face_embedding && e.face_embedding.length > 0).length}
            </strong>
          </span>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">NIP / ID</th>
                <th className="py-3 px-4">Jabatan & Departemen</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Shift Bawaan</th>
                <th className="py-3 px-4">Biometrik Wajah</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Tidak ada data karyawan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const hasFace = emp.face_embedding && emp.face_embedding.length > 0;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Photo & Name */}
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                          {emp.photo ? (
                            <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                              {emp.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{emp.name}</div>
                          <div className="text-[10px] text-slate-400">{emp.email || '-'}</div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {emp.employee_code}
                      </td>

                      {/* Position & Department */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{emp.position}</div>
                        <div className="text-[10px] text-slate-400">{emp.department}</div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {emp.phone || '-'}
                      </td>

                      {/* Default Shift */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {emp.default_shift === 'SHIFT_1' ? 'Shift 1 (08:00)' : 'Shift 2 (12:00)'}
                        </span>
                      </td>

                      {/* Face Biometric Status */}
                      <td className="py-3 px-4">
                        {hasFace ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            <span>Terdaftar (128-d)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" />
                            <span>Belum Ada Wajah</span>
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          emp.is_active
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {emp.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenFaceEnroll(emp)}
                          title="Daftarkan / Perbarui Wajah"
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          title="Ubah Data"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp)}
                          title="Hapus Karyawan"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT EMPLOYEE */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>{editingEmp ? 'Ubah Data Karyawan' : 'Tambah Karyawan Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">NIP / ID Karyawan *</label>
                  <input
                    type="text"
                    required
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    placeholder="EMP001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Budi Santoso"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Jabatan *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Software Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Departemen *</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Teknologi Informasi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="budi@perusahaan.co.id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Nomor Telepon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Shift Kerja Default</label>
                  <select
                    value={formData.default_shift}
                    onChange={(e) => setFormData({ ...formData, default_shift: e.target.value as ShiftType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SHIFT_1">Shift 1 (08:00 - 09:00 WIB)</option>
                    <option value="SHIFT_2">Shift 2 (12:00 - 13:00 WIB)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Status Karyawan</label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="true">Aktif (Dapat Melakukan Absensi)</option>
                    <option value="false">Nonaktif (Diblokir)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FACE ENROLLMENT MODAL (Section 8 Specification) */}
      {faceModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <span>Pendaftaran Wajah Biometrik</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Karyawan: <strong className="text-white">{faceModalEmp.name}</strong> ({faceModalEmp.employee_code})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseFaceEnroll}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Instructions Box (as requested in Section 8) */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-cyan-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Petunjuk Pendaftaran Wajah:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px] pl-1">
                  <li>Posisikan wajah di dalam frame kamera.</li>
                  <li>Pastikan pencahayaan ruangan cukup terang.</li>
                  <li>Lepaskan masker atau kacamata gelap jika diperlukan.</li>
                  <li>Lihat langsung lurus ke kamera.</li>
                </ul>
              </div>

              {/* Camera & Scanner View */}
              <div className="relative aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
                
                {/* Live Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover transform scale-x-[-1] ${
                    capturedPhoto ? 'hidden' : 'block'
                  }`}
                />

                {/* Canvas Overlay */}
                <canvas
                  ref={faceCanvasRef}
                  className={`absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1] ${
                    capturedPhoto ? 'hidden' : 'block'
                  }`}
                />

                {/* Captured Photo Preview if taken */}
                {capturedPhoto && (
                  <img
                    src={capturedPhoto}
                    alt="Pratinjau Wajah"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Center target circle */}
                {!capturedPhoto && (
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
                    <div className={`w-52 h-64 border-2 rounded-[50%] transition-all ${
                      isFaceDetected
                        ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                        : 'border-cyan-500/30 border-dashed'
                    }`} />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute bottom-3 inset-x-6 flex justify-center">
                  <div className="px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      capturedPhoto
                        ? 'bg-emerald-400'
                        : isFaceDetected
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400'
                    }`} />
                    <span>{capturedPhoto ? 'Foto Wajah Berhasil Diambil ✓' : faceDetectionStatus}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                {capturedPhoto ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhoto(null);
                        setCapturedEmbedding(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                    >
                      Ambil Ulang Foto
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSaveFaceEnrollment}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-slate-950 font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Mendaftarkan Biometrik...' : '✓ Simpan Data Biometrik Wajah'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseFaceEnroll}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={!isFaceDetected}
                      onClick={handleCaptureFace}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-slate-950 font-bold shadow-md shadow-cyan-600/20 disabled:opacity-40"
                    >
                      📸 Ambil Sampel Wajah Sekarang
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
