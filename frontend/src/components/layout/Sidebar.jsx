import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

const NAV = [
  { icon: '📊', label: 'Dashboard', to: '/', end: true },
  { icon: '📧', label: 'Gmail Accounts', to: '/gmail-accounts' },
  { icon: '📄', label: 'Templates', to: '/templates' },
  { icon: '🚀', label: 'New Campaign', to: '/campaigns/new' },
  { icon: '📋', label: 'Campaign History', to: '/campaigns' },
  { icon: '🔒', label: 'Change Password', to: '/change-password' },
];

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  return (
    <>
      <div className="sidebar-logo">✉ MailBlast</div>
      <nav className="sidebar-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleLogout}>
          <span className="nav-icon">↪</span> Logout
        </button>
      </div>
    </>
  );
}
