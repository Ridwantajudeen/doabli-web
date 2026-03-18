import {
  BadgeCheck,
  ShieldCheck,
  Handshake,
  MessagesSquare,
  Wallet,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

export default function Features() {
  const { theme, isDark } = useTheme();
  const cardBg = isDark ? '#1f1c2c' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,28,43,0.12)';

  const items = [
    {
      title: 'Verified Runners',
      desc: 'Identity checks, ratings, and KYC for higher limits keep the market safe.',
      icon: BadgeCheck,
    },
    {
      title: 'Escrow-First Payments',
      desc: 'Clients fund tasks securely. Funds release only after completion.',
      icon: Wallet,
    },
    {
      title: 'Clear Task Flow',
      desc: 'Post, accept, track, and close every job with a structured workflow.',
      icon: ShieldCheck,
    },
    {
      title: 'Negotiation Built-In',
      desc: 'Runners can apply, discuss, and agree on terms before starting.',
      icon: Handshake,
    },
    {
      title: 'In-App Communication',
      desc: 'Messages stay inside Doabli with accountability and activity tracking.',
      icon: MessagesSquare,
    },
    {
      title: 'Reliable Opportunities',
      desc: 'Runners get steady access to clients who need help now.',
      icon: UserPlus,
    },
  ];

  return (
    <section
      id="features"
      style={{
        background: theme.uiBackground,
        padding: '90px 32px',
        color: theme.title,
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-4 text-center">
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ border: `1px solid ${cardBorder}`, background: cardBg, color: theme.text }}
          >
            <Sparkles size={14} />
            Why Doabli
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Built for trust, speed, and clarity.
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg" style={{ color: theme.text }}>
            Doabli removes the guesswork from errands by structuring payments,
            communication, and task tracking for both clients and runners.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 shadow-lg"
              style={{ border: `1px solid ${cardBorder}`, background: cardBg }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: isDark ? 'rgba(255,255,255,0.1)' : theme.uiBackground, color: Colors.primary }}
              >
                <f.icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm" style={{ color: theme.text }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div
          className="grid gap-6 rounded-3xl p-8 lg:grid-cols-2"
          style={{ border: `1px solid ${cardBorder}`, background: cardBg }}
        >
          <div>
            <h3 className="text-2xl font-semibold">For Clients</h3>
            <p className="mt-3 text-sm" style={{ color: theme.text }}>
              Post tasks confidently, set clear budgets, and pay securely through
              escrow. You stay in control from posting to confirmation.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">For Runners</h3>
            <p className="mt-3 text-sm" style={{ color: theme.text }}>
              Apply for real opportunities, negotiate fairly, and build a
              reputation in a trusted marketplace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

