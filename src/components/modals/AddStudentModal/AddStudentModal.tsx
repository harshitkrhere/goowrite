'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Phone, Calendar, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { GlassCard, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { Course, Batch } from '@/lib/hooks';
import styles from './AddStudentModal.module.css';

export interface AddStudentModalProps {
  instituteId: string;
  batchId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStudentModal({ instituteId, batchId, onClose, onSuccess }: AddStudentModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [admissionDate, setAdmissionDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>(batchId ? [batchId] : []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Fetch courses and batches
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('institute_id', instituteId)
        .eq('is_active', true);
      
      if (coursesData) setCourses(coursesData);

      // Fetch batches
      const { data: batchesData } = await supabase
        .from('batches')
        .select('*, courses(id, name)')
        .eq('institute_id', instituteId)
        .eq('is_active', true);
      
      if (batchesData) {
        setBatches(batchesData.map(b => ({
          ...b,
          course: b.courses as unknown as Course
        })));
      }
      
      setIsLoadingData(false);
    }

    fetchData();
  }, [instituteId]);

  // Filter batches by selected course
  const filteredBatches = selectedCourseId 
    ? batches.filter(b => b.course_id === selectedCourseId)
    : batches;

  const handleBatchToggle = (batchId: string) => {
    setSelectedBatchIds(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Generate admission number (simple format: YYYY-XXXXX)
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    const admissionNumber = `${year}-${random}`;

    // Create student
    const { data: studentData, error: insertError } = await supabase
      .from('students')
      .insert({
        institute_id: instituteId,
        admission_number: admissionNumber,
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        admission_date: admissionDate,
        current_status: 'active',
        created_by: user?.id,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    // Add student to selected batches
    if (studentData && selectedBatchIds.length > 0) {
      const batchAssignments = selectedBatchIds.map(batchId => ({
        batch_id: batchId,
        student_id: studentData.id,
        status: 'active',
        created_by: user?.id,
      }));

      const { error: batchError } = await supabase
        .from('batch_students')
        .insert(batchAssignments);

      if (batchError) {
        console.error('Error assigning batches:', batchError);
        // Student created but batch assignment failed - still call success
      }
    }

    onSuccess();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="elevated" padding="lg">
          <div className={styles.header}>
            <h2>Add New Student</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {isLoadingData ? (
            <div className={styles.loadingState}>
              <Loader2 size={24} className={styles.spinner} />
              <p>Loading...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User size={18} />}
                required
                fullWidth
              />

              <div className={styles.row}>
                <Input
                  type="email"
                  label="Email (Optional)"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail size={18} />}
                  fullWidth
                />

                <Input
                  type="tel"
                  label="Phone (Optional)"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone size={18} />}
                  fullWidth
                />
              </div>

              <Input
                type="date"
                label="Admission Date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                leftIcon={<Calendar size={18} />}
                required
                fullWidth
              />

              {/* Course Filter */}
              <div className={styles.selectWrapper}>
                <label><BookOpen size={16} /> Filter by Course (Optional)</label>
                <select 
                  value={selectedCourseId} 
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedBatchIds([]); // Reset batch selection
                  }}
                  className={styles.select}
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Selection */}
              <div className={styles.batchSection}>
                <label><GraduationCap size={16} /> Assign to Batches (Optional)</label>
                {filteredBatches.length === 0 ? (
                  <p className={styles.noBatches}>No batches available</p>
                ) : (
                  <div className={styles.batchGrid}>
                    {filteredBatches.map(batch => (
                      <label key={batch.id} className={styles.batchCheckbox}>
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.includes(batch.id)}
                          onChange={() => handleBatchToggle(batch.id)}
                        />
                        <span className={styles.batchLabel}>
                          <strong>{batch.name}</strong>
                          {batch.course?.name && <small>{batch.course.name}</small>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <Button variant="secondary" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Student'}
                </Button>
              </div>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
