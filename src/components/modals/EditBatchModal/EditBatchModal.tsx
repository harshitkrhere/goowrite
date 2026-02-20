'use client';

import { useState } from 'react';
import { X, GraduationCap, Clock, Calendar } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { Course, Batch } from '@/lib/hooks';
import styles from './EditBatchModal.module.css';

interface EditBatchModalProps {
  batch: Batch;
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBatchModal({ batch, courses, onClose, onSuccess }: EditBatchModalProps) {
  const [name, setName] = useState(batch.name);
  const [courseId, setCourseId] = useState(batch.course_id || '');
  const [schedule, setSchedule] = useState(batch.schedule || '');
  const [startDate, setStartDate] = useState(() => {
    if (batch.start_date) {
      return new Date(batch.start_date).toISOString().split('T')[0];
    }
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

    const { error: updateError } = await supabase
      .from('batches')
      .update({
        name: name.trim(),
        course_id: courseId,
        schedule: schedule.trim() || null,
        start_date: startDate,
      })
      .eq('id', batch.id);

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>Edit Batch</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Batch Name</label>
            <div className={styles.inputWithIcon}>
              <GraduationCap size={18} className={styles.icon} />
              <input
                type="text"
                placeholder="Morning Batch 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Course</label>
            <select 
              value={courseId} 
              onChange={(e) => setCourseId(e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Schedule (Optional)</label>
            <div className={styles.inputWithIcon}>
              <Clock size={18} className={styles.icon} />
              <input
                type="text"
                placeholder="Mon-Fri, 9:00 AM - 11:00 AM"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Start Date</label>
            <div className={styles.inputWithIcon}>
              <Calendar size={18} className={styles.icon} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
