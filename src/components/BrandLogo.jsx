import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function BrandLogo({
  width = 140,
  height = 40,
  linkTo = '/',
  alt = 'Doabli',
  variant = 'auto',
  style = {},
}) {
  const { isDark } = useTheme();

  const resolvedVariant = variant === 'auto' ? (isDark ? 'light' : 'dark') : variant;
  const logoSrc =
    resolvedVariant === 'light'
      ? '/doablilogo-lightsvg.svg'
      : '/doablilogo-darksvg.svg';

  const img = (
    <img
      src={logoSrc}
      alt={alt}
      style={{
        width,
        height,
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
    />
  );

  if (!linkTo) return img;

  return (
    <Link to={linkTo} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {img}
    </Link>
  );
}
