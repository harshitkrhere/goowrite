'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  UserX,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { AddStudentModal } from '@/components/modals';
import { useInstitute } from '@/lib/context/InstituteContext';
import { useStudents, Student } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

const statusColors: Record<Student['current_status'], string> = {
  active: 'green',
  on_leave: 'orange',
  completed: 'blue',
  dropped: 'red',
};

const statusLabels: Record<Student['current_status'], string> = {
  active: 'Active',
  on_leave: 'On Leave',
  completed: 'Completed',
  dropped: 'Dropped',
};

export default function StudentsPage() {
  const { institute, loading: instituteLoading } = useInstitute();
  const { students, loading: studentsLoading } = useStudents(institute?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [localStudents, setLocalStudents] = useState<Student[]>([]);

  const isLoading = instituteLoading || studentsLoading;

  // Sync local state with fetched students
  useEffect(() => {
    setLocalStudents(students);
  }, [students]);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    window.location.reload();
  };

  const filteredStudents = localStudents.filter((student) => {
    const matchesSearch = 
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.phone?.includes(searchQuery)) ||
      student.admission_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || student.current_status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (student: Student, newStatus: Student['current_status']) => {
    setActionLoading(student.id);
    setOpenMenuId(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('students')
      .update({ current_status: newStatus })
      .eq('id', student.id);

    if (!error) {
      setLocalStudents(prev => prev.map(s => 
        s.id === student.id ? { ...s, current_status: newStatus } : s
      ));
    }

    setActionLoading(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading students...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Students</h1>
          <p className={styles.pageSubtitle}>{localStudents.length} total students</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={() => setShowAddModal(true)}
        >
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.statusFilters}>
          {['all', 'active', 'on_leave', 'completed', 'dropped'].map((status) => (
            <button
              key={status}
              className={`${styles.filterBtn} ${selectedStatus === status ? styles.active : ''}`}
              onClick={() => setSelectedStatus(status)}
            >
              {status === 'all' ? 'All' : statusLabels[status as Student['current_status']]}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className={styles.tableWrapper}>
        {filteredStudents.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <User size={32} />
            </div>
            <h3>No students found</h3>
            <p>{localStudents.length === 0 ? 'Click "Add Student" to get started.' : 'Try adjusting your filters.'}</p>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Contact</th>
                  <th>Admission #</th>
                  <th>Status</th>
                  <th>Enrolled</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className={styles.studentInfo}>
                        <div className={styles.avatar}>
                          <User size={16} />
                        </div>
                        <div className={styles.studentDetails}>
                          <span className={styles.studentName}>{student.full_name}</span>
                          <span className={styles.studentEmail}>{student.email || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{student.phone || '-'}</td>
                    <td>{student.admission_number}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[statusColors[student.current_status]]}`}>
                        {statusLabels[student.current_status]}
                      </span>
                    </td>
                    <td>
                      {new Date(student.admission_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className={styles.actionsCell}>
                      {actionLoading === student.id ? (
                        <Loader2 size={16} className={styles.spinner} />
                      ) : (
                        <div className={styles.actionsWrapper}>
                          <button 
                            className={styles.actionsBtn}
                            onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {openMenuId === student.id && (
                            <div className={styles.actionsMenu}>
                              <div className={styles.menuHeader}>Change Status</div>
                              {student.current_status !== 'active' && (
                                <button onClick={() => handleStatusChange(student, 'active')}>
                                  <CheckCircle size={14} />
                                  Mark Active
                                </button>
                              )}
                              {student.current_status !== 'on_leave' && (
                                <button onClick={() => handleStatusChange(student, 'on_leave')}>
                                  <Clock size={14} />
                                  Mark On Leave
                                </button>
                              )}
                              {student.current_status !== 'completed' && (
                                <button onClick={() => handleStatusChange(student, 'completed')}>
                                  <CheckCircle size={14} />
                                  Mark Completed
                                </button>
                              )}
                              {student.current_status !== 'dropped' && (
                                <button 
                                  onClick={() => handleStatusChange(student, 'dropped')}
                                  className={styles.dangerAction}
                                >
                                  <XCircle size={14} />
                                  Mark Dropped
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Showing {filteredStudents.length} of {localStudents.length} students
              </span>
              <div className={styles.paginationControls}>
                <button className={styles.paginationBtn} disabled>
                  <ChevronLeft size={16} />
                </button>
                <button className={styles.paginationBtn}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div 
          className={styles.menuBackdrop} 
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* Add Student Modal */}
      {showAddModal && institute && (
        <AddStudentModal
          instituteId={institute.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}

