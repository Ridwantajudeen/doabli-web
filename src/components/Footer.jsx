import { useState } from 'react';
import { Colors } from '../constants/colors';

export default function Footer() {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? Colors.dark : Colors.light;

  const links = {
    Product: ['Features', 'Pricing', 'Security', 'Roadmap'],
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Legal: ['Privacy', 'Terms', 'Cookies', 'Licenses'],
    Social: ['Twitter', 'LinkedIn', 'Instagram', 'GitHub'],
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
            <h3 style={{ color: Colors.primary }} className="text-2xl font-bold mb-2">
              Doabli
            </h3>
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
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm hover:opacity-100 opacity-75 transition-opacity"
                    >
                      {item}
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
            &copy; 2024 Doabli. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:opacity-100 opacity-75 transition-opacity">
              Privacy Policy
            </a>
            <a href="#" className="hover:opacity-100 opacity-75 transition-opacity">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
