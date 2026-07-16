import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Avatar.jsx'

// Activity/Insights/Friends had no backing endpoints left once this
// became a batch-processed COBOL demo instead of a live graph query
// -- api-cobol only implements groups/expenses/balances, so those
// tabs would just be dead links. See App.jsx for the matching route
// trim.
const NAV_ITEMS = [
  { to: '/groups', end: true, label: 'Home', icon: HomeIcon },
]

function HomeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

export default function Layout() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell">

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="app-sidebar">
        <Link to="/groups" className="sidebar-logo">
          <span className="terminal-prompt" aria-hidden="true">=^.^=</span>
          <span>CATALOG<span className="sidebar-logo-accent">-74</span></span>
        </Link>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => 'sidebar-nav-item' + (isActive ? ' active' : '')}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="sidebar-user">
            <Avatar name={currentUser?.name} size={28} colorIndex={currentUser?.avatarColor} emoji={currentUser?.avatarEmoji} />
            <span className="sidebar-user-name">{currentUser?.name ?? ''}</span>
          </Link>
        </div>
      </aside>

      {/* ── HEADER (mobile) ── */}
      <header className="app-header" >
        <Link to="/groups" className="app-logo">
            <span className="terminal-prompt" aria-hidden="true">=^.^=</span>
            <span>CATALOG<span className="app-logo-accent">-74</span></span></Link>
        <Link to="/profile" className="app-avatar">
          <Avatar name={currentUser?.name} size={28} colorIndex={currentUser?.avatarColor} emoji={currentUser?.avatarEmoji} />
        </Link>
      </header>

      {/* ── CONTENT ── */}
      <main className="app-content">
        <div className="page-wrap">
          <Outlet />
        </div>
      </main>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <Icon size={22} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
