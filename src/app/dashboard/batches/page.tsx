'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Users,
  Clock,
  MoreVertical,
  Loader2,
  Edit,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { CreateBatchModal, EditBatchModal } from '@/components/modals';
import { useInstitute } from '@/lib/context/InstituteContext';
import { useBatches, useCourses, Batch } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function BatchesPage() {
  const router = useRouter();
  const { institute, loading: instituteLoading } = useInstitute();
  const { batches, loading: batchesLoading } = useBatches(institute?.id);
  const { courses } = useCourses(institute?.id);
  const [filter, setFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const isLoading = instituteLoading || batchesLoading;

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    window.location.reload();
  };

  const filteredBatches = batches.filter((batch) => {
    if (filter === 'all') return true;
    if (filter === 'active') return batch.is_active;
    if (filter === 'inactive') return !batch.is_active;
    return true;
  });

  // Group batches by course
  const groupedByCourse = filteredBatches.reduce((acc, batch) => {
    const courseName = batch.course?.name || 'Uncategorized';
    if (!acc[courseName]) {
      acc[courseName] = [];
    }
    acc[courseName].push(batch);
    return acc;
  }, {} as Record<string, Batch[]>);

  const handleToggleStatus = async (batch: Batch) => {
    setActionLoading(batch.id);
    setOpenMenuId(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('batches')
      .update({ is_active: !batch.is_active })
      .eq('id', batch.id);

    if (!error) {
      window.location.reload();
    }
    setActionLoading(null);
  };

  const handleDeleteBatch = async (batch: Batch) => {
    if (!confirm(`Are you sure you want to delete "${batch.name}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(batch.id);
    setOpenMenuId(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', batch.id);

    if (!error) {
      window.location.reload();
    } else {
      alert('Failed to delete batch. It may have associated students.');
    }
    setActionLoading(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading batches...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Batches</h1>
          <p className={styles.pageSubtitle}>{batches.length} total batches</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Batch
        </Button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {[
          { key: 'all', label: 'All Batches' },
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.filterBtn} ${filter === key ? styles.active : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {batches.length === 0 ? (
        <div className={styles.emptyState}>
          <Card padding="lg">
            <p>No batches created yet</p>
            <Button 
              variant="primary" 
              leftIcon={<Plus size={18} />}
              onClick={() => setShowCreateModal(true)}
            >
              Create your first batch
            </Button>
          </Card>
        </div>
      ) : (
        /* Batches by Course */
        Object.entries(groupedByCourse).map(([course, courseBatches]) => (
          <div key={course} className={styles.courseSection}>
            <h2 className={styles.courseTitle}>{course}</h2>
            <div className={styles.batchesGrid}>
              {courseBatches.map((batch) => (
                <Card 
                  key={batch.id}
                  padding="lg" 
                  className={styles.batchCard}
                >
                  <div className={styles.batchHeader}>
                    <h3 className={styles.batchName}>{batch.name}</h3>
                    <span className={`${styles.status} ${batch.is_active ? styles.green : styles.gray}`}>
                      {batch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className={styles.batchDetails}>
                    {batch.schedule && (
                      <div className={styles.detailItem}>
                        <Clock size={16} />
                        <span>{batch.schedule}</span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <Users size={16} />
                      <span>{batch.student_count || 0} students</span>
                    </div>
                  </div>

                  <div className={styles.batchFooter}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
                    >
                      View Details
                    </Button>
                    
                    <div className={styles.actionsWrapper}>
                      {actionLoading === batch.id ? (
                        <Loader2 size={16} className={styles.spinner} />
                      ) : (
                        <>
                          <button 
                            className={styles.moreBtn}
                            onClick={() => setOpenMenuId(openMenuId === batch.id ? null : batch.id)}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openMenuId === batch.id && (
                            <div className={styles.actionsMenu}>
                              <button onClick={() => { setEditingBatch(batch); setOpenMenuId(null); }}>
                                <Edit size={14} />
                                Edit Batch
                              </button>
                              <button onClick={() => handleToggleStatus(batch)}>
                                {batch.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                {batch.is_active ? 'Mark Inactive' : 'Mark Active'}
                              </button>
                              <button 
                                onClick={() => handleDeleteBatch(batch)}
                                className={styles.dangerAction}
                              >
                                <Trash2 size={14} />
                                Delete Batch
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Click outside to close menu */}
      {openMenuId && (
        <div 
          className={styles.menuBackdrop} 
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* Create Batch Modal */}
      {showCreateModal && institute && (
        <CreateBatchModal
          instituteId={institute.id}
          courses={courses}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Batch Modal */}
      {editingBatch && (
        <EditBatchModal
          batch={editingBatch}
          courses={courses}
          onClose={() => setEditingBatch(null)}
          onSuccess={() => {
            setEditingBatch(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
