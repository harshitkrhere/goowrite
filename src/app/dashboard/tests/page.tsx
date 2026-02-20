'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Calendar,
  FileText,
  Loader2,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useInstitute } from '@/lib/context/InstituteContext';
import { useTests, useBatches, Test } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function TestsPage() {
  const { institute, loading: instituteLoading } = useInstitute();
  const { tests, loading: testsLoading } = useTests(institute?.id);
  const { batches, loading: batchesLoading } = useBatches(institute?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  const isLoading = instituteLoading || testsLoading || batchesLoading;

  const filteredTests = selectedBatch === 'all' 
    ? tests 
    : tests.filter(t => t.batch_id === selectedBatch);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading tests...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Tests & Marks</h1>
          <p className={styles.pageSubtitle}>{tests.length} tests created</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Test
        </Button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select 
          className={styles.filterSelect}
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          <option value="all">All Batches</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>{batch.name}</option>
          ))}
        </select>
      </div>

      {/* Tests List */}
      {filteredTests.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FileText size={32} />
          </div>
          <h3>No tests found</h3>
          <p>Create your first test to get started with marks entry.</p>
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Test
          </Button>
        </div>
      ) : (
        <div className={styles.testsList}>
          {filteredTests.map(test => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && institute && (
        <CreateTestModal
          instituteId={institute.id}
          batches={batches}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function TestCard({ test }: { test: Test }) {
  return (
    <Link href={`/dashboard/tests/${test.id}`} className={styles.testCardLink}>
      <div className={styles.testMain}>
        <div className={styles.testIcon}>
          <FileText size={20} />
        </div>
        <div className={styles.testInfo}>
          <h3 className={styles.testName}>{test.name}</h3>
          <div className={styles.testMeta}>
            <span className={styles.metaItem}>
              <GraduationCap size={14} />
              {(test.batch as any)?.name || 'Unknown Batch'}
            </span>
            <span className={styles.metaItem}>
              <Calendar size={14} />
              {new Date(test.test_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.testRight}>
        <div className={styles.maxMarks}>
          <span className={styles.marksValue}>{test.total_max_marks}</span>
          <span className={styles.marksLabel}>Max Marks</span>
        </div>
        <ChevronRight size={20} className={styles.chevron} />
      </div>
    </Link>
  );
}

interface CreateTestModalProps {
  instituteId: string;
  batches: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateTestModal({ instituteId, batches, onClose, onSuccess }: CreateTestModalProps) {
  const [name, setName] = useState('');
  const [batchId, setBatchId] = useState('');
  const [testDate, setTestDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name.trim() || !batchId || !testDate || !maxMarks) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const { error: insertError } = await supabase
      .from('tests')
      .insert({
        institute_id: instituteId,
        batch_id: batchId,
        name: name.trim(),
        test_date: testDate,
        total_max_marks: parseFloat(maxMarks),
      });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create Test</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Test Name *</label>
            <input
              type="text"
              placeholder="e.g., Mid-Term Exam"
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Batch *</label>
            <select
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              className={styles.input}
              required
            >
              <option value="">Select Batch</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Test Date *</label>
              <input
                type="date"
                value={testDate}
                onChange={e => setTestDate(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Max Marks *</label>
              <input
                type="number"
                placeholder="100"
                value={maxMarks}
                onChange={e => setMaxMarks(e.target.value)}
                className={styles.input}
                min="1"
                required
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Create Test
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
