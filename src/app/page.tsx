'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import GooWriteLogo from '@/components/ui/GooWriteLogo';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  ClipboardCheck,
  BookOpen,
  Shield,
  ArrowRight,
  CheckCircle,
  Zap,
  BarChart3,
  UserPlus,
} from 'lucide-react';
import styles from './page.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const features = [
  {
    icon: <Users size={24} />,
    title: 'Student Management',
    desc: 'Add students, assign to batches, track their journey from admission to graduation.',
    color: '#818cf8',
  },
  {
    icon: <GraduationCap size={24} />,
    title: 'Courses & Batches',
    desc: 'Create courses, organize batches with schedules, and manage capacity effortlessly.',
    color: '#c084fc',
  },
  {
    icon: <ClipboardCheck size={24} />,
    title: 'Attendance Tracking',
    desc: 'Mark attendance in seconds. Present, absent, or late — with instant summaries.',
    color: '#34d399',
  },
  {
    icon: <CreditCard size={24} />,
    title: 'Fee Collection',
    desc: 'Record payments, track dues, and see who owes what — no more spreadsheets.',
    color: '#fbbf24',
  },
  {
    icon: <BookOpen size={24} />,
    title: 'Tests & Marks',
    desc: 'Create tests, enter marks per student, and track academic performance over time.',
    color: '#fb7185',
  },
  {
    icon: <Shield size={24} />,
    title: 'Team & Permissions',
    desc: 'Add admins and teachers. Control who can see fees, who can mark attendance, and more.',
    color: '#38bdf8',
  },
];

const steps = [
  {
    num: '01',
    title: 'Create your Institute',
    desc: 'Sign up and create your coaching institute in under a minute. You become the owner.',
  },
  {
    num: '02',
    title: 'Add Courses & Batches',
    desc: 'Set up the courses you teach and create batches with schedules for each.',
  },
  {
    num: '03',
    title: 'Enroll Students',
    desc: 'Add students and assign them to batches. Track their fees and attendance from day one.',
  },
  {
    num: '04',
    title: 'Manage Everything',
    desc: 'Mark attendance, collect fees, enter marks, and manage your team — all from one dashboard.',
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ─── Navbar ───────────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>
            <GooWriteLogo size={20} />
            <span>Goo Write</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/login" className={styles.navLink}>Log in</Link>
            <Link href="/signup" className={styles.navCta}>
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroOrbs}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
        </div>

        <motion.div 
          className={styles.heroContent}
          initial="hidden"
          animate="visible"
        >
          <motion.div className={styles.heroBadge} variants={fadeUp} custom={0}>
            <Zap size={14} />
            Built for Indian Coaching Institutes
          </motion.div>

          <motion.h1 className={styles.heroTitle} variants={fadeUp} custom={1}>
            Stop managing your institute on{' '}
            <span className={styles.heroGradient}>WhatsApp & spreadsheets</span>
          </motion.h1>

          <motion.p className={styles.heroSubtitle} variants={fadeUp} custom={2}>
            Goo Write is the all-in-one operating system for coaching centers. 
            Students, batches, attendance, fees, tests, team — everything in one 
            beautiful dashboard.
          </motion.p>

          <motion.div className={styles.heroCtas} variants={fadeUp} custom={3}>
            <Link href="/signup" className={styles.primaryBtn}>
              Start Free <ArrowRight size={18} />
            </Link>
            <a href="#features" className={styles.secondaryBtn}>
              See Features
            </a>
          </motion.div>

          <motion.div className={styles.heroStats} variants={fadeUp} custom={4}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>100%</span>
              <span className={styles.heroStatLabel}>Free to start</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>2 min</span>
              <span className={styles.heroStatLabel}>Setup time</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>∞</span>
              <span className={styles.heroStatLabel}>Students</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section className={styles.features} id="features">
        <motion.div 
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className={styles.sectionLabel}>Features</span>
          <h2 className={styles.sectionTitle}>
            Everything you need.{' '}
            <span className={styles.titleMuted}>Nothing you don&apos;t.</span>
          </h2>
          <p className={styles.sectionDesc}>
            Replace 5 different apps with one. No training needed — if you can use WhatsApp, you can use Goo Write.
          </p>
        </motion.div>

        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <motion.div 
              key={f.title}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <div className={styles.featureIcon} style={{ color: f.color, borderColor: `${f.color}33`, background: `${f.color}0D` }}>
                {f.icon}
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <section className={styles.howItWorks}>
        <motion.div 
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className={styles.sectionLabel}>How it works</span>
          <h2 className={styles.sectionTitle}>
            Up and running in{' '}
            <span className={styles.heroGradient}>4 simple steps</span>
          </h2>
        </motion.div>

        <div className={styles.stepsGrid}>
          {steps.map((s, i) => (
            <motion.div 
              key={s.num}
              className={styles.stepCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <span className={styles.stepNum}>{s.num}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Roles Section ───────────────────────────────────────────────── */}
      <section className={styles.rolesSection}>
        <motion.div 
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className={styles.sectionLabel}>Team Roles</span>
          <h2 className={styles.sectionTitle}>
            Right access for the{' '}
            <span className={styles.titleMuted}>right people</span>
          </h2>
          <p className={styles.sectionDesc}>
            Owners, Admins, and Teachers each see only what they need. No confusion, no data leaks.
          </p>
        </motion.div>

        <motion.div 
          className={styles.rolesGrid}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.roleCard}>
            <div className={`${styles.roleIcon} ${styles.rolePurple}`}><Shield size={20} /></div>
            <h3>Owner</h3>
            <ul>
              <li><CheckCircle size={14} /> Full control over everything</li>
              <li><CheckCircle size={14} /> Add/remove admins & teachers</li>
              <li><CheckCircle size={14} /> View fees & financial data</li>
              <li><CheckCircle size={14} /> Delete institute</li>
            </ul>
          </div>
          <div className={styles.roleCard}>
            <div className={`${styles.roleIcon} ${styles.roleBlue}`}><Shield size={20} /></div>
            <h3>Admin</h3>
            <ul>
              <li><CheckCircle size={14} /> Manage students & batches</li>
              <li><CheckCircle size={14} /> Collect fees & track dues</li>
              <li><CheckCircle size={14} /> Add teachers</li>
              <li><CheckCircle size={14} /> Mark attendance & grades</li>
            </ul>
          </div>
          <div className={styles.roleCard}>
            <div className={`${styles.roleIcon} ${styles.roleGreen}`}><BookOpen size={20} /></div>
            <h3>Teacher</h3>
            <ul>
              <li><CheckCircle size={14} /> View assigned batches</li>
              <li><CheckCircle size={14} /> Mark attendance</li>
              <li><CheckCircle size={14} /> Enter test marks</li>
              <li><CheckCircle size={14} /> View student info</li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <motion.div 
          className={styles.ctaContent}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.ctaOrb} />
          <h2 className={styles.ctaTitle}>
            Ready to modernize your coaching institute?
          </h2>
          <p className={styles.ctaDesc}>
            Join hundreds of coaching centers that stopped juggling apps and started growing with Goo Write.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/signup" className={styles.primaryBtn}>
              <UserPlus size={18} /> Create Free Account
            </Link>
          </div>
          <p className={styles.ctaNote}>No credit card required · Setup in 2 minutes</p>
        </motion.div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <GooWriteLogo size={18} />
            <span>Goo Write</span>
          </div>
          <p className={styles.footerText}>
            © {new Date().getFullYear()} Goo Write. The operating system for coaching institutes.
          </p>
        </div>
      </footer>
    </div>
  );
}
