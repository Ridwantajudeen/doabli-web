import { useState, useEffect } from 'react';
import { Colors } from '../constants/colors';
import Button from './Button';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
  ];

  const handleNavClick = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <nav
      style={{
        backgroundColor: scrolled ? colors.navBackground : 'transparent',
        borderBottom: scrolled ? `1px solid ${colors.uiBackground}` : 'none',
        transition: 'all 0.3s ease',
      }}
      className="fixed w-full top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div style={{ color: Colors.primary }} className="text-2xl font-bold">
            Errandly
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                style={{ color: colors.text }}
                className="hover:opacity-80 transition-opacity font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex gap-3">
            <Link to="/login">
            <Button variant="ghost" size="md">
              Sign In
            </Button>
            </Link>
            <Link to="/signup">
            <Button variant="primary" size="md">
              Sign Up
            </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex flex-col gap-1"
          >
            <div
              style={{
                width: '24px',
                height: '2px',
                backgroundColor: colors.text,
                transition: 'all 0.3s ease',
                transform: isOpen ? 'rotate(45deg) translateY(10px)' : 'none',
              }}
            />
            <div
              style={{
                width: '24px',
                height: '2px',
                backgroundColor: colors.text,
                opacity: isOpen ? 0 : 1,
                transition: 'all 0.3s ease',
              }}
            />
            <div
              style={{
                width: '24px',
                height: '2px',
                backgroundColor: colors.text,
                transition: 'all 0.3s ease',
                transform: isOpen ? 'rotate(-45deg) translateY(-10px)' : 'none',
              }}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div
            style={{
              backgroundColor: colors.navBackground,
              borderTop: `1px solid ${colors.uiBackground}`,
              padding: '16px 0',
            }}
          >
            <div className="flex flex-col gap-4 px-4 pb-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  style={{ color: colors.text }}
                  className="text-left hover:opacity-80 transition-opacity font-medium"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: colors.uiBackground }}>
                <Button variant="ghost" size="md" className="w-full">
                  Sign In
                </Button>
                <Button variant="primary" size="md" className="w-full">
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}