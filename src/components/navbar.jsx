import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import BrandLogo from './BrandLogo';
import { Colors } from '../constants/colors';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme, theme } = useTheme();

  const colors = isDark ? Colors.dark : Colors.light;
  const navTextColor = scrolled ? '#ffffff' : theme.title;
  const mobileMenuBg = scrolled ? Colors.primary : theme.navBackground;
  const mobileMenuText = scrolled ? '#ffffff' : theme.title;
  const navBackground = scrolled ? Colors.primary : 'transparent';
  const signInButtonStyle = scrolled
    ? {
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        backgroundColor: 'transparent',
      }
    : {};

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      style={{
        backgroundColor: navBackground,
        borderBottom: scrolled ? `1px solid ${colors.uiBackground}` : 'none',
        transition: 'all 0.3s ease',
      }}
      className="fixed w-full top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <BrandLogo
            width={120}
            height={30}
            variant={scrolled ? 'light' : isDark ? 'light' : 'dark'}
          />

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                style={{ color: navTextColor }}
                className="hover:opacity-80 transition-opacity font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex gap-3 items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border transition"
              style={{
                borderColor: scrolled ? 'rgba(255,255,255,0.4)' : theme.uiBackground,
                color: navTextColor,
              }}
              aria-label="Toggle theme"
              type="button"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="md" style={signInButtonStyle}>
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
            className="md:hidden p-2 bg-zinc-800 text-white rounded-full shadow-lg"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              style={{ backgroundColor: mobileMenuBg }}
              className="absolute top-16 right-4 w-44 rounded-xl shadow-lg p-4 flex flex-col space-y-4 md:hidden"
            >
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  style={{ color: mobileMenuText }}
                  className="text-left hover:text-purple-400 transition font-medium"
                >
                  {link.label}
                </button>
              ))}

              <div className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: colors.uiBackground }}>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: mobileMenuText }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <Link to="/login">
                  <Button variant="ghost" size="md" className="w-full" style={signInButtonStyle}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="md" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

