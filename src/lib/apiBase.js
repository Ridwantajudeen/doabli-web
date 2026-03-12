const DEFAULT_API_BASE = 'https://errandly-9ezp.onrender.com';

export const getApiBase = () => {
  const envBase = import.meta.env.VITE_API_URL;
  if (envBase) return envBase;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    if (host === 'doabli.com' || host === 'www.doabli.com') {
      return DEFAULT_API_BASE;
    }
  }

  return DEFAULT_API_BASE;
};
