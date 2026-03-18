import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  MessageSquare,
  BadgeCheck,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import Button from './Button';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const cardBg = isDark ? '#1f1c2c' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,28,43,0.12)';
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(31,28,43,0.05)';
  const chipText = isDark ? 'rgba(255,255,255,0.7)' : theme.text;
  const chipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,28,43,0.12)';
  const subtleText = isDark ? 'rgba(255,255,255,0.7)' : theme.text;

  return (
    <section
      id="home"
      style={{
        backgroundColor: theme.background,
        minHeight: 'calc(100vh - 64px)',
        marginTop: '64px',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="flex items-center justify-center px-4 sm:px-6 lg:px-10"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="text-left">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease-out',
              border: `1px solid ${chipBorder}`,
              background: chipBg,
              color: chipText,
            }}
          >
            <Sparkles size={14} />
            Doabli Marketplace
          </div>

          <h1
            style={{
              color: theme.title,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease-out 0.05s',
            }}
            className="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
          >
            Do it fast.
            <span className="block" style={{ color: subtleText }}>
              Do it right.
            </span>
            <span style={{ color: Colors.primary }}>Doabli.</span>
          </h1>

          <p
            style={{
              color: theme.text,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease-out 0.12s',
            }}
            className="mt-6 text-lg leading-relaxed sm:text-xl"
          >
            From quick errands to home services, tech and digital work, and
            everything in between, Doabli connects you with trusted people who
            deliver without the stress. Clear budgets, safe payments, and a
            structured task flow are built in.
          </p>

          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease-out 0.2s',
            }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/signup">
              <Button
                variant="primary"
                size="lg"
                className="flex items-center gap-2"
              >
                Post an errand
                <ArrowUpRight size={18} />
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="secondary" size="lg">
                Become a runner
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            {[
              { label: 'Escrow protected', icon: ShieldCheck },
              { label: 'Verified runners', icon: BadgeCheck },
              { label: 'In-app chat', icon: MessageSquare },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-full px-3 py-2"
                style={{
                  border: `1px solid ${chipBorder}`,
                  background: chipBg,
                  color: chipText,
                }}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.9s ease-out 0.18s',
          }}
          className="relative"
        >
          <div
            className="absolute -left-8 -top-8 h-24 w-24 rounded-3xl blur-xl"
            style={{ background: chipBg }}
          />
          <div
            className="rounded-3xl p-6 shadow-2xl"
            style={{ border: `1px solid ${cardBorder}`, background: chipBg }}
          >
            <div
              className="rounded-2xl p-4"
              style={{ border: `1px solid ${cardBorder}`, background: cardBg }}
            >
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: subtleText }}>
                Task Preview
              </p>
              <h3 className="mt-3 text-lg font-semibold" style={{ color: theme.title }}>
                Grocery run + pharmacy pickup
              </h3>
              <p className="mt-2 text-sm" style={{ color: theme.text }}>
                Budget NGN 5,500 - Same day - Required items listed
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Escrow ready', 'Runner shortlisted', 'Chat enabled'].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full px-3 py-1 text-xs"
                      style={{
                        border: `1px solid ${cardBorder}`,
                        background: chipBg,
                        color: chipText,
                      }}
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {[
                {
                  title: 'Runner accepted',
                  desc: 'Verified, with required KYC.',
                },
                {
                  title: 'Payment secured',
                  desc: 'Funds held safely in escrow.',
                },
                {
                  title: 'Task completed',
                  desc: 'Client confirms before release.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl px-4 py-3"
                  style={{
                    border: `1px solid ${cardBorder}`,
                    background: chipBg,
                  }}
                >
                  <div
                    className="mt-1 h-2 w-2 rounded-full"
                    style={{ background: isDark ? 'rgba(255,255,255,0.8)' : Colors.primary }}
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: theme.title }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: theme.text }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
