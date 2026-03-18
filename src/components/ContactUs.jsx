import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Mail } from 'lucide-react';
import { Colors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import Button from './Button';

export default function ContactUs() {
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const cardBg = isDark ? '#1f1c2c' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,28,43,0.12)';

  return (
    <section
      id="contact"
      style={{
        background: theme.uiBackground,
        color: theme.title,
        padding: '90px 32px',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div
          className="rounded-3xl p-8 shadow-2xl md:p-10"
          style={{ border: `1px solid ${cardBorder}`, background: cardBg }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ready to get more done with Doabli?
              </h2>
              <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: theme.text }}>
                Post your first errand in minutes or apply to nearby tasks.
                Everything is structured, secure, and built for clarity.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2"
            >
              Create your account
              <ArrowUpRight size={18} />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${cardBorder}`, background: cardBg }}>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : theme.uiBackground, color: Colors.primary }}
            >
              <Mail size={18} />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Email Support</h3>
            <p className="mt-2 text-sm" style={{ color: theme.text }}>
              Reach us directly and we will respond as soon as possible.
            </p>
            <a
              href="mailto:support@doabli.com"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: theme.title }}
            >
              support@doabli.com
              <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="rounded-2xl p-6" style={{ border: `1px solid ${cardBorder}`, background: cardBg }}>
            <h3 className="text-lg font-semibold">Need Help?</h3>
            <p className="mt-2 text-sm" style={{ color: theme.text }}>
              Support messages are available inside your dashboard after login.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/login')}
              className="mt-4"
            >
              Log In to Contact Support
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
