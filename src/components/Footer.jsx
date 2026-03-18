import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/colors';
import BrandLogo from './BrandLogo';
import { FaInstagram, FaXTwitter, FaFacebookF } from 'react-icons/fa6';

export default function Footer() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const currentYear = new Date().getFullYear();

  const links = {
    Product: [
      { label: 'Features', href: '/#features' },
      { label: 'How It Works', href: '/#how' },
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/#contact' },
    ],
    Legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Data Policy', href: '/data-policy' },
      { label: 'Refunds', href: '/refunds' },
    ],
    Social: [
      { label: 'Instagram', href: 'https://www.instagram.com/doabliapp?igsh=YW5tc3BhNmJqbGZu&utm_source=qr', icon: FaInstagram },
      { label: 'X (Twitter)', href: 'https://x.com/doabliapp?s=21', icon: FaXTwitter },
      { label: 'Facebook', href: 'https://www.facebook.com/share/18MC368Shp/?mibextid=LQQJ4d', icon: FaFacebookF },
    ],
    Support: [
      { label: 'support@doabli.com', href: 'mailto:support@doabli.com' },
    ],
  };

  return (
    <footer
      style={{
        backgroundColor: colors.navBackground,
        borderTop: `1px solid ${colors.uiBackground}`,
        color: colors.text,
      }}
      className="px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div>
            <BrandLogo width={120} height={32} />
            <p className="text-sm opacity-75">
              Your trusted platform for everyday errands.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 style={{ color: colors.title }} className="font-bold mb-4">
                {category}
              </h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                      className="text-sm hover:opacity-100 opacity-75 transition-opacity"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {item.icon ? <item.icon size={16} /> : null}
                        {item.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{ borderColor: colors.uiBackground }}
          className="border-t my-8"
        />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="opacity-75">
            &copy; {currentYear} Doabli. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="/privacy" className="hover:opacity-100 opacity-75 transition-opacity">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:opacity-100 opacity-75 transition-opacity">
              Terms of Service
            </a>
            <a href="/data-policy" className="hover:opacity-100 opacity-75 transition-opacity">
              Data Policy
            </a>
            <a href="/refunds" className="hover:opacity-100 opacity-75 transition-opacity">
              Refunds
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
