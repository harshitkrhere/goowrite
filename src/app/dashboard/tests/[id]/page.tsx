'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Calendar,
  GraduationCap,
  Loader2,
  Save,
  User,
  History,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useInstitute } from '@/lib/context/InstituteContext';
import { useBatchStudents, useTestMarks, Test, Student, StudentMarks } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  
  const { institute, loading: instituteLoading } = useInstitute();
  const [test, setTest] = useState<Test | null>(null);
  const [testLoading, setTestLoading] = useState(true);
  const { marks, loading: marksLoading } = useTestMarks(testId);
  const { students, loading: studentsLoading } = useBatchStudents(test?.batch_id);
  
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fetch test details
  useEffect(() => {
    async function fetchTest() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('tests')
        .select(`
          *,
          batch:batches(id, name, course:courses(id, name))
        `)
        .eq('id', testId)
        .single();

      if (!error && data) {
        setTest(data as Test);
      }
      setTestLoading(false);
    }

    if (testId) {
      fetchTest();
    }
  }, [testId]);

  // Initialize marks map from existing marks
  useEffect(() => {
    const map: Record<string, string> = {};
    marks.forEach(m => {
      map[m.student_id] = m.marks_obtained.toString();
    });
    setMarksMap(map);
  }, [marks]);

  const isLoading = instituteLoading || testLoading || marksLoading || studentsLoading;

  const handleMarksChange = (studentId: string, value: string) => {
    setMarksMap(prev => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleSave = async () => {
    if (!test || !institute) return;
    
    setSaving(true);
    setSaveError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      for (const student of students) {
        const marksValue = marksMap[student.id];
        if (!marksValue || marksValue.trim() === '') continue;

        const marksNum = parseFloat(marksValue);
        if (isNaN(marksNum) || marksNum < 0 || marksNum > test.total_max_marks) {
          setSaveError(`Invalid marks for ${student.full_name}. Must be between 0 and ${test.total_max_marks}.`);
          setSaving(false);
          return;
        }

        // Check if marks record exists
        const existingMark = marks.find(m => m.student_id === student.id);

        if (existingMark) {
          // Update existing
          await supabase
            .from('student_marks')
            .update({ marks_obtained: marksNum })
            .eq('id', existingMark.id);
        } else {
          // Insert new
          await supabase
            .from('student_marks')
            .insert({
              institute_id: institute.id,
              student_id: student.id,
              test_id: test.id,
              marks_obtained: marksNum,
              entered_by: user?.id,
            });
        }
      }

      // Refresh the page to show updated marks
      window.location.reload();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save marks');
    }

    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading test...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className={styles.errorContainer}>
        <p>Test not found</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard/tests')}>
          Back to Tests
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <button className={styles.backBtn} onClick={() => router.push('/dashboard/tests')}>
        <ArrowLeft size={18} />
        <span>Back to Tests</span>
      </button>

      {/* Test Header */}
      <div className={styles.testHeader}>
        <div>
          <h1 className={styles.testName}>{test.name}</h1>
          <div className={styles.testMeta}>
            <span className={styles.metaItem}>
              <GraduationCap size={16} />
              {(test.batch as any)?.name || 'Unknown Batch'}
            </span>
            <span className={styles.metaItem}>
              <Calendar size={16} />
              {new Date(test.test_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className={styles.maxMarksBadge}>
          Max: {test.total_max_marks}
        </div>
      </div>

      {/* Marks Entry */}
      <Card padding="none" className={styles.marksCard}>
        <div className={styles.marksHeader}>
          <h2>Enter Marks</h2>
          <Button 
            variant="primary" 
            leftIcon={<Save size={16} />}
            onClick={handleSave}
            isLoading={saving}
          >
            Save All Marks
          </Button>
        </div>

        {saveError && <p className={styles.error}>{saveError}</p>}

        {students.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No students enrolled in this batch.</p>
          </div>
        ) : (
          <div className={styles.marksList}>
            <div className={styles.marksListHeader}>
              <span className={styles.colStudent}>Student</span>
              <span className={styles.colMarks}>Marks (out of {test.total_max_marks})</span>
              <span className={styles.colStatus}>Status</span>
            </div>

            {students.map(student => {
              const existingMark = marks.find(m => m.student_id === student.id);
              const currentValue = marksMap[student.id] || '';
              
              return (
                <div key={student.id} className={styles.marksRow}>
                  <div className={styles.studentInfo}>
                    <div className={styles.avatar}>
                      <User size={16} />
                    </div>
                    <div>
                      <span className={styles.studentName}>{student.full_name}</span>
                      <span className={styles.admissionNo}>{student.admission_number}</span>
                    </div>
                  </div>
                  
                  <div className={styles.marksInput}>
                    <input
                      type="number"
                      value={currentValue}
                      onChange={e => handleMarksChange(student.id, e.target.value)}
                      placeholder="0"
                      min="0"
                      max={test.total_max_marks}
                      className={styles.input}
                    />
                    <span className={styles.maxMarksHint}>/ {test.total_max_marks}</span>
                  </div>

                  <div className={styles.marksStatus}>
                    {existingMark ? (
                      <span className={styles.statusEntered}>
                        <History size={14} />
                        Entered
                      </span>
                    ) : (
                      <span className={styles.statusPending}>Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
