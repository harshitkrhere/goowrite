'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Copy,
  Check,
  Loader2,
  Save,
} from 'lucide-react';
import { GlassCard, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('id, email, username, full_name')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setUser(data);
        setUsername(data.username || '');
        setFullName(data.full_name || '');
      } else {
        // User exists in auth but not in users table
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          username: null,
          full_name: authUser.user_metadata?.full_name || null,
        });
        setFullName(authUser.user_metadata?.full_name || '');
      }
      
      setLoading(false);
    }

    fetchProfile();
  }, []);

  // Check username availability
  useEffect(() => {
    if (!username || username.length < 3 || username === user?.username) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      const supabase = createClient();
      
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', user?.id || '')
        .single();
      
      setIsAvailable(!data);
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, user?.username, user?.id]);

  const handleCopyId = async () => {
    if (user?.id) {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (username && username.length < 3) {
      setError('Username must be at least 3 characters');
      setSaving(false);
      return;
    }

    if (username !== user?.username && isAvailable === false) {
      setError('This username is already taken');
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      setError('You must be logged in');
      setSaving(false);
      return;
    }

    // Check if user record exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single();

    const updateData = {
      username: username.toLowerCase().trim() || null,
      full_name: fullName.trim() || null,
    };

    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', authUser.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          ...updateData,
        });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profile Settings</h1>
        <p className={styles.pageSubtitle}>Manage your account information</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <GlassCard variant="elevated" padding="lg" className={styles.profileCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              <User size={32} />
            </div>
            <div>
              <h2 className={styles.userName}>{fullName || 'User'}</h2>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>

          {/* User ID Section */}
          <div className={styles.section}>
            <label className={styles.label}>User ID</label>
            <div className={styles.idWrapper}>
              <code className={styles.userId}>{user?.id}</code>
              <button className={styles.copyBtn} onClick={handleCopyId}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className={styles.hint}>Share this ID to let others add you to their institute</p>
          </div>

          <form onSubmit={handleSave} className={styles.form}>
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
            />

            <Input
              type="text"
              label="Username"
              placeholder="john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              leftIcon={<User size={18} />}
              rightIcon={
                isChecking ? (
                  <Loader2 size={18} className={styles.spinnerSmall} />
                ) : isAvailable === true ? (
                  <Check size={18} className={styles.available} />
                ) : isAvailable === false ? (
                  <span className={styles.unavailable}>Taken</span>
                ) : null
              }
              hint="Only lowercase letters, numbers, and underscores"
              fullWidth
            />

            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}

            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              leftIcon={saving ? undefined : <Save size={18} />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
