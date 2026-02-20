'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, GraduationCap, Clock, Loader2 } from 'lucide-react';
import { GlassCard, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { Course } from '@/lib/hooks';
import styles from './CreateBatchModal.module.css';

interface CreateBatchModalProps {
  instituteId: string;
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateBatchModal({ instituteId, courses, onClose, onSuccess }: CreateBatchModalProps) {
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [schedule, setSchedule] = useState('');
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Batch name is required');
      setIsLoading(false);
      return;
    }

    if (!courseId) {
      setError('Please select a course');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from('batches')
      .insert({
        institute_id: instituteId,
        course_id: courseId,
        name: name.trim(),
        schedule: schedule.trim() || null,
        start_date: startDate,
        is_active: true,
        created_by: user?.id,
      });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
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
            <h2>Create New Batch</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type="text"
              label="Batch Name"
              placeholder="Morning Batch 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<GraduationCap size={18} />}
              required
              fullWidth
            />

            <div className={styles.selectWrapper}>
              <label>Course</label>
              <select 
                value={courseId} 
                onChange={(e) => setCourseId(e.target.value)}
                className={styles.select}
                required
              >
                <option value="">Select a course</option>
                {courses.filter(c => c.is_active).map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className={styles.hint}>No courses yet. Create a course first.</p>
              )}
            </div>

            <Input
              type="text"
              label="Schedule (Optional)"
              placeholder="Mon-Fri, 9:00 AM - 11:00 AM"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              leftIcon={<Clock size={18} />}
              fullWidth
            />

            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              fullWidth
            />

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isLoading}>
                {isLoading ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
