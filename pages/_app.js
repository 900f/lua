import '../styles/globals.css';
import { useEffect } from 'react';
export default function App({ Component, pageProps }) {
  useEffect(() => {
    const t = localStorage.getItem('lv_theme')||'violet';
    const d = localStorage.getItem('lv_dark')==='true';
    document.documentElement.setAttribute('data-theme', t);
    if (d) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);
  return <Component {...pageProps} />;
}
