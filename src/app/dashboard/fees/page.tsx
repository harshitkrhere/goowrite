'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  IndianRupee,
  Loader2,
  X,
  User,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useInstitute } from '@/lib/context/InstituteContext';
import { useStudents, Student } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

type FeeStatus = 'paid' | 'partial' | 'overdue' | 'pending';

interface StudentFee {
  id: string;
  student_id: string;
  student: Student;
  final_amount: number;
  amount_paid: number;
  amount_due: number;
  is_fully_paid: boolean;
}

const statusColors = {
  paid: 'green',
  partial: 'orange',
  overdue: 'red',
  pending: 'blue',
};

const statusLabels = {
  paid: 'Fully Paid',
  partial: 'Partial',
  overdue: 'Overdue',
  pending: 'Pending',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getFeeStatus(fee: { is_fully_paid: boolean; amount_due: number; amount_paid: number }): FeeStatus {
  if (fee.is_fully_paid) return 'paid';
  if (fee.amount_paid > 0) return 'partial';
  if (fee.amount_due > 0) return 'pending';
  return 'pending';
}

export default function FeesPage() {
  const { institute, loading: instituteLoading } = useInstitute();
  const { students } = useStudents(institute?.id);
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch fee records
  useEffect(() => {
    if (!institute?.id) return;
    const instId = institute.id;

    async function fetchFees() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          *,
          student:students(id, full_name, admission_number, phone, email)
        `)
        .eq('institute_id', instId);

      if (!error && data) {
        setFees(data.map(f => ({
          ...f,
          student: f.student as Student,
        })));
      }
      setFeesLoading(false);
    }

    fetchFees();
  }, [institute?.id]);

  const isLoading = instituteLoading || feesLoading;

  const filteredFees = fees.filter((fee) => {
    const studentName = fee.student?.full_name?.toLowerCase() || '';
    const matchesSearch = studentName.includes(searchQuery.toLowerCase());
    const status = getFeeStatus(fee);
    const matchesFilter = filter === 'all' || status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalCollected = fees.reduce((sum, f) => sum + Number(f.amount_paid || 0), 0);
  const totalDue = fees.reduce((sum, f) => sum + Number(f.amount_due || 0), 0);
  const pendingCount = fees.filter(f => f.amount_due > 0 && !f.is_fully_paid).length;

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading fees...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Fees & Payments</h1>
          <p className={styles.pageSubtitle}>Track student fees and payments</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => setShowPaymentModal(true)}
        >
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.green}`}>
            <TrendingUp size={20} />
          </div>
          <div>
            <span className={styles.summaryLabel}>Total Collected</span>
            <span className={styles.summaryValue}>{formatCurrency(totalCollected)}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.orange}`}>
            <IndianRupee size={20} />
          </div>
          <div>
            <span className={styles.summaryLabel}>Total Due</span>
            <span className={styles.summaryValue}>{formatCurrency(totalDue)}</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.red}`}>
            <Clock size={20} />
          </div>
          <div>
            <span className={styles.summaryLabel}>Pending</span>
            <span className={styles.summaryValue}>{pendingCount} students</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterButtons}>
          {['all', 'paid', 'partial', 'pending'].map((status) => (
            <button
              key={status}
              className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All' : statusLabels[status as keyof typeof statusLabels]}
            </button>
          ))}
        </div>
      </div>

      {/* Fees List */}
      <Card padding="none">
        {fees.length === 0 ? (
          <div className={styles.emptyState}>
            <CreditCard size={48} />
            <h3>No fee records found</h3>
            <p>Record a payment to get started</p>
            <Button 
              variant="primary" 
              leftIcon={<Plus size={18} />}
              onClick={() => setShowPaymentModal(true)}
            >
              Record Payment
            </Button>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No matching records found</p>
          </div>
        ) : (
          <>
            <div className={styles.listHeader}>
              <span>Student</span>
              <span>Total Fee</span>
              <span>Paid</span>
              <span>Due</span>
              <span>Status</span>
            </div>

            <div className={styles.feesList}>
              {filteredFees.map((fee) => {
                const status = getFeeStatus(fee);
                return (
                  <div key={fee.id} className={styles.feeItem}>
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar}>
                        <User size={16} />
                      </div>
                      <div>
                        <span className={styles.studentName}>
                          {fee.student?.full_name || 'Unknown'}
                        </span>
                        <span className={styles.admissionNo}>
                          {fee.student?.admission_number || '-'}
                        </span>
                      </div>
                    </div>
                    <span className={styles.amount}>{formatCurrency(fee.final_amount)}</span>
                    <span className={styles.amountPaid}>{formatCurrency(fee.amount_paid)}</span>
                    <span className={`${styles.amountDue} ${fee.amount_due > 0 ? styles.hasdue : ''}`}>
                      {formatCurrency(fee.amount_due)}
                    </span>
                    <span className={`${styles.statusBadge} ${styles[statusColors[status]]}`}>
                      {status === 'paid' && <CheckCircle size={14} />}
                      {status === 'partial' && <Clock size={14} />}
                      {status === 'pending' && <AlertCircle size={14} />}
                      {statusLabels[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Record Payment Modal */}
      {showPaymentModal && institute && (
        <RecordPaymentModal
          instituteId={institute.id}
          students={students}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

// Record Payment Modal
function RecordPaymentModal({
  instituteId,
  students,
  onClose,
  onSuccess,
}: {
  instituteId: string;
  students: Student[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [totalFee, setTotalFee] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!selectedStudent || !totalFee || !amountPaid) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    const totalFeeNum = parseFloat(totalFee);
    const amountPaidNum = parseFloat(amountPaid);

    if (isNaN(totalFeeNum) || isNaN(amountPaidNum) || totalFeeNum < 0 || amountPaidNum < 0) {
      setError('Please enter valid amounts');
      setIsLoading(false);
      return;
    }

    if (amountPaidNum > totalFeeNum) {
      setError('Amount paid cannot exceed total fee');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if fee record exists for this student
    const { data: existingFee } = await supabase
      .from('student_fees')
      .select('id, amount_paid, final_amount')
      .eq('institute_id', instituteId)
      .eq('student_id', selectedStudent)
      .single();

    if (existingFee) {
      // Update existing fee record
      const newAmountPaid = Number(existingFee.amount_paid) + amountPaidNum;
      const newAmountDue = Number(existingFee.final_amount) - newAmountPaid;
      
      const { error: updateError } = await supabase
        .from('student_fees')
        .update({
          amount_paid: newAmountPaid,
          amount_due: Math.max(0, newAmountDue),
          is_fully_paid: newAmountDue <= 0,
        })
        .eq('id', existingFee.id);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Record payment transaction
      await supabase.from('fee_payments').insert({
        institute_id: instituteId,
        student_fee_id: existingFee.id,
        amount: amountPaidNum,
        payment_method: paymentMethod,
        notes: notes || null,
        received_by: user?.id,
      });

    } else {
      // Create new fee record
      const amountDue = totalFeeNum - amountPaidNum;
      
      const { data: newFee, error: insertError } = await supabase
        .from('student_fees')
        .insert({
          institute_id: instituteId,
          student_id: selectedStudent,
          total_amount: totalFeeNum,
          discount_amount: 0,
          final_amount: totalFeeNum,
          amount_paid: amountPaidNum,
          amount_due: Math.max(0, amountDue),
          is_fully_paid: amountDue <= 0,
          created_by: user?.id,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setIsLoading(false);
        return;
      }

      // Record payment transaction
      if (newFee && amountPaidNum > 0) {
        await supabase.from('fee_payments').insert({
          institute_id: instituteId,
          student_fee_id: newFee.id,
          amount: amountPaidNum,
          payment_method: paymentMethod,
          notes: notes || null,
          received_by: user?.id,
        });
      }
    }

    onSuccess();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Record Payment</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Student *</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className={styles.input}
              required
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.admission_number})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Total Fee (₹) *</label>
              <input
                type="number"
                placeholder="10000"
                value={totalFee}
                onChange={(e) => setTotalFee(e.target.value)}
                className={styles.input}
                min="0"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Amount Paid (₹) *</label>
              <input
                type="number"
                placeholder="5000"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className={styles.input}
                min="0"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.input}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Notes (Optional)</label>
            <textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
              rows={2}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
