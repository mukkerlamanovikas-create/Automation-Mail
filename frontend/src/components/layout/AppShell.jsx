import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from '../ui/Toast';

export default function AppShell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="shell">
      <button className="hamburger" onClick={() => setOpen(o => !o)}>☰</button>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Sidebar onClose={() => setOpen(false)} />
      </aside>
      <main className="shell-main">
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
