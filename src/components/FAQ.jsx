import { HelpCircle, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function FAQ() {
  const { theme, isDark } = useTheme();
  const cardBg = isDark ? '#1f1c2c' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,28,43,0.12)';

  const faqs = [
    {
      q: 'How do payments work?',
      a: 'Clients fund the task upfront. Funds are held in escrow and released only after the client confirms completion.',
    },
    {
      q: 'Can I negotiate the budget?',
      a: 'Yes. Runners can apply with an offer and clients can accept or counter before the task begins.',
    },
    {
      q: 'What happens if there is an issue?',
      a: 'We provide a structured dispute process with activity logs so issues can be reviewed fairly.',
    },
    {
      q: 'When are contact details shared?',
      a: 'Contact details are only shared inside active tasks when it is necessary to complete the job.',
    },
    {
      q: 'Who can become a runner?',
      a: 'Anyone who meets verification requirements can apply and earn by completing tasks.',
    },
  ];

  return (
    <section
      id="faq"
      style={{
        background: theme.background,
        color: theme.title,
        padding: '90px 32px',
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-4 text-center">
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ border: `1px solid ${cardBorder}`, background: cardBg, color: theme.text }}
          >
            <HelpCircle size={14} />
            FAQ
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Answers before you start.
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg" style={{ color: theme.text }}>
            Everything you need to know about how Doabli works and how you stay
            protected.
          </p>
        </div>

        <div className="grid gap-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl p-5 text-left"
              style={{ border: `1px solid ${cardBorder}`, background: cardBg }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                <span>{item.q}</span>
                <Plus
                  size={16}
                  className="transition group-open:rotate-45"
                  style={{ color: theme.text }}
                />
              </summary>
              <p className="mt-3 text-sm" style={{ color: theme.text }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
