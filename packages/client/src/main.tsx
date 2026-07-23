import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AdminPanel } from './components/AdminPanel';

const isAdminPath = window.location.pathname.startsWith('/admin');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isAdminPath ? <AdminPanel /> : <App />}</React.StrictMode>
);
