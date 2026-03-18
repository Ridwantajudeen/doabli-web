import {
  ShieldCheck,
  BadgeCheck,
  Lock,
  Gavel,
  Wallet,
} from 'lucide-react';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

export default function TrustSafety() {
  const { theme, isDark } = useTheme();
  const cardBg = isDark ? '#1f1c2c' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,28,43,0.12)';

  const items = [
    {
      title: 'Escrow-First Payments',
      desc: 'Funds are held securely until the task is completed and confirmed.',
      icon: Wallet,
    },
    {
      title: 'Verified Identities',
      desc: 'Identity and bank verification reduce risk and improve accountability.',
      icon: BadgeCheck,
    },
    {
      title: 'Controlled Contact',
      desc: 'Personal details are shared only within active tasks when needed.',
      icon: Lock,
    },
    {
      title: 'Dispute Resolution',
      desc: 'Structured reviews ensure issues are handled fairly and consistently.',
      icon: Gavel,
    },
  ];

  return (
    <section
      id="trust"
      style={{
        background: theme.uiBackground,
        color: theme.title,
        padding: '90px 32px',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-4 text-center">
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ border: `1px solid ${cardBorder}`, background: cardBg, color: theme.text }}
          >
            <ShieldCheck size={14} />
            Trust & Safety
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Protection built into every step.
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg" style={{ color: theme.text }}>
            Doabli keeps transactions safe and expectations clear with layered
            verification, escrow, and accountability tools.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl p-6"
              style={{ border: `1px solid ${cardBorder}`, background: cardBg }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: isDark ? 'rgba(255,255,255,0.1)' : theme.uiBackground, color: Colors.primary }}
              >
                <item.icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm" style={{ color: theme.text }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
