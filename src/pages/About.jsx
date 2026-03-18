import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ShieldCheck,
  BadgeCheck,
  Handshake,
  MessageSquare,
  Lock,
  Landmark,
  ClipboardCheck,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const solutionPoints = [
  'Clients can post errands with clear details and budgets',
  'Runners can apply, negotiate, and accept jobs',
  'Communication happens within the platform',
  'Payments are handled securely through escrow',
  'Tasks are tracked from start to completion',
];

const trustLayers = [
  {
    title: 'Secure Payments',
    description:
      'All payments are processed through trusted providers and held in escrow until tasks are completed.',
    icon: Landmark,
  },
  {
    title: 'Verification Systems',
    description:
      'User identity and bank details are verified, with KYC required for higher transaction limits.',
    icon: BadgeCheck,
  },
  {
    title: 'Controlled Contact Sharing',
    description:
      'Personal contact details are only shared when necessary and within active tasks.',
    icon: Lock,
  },
  {
    title: 'Dispute Resolution',
    description:
      'A structured system allows issues to be reviewed and resolved fairly.',
    icon: Handshake,
  },
  {
    title: 'Activity Tracking',
    description:
      'Messages, task updates, and transactions are recorded to maintain accountability.',
    icon: ClipboardCheck,
  },
];

const steps = [
  'A client posts a task',
  'Runners apply or make offers',
  'A runner is selected and the task begins',
  'Payment is secured in escrow',
  'The runner completes the task',
  'The client confirms, and funds are released',
];

const hexToRgba = (hex, alpha) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function About() {
  const { isDark, theme, Colors } = useTheme();
  const accent = Colors.primary;
  const accentGlow = hexToRgba(accent, isDark ? 0.45 : 0.3);
  const accentGlowSoft = hexToRgba(accent, isDark ? 0.25 : 0.18);
  const muted = isDark ? 'rgba(212,212,212,0.75)' : '#6a677a';
  const subtle = isDark ? 'rgba(212,212,212,0.6)' : '#8a86a0';
  const card = isDark ? 'rgba(32,30,43,0.9)' : 'rgba(255,255,255,0.9)';
  const panel = isDark ? 'rgba(32,30,43,0.7)' : 'rgba(255,255,255,0.7)';
  const chip = isDark ? 'rgba(47,43,61,0.8)' : 'rgba(255,255,255,0.75)';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(32,30,43,0.12)';
  const ink = isDark ? '#1a1530' : '#1b1427';

  return (
    <main
      className="about-page relative min-h-screen overflow-hidden"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        '--about-bg': theme.background,
        '--about-title': theme.title,
        '--about-text': theme.text,
        '--about-muted': muted,
        '--about-subtle': subtle,
        '--about-card': card,
        '--about-panel': panel,
        '--about-chip': chip,
        '--about-border': border,
        '--about-primary': accent,
        '--about-primary-soft': accentGlowSoft,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Manrope:wght@300;400;500;600;700&display=swap');
        .about-page { font-family: 'Manrope', system-ui, sans-serif; background: var(--about-bg); color: var(--about-text); }
        .about-title { font-family: 'Bricolage Grotesque', 'Manrope', system-ui, sans-serif; letter-spacing: -0.02em; color: var(--about-title); }
        .about-muted { color: var(--about-muted); }
        .about-subtle { color: var(--about-subtle); }
        .about-card { background: var(--about-card); border: 1px solid var(--about-border); box-shadow: 0 24px 60px rgba(20, 16, 32, 0.22); }
        .about-panel { background: var(--about-panel); border: 1px solid var(--about-border); }
        .about-chip { background: var(--about-chip); border: 1px solid var(--about-border); }
      `}</style>

      <div
        className="pointer-events-none absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle at center, ${accentGlow}, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute top-40 left-[-8%] h-[360px] w-[360px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle at center, ${accentGlowSoft}, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-20%] right-1/4 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle at center, ${hexToRgba(accent, isDark ? 0.3 : 0.2)}, transparent 70%)`,
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
        <BrandLogo width={130} height={34} variant={isDark ? 'light' : 'dark'} />
        <nav
          className="hidden items-center gap-6 text-sm font-semibold md:flex"
          style={{ color: theme.title }}
        >
          <Link className="transition hover:opacity-80" to="/">
            Home
          </Link>
          <Link className="transition hover:opacity-80" to="/login">
            Sign In
          </Link>
          <Link
            to="/signup"
            className="about-chip rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-16 lg:flex-row lg:items-center lg:pt-24">
        <motion.div
          className="flex-1"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          variants={fadeUp}
        >
          <p className="about-chip about-subtle inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
            About Doabli <ArrowUpRight size={14} />
          </p>
          <h1 className="about-title mt-6 text-4xl font-semibold leading-tight md:text-5xl">
            A trusted marketplace for errands, built to feel effortless for
            clients and empowering for runners.
          </h1>
          <p className="about-muted mt-5 text-lg leading-relaxed">
            Doabli is a digital marketplace that connects people who need help
            with everyday tasks to reliable individuals who can complete them.
            From small errands to more involved jobs, Doabli provides a
            structured and secure way for clients and runners to work together
            with confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              style={{
                backgroundColor: accent,
                boxShadow: `0 18px 40px ${hexToRgba(accent, 0.25)}`,
              }}
            >
              Start with Doabli
            </Link>
            <Link
              to="/"
              className="about-panel rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
            >
              Explore the platform
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="about-card flex-1 rounded-[32px] p-8 md:p-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          variants={fadeUp}
        >
          <h2 className="about-title text-2xl font-semibold">
            The Problem We&apos;re Solving
          </h2>
          <p className="about-muted mt-4 leading-relaxed">
            Getting things done shouldn&apos;t be stressful. Many people struggle
            to find trustworthy help for errands, while others are willing and
            capable but lack access to opportunities. Informal arrangements
            often lead to uncertainty, lack of accountability, and disputes.
          </p>
          <p className="about-muted mt-4 leading-relaxed">
            Doabli exists to remove that friction by creating a system where
            both sides can engage with clarity, structure, and protection.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Clear Expectations', icon: ShieldCheck },
                { label: 'Reliable Outcomes', icon: Handshake },
                { label: 'Secure Communication', icon: MessageSquare },
                { label: 'Protected Payments', icon: Landmark },
              ].map((item) => (
              <div
                key={item.label}
                className="about-chip flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                <item.icon size={18} style={{ color: accent }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
        <motion.div
          className="grid gap-8 lg:grid-cols-[1.2fr_1fr]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          variants={fadeUp}
        >
          <div>
            <h2 className="about-title text-3xl font-semibold">
              Our Solution
            </h2>
            <p className="about-muted mt-4 text-lg leading-relaxed">
              Doabli provides a complete workflow for task management by
              structuring every step of the process so expectations stay clear
              and outcomes remain fair.
            </p>
            <ul className="mt-6 space-y-3 text-sm font-medium">
              {solutionPoints.map((item) => (
                <li
                  key={item}
                  className="about-panel flex items-start gap-3 rounded-2xl px-4 py-3 shadow-sm"
                >
                  <ShieldCheck size={18} className="mt-0.5" style={{ color: accent }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="about-card rounded-[28px] p-8">
            <h3 className="about-title text-xl font-semibold">
              Built on Trust and Security
            </h3>
            <p className="about-muted mt-3 text-sm leading-relaxed">
              Trust is at the core of everything we do. Doabli is designed with
              multiple layers of protection to ensure safe transactions and
              reliable interactions.
            </p>
            <div className="mt-6 space-y-4">
              {trustLayers.map((item) => (
                <div
                  key={item.title}
                  className="about-panel flex gap-4 rounded-2xl p-4"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: hexToRgba(accent, 0.15), color: accent }}
                  >
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: theme.title }}>
                      {item.title}
                    </p>
                    <p className="about-muted mt-1 text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
        <motion.div
          className="about-panel rounded-[32px] p-8 shadow-xl md:p-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          variants={fadeUp}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="about-title text-3xl font-semibold">
                How Doabli Works
              </h2>
              <p className="about-muted mt-3 text-sm">
                This process ensures that both parties are protected from start
                to finish.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
              Structured Workflow
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="about-panel flex h-full flex-col justify-between rounded-2xl p-5 shadow-sm"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {index + 1}
                </div>
                <p className="mt-4 text-sm font-medium">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
        <motion.div
          className="grid gap-8 lg:grid-cols-[1.1fr_1fr]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          variants={fadeUp}
        >
          <div className="about-card rounded-[28px] p-8">
            <h2 className="about-title text-2xl font-semibold">
              Our Vision
            </h2>
            <p className="about-muted mt-4 text-sm leading-relaxed">
              We believe access to reliable help should be simple, safe, and
              scalable. Doabli is building a system where people can confidently
              outsource tasks and where individuals can earn by providing value
              in a trusted environment.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {['Simple', 'Safe', 'Scalable', 'Human-Centered'].map((label) => (
                <span
                  key={label}
                  className="about-chip about-subtle rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div
            className="rounded-[28px] border p-8 text-white shadow-2xl"
            style={{ backgroundColor: ink, borderColor: border }}
          >
            <h2 className="about-title text-2xl font-semibold text-white">
              About the Team
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Doabli is built with a focus on creating practical, secure, and
              user-centered solutions. The goal is to combine simplicity with
              strong infrastructure, making it easy for anyone to use the
              platform while maintaining high standards for safety and
              reliability.
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-white/80">
              <ShieldCheck size={18} />
              Built with care for clients and runners alike.
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <motion.div
          className="about-card flex flex-col items-start gap-6 rounded-[32px] p-8 shadow-xl md:flex-row md:items-center md:justify-between md:p-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          variants={fadeUp}
        >
          <div>
            <h2 className="about-title text-2xl font-semibold">
              Ready to get more done with confidence?
            </h2>
            <p className="about-muted mt-3 text-sm">
              Join a trusted community where expectations are clear and outcomes
              are fair.
            </p>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            style={{
              backgroundColor: accent,
              boxShadow: `0 18px 40px ${hexToRgba(accent, 0.28)}`,
            }}
          >
            Create your account
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
