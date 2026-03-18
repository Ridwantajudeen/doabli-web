import {
  ClipboardList,
  Handshake,
  ShieldCheck,
  MessageCircle,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

export default function HowItWorks() {
  const { theme, isDark } = useTheme();
  const cardBg = isDark ? '#1f1c2c' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,28,43,0.12)';

  const steps = [
    {
      title: 'Create your account',
      desc: 'Join as a client or runner in minutes.',
      icon: ClipboardList,
    },
    {
      title: 'Post or apply',
      desc: 'Clients post errands, runners apply with offers.',
      icon: Handshake,
    },
    {
      title: 'Secure payment',
      desc: 'Funds are held safely in escrow until completion.',
      icon: Wallet,
    },
    {
      title: 'Work together',
      desc: 'Chat in-app, track progress, and stay aligned.',
      icon: MessageCircle,
    },
    {
      title: 'Complete & confirm',
      desc: 'Runner completes the task, client confirms.',
      icon: ShieldCheck,
    },
    {
      title: 'Release funds',
      desc: 'Payment releases when everyone is satisfied.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section
      id="how"
      style={{
        background: theme.background,
        color: theme.title,
        padding: '90px 32px',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How Doabli Works</h2>
          <p className="max-w-2xl text-base sm:text-lg" style={{ color: theme.text }}>
            A simple, structured flow that keeps expectations clear from start
            to finish.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group rounded-2xl p-6 transition hover:-translate-y-1"
              style={{ border: `1px solid ${cardBorder}`, background: cardBg }}
            >
              <div className="flex items-center justify-between" style={{ color: theme.text }}>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: isDark ? 'rgba(255,255,255,0.1)' : theme.uiBackground, color: Colors.primary }}
                >
                  <step.icon size={18} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: theme.title }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: theme.text }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

