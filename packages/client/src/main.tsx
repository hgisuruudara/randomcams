import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AdminPanel } from './components/AdminPanel';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

function Root() {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return <AdminPanel />;
  if (path.startsWith('/terms')) return <TermsPage />;
  if (path.startsWith('/privacy')) return <PrivacyPage />;
  if (path.startsWith('/reset-password')) return <ResetPasswordPage />;
  if (path.startsWith('/verify-email')) return <VerifyEmailPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
