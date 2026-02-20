'use client';

import { useState, useEffect } from 'react';
import { 
  Plus,
  UserPlus,
  Phone,
  Loader2,
  ArrowRight,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { useInstitute } from '@/lib/context/InstituteContext';
import { useCourses, Course } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface Inquiry {
  id: string;
  institute_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: 'walk_in' | 'referral' | 'social_media' | 'website' | 'agent' | 'other';
  status: 'inquiry' | 'applied' | 'admitted' | 'enrolled' | 'rejected';
  interested_course: string | null;
  created_at: string;
}

const statusColors: Record<Inquiry['status'], string> = {
  inquiry: 'blue',
  applied: 'orange',
  admitted: 'purple',
  enrolled: 'green',
  rejected: 'red',
};

const statusLabels: Record<Inquiry['status'], string> = {
  inquiry: 'New',
  applied: 'Applied',
  admitted: 'Admitted',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
};

// Get next status in pipeline
function getNextStatus(current: Inquiry['status']): Inquiry['status'] | null {
  const flow: Inquiry['status'][] = ['inquiry', 'applied', 'admitted', 'enrolled'];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function getNextActionLabel(status: Inquiry['status']): string {
  switch (status) {
    case 'inquiry': return 'Mark Applied';
    case 'applied': return 'Admit';
    case 'admitted': return 'Enroll';
    default: return '';
  }
}

export default function AdmissionsPage() {
  const { institute, loading: instituteLoading } = useInstitute();
  const { courses } = useCourses(institute?.id);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch inquiries
  useEffect(() => {
    if (!institute?.id) return;
    const instituteId = institute.id;

    async function fetchInquiries() {
      const supabase = createClient();
      const { data } = await supabase
        .from('inquiries')
        .select('*')
        .eq('institute_id', instituteId)
        .order('created_at', { ascending: false });

      if (data) {
        setInquiries(data as Inquiry[]);
      }
      setLoading(false);
    }

    fetchInquiries();
  }, [institute?.id]);

  const filteredInquiries = inquiries.filter(i => 
    filter === 'all' || i.status === filter
  );

  const handleAddSuccess = () => {
    setShowAddModal(false);
    window.location.reload();
  };

  // Advance status (Apply, Admit)
  const handleAdvanceStatus = async (inquiry: Inquiry) => {
    const nextStatus = getNextStatus(inquiry.status);
    if (!nextStatus) return;

    setActionLoading(inquiry.id);
    const supabase = createClient();

    // If enrolling, create student first
    if (nextStatus === 'enrolled') {
      await handleEnroll(inquiry);
    } else {
      // Just update status
      const { error } = await supabase
        .from('inquiries')
        .update({ status: nextStatus })
        .eq('id', inquiry.id);

      if (!error) {
        setInquiries(prev => prev.map(i => 
          i.id === inquiry.id ? { ...i, status: nextStatus } : i
        ));
      }
    }

    setActionLoading(null);
  };

  // Enroll: Create student and update status
  const handleEnroll = async (inquiry: Inquiry) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Generate admission number
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    const admissionNumber = `${year}-${random}`;

    // Create student
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        institute_id: inquiry.institute_id,
        admission_number: admissionNumber,
        full_name: inquiry.full_name,
        email: inquiry.email,
        phone: inquiry.phone,
        admission_date: new Date().toISOString().split('T')[0],
        current_status: 'active',
        created_by: user?.id,
      })
      .select()
      .single();

    if (studentError) {
      alert('Failed to create student: ' + studentError.message);
      return;
    }

    // Create admission record linking inquiry to student
    await supabase
      .from('admissions')
      .insert({
        institute_id: inquiry.institute_id,
        inquiry_id: inquiry.id,
        admission_number: admissionNumber,
        status: 'enrolled',
        student_id: studentData.id,
        created_by: user?.id,
      });

    // Update inquiry status to enrolled
    await supabase
      .from('inquiries')
      .update({ status: 'enrolled' })
      .eq('id', inquiry.id);

    // Refresh
    setInquiries(prev => prev.map(i => 
      i.id === inquiry.id ? { ...i, status: 'enrolled' } : i
    ));

    alert(`${inquiry.full_name} has been enrolled as a student!`);
  };

  // Reject inquiry
  const handleReject = async (inquiry: Inquiry) => {
    if (!confirm(`Are you sure you want to reject ${inquiry.full_name}?`)) return;

    setActionLoading(inquiry.id);
    const supabase = createClient();

    const { error } = await supabase
      .from('inquiries')
      .update({ status: 'rejected' })
      .eq('id', inquiry.id);

    if (!error) {
      setInquiries(prev => prev.map(i => 
        i.id === inquiry.id ? { ...i, status: 'rejected' } : i
      ));
    }

    setActionLoading(null);
  };

  if (instituteLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading admissions...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admissions</h1>
          <p className={styles.pageSubtitle}>{inquiries.length} total inquiries</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => setShowAddModal(true)}
        >
          Add Inquiry
        </Button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {['all', 'inquiry', 'applied', 'admitted', 'enrolled', 'rejected'].map((status) => (
          <button
            key={status}
            className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : statusLabels[status as Inquiry['status']]}
          </button>
        ))}
      </div>

      {/* Pipeline Stats */}
      <div className={styles.pipelineStats}>
        {(['inquiry', 'applied', 'admitted', 'enrolled'] as const).map((status) => (
          <div key={status} className={styles.statCard}>
            <span className={styles.statValue}>
              {inquiries.filter(i => i.status === status).length}
            </span>
            <span className={styles.statLabel}>{statusLabels[status]}</span>
          </div>
        ))}
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div className={styles.emptyState}>
          <UserPlus size={48} />
          <h3>No inquiries yet</h3>
          <p>Add your first inquiry to start tracking admissions</p>
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />}
            onClick={() => setShowAddModal(true)}
          >
            Add Inquiry
          </Button>
        </div>
      ) : (
        <div className={styles.inquiryList}>
          {filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id} className={styles.inquiryCard} padding="md">
              <div className={styles.inquiryMain}>
                <div className={styles.inquiryInfo}>
                  <span className={styles.inquiryName}>{inquiry.full_name}</span>
                  <div className={styles.inquiryDetails}>
                    <span><Phone size={12} /> {inquiry.phone || 'N/A'}</span>
                    {inquiry.interested_course && (
                      <span>• {inquiry.interested_course}</span>
                    )}
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${styles[statusColors[inquiry.status]]}`}>
                  {statusLabels[inquiry.status]}
                </span>
              </div>

              {/* Actions - only show if not terminal status */}
              {inquiry.status !== 'enrolled' && inquiry.status !== 'rejected' && (
                <div className={styles.inquiryActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<ArrowRight size={14} />}
                    onClick={() => handleAdvanceStatus(inquiry)}
                    isLoading={actionLoading === inquiry.id}
                  >
                    {getNextActionLabel(inquiry.status)}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<XCircle size={14} />}
                    onClick={() => handleReject(inquiry)}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {/* Show success for enrolled */}
              {inquiry.status === 'enrolled' && (
                <div className={styles.enrolledBadge}>
                  <CheckCircle size={16} />
                  <span>Converted to Student</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Inquiry Modal */}
      {showAddModal && institute && (
        <AddInquiryModal
          instituteId={institute.id}
          courses={courses}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}

// Inline Add Inquiry Modal
function AddInquiryModal({ 
  instituteId, 
  courses, 
  onClose, 
  onSuccess 
}: { 
  instituteId: string;
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from('inquiries')
      .insert({
        institute_id: instituteId,
        full_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        interested_course: courseId ? courses.find(c => c.id === courseId)?.name || null : null,
        source: 'walk_in',
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add New Inquiry</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Student Name *</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Phone Number *</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email (Optional)</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Course Interested</label>
            <select 
              value={courseId} 
              onChange={(e) => setCourseId(e.target.value)}
              className={styles.input}
            >
              <option value="">Select a course (optional)</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Add Inquiry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
