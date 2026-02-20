'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Users,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Plus,
  User,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useInstitute } from '@/lib/context/InstituteContext';
import { useBatchStudents, Batch, Student } from '@/lib/hooks';
import { AddStudentModal } from '@/components/modals';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  
  const { institute, loading: instituteLoading } = useInstitute();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [batchLoading, setBatchLoading] = useState(true);
  const { students, loading: studentsLoading } = useBatchStudents(batchId);
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Fetch batch details
  useEffect(() => {
    async function fetchBatch() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('batches')
        .select(`
          *,
          course:courses(id, name)
        `)
        .eq('id', batchId)
        .single();

      if (!error && data) {
        setBatch(data as Batch);
      }
      setBatchLoading(false);
    }

    if (batchId) {
      fetchBatch();
    }
  }, [batchId]);

  const isLoading = instituteLoading || batchLoading || studentsLoading;

  const handleAddStudentSuccess = () => {
    setShowAddStudent(false);
    window.location.reload();
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the batch?')) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from('batch_students')
      .update({ left_at: new Date().toISOString() })
      .eq('batch_id', batchId)
      .eq('student_id', studentId)
      .is('left_at', null);

    if (!error) {
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading batch...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className={styles.errorContainer}>
        <p>Batch not found</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard/batches')}>
          Back to Batches
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <button className={styles.backBtn} onClick={() => router.push('/dashboard/batches')}>
        <ArrowLeft size={18} />
        <span>Back to Batches</span>
      </button>

      {/* Batch Header */}
      <div className={styles.batchHeader}>
        <div>
          <h1 className={styles.batchName}>{batch.name}</h1>
          <div className={styles.batchMeta}>
            {batch.course && (
              <span className={styles.metaItem}>
                <GraduationCap size={16} />
                {(batch.course as any).name}
              </span>
            )}
            <span className={styles.metaItem}>
              <Users size={16} />
              {students.length} students
            </span>
            {batch.schedule && (
              <span className={styles.metaItem}>
                <Clock size={16} />
                {batch.schedule}
              </span>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={`${styles.statusBadge} ${batch.is_active ? styles.active : styles.inactive}`}>
            {batch.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Students Section */}
      <Card padding="none" className={styles.studentsCard}>
        <div className={styles.studentsHeader}>
          <h2>Students</h2>
          <Button 
            variant="primary" 
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setShowAddStudent(true)}
          >
            Add Student
          </Button>
        </div>

        {students.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} />
            <h3>No students enrolled</h3>
            <p>Add students to this batch to get started</p>
            <Button 
              variant="primary" 
              leftIcon={<Plus size={18} />}
              onClick={() => setShowAddStudent(true)}
            >
              Add Student
            </Button>
          </div>
        ) : (
          <div className={styles.studentsList}>
            {students.map((student) => (
              <div key={student.id} className={styles.studentRow}>
                <div className={styles.studentInfo}>
                  <div className={styles.avatar}>
                    <User size={16} />
                  </div>
                  <div>
                    <span className={styles.studentName}>{student.full_name}</span>
                    <span className={styles.admissionNo}>{student.admission_number}</span>
                  </div>
                </div>
                <div className={styles.studentContact}>
                  {student.phone || student.email || '-'}
                </div>
                <button 
                  className={styles.removeBtn}
                  onClick={() => handleRemoveStudent(student.id)}
                  title="Remove from batch"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Student Modal */}
      {showAddStudent && institute && (
        <AddStudentModal
          instituteId={institute.id}
          batchId={batchId}
          onClose={() => setShowAddStudent(false)}
          onSuccess={handleAddStudentSuccess}
        />
      )}
    </div>
  );
}
