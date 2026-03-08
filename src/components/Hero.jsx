import { useState, useEffect } from 'react';
import { Colors } from '../constants/colors';
import Button from './Button';
import { Link } from 'react-router-dom';

export default function Hero() {
  const [isDark, setIsDark] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <section
      id="home"
      style={{
        backgroundColor: colors.background,
        minHeight: 'calc(100vh - 64px)',
        marginTop: '64px',
      }}
      className="flex items-center justify-center px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h1
          style={{
            color: colors.title,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out',
          }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
        >
          Do it fast. Do it right. Doabli.
        </h1>

        {/* Subheading */}
        <p
          style={{
            color: colors.text,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out 0.1s',
          }}
          className="text-lg sm:text-xl mb-8 leading-relaxed"
        >
          From quick pickups to daily tasks, Doabli connects you with trusted
          runners who get things done without the stress.
        </p>

        {/* CTA Button */}
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out 0.2s',
          }}
        >
          <Link to="/signup">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                // Navigate to signup
                window.location.href = '/signup';
              }}
              className="hover:scale-105 transition-transform"
            >
              Get Started with Doabli
            </Button>
          </Link>
        </div>

        {/* Decorative Element */}
        <div
          style={{
            marginTop: '60px',
            opacity: isVisible ? 0.1 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 1s ease-out 0.4s',
            background: `linear-gradient(135deg, ${Colors.primary}, ${Colors.warning})`,
            filter: 'blur(40px)',
          }}
          className="w-32 h-32 mx-auto rounded-full"
        />
      </div>
    </section>
  );
}
