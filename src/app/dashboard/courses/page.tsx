'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  BookOpen,
  MoreVertical,
  Loader2,
  Edit,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { CreateCourseModal } from '@/components/modals';
import { useInstitute } from '@/lib/context/InstituteContext';
import { useCourses, Course } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function CoursesPage() {
  const router = useRouter();
  const { institute, loading: instituteLoading } = useInstitute();
  const { courses, loading: coursesLoading } = useCourses(institute?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const isLoading = instituteLoading || coursesLoading;

  const handleSuccess = () => {
    setShowCreateModal(false);
    window.location.reload();
  };

  const handleToggleStatus = async (course: Course) => {
    setActionLoading(course.id);
    setOpenMenuId(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('courses')
      .update({ is_active: !course.is_active })
      .eq('id', course.id);

    if (!error) {
      window.location.reload();
    }
    setActionLoading(null);
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Are you sure you want to delete "${course.name}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(course.id);
    setOpenMenuId(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', course.id);

    if (!error) {
      window.location.reload();
    } else {
      alert('Failed to delete course. It may have associated batches.');
    }
    setActionLoading(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Courses</h1>
          <p className={styles.pageSubtitle}>{courses.length} total courses</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Course
        </Button>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card padding="lg" className={styles.emptyState}>
          <BookOpen size={48} />
          <h3>No courses yet</h3>
          <p>Create your first course to get started</p>
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Course
          </Button>
        </Card>
      ) : (
        <div className={styles.coursesGrid}>
          {courses.map((course) => (
            <Card 
              key={course.id}
              padding="lg" 
              className={styles.courseCard}
            >
              <div className={styles.courseHeader}>
                <div className={styles.courseIcon}>
                  <BookOpen size={20} />
                </div>
                <div className={styles.actionsWrapper}>
                  {actionLoading === course.id ? (
                    <Loader2 size={16} className={styles.spinner} />
                  ) : (
                    <>
                      <button 
                        className={styles.moreBtn}
                        onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenuId === course.id && (
                        <div className={styles.actionsMenu}>
                          <button onClick={() => { setEditingCourse(course); setOpenMenuId(null); }}>
                            <Edit size={14} />
                            Edit Course
                          </button>
                          <button onClick={() => handleToggleStatus(course)}>
                            {course.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                            {course.is_active ? 'Mark Inactive' : 'Mark Active'}
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course)}
                            className={styles.dangerAction}
                          >
                            <Trash2 size={14} />
                            Delete Course
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <h3 className={styles.courseName}>{course.name}</h3>
              {course.description && (
                <p className={styles.courseDescription}>{course.description}</p>
              )}
              <div className={styles.courseStatus}>
                <span className={`${styles.badge} ${course.is_active ? styles.active : styles.inactive}`}>
                  {course.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.courseFooter}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenuId && (
        <div 
          className={styles.menuBackdrop} 
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* Create Course Modal */}
      {showCreateModal && institute && (
        <CreateCourseModal
          instituteId={institute.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <EditCourseModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSuccess={() => {
            setEditingCourse(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// Edit Course Modal Component
function EditCourseModal({
  course,
  onClose,
  onSuccess,
}: {
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(course.name);
  const [description, setDescription] = useState(course.description || '');
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
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        name: name.trim(),
        description: description.trim() || null,
      })
      .eq('id', course.id);

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit Course</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Course Name</label>
            <input
              type="text"
              placeholder="e.g., JEE Advanced, NEET Preparation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description (Optional)</label>
            <textarea
              placeholder="Brief description of the course..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              rows={3}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalActions}>
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
