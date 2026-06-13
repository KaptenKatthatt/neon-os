import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Desktop } from './os/components/Desktop';
import './os/styles/global.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <Desktop />
  </StrictMode>,
);
