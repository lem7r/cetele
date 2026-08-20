import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the service worker so Kohort is installable and survives a dropped connection.
// Registered after load so it never competes with the first paint. Dev is skipped: a worker
// caching Vite's dev assets makes hot reload behave strangely.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Install is a progressive enhancement — the app works fine without it. */
    });
  });
}
