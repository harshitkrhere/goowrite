'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Clock, Loader2 } from 'lucide-react';
import { GlassCard, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import styles from './CreateCourseModal.module.css';

interface CreateCourseModalProps {
  instituteId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCourseModal({ instituteId, onClose, onSuccess }: CreateCourseModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Course name is required');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from('courses')
      .insert({
        institute_id: instituteId,
        name: name.trim(),
        description: description.trim() || null,
        duration: duration.trim() || null,
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
            <h2>Create New Course</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              type="text"
              label="Course Name"
              placeholder="JEE Main Preparation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<BookOpen size={18} />}
              required
              fullWidth
            />

            <div className={styles.textareaWrapper}>
              <label>Description (Optional)</label>
              <textarea
                placeholder="Comprehensive preparation course for JEE Main..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
                rows={3}
              />
            </div>

            <Input
              type="text"
              label="Duration (Optional)"
              placeholder="6 months, 1 year, etc."
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              leftIcon={<Clock size={18} />}
              fullWidth
            />

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isLoading}>
                {isLoading ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
