'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import GooWriteLogo from '@/components/ui/GooWriteLogo';
import { Button, Input, GlassCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      {/* Background orbs */}
      <div className={styles.backgroundOrbs}>
        <motion.div 
          className={styles.orb1}
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className={styles.orb2}
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={styles.formWrapper}
      >
        <GlassCard variant="elevated" padding="lg" className={styles.card}>
          {sent ? (
            /* Success state */
            <div className={styles.successState}>
              <motion.div 
                className={styles.successIcon}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle size={40} />
              </motion.div>
              <h1 className={styles.title}>Check your email</h1>
              <p className={styles.subtitle}>
                We&apos;ve sent a password reset link to <strong>{email}</strong>. 
                Click the link in the email to reset your password.
              </p>
              <p className={styles.hint}>
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <div className={styles.actions}>
                <Button variant="secondary" onClick={() => setSent(false)}>
                  Try again
                </Button>
                <Link href="/login">
                  <Button variant="primary" rightIcon={<ArrowRight size={18} />}>
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Form state */
            <>
              <div className={styles.header}>
                <motion.div 
                  className={styles.logo}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <GooWriteLogo size={32} />
                </motion.div>
                <h1 className={styles.title}>Reset password</h1>
                <p className={styles.subtitle}>
                  Enter your email and we&apos;ll send you a link to reset your password
                </p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail size={18} />}
                  error={error}
                  required
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight size={18} />}
                  fullWidth
                >
                  Send reset link
                </Button>
              </form>

              <Link href="/login" className={styles.backLink}>
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
