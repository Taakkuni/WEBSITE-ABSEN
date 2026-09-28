'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  UserCheck, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Sliders, 
  Zap, 
  Eye, 
  CameraOff,
  UserPlus,
  X,
  Lock,
  Unlock,
  Check,
  UserCheck2,
  Users
} from 'lucide-react';
import { playSuccessSound, playErrorSound, speakMessage } from '@/lib/sound';
import { euclideanDistance } from '@/lib/face';
import { ShiftType, AttendanceDecision } from '@/types';

type AttendanceMode = 'AUTO' | 'MASUK' | 'PULANG';

interface RecognitionState {
  step: 'IDLE' | 'SEARCHING' | 'DETECTED' | 'VERIFYING' | 'SUCCESS' | 'LOCKED' | 'ERROR';
  message: string;
}

interface HandledPersonSession {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  position: string;
  department: string;
  photo?: string | null;
  descriptor: number[];
  state: 'JUST_CHECKED_IN' | 'JUST_CHECKED_OUT' | 'WAITING_FOR_CHECKOUT' | 'COMPLETED' | 'UNREGISTERED';
  title: string;
  statusText: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue';
  message: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  shiftEndTime?: string;
  shift?: ShiftType;
  handledAt: number;
}

export default function FaceScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mode, setMode] = useState<AttendanceMode>('AUTO');
  const [recognitionState, setRecognitionState] = useState<RecognitionState>({
    step: 'SEARCHING',
    message: 'Mencari wajah...',
  });
  
  // Current active result card displayed on UI
  const [activeSession, setActiveSession] = useState<HandledPersonSession | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);
  const [isBypassShiftActive, setIsBypassShiftActive] = useState<boolean>(true);

  // Reference to current person in front of camera (avoids re-scanning the same person)
  const currentHandledPersonRef = useRef<HandledPersonSession | null>(null);
  const noFaceFrameCountRef = useRef<number>(0);

  // Latest detected descriptor & snapshot in memory (for 1-click enrollment)
  const [lastDescriptor, setLastDescriptor] = useState<number[] | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);

  // Quick Enrollment Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [enrollTab, setEnrollTab] = useState<'NEW' | 'EXISTING'>('NEW');
  const [enrollFormData, setEnrollFormData] = useState({
    name: '',
    employee_code: '',
    position: 'Software Engineer',
    department: 'Teknologi Informasi',
    default_shift: 'SHIFT_1' as ShiftType,
    selected_employee_id: '',
  });
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState<boolean>(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Registered employees list (for simulator & modal)
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedSimulatorEmp, setSelectedSimulatorEmp] = useState<string>('');

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success && data.data) {
        setEmployees(data.data);
        if (data.data.length > 0 && !selectedSimulatorEmp) {
          setSelectedSimulatorEmp(data.data[0].id);
        }
        if (data.data.length > 0 && !enrollFormData.selected_employee_id) {
          setEnrollFormData((prev) => ({ ...prev, selected_employee_id: data.data[0].id }));
        }
      }
    } catch (e) {
      console.error('Failed to load employees', e);
    }
  }, [selectedSimulatorEmp, enrollFormData.selected_employee_id]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load face-api models
  useEffect(() => {
    let isMounted = true;

    async function loadModels() {
      try {
        setRecognitionState({ step: 'SEARCHING', message: 'Memuat model AI Biometrik...' });
        const faceapi = await import('@vladmandic/face-api');

        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (isMounted) {
          setModelsLoaded(true);
          setRecognitionState({ step: 'SEARCHING', message: 'Mencari wajah...' });
        }
      } catch (err: any) {
        console.error('Error loading face-api models:', err);
        if (isMounted) {
          setModelsLoaded(true);
        }
      }
    }

    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setCameraError('Browser tidak mendukung akses kamera.');
      }
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      setCameraError('Kamera tidak dapat diakses. Gunakan Simulator Absensi di bawah.');
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [modelsLoaded, startCamera, stopCamera]);

  const captureSnapshot = (): string | undefined => {
    if (!videoRef.current) return undefined;
    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = videoRef.current.videoWidth || 320;
      snapCanvas.height = videoRef.current.videoHeight || 240;
      const ctx = snapCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
        return snapCanvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (e) {
      // ignore
    }
    return undefined;
  };

  /**
   * CONTINUOUS QUEUE & MULTI-USER DETECTION LOOP
   * 
   * Rule 1: When Person 1 completes attendance -> show "Absen Berhasil".
   *         If Person 1 remains in frame -> show "Anda sudah absen" WITHOUT looping or repeating sound/requests.
   * Rule 2: When Person 2 enters frame -> automatically detect that this is a DIFFERENT person,
   *         and instantly identify & process Person 2's attendance!
   */
  useEffect(() => {
    if (!cameraActive || !modelsLoaded || isEnrollModalOpen) {
      return;
    }

    let animationFrameId: number;
    let isDetecting = false;

    const detectLoop = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animationFrameId = requestAnimationFrame(detectLoop);
        return;
      }

      if (isDetecting || isProcessing || isEnrollModalOpen) {
        animationFrameId = requestAnimationFrame(detectLoop);
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
            // Reset empty frames counter
            noFaceFrameCountRef.current = 0;

            const currentDescriptor = Array.from(detection.descriptor);
            setLastDescriptor(currentDescriptor);
            const currentSnap = captureSnapshot();
            if (currentSnap) setLastSnapshot(currentSnap);

            // Draw bounding box on canvas
            if (canvasRef.current && videoRef.current) {
              const displaySize = {
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
              };
              faceapi.matchDimensions(canvasRef.current, displaySize);
              const resized = faceapi.resizeResults(detection, displaySize);
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                faceapi.draw.drawDetections(canvasRef.current, resized);
              }
            }

            // CHECK: IS THIS THE SAME PERSON WHO IS ALREADY HANDLED AND STILL STANDING IN FRONT OF THE CAMERA?
            if (currentHandledPersonRef.current) {
              const dist = euclideanDistance(
                currentDescriptor,
                currentHandledPersonRef.current.descriptor
              );

              if (dist < 0.42) {
                // IT IS THE EXACT SAME PERSON STILL IN FRONT OF CAMERA!
                // NO NETWORK CALL! NO SOUND SPAM! NO LOOP!
                // If they just checked in, keep display calm: "Anda sudah absen"
                if (currentHandledPersonRef.current.state === 'JUST_CHECKED_IN') {
                  setRecognitionState({
                    step: 'LOCKED',
                    message: `Anda sudah absen, ${currentHandledPersonRef.current.employeeName}. Silakan bergantian.`,
                  });
                  setActiveSession((prev) => prev ? {
                    ...prev,
                    title: 'Anda Sudah Absen',
                    message: 'Absensi Anda telah tersimpan hari ini. Silakan bergantian dengan karyawan berikutnya.',
                    statusText: 'Sudah Absen Hari Ini',
                    statusColor: 'yellow',
                  } : null);
                }
                return; // SKIP RE-TRIGGERING!
              } else {
                // DISTANCE >= 0.42 -> A DIFFERENT PERSON HAS ENTERED THE FRAME!
                console.log('Orang baru masuk frame! Memulai identifikasi orang berikutnya...');
                currentHandledPersonRef.current = null;
                setActiveSession(null);
                setRecognitionState({
                  step: 'DETECTED',
                  message: 'Wajah baru terdeteksi ✓ Memverifikasi...',
                });
              }
            }

            // NEW PERSON TO IDENTIFY: Process through Attendance Decision Engine
            setRecognitionState({
              step: 'VERIFYING',
              message: 'Memverifikasi identitas karyawan...',
            });
            await handleProcessNewPerson(currentDescriptor, currentSnap);

          } else {
            // NO FACE DETECTED in this frame
            noFaceFrameCountRef.current++;

            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }

            // If no face has been present for ~25 frames (approx 1 - 1.5 seconds)
            // Person 1 has walked away! Clear session so next person is ready.
            if (noFaceFrameCountRef.current > 25) {
              if (currentHandledPersonRef.current !== null) {
                currentHandledPersonRef.current = null;
                setActiveSession(null);
                setRecognitionState({ step: 'SEARCHING', message: 'Mencari wajah...' });
              }
            }
          }
        }
      } catch (err) {
        // detection cycle error ignore
      } finally {
        isDetecting = false;
        animationFrameId = requestAnimationFrame(detectLoop);
      }
    };

    animationFrameId = requestAnimationFrame(detectLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, modelsLoaded, isProcessing, isEnrollModalOpen, mode, speechEnabled]);

  /**
   * Process attendance for a newly detected person entering the frame
   */
  const handleProcessNewPerson = async (descriptor: number[], snapshot?: string) => {
    setIsProcessing(true);

    try {
      // Step 1: Face Recognition (WHO IS THIS?)
      const recRes = await fetch('/api/face/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          descriptor, 
          snapshot,
          bypass_shift_lock: isBypassShiftActive 
        }),
      });

      const recData = await recRes.json();

      if (!recData.success || !recData.recognized) {
        // Unrecognized face
        playErrorSound();
        setRecognitionState({
          step: 'ERROR',
          message: 'Wajah tidak terdaftar di sistem',
        });
        const unregSession: HandledPersonSession = {
          employeeId: '',
          employeeCode: '',
          employeeName: 'Wajah Belum Terdaftar',
          position: '',
          department: '',
          descriptor,
          state: 'UNREGISTERED',
          title: 'Wajah Anda Belum Terdaftar',
          statusText: 'Belum Terdaftar',
          statusColor: 'red',
          message: 'Wajah Anda belum terdaftar dalam sistem. Daftarkan profil Anda sekarang dengan tombol di bawah.',
          handledAt: Date.now(),
        };
        currentHandledPersonRef.current = unregSession;
        setActiveSession(unregSession);
        return;
      }

      const emp = recData.employee;
      const decision: AttendanceDecision = recData.decision;

      // Step 2: Attendance Decision Engine Action
      
      // CASE 1: Belum Ada Absen Hari Ini -> CHECK IN
      if (decision.state === 'NO_ATTENDANCE') {
        if (mode === 'PULANG') {
          playErrorSound();
          if (speechEnabled) speakMessage('Anda belum melakukan absensi masuk.');
          const notInSession: HandledPersonSession = {
            employeeId: emp.id,
            employeeCode: emp.employee_code,
            employeeName: emp.name,
            position: emp.position,
            department: emp.department,
            photo: emp.photo,
            descriptor,
            state: 'WAITING_FOR_CHECKOUT',
            title: 'Belum Absen Masuk',
            statusText: 'Belum Check-In',
            statusColor: 'red',
            message: 'Anda belum melakukan absensi masuk hari ini. Silakan ubah mode ke Masuk atau Auto.',
            handledAt: Date.now(),
          };
          currentHandledPersonRef.current = notInSession;
          setActiveSession(notInSession);
        } else {
          // Perform Check-In
          await executeCheckInForPerson(emp, descriptor, snapshot);
        }
        return;
      }

      // CASE 2: Sudah Absen Masuk, Belum Waktunya Pulang -> TAMPILKAN "ANDA SUDAH ABSEN"
      if (decision.state === 'WAITING_FOR_CHECKOUT') {
        playErrorSound();
        if (speechEnabled) {
          speakMessage(`Anda sudah absen masuk, ${emp.name}. Jam pulang pukul ${decision.shiftEndTime}.`);
        }
        setRecognitionState({
          step: 'LOCKED',
          message: `Anda sudah absen masuk • Jam Pulang: ${decision.shiftEndTime} WIB`,
        });
        const waitingSession: HandledPersonSession = {
          employeeId: emp.id,
          employeeCode: emp.employee_code,
          employeeName: emp.name,
          position: emp.position,
          department: emp.department,
          photo: emp.photo,
          descriptor,
          state: 'WAITING_FOR_CHECKOUT',
          title: 'Anda Sudah Absen',
          statusText: 'Menunggu Jam Pulang',
          statusColor: 'yellow',
          checkInTime: decision.checkInTime,
          shiftEndTime: decision.shiftEndTime,
          shift: decision.shift,
          message: `Anda sudah melakukan absensi masuk pada ${decision.checkInTime}. Jam pulang shift adalah ${decision.shiftEndTime} WIB (belum waktunya absensi pulang).`,
          handledAt: Date.now(),
        };
        currentHandledPersonRef.current = waitingSession;
        setActiveSession(waitingSession);
        return;
      }

      // CASE 3: Jam Pulang Tiba -> CHECK OUT
      if (decision.state === 'CHECKOUT_ALLOWED') {
        if (mode === 'MASUK') {
          playErrorSound();
          if (speechEnabled) speakMessage('Anda sudah melakukan absensi masuk hari ini.');
          const alreadySession: HandledPersonSession = {
            employeeId: emp.id,
            employeeCode: emp.employee_code,
            employeeName: emp.name,
            position: emp.position,
            department: emp.department,
            photo: emp.photo,
            descriptor,
            state: 'WAITING_FOR_CHECKOUT',
            title: 'Anda Sudah Absen Masuk',
            statusText: 'Sudah Check-In',
            statusColor: 'yellow',
            checkInTime: decision.checkInTime,
            shiftEndTime: decision.shiftEndTime,
            shift: decision.shift,
            message: `Anda sudah melakukan absensi masuk pada ${decision.checkInTime}. Untuk pulang, ubah ke mode Pulang atau Auto.`,
            handledAt: Date.now(),
          };
          currentHandledPersonRef.current = alreadySession;
          setActiveSession(alreadySession);
        } else {
          // Perform Check-Out
          await executeCheckOutForPerson(emp, descriptor, snapshot);
        }
        return;
      }

      // CASE 4: Selesai (Sudah Check-In & Check-Out) -> COMPLETED
      if (decision.state === 'COMPLETED') {
        playSuccessSound();
        if (speechEnabled) {
          speakMessage('Absensi hari ini sudah lengkap. Terima kasih.');
        }
        setRecognitionState({
          step: 'LOCKED',
          message: 'Absensi hari ini sudah lengkap ✓',
        });
        const completedSession: HandledPersonSession = {
          employeeId: emp.id,
          employeeCode: emp.employee_code,
          employeeName: emp.name,
          position: emp.position,
          department: emp.department,
          photo: emp.photo,
          descriptor,
          state: 'COMPLETED',
          title: 'Absensi Hari Ini Lengkap',
          statusText: 'Absen Lengkap',
          statusColor: 'green',
          checkInTime: decision.checkInTime,
          checkOutTime: decision.checkOutTime,
          shift: decision.shift,
          message: `Absensi hari ini sudah lengkap (Masuk: ${decision.checkInTime}, Pulang: ${decision.checkOutTime}). Terima kasih!`,
          handledAt: Date.now(),
        };
        currentHandledPersonRef.current = completedSession;
        setActiveSession(completedSession);
        return;
      }

    } catch (err: any) {
      console.error('Error handling person:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform Check-In for Person
  const executeCheckInForPerson = async (emp: any, descriptor: number[], snapshot?: string) => {
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: emp.id, descriptor, snapshot }),
      });

      const data = await res.json();

      if (data.success) {
        playSuccessSound();
        if (speechEnabled) {
          speakMessage(`Absen berhasil. Selamat bekerja, ${emp.name}`);
        }

        // Trigger instant update of today's attendance feed across the app!
        window.dispatchEvent(new CustomEvent('attendance-updated'));

        const isLate = data.status === 'TERLAMBAT';
        const shiftEndTime = data.shift === 'SHIFT_1' ? '16:00' : '20:00';

        const successSession: HandledPersonSession = {
          employeeId: emp.id,
          employeeCode: emp.employee_code,
          employeeName: emp.name,
          position: emp.position,
          department: emp.department,
          photo: emp.photo,
          descriptor,
          state: 'JUST_CHECKED_IN',
          title: '✓ Absen Berhasil',
          statusText: isLate ? 'Hadir — Terlambat' : 'Hadir — Tepat Waktu',
          statusColor: isLate ? 'red' : 'green',
          checkInTime: data.checkInTimeFormatted,
          shiftEndTime,
          shift: data.shift,
          message: `${data.statusDescription || 'Absen Masuk Berhasil!'} Data telah masuk ke riwayat hari ini.`,
          handledAt: Date.now(),
        };

        currentHandledPersonRef.current = successSession;
        setActiveSession(successSession);
        setRecognitionState({
          step: 'SUCCESS',
          message: `✓ Absen Berhasil: ${emp.name} (${data.checkInTimeFormatted})`,
        });
      }
    } catch (e) {
      console.error('Failed to execute check-in:', e);
    }
  };

  // Perform Check-Out for Person
  const executeCheckOutForPerson = async (emp: any, descriptor: number[], snapshot?: string) => {
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employee_id: emp.id, 
          descriptor, 
          snapshot,
          bypass_shift_lock: isBypassShiftActive 
        }),
      });

      const data = await res.json();

      if (data.success) {
        playSuccessSound();
        if (speechEnabled) {
          speakMessage(`Absensi pulang berhasil. Hati-hati di jalan, ${emp.name}`);
        }

        // Trigger instant update of today's attendance feed
        window.dispatchEvent(new CustomEvent('attendance-updated'));

        const checkOutSession: HandledPersonSession = {
          employeeId: emp.id,
          employeeCode: emp.employee_code,
          employeeName: emp.name,
          position: emp.position,
          department: emp.department,
          photo: emp.photo,
          descriptor,
          state: 'JUST_CHECKED_OUT',
          title: '✓ Absen Pulang Berhasil',
          statusText: 'Hadir — Absen Lengkap',
          statusColor: 'green',
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
          shift: data.attendance?.shift,
          message: `Absensi pulang berhasil dicatat pada ${data.checkOutTime}. Terima kasih atas kerja keras Anda hari ini!`,
          handledAt: Date.now(),
        };

        currentHandledPersonRef.current = checkOutSession;
        setActiveSession(checkOutSession);
        setRecognitionState({
          step: 'SUCCESS',
          message: `✓ Absen Pulang Berhasil: ${emp.name}`,
        });
      }
    } catch (e) {
      console.error('Failed to execute check-out:', e);
    }
  };

  // Reset employee attendance for today (allows instant re-testing)
  const handleResetEmployeeAttendance = async (empId: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch('/api/attendance/reset-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: empId }),
      });
      const data = await res.json();
      if (data.success) {
        playSuccessSound();
        currentHandledPersonRef.current = null;
        setActiveSession(null);
        setRecognitionState({
          step: 'SEARCHING',
          message: 'Data absensi hari ini di-reset ✓ Siap uji coba ulang.',
        });
        window.dispatchEvent(new CustomEvent('attendance-updated'));
      }
    } catch (err) {
      console.error('Failed to reset attendance:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual button to clear current person session
  const handleClearCurrentSession = () => {
    currentHandledPersonRef.current = null;
    setActiveSession(null);
    setRecognitionState({ step: 'SEARCHING', message: 'Mencari wajah...' });
  };

  // Open Quick Face Enrollment Modal
  const openQuickEnrollModal = () => {
    setEnrollError(null);
    setEnrollSuccessMessage(null);
    setEnrollFormData((prev) => ({
      ...prev,
      employee_code: `EMP${String(employees.length + 1).padStart(3, '0')}`,
    }));
    setIsEnrollModalOpen(true);
  };

  const handleSnapInModal = async () => {
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
        alert('Wajah tidak terdeteksi secara jelas di kamera.');
        return;
      }

      setLastDescriptor(Array.from(detection.descriptor));
      const snap = captureSnapshot();
      if (snap) setLastSnapshot(snap);
      playSuccessSound();
    } catch (err: any) {
      alert('Gagal mengambil sampel wajah: ' + err.message);
    }
  };

  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastDescriptor || lastDescriptor.length !== 128) {
      setEnrollError('Wajah Anda belum terambil oleh kamera.');
      return;
    }

    try {
      setIsSubmittingEnroll(true);
      setEnrollError(null);

      const payload = {
        mode: enrollTab === 'NEW' ? 'NEW_EMPLOYEE' : 'EXISTING_EMPLOYEE',
        employee_id: enrollFormData.selected_employee_id,
        employee_code: enrollFormData.employee_code,
        name: enrollFormData.name,
        position: enrollFormData.position,
        department: enrollFormData.department,
        default_shift: enrollFormData.default_shift,
        face_embedding: lastDescriptor,
        photo: lastSnapshot,
      };

      const res = await fetch('/api/employees/register-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        playSuccessSound();
        const savedEmpName = data.employee?.name || enrollFormData.name;
        if (speechEnabled) {
          speakMessage(`Pendaftaran wajah berhasil! Selamat datang, ${savedEmpName}.`);
        }

        setEnrollSuccessMessage(data.message);
        await fetchEmployees();

        setTimeout(() => {
          setIsEnrollModalOpen(false);
          handleClearCurrentSession();
        }, 1500);
      } else {
        playErrorSound();
        setEnrollError(data.message || 'Gagal mendaftarkan data wajah.');
      }
    } catch (err: any) {
      playErrorSound();
      setEnrollError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  // Simulator Trigger for testing without physical face
  const handleSimulateAttendance = async () => {
    if (!selectedSimulatorEmp) return;
    const emp = employees.find((e) => e.id === selectedSimulatorEmp);
    if (!emp) return;

    setIsProcessing(true);
    try {
      const todayRes = await fetch('/api/attendance/today');
      const todayData = await todayRes.json();
      const existing = todayData.todayAttendances?.find((a: any) => a.employee_id === emp.id);

      if (!existing) {
        await executeCheckInForPerson(emp, new Array(128).fill(0.1));
      } else if (!existing.check_out) {
        await executeCheckOutForPerson(emp, new Array(128).fill(0.1));
      } else {
        const completedSession: HandledPersonSession = {
          employeeId: emp.id,
          employeeCode: emp.employee_code,
          employeeName: emp.name,
          position: emp.position,
          department: emp.department,
          photo: emp.photo,
          descriptor: new Array(128).fill(0.1),
          state: 'COMPLETED',
          title: 'Anda Sudah Absen Lengkap',
          statusText: 'Absen Lengkap',
          statusColor: 'green',
          checkInTime: `${existing.check_in.substring(0, 5)} WIB`,
          checkOutTime: `${existing.check_out.substring(0, 5)} WIB`,
          shift: existing.shift,
          message: `Absensi hari ini sudah lengkap (Masuk: ${existing.check_in.substring(0, 5)} WIB, Pulang: ${existing.check_out.substring(0, 5)} WIB).`,
          handledAt: Date.now(),
        };
        currentHandledPersonRef.current = completedSession;
        setActiveSession(completedSession);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-6">
      
      {/* Top Controls: Mode Switcher, Queue Info & Audio Toggle */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-md">
        
        {/* Mode Selector */}
        <div className="flex items-center space-x-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('AUTO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'AUTO'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Auto Kios (Antrian Otomatis)
          </button>
          <button
            type="button"
            onClick={() => setMode('MASUK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'MASUK'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🟢 Masuk Saja
          </button>
          <button
            type="button"
            onClick={() => setMode('PULANG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'PULANG'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔵 Pulang Saja
          </button>
        </div>

        {/* Testing Mode Toggle & Action Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => setIsBypassShiftActive(!isBypassShiftActive)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isBypassShiftActive
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Bypass batas jam pulang 16:00 agar Anda bebas mencoba Masuk & Pulang kapan saja"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isBypassShiftActive ? '🧪 Mode Testing (Bypass 16:00)' : '🔒 Normal Shift (16:00)'}</span>
          </button>
          <button
            type="button"
            onClick={openQuickEnrollModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all hover:scale-105"
            title="Daftarkan wajah Anda sekarang"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Wajah</span>
          </button>

          <button
            type="button"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border transition-all ${
              speechEnabled
                ? 'bg-slate-800 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Aktifkan/nonaktifkan suara"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suara</span>
          </button>

          <button
            type="button"
            onClick={cameraActive ? stopCamera : startCamera}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border transition-all ${
              cameraActive
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{cameraActive ? 'Kamera On' : 'Nyalakan'}</span>
          </button>
        </div>
      </div>

      {/* Main Webcam / HUD Scanner Frame */}
      <div className="relative w-full max-w-2xl aspect-[4/3] sm:aspect-[16/11] bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl shadow-cyan-950/20">
        
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
            cameraActive ? 'opacity-100' : 'opacity-20'
          }`}
        />

        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]"
        />

        {/* Scanner Laser */}
        {cameraActive && (
          <div className="scanner-laser" />
        )}

        {/* HUD Corners */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Center Target Face Ellipse */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-56 h-72 sm:w-64 sm:h-80 border-2 rounded-[50%] transition-all duration-300 ${
            recognitionState.step === 'SUCCESS'
              ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)]'
              : recognitionState.step === 'LOCKED'
              ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)]'
              : recognitionState.step === 'ERROR'
              ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)]'
              : recognitionState.step === 'DETECTED' || recognitionState.step === 'VERIFYING'
              ? 'border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.5)] scale-105'
              : 'border-cyan-500/30 border-dashed'
          }`}>
            <div className="w-full h-full flex flex-col justify-between items-center py-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Kios Presensi Cerdas
              </span>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono text-cyan-400/90">AUTO-QUEUE ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-left HUD badge */}
        <div className="absolute top-5 left-14 z-30 flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs">
          <span className={`w-2 h-2 rounded-full ${
            cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
          }`} />
          <span className="font-mono text-slate-300">
            {cameraActive ? 'CONTINUOUS RECOGNITION' : 'KAMERA OFFLINE'}
          </span>
        </div>

        {/* Status Indicator Bar at Bottom of Camera */}
        <div className="absolute bottom-5 inset-x-8 z-30 flex justify-center">
          <div className={`px-5 py-2.5 rounded-2xl backdrop-blur-md border text-sm font-semibold flex items-center space-x-2.5 shadow-xl transition-all ${
            recognitionState.step === 'SUCCESS'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-emerald-900/30'
              : recognitionState.step === 'LOCKED'
              ? 'bg-amber-950/90 border-amber-500/60 text-amber-300 shadow-amber-900/30'
              : recognitionState.step === 'ERROR'
              ? 'bg-rose-950/90 border-rose-500/60 text-rose-300 shadow-rose-900/30'
              : recognitionState.step === 'VERIFYING'
              ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-300 shadow-cyan-900/30'
              : 'bg-slate-900/85 border-slate-700/80 text-slate-300'
          }`}>
            {recognitionState.step === 'SEARCHING' && (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            )}
            {recognitionState.step === 'DETECTED' && (
              <Eye className="w-4 h-4 text-cyan-400" />
            )}
            {recognitionState.step === 'VERIFYING' && (
              <ShieldCheck className="w-4 h-4 animate-pulse text-cyan-400" />
            )}
            {recognitionState.step === 'SUCCESS' && (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
            {recognitionState.step === 'LOCKED' && (
              <UserCheck2 className="w-4 h-4 text-amber-400" />
            )}
            {recognitionState.step === 'ERROR' && (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{recognitionState.message}</span>
          </div>
        </div>

        {/* Camera Inactive Overlay */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center z-20">
            <CameraOff className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-slate-200 mb-1">
              Kamera Belum Aktif
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Izinkan akses webcam pada browser Anda atau gunakan Simulator Presensi di bawah.
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Camera className="w-4 h-4" />
              <span>Nyalakan Kamera Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* CONTINUOUS QUEUE ATTENDANCE RESULT CARD */}
      {activeSession && (
        <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className={`p-6 rounded-3xl border shadow-2xl relative overflow-hidden transition-all ${
            activeSession.statusColor === 'green'
              ? 'bg-emerald-950/80 border-emerald-500/50 shadow-emerald-950/40'
              : activeSession.statusColor === 'yellow'
              ? 'bg-amber-950/80 border-amber-500/50 shadow-amber-950/40'
              : activeSession.statusColor === 'red'
              ? 'bg-rose-950/80 border-rose-500/50 shadow-rose-950/40'
              : 'bg-slate-900/90 border-slate-700 shadow-slate-950/40'
          }`}>
            
            {/* Card Header & Clear Action */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                {activeSession.statusColor === 'green' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : activeSession.statusColor === 'yellow' ? (
                  <UserCheck2 className="w-6 h-6 text-amber-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                )}
                <span className="font-bold text-lg text-white">
                  {activeSession.title}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {activeSession.employeeId && (
                  <button
                    type="button"
                    onClick={() => handleResetEmployeeAttendance(activeSession.employeeId)}
                    className="text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all font-medium flex items-center space-x-1"
                    title="Hapus rekaman absensi hari ini untuk karyawan ini agar dapat diuji ulang dari awal"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Absen Saya (Uji Ulang)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearCurrentSession}
                  className="text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors font-medium flex items-center space-x-1"
                  title="Ganti ke karyawan berikutnya"
                >
                  <span>Orang Berikutnya</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Employee Details (if registered) */}
            {activeSession.state !== 'UNREGISTERED' ? (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-800 shadow-lg">
                    {activeSession.photo ? (
                      <img
                        src={activeSession.photo}
                        alt={activeSession.employeeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xl">
                        {activeSession.employeeName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 p-1 rounded-full ${
                    activeSession.statusColor === 'green' ? 'bg-emerald-500' : 'bg-amber-500'
                  } text-slate-950`}>
                    <Check className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="text-xl font-bold text-white tracking-tight">
                    {activeSession.employeeName}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                    <span className="bg-white/10 text-white font-mono px-2 py-0.5 rounded">
                      NIP: {activeSession.employeeCode}
                    </span>
                    <span className="bg-cyan-500/20 text-cyan-300 font-medium px-2 py-0.5 rounded">
                      {activeSession.position}
                    </span>
                    <span className="text-slate-300">
                      • {activeSession.department}
                    </span>
                  </div>

                  {/* Status Grid */}
                  <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-left">
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <div className="text-[11px] text-slate-400">Status Kehadiran</div>
                      <div className={`text-sm font-bold mt-0.5 ${
                        activeSession.statusColor === 'green'
                          ? 'text-emerald-400'
                          : activeSession.statusColor === 'red'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}>
                        {activeSession.statusText}
                      </div>
                    </div>

                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <div className="text-[11px] text-slate-400">
                        {activeSession.checkOutTime ? 'Jam Pulang' : 'Jam Masuk'}
                      </div>
                      <div className="text-sm font-mono font-bold text-white mt-0.5">
                        {activeSession.checkOutTime || activeSession.checkInTime || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Queue helper instruction */}
                  <div className="mt-3 text-xs text-slate-300 bg-black/20 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>"{activeSession.message}"</span>
                    <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline ml-2 flex-shrink-0">
                      [Karyawan berikutnya cukup masuk ke frame]
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* UNREGISTERED FACE */
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                  <UserPlus className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Wajah Anda Belum Terdaftar di Sistem</div>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                    Kamera mendeteksi wajah Anda, namun belum ada profil karyawan yang terdaftar untuk biometrik ini.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={openQuickEnrollModal}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Daftarkan Wajah Saya Sekarang (1-Klik)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCurrentSession}
                    className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold"
                  >
                    Orang Berikutnya
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* QUICK FACE ENROLLMENT MODAL */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Daftarkan Wajah Biometrik Anda</h3>
                  <p className="text-[11px] text-slate-400">Buat profil karyawan baru atau tautkan ke karyawan terdaftar.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enrollSuccessMessage && (
              <div className="m-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-in zoom-in-95">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{enrollSuccessMessage}</span>
              </div>
            )}

            {enrollError && (
              <div className="m-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-in zoom-in-95">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{enrollError}</span>
              </div>
            )}

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center space-x-3.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border-2 border-cyan-500/40 flex-shrink-0">
                  {lastSnapshot ? (
                    <img src={lastSnapshot} alt="Snapshot Wajah" className="w-full h-full object-cover transform scale-x-[-1]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Sampel Wajah Siap Digunakan</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Vektor embedding biometrik 128-dimensi berhasil diekstrak.
                  </div>
                  <button
                    type="button"
                    onClick={handleSnapInModal}
                    className="mt-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    Ambil Ulang Foto Wajah
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEnrollTab('NEW')}
                  className={`py-2 text-center rounded-lg font-semibold transition-all ${
                    enrollTab === 'NEW'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1. Karyawan Baru
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollTab('EXISTING')}
                  className={`py-2 text-center rounded-lg font-semibold transition-all ${
                    enrollTab === 'EXISTING'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2. Tautkan Profil Lama
                </button>
              </div>

              <form onSubmit={handleSubmitEnrollment} className="space-y-3.5">
                {enrollTab === 'NEW' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-medium">Nama Lengkap Anda *</label>
                        <input
                          type="text"
                          required
                          value={enrollFormData.name}
                          onChange={(e) => setEnrollFormData({ ...enrollFormData, name: e.target.value })}
                          placeholder="Masukkan nama Anda"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 font-medium">NIP / ID Karyawan</label>
                        <input
                          type="text"
                          value={enrollFormData.employee_code}
                          onChange={(e) => setEnrollFormData({ ...enrollFormData, employee_code: e.target.value })}
                          placeholder="EMP007"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-medium">Jabatan</label>
                        <input
                          type="text"
                          value={enrollFormData.position}
                          onChange={(e) => setEnrollFormData({ ...enrollFormData, position: e.target.value })}
                          placeholder="Staff / Engineer"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 font-medium">Departemen</label>
                        <input
                          type="text"
                          value={enrollFormData.department}
                          onChange={(e) => setEnrollFormData({ ...enrollFormData, department: e.target.value })}
                          placeholder="IT / Operasional"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-medium">Pilihan Shift Kerja</label>
                      <select
                        value={enrollFormData.default_shift}
                        onChange={(e) => setEnrollFormData({ ...enrollFormData, default_shift: e.target.value as ShiftType })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="SHIFT_1">Shift 1 (08:00 - 16:00 WIB)</option>
                        <option value="SHIFT_2">Shift 2 (12:00 - 20:00 WIB)</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-slate-300 font-medium">
                      Pilih Profil Karyawan Yang Sudah Ada:
                    </label>
                    <select
                      value={enrollFormData.selected_employee_id}
                      onChange={(e) => setEnrollFormData({ ...enrollFormData, selected_employee_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employee_code} - {emp.name} ({emp.position} • {emp.department})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      Wajah Anda akan ditautkan ke profil karyawan yang dipilih di atas sehingga sistem langsung mengenali Anda sebagai karyawan tersebut.
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEnroll}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmittingEnroll ? 'Menyimpan...' : '✓ Simpan & Daftarkan Wajah'}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* SIMULATOR TESTING SANDBOX */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 mt-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Panel Pengujian Cepat (Simulator Antrian Karyawan)
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            Uji coba pergantian orang 1 & orang 2 secara berurutan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs text-slate-400 font-medium">
              Pilih Profil Karyawan Pengujian:
            </label>
            <select
              value={selectedSimulatorEmp}
              onChange={(e) => setSelectedSimulatorEmp(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.name} ({emp.position} • {emp.department})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                const emp = employees.find((e) => e.id === selectedSimulatorEmp);
                if (emp) executeCheckInForPerson(emp, new Array(128).fill(0.1));
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-3 py-2 text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-1"
            >
              <span>🟢 Masuk</span>
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                const emp = employees.find((e) => e.id === selectedSimulatorEmp);
                if (emp) executeCheckOutForPerson(emp, new Array(128).fill(0.1));
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-3 py-2 text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-1"
            >
              <span>🔵 Pulang</span>
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                if (selectedSimulatorEmp) handleResetEmployeeAttendance(selectedSimulatorEmp);
              }}
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-semibold rounded-xl px-3 py-2 text-xs disabled:opacity-50 transition-all flex items-center justify-center space-x-1"
              title="Reset data absensi hari ini untuk karyawan terpilih agar bisa diuji ulang"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-slate-400 flex flex-wrap gap-4 pt-2 border-t border-slate-800/60">
          <span>• Shift 1: <strong className="text-slate-200">08:00 - 16:00 WIB</strong></span>
          <span>• Shift 2: <strong className="text-slate-200">12:00 - 20:00 WIB</strong></span>
          <span>
            • Ubah simulasi jam di:{' '}
            <a href="/admin/settings" className="text-cyan-400 underline hover:text-cyan-300">
              Pengaturan Shift
            </a>
          </span>
        </div>
      </div>

    </div>
  );
}
