import '../styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const theme = localStorage.getItem('lv_theme') || 'pink';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  return <Component {...pageProps} />;
}
