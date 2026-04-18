import '../styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const theme = localStorage.getItem('lv_theme') || 'pink';
    const dark = localStorage.getItem('lv_dark') === 'true';
    document.documentElement.setAttribute('data-theme', theme);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);
  return <Component {...pageProps} />;
}
