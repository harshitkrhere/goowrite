'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  Users,
  Check,
  X,
  Clock,
  Loader2,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';
import { useCurrentInstitute, useBatches, Batch } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface StudentInBatch {
  id: string;
  full_name: string;
  admission_number: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export default function AttendancePage() {
  const { institute, loading: instituteLoading } = useCurrentInstitute();
  const { batches, loading: batchesLoading } = useBatches(institute?.id);
  
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [students, setStudents] = useState<StudentInBatch[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isLoading = instituteLoading || batchesLoading;

  // Fetch students when batch is selected
  useEffect(() => {
    if (!selectedBatch) {
      setStudents([]);
      return;
    }
    const batch = selectedBatch;

    async function fetchStudentsAndAttendance() {
      setLoadingStudents(true);
      const supabase = createClient();

      // Fetch students in this batch
      const { data: studentBatches } = await supabase
        .from('batch_students')
        .select(`
          student_id,
          students(id, full_name, admission_number)
        `)
        .eq('batch_id', batch.id)
        .is('left_at', null);

      const studentList = (studentBatches || [])
        .filter(sb => sb.students)
        .map(sb => sb.students as unknown as StudentInBatch);
      
      setStudents(studentList);

      // Check for existing attendance session
      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('batch_id', batch.id)
        .eq('attendance_date', selectedDate)
        .single();

      if (session) {
        setExistingSessionId(session.id);

        // Fetch existing attendance records
        const { data: records } = await supabase
          .from('attendance_records')
          .select('student_id, status, remarks')
          .eq('attendance_session_id', session.id);

        const attendanceMap: Record<string, AttendanceRecord> = {};
        (records || []).forEach(r => {
          attendanceMap[r.student_id] = {
            student_id: r.student_id,
            status: r.status as 'present' | 'absent' | 'late',
            remarks: r.remarks || undefined,
          };
        });
        setAttendance(attendanceMap);
      } else {
        setExistingSessionId(null);
        // Initialize all as present
        const attendanceMap: Record<string, AttendanceRecord> = {};
        studentList.forEach(s => {
          attendanceMap[s.id] = { student_id: s.id, status: 'present' };
        });
        setAttendance(attendanceMap);
      }

      setLoadingStudents(false);
    }

    fetchStudentsAndAttendance();
  }, [selectedBatch, selectedDate]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], student_id: studentId, status }
    }));
  };

  const handleSave = async () => {
    if (!selectedBatch || !institute) return;
    
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      let sessionId = existingSessionId;

      // Create session if doesn't exist
      if (!sessionId) {
        const { data: newSession, error: sessionError } = await supabase
          .from('attendance_sessions')
          .insert({
            institute_id: institute.id,
            batch_id: selectedBatch.id,
            attendance_date: selectedDate,
            taken_by: user?.id,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = newSession.id;
        setExistingSessionId(sessionId);
      }

      // Upsert attendance records
      const records = Object.values(attendance).map(a => ({
        attendance_session_id: sessionId,
        student_id: a.student_id,
        status: a.status,
        remarks: a.remarks || null,
      }));

      const { error: recordsError } = await supabase
        .from('attendance_records')
        .upsert(records, { 
          onConflict: 'attendance_session_id,student_id',
          ignoreDuplicates: false 
        });

      if (recordsError) throw recordsError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
    }

    setSaving(false);
  };

  const markAllAs = (status: 'present' | 'absent' | 'late') => {
    const newAttendance: Record<string, AttendanceRecord> = {};
    students.forEach(s => {
      newAttendance[s.id] = { student_id: s.id, status };
    });
    setAttendance(newAttendance);
  };

  const presentCount = Object.values(attendance).filter(a => a.status === 'present').length;
  const absentCount = Object.values(attendance).filter(a => a.status === 'absent').length;
  const lateCount = Object.values(attendance).filter(a => a.status === 'late').length;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Attendance</h1>
          <p className={styles.pageSubtitle}>Mark and track student attendance</p>
        </div>
      </div>

      {/* Controls */}
      <motion.div 
        className={styles.controls}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Batch Selector */}
        <div className={styles.controlGroup}>
          <label>Batch</label>
          <select 
            value={selectedBatch?.id || ''} 
            onChange={(e) => {
              const batch = batches.find(b => b.id === e.target.value);
              setSelectedBatch(batch || null);
            }}
            className={styles.select}
          >
            <option value="">Select a batch</option>
            {batches.filter(b => b.is_active).map(batch => (
              <option key={batch.id} value={batch.id}>
                {batch.name} {batch.course?.name ? `(${batch.course.name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Picker */}
        <div className={styles.controlGroup}>
          <label>Date</label>
          <div className={styles.dateWrapper}>
            <button 
              className={styles.dateBtn}
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.dateInput}
            />
            <button 
              className={styles.dateBtn}
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      {!selectedBatch ? (
        <GlassCard variant="elevated" padding="lg" className={styles.emptyState}>
          <Calendar size={48} />
          <h3>Select a batch to mark attendance</h3>
          <p>Choose a batch from the dropdown above to begin</p>
        </GlassCard>
      ) : loadingStudents ? (
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={32} />
          <p>Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <GlassCard variant="elevated" padding="lg" className={styles.emptyState}>
          <Users size={48} />
          <h3>No students in this batch</h3>
          <p>Add students to this batch to mark attendance</p>
        </GlassCard>
      ) : (
        <>
          {/* Summary Bar */}
          <motion.div 
            className={styles.summaryBar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total</span>
              <span className={styles.summaryValue}>{students.length}</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.present}`}>
              <span className={styles.summaryLabel}>Present</span>
              <span className={styles.summaryValue}>{presentCount}</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.absent}`}>
              <span className={styles.summaryLabel}>Absent</span>
              <span className={styles.summaryValue}>{absentCount}</span>
            </div>
            <div className={`${styles.summaryItem} ${styles.late}`}>
              <span className={styles.summaryLabel}>Late</span>
              <span className={styles.summaryValue}>{lateCount}</span>
            </div>

            <div className={styles.quickActions}>
              <button onClick={() => markAllAs('present')} className={styles.quickBtn}>
                All Present
              </button>
              <button onClick={() => markAllAs('absent')} className={styles.quickBtn}>
                All Absent
              </button>
            </div>
          </motion.div>

          {/* Attendance List */}
          <GlassCard variant="elevated" padding="none">
            <ul className={styles.studentList}>
              {students.map((student, index) => (
                <motion.li
                  key={student.id}
                  className={styles.studentItem}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <div className={styles.studentInfo}>
                    <span className={styles.studentName}>
                      {student.full_name}
                    </span>
                    <span className={styles.studentId}>{student.admission_number}</span>
                  </div>

                  <div className={styles.statusButtons}>
                    <button
                      className={`${styles.statusBtn} ${styles.presentBtn} ${attendance[student.id]?.status === 'present' ? styles.active : ''}`}
                      onClick={() => handleStatusChange(student.id, 'present')}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className={`${styles.statusBtn} ${styles.lateBtn} ${attendance[student.id]?.status === 'late' ? styles.active : ''}`}
                      onClick={() => handleStatusChange(student.id, 'late')}
                    >
                      <Clock size={16} />
                    </button>
                    <button
                      className={`${styles.statusBtn} ${styles.absentBtn} ${attendance[student.id]?.status === 'absent' ? styles.active : ''}`}
                      onClick={() => handleStatusChange(student.id, 'absent')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </GlassCard>

          {/* Save Button */}
          <motion.div 
            className={styles.saveBar}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {saveSuccess && (
              <span className={styles.successMsg}>
                <Check size={16} /> Attendance saved!
              </span>
            )}
            <Button 
              variant="primary" 
              size="lg"
              leftIcon={saving ? undefined : <Save size={18} />}
              isLoading={saving}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : existingSessionId ? 'Update Attendance' : 'Save Attendance'}
            </Button>
          </motion.div>
        </>
      )}
    </div>
  );
}
