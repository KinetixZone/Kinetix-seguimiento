import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Purge any dormant Service Workers or old CacheStorage on mobile browsers
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
