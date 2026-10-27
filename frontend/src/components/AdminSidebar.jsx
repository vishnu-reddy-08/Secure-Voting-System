import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Vote, 
  Award, 
  ShieldAlert, 
  LogOut, 
  ExternalLink,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Voters Registry', path: '/admin/voters', icon: Users },
    { label: 'Register Voter', path: '/admin/voters/create', icon: UserPlus },
    { label: 'Elections', path: '/admin/elections', icon: Vote },
    { label: 'Candidates', path: '/admin/candidates', icon: Award },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(10, 15, 29, 0.95)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '1.5rem 1rem'
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem 1.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{
          padding: '0.6rem',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)'
        }}>
          <Fingerprint size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>SECURE VOTING SYSTEM</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Admin Console</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
                background: isActive ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div style={{ margin: '1rem 0', height: '1px', background: 'var(--border-color)' }} />

        {/* Quick link to Voter Kiosk */}
        <a
          href="/vote"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            fontWeight: 600,
            textDecoration: 'none',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Vote size={18} /> VOTING BALLOT
          </span>
          <ExternalLink size={14} />
        </a>
      </nav>

      {/* User Info & Logout */}
      <div style={{
        padding: '1rem 0.75rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {admin?.name || 'Election Admin'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{admin?.email || 'admin@election.gov'}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color var(--transition-fast)'
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
