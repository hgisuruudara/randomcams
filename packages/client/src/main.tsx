import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AdminPanel } from './components/AdminPanel';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

function Root() {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return <AdminPanel />;
  if (path.startsWith('/terms')) return <TermsPage />;
  if (path.startsWith('/privacy')) return <PrivacyPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
