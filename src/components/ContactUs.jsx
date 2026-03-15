import { useNavigate } from 'react-router-dom';
import { Colors } from '../constants/colors';
import Button from './Button';

export default function ContactUs() {
  const navigate = useNavigate();

  return (
    <section
      id="contact"
      style={{
        background: Colors.dark.uiBackground,
        color: Colors.dark.title,
        padding: '70px 32px',
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 36, marginBottom: 12 }}>Contact Us</h2>
          <p style={{ color: Colors.dark.text, maxWidth: 640, margin: '0 auto' }}>
            Need help or have a question? Email us or send a message and our team will respond.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
          <div style={{ background: Colors.dark.background, padding: 24, borderRadius: 14 }}>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>Email Support</h3>
            <p style={{ color: Colors.dark.text, marginBottom: 16 }}>
              Reach us directly and we will respond as soon as possible.
            </p>
            <a
              href="mailto:support@doabli.com"
              style={{
                color: Colors.primary,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
              }}
            >
              support@doabli.com
            </a>
          </div>

          <div
            style={{
              background: Colors.dark.background,
              padding: 24,
              borderRadius: 14,
              display: 'grid',
              gap: 14,
            }}
          >
            <h3 style={{ fontSize: 20, marginBottom: 4 }}>Need Help?</h3>
            <p style={{ color: Colors.dark.text, marginBottom: 8 }}>
              Support messages are available inside your dashboard after login.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/login')}
            >
              Log In to Contact Support
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
