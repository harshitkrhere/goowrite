'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  BookOpen,
  Users,
  Edit,
  Plus,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useInstitute } from '@/lib/context/InstituteContext';
import { Course, Batch } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const { institute, loading: instituteLoading } = useInstitute();
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(true);

  // Fetch course details
  useEffect(() => {
    async function fetchCourse() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (!error && data) {
        setCourse(data as Course);
      }
      setCourseLoading(false);
    }

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Fetch batches for this course
  useEffect(() => {
    async function fetchBatches() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBatches(data as Batch[]);
      }
      setBatchesLoading(false);
    }

    if (courseId) {
      fetchBatches();
    }
  }, [courseId]);

  const isLoading = instituteLoading || courseLoading;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.errorContainer}>
        <p>Course not found</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <button className={styles.backBtn} onClick={() => router.push('/dashboard/courses')}>
        <ArrowLeft size={18} />
        <span>Back to Courses</span>
      </button>

      {/* Course Header */}
      <div className={styles.courseHeader}>
        <div className={styles.courseIconLarge}>
          <BookOpen size={28} />
        </div>
        <div>
          <h1 className={styles.courseTitle}>{course.name}</h1>
          {course.description && (
            <p className={styles.courseDesc}>{course.description}</p>
          )}
          <div className={styles.courseMeta}>
            <span className={`${styles.statusBadge} ${course.is_active ? styles.active : styles.inactive}`}>
              {course.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className={styles.metaItem}>
              <GraduationCap size={16} />
              {batches.length} batches
            </span>
          </div>
        </div>
      </div>

      {/* Batches Section */}
      <Card padding="none" className={styles.batchesCard}>
        <div className={styles.batchesHeader}>
          <h2>Batches</h2>
          <Button 
            variant="primary" 
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => router.push('/dashboard/batches')}
          >
            Create Batch
          </Button>
        </div>

        {batchesLoading ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={24} />
          </div>
        ) : batches.length === 0 ? (
          <div className={styles.emptyState}>
            <GraduationCap size={48} />
            <h3>No batches for this course</h3>
            <p>Create a batch to start enrolling students</p>
            <Button 
              variant="primary" 
              leftIcon={<Plus size={18} />}
              onClick={() => router.push('/dashboard/batches')}
            >
              Create Batch
            </Button>
          </div>
        ) : (
          <div className={styles.batchesList}>
            {batches.map((batch) => (
              <div 
                key={batch.id} 
                className={styles.batchRow}
                onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
              >
                <div className={styles.batchInfo}>
                  <span className={styles.batchName}>{batch.name}</span>
                  {batch.schedule && (
                    <span className={styles.batchSchedule}>{batch.schedule}</span>
                  )}
                </div>
                <div className={styles.batchMeta}>
                  <span className={styles.studentCount}>
                    <Users size={14} />
                    {batch.student_count || 0}
                  </span>
                  <span className={`${styles.batchStatus} ${batch.is_active ? styles.active : styles.inactive}`}>
                    {batch.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
