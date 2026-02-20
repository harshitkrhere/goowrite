'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Users as UsersIcon,
  User,
  Shield,
  BookOpen,
  Trash2,
  Loader2,
  X,
  MoreVertical,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard, Button, Input } from '@/components/ui';
import { useInstitute, useIsOwner, useIsAdmin } from '@/lib/context/InstituteContext';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'teacher';
  user?: {
    id: string;
    email: string;
    username: string | null;
    full_name: string | null;
  };
}

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  teacher: 'Teacher',
};

const roleIcons = {
  owner: <Shield size={14} />,
  admin: <Shield size={14} />,
  teacher: <BookOpen size={14} />,
};

const roleColors = {
  owner: 'purple',
  admin: 'blue',
  teacher: 'green',
};

// ─── Confirmation Modal ───────────────────────────────────────────────────────
interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, message, confirmLabel, variant, isLoading, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className={styles.confirmOverlay} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
        <div className={`${styles.confirmIcon} ${styles[variant]}`}>
          <AlertTriangle size={24} />
        </div>
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Team Page ───────────────────────────────────────────────────────────
export default function TeamPage() {
  const { institute, loading: instituteLoading } = useInstitute();
  const isOwner = useIsOwner();
  const isAdmin = useIsAdmin();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Confirmation state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'remove' | 'promote' | 'demote';
    member: TeamMember;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch team members
  useEffect(() => {
    if (!institute?.id) return;
    const instId = institute.id;

    async function fetchMembers() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('user_institute_roles')
        .select(`
          id,
          user_id,
          role,
          users(id, email, username, full_name)
        `)
        .eq('institute_id', instId)
        .order('role');

      if (!error && data) {
        setMembers(data.map(m => ({
          ...m,
          user: m.users as unknown as TeamMember['user']
        })));
      }
      setLoading(false);
    }

    fetchMembers();
  }, [institute?.id]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleRemoveMember = async () => {
    if (!confirmAction || confirmAction.type !== 'remove') return;
    setActionLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('user_institute_roles')
      .delete()
      .eq('id', confirmAction.member.id);

    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== confirmAction.member.id));
    }
    setActionLoading(false);
    setConfirmAction(null);
  };

  const handleChangeRole = async () => {
    if (!confirmAction || (confirmAction.type !== 'promote' && confirmAction.type !== 'demote')) return;
    setActionLoading(true);

    const newRole = confirmAction.type === 'promote' ? 'admin' : 'teacher';
    const supabase = createClient();
    const { error } = await supabase
      .from('user_institute_roles')
      .update({ role: newRole })
      .eq('id', confirmAction.member.id);

    if (!error) {
      setMembers(prev => prev.map(m => 
        m.id === confirmAction.member.id ? { ...m, role: newRole } : m
      ));
    }
    setActionLoading(false);
    setConfirmAction(null);
  };

  // ─── Permission Helpers ───────────────────────────────────────────────────
  const canManageMember = (member: TeamMember) => {
    // Can't manage yourself
    if (member.role === 'owner') return false;
    // Owner can manage everyone
    if (isOwner) return true;
    // Admin can manage teachers
    if (isAdmin && member.role === 'teacher') return true;
    return false;
  };

  const canPromote = (member: TeamMember) => {
    return isOwner && member.role === 'teacher';
  };

  const canDemote = (member: TeamMember) => {
    return isOwner && member.role === 'admin';
  };

  // ─── Confirm modal content ───────────────────────────────────────────────
  const getConfirmProps = () => {
    if (!confirmAction) return null;
    const memberName = confirmAction.member.user?.full_name || confirmAction.member.user?.username || 'this member';

    switch (confirmAction.type) {
      case 'remove':
        return {
          title: 'Remove Team Member',
          message: `Are you sure you want to remove ${memberName}? They will immediately lose all access to your institute.`,
          confirmLabel: 'Remove Member',
          variant: 'danger' as const,
        };
      case 'promote':
        return {
          title: 'Promote to Admin',
          message: `Promote ${memberName} to Admin? They will be able to manage students, batches, fees, and add teachers.`,
          confirmLabel: 'Promote to Admin',
          variant: 'warning' as const,
        };
      case 'demote':
        return {
          title: 'Demote to Teacher',
          message: `Demote ${memberName} to Teacher? They will lose admin privileges and can only view their assigned batches.`,
          confirmLabel: 'Demote to Teacher',
          variant: 'warning' as const,
        };
    }
  };

  if (instituteLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading team...</p>
      </div>
    );
  }

  // Count by role
  const ownerCount = members.filter(m => m.role === 'owner').length;
  const adminCount = members.filter(m => m.role === 'admin').length;
  const teacherCount = members.filter(m => m.role === 'teacher').length;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Team</h1>
          <p className={styles.pageSubtitle}>{members.length} members</p>
        </div>
        {(isOwner || isAdmin) && (
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />}
            onClick={() => setShowInviteModal(true)}
          >
            Add Member
          </Button>
        )}
      </div>

      {/* Role Summary */}
      <div className={styles.roleSummary}>
        <div className={`${styles.rolePill} ${styles.purple}`}>
          <Shield size={14} />
          <span>{ownerCount} Owner{ownerCount !== 1 ? 's' : ''}</span>
        </div>
        <div className={`${styles.rolePill} ${styles.blue}`}>
          <Shield size={14} />
          <span>{adminCount} Admin{adminCount !== 1 ? 's' : ''}</span>
        </div>
        <div className={`${styles.rolePill} ${styles.green}`}>
          <BookOpen size={14} />
          <span>{teacherCount} Teacher{teacherCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Team Members List */}
      <div className={styles.teamCard}>
        <ul className={styles.memberList}>
          {members.map((member) => (
            <li key={member.id} className={styles.memberItem}>
              <div className={styles.memberInfo}>
                <div className={styles.avatar}>
                  <User size={18} />
                </div>
                <div>
                  <span className={styles.memberName}>
                    {member.user?.full_name || member.user?.username || 'Unknown'}
                  </span>
                  <span className={styles.memberEmail}>
                    {member.user?.email}
                    {member.user?.username && ` (@${member.user.username})`}
                  </span>
                </div>
              </div>

              <div className={styles.memberActions}>
                <span className={`${styles.roleBadge} ${styles[roleColors[member.role]]}`}>
                  {roleIcons[member.role]}
                  {roleLabels[member.role]}
                </span>

                {canManageMember(member) && (
                  <div className={styles.actionsWrapper}>
                    <button 
                      className={styles.moreBtn}
                      onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === member.id && (
                      <div className={styles.actionsMenu}>
                        {canPromote(member) && (
                          <button onClick={() => { setConfirmAction({ type: 'promote', member }); setOpenMenuId(null); }}>
                            <ArrowUpCircle size={14} />
                            Promote to Admin
                          </button>
                        )}
                        {canDemote(member) && (
                          <button onClick={() => { setConfirmAction({ type: 'demote', member }); setOpenMenuId(null); }}>
                            <ArrowDownCircle size={14} />
                            Demote to Teacher
                          </button>
                        )}
                        <button 
                          className={styles.dangerAction}
                          onClick={() => { setConfirmAction({ type: 'remove', member }); setOpenMenuId(null); }}
                        >
                          <Trash2 size={14} />
                          Remove Member
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div className={styles.menuBackdrop} onClick={() => setOpenMenuId(null)} />
      )}

      {/* Confirmation Modal */}
      {confirmAction && getConfirmProps() && (
        <ConfirmModal
          {...getConfirmProps()!}
          isLoading={actionLoading}
          onConfirm={confirmAction.type === 'remove' ? handleRemoveMember : handleChangeRole}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal 
          instituteId={institute?.id || ''}
          isOwner={isOwner}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// ─── Invite Modal (existing) ────────────────────────────────────────────────
interface InviteModalProps {
  instituteId: string;
  isOwner: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function InviteModal({ instituteId, isOwner, onClose, onSuccess }: InviteModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher'>('teacher');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!identifier.trim()) {
      setError('Please enter a username, email, or user ID');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const searchValue = identifier.trim();

    const { data: result, error: rpcError } = await supabase
      .rpc('find_user_for_invite', { p_identifier: searchValue })
      .single() as unknown as { data: { found_in: string; user_id: string | null } | null; error: Error | null };

    if (rpcError) {
      setError('Error searching for user. Please try again.');
      setIsLoading(false);
      return;
    }

    if (!result || result.found_in === 'not_found' || !result.user_id) {
      const isEmail = searchValue.includes('@');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchValue);
      const identifierType = isUUID ? 'User ID' : isEmail ? 'email' : 'username';
      setError(`No user found with ${identifierType} "${searchValue}". Make sure they have signed up.`);
      setIsLoading(false);
      return;
    }

    const { data: existingRole } = await supabase
      .from('user_institute_roles')
      .select('id')
      .eq('institute_id', instituteId)
      .eq('user_id', result.user_id)
      .maybeSingle();

    if (existingRole) {
      setError('This user is already a member of your institute');
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('user_institute_roles')
      .insert({
        institute_id: instituteId,
        user_id: result.user_id,
        role: role,
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
          <h2>Add Team Member</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <Input
            type="text"
            label="Username, Email, or User ID"
            placeholder="john_doe, john@example.com, or UUID"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<User size={18} />}
            error={error}
            required
            fullWidth
          />

          <div className={styles.roleSelector}>
            <label className={styles.roleSelectorLabel}>Role</label>
            <div className={styles.roleButtons}>
              {isOwner && (
                <button
                  type="button"
                  className={`${styles.roleBtn} ${role === 'admin' ? styles.active : ''}`}
                  onClick={() => setRole('admin')}
                >
                  <Shield size={16} />
                  Admin
                </button>
              )}
              <button
                type="button"
                className={`${styles.roleBtn} ${role === 'teacher' ? styles.active : ''}`}
                onClick={() => setRole('teacher')}
              >
                <BookOpen size={16} />
                Teacher
              </button>
            </div>
            <p className={styles.roleHint}>
              {role === 'admin' 
                ? 'Admins can manage students, batches, and fees'
                : 'Teachers can view their assigned batches and students'}
            </p>
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Add Member
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
