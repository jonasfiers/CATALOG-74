import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Avatar.jsx'
import CatAvatar from './CatAvatar/CatAvatar'

const NAV_ITEMS = [
  { to: '/groups',     end: true, label: 'Home',       icon: HomeIcon       },
  { to: '/activity',             label: 'Activity',   icon: ActivityIcon   },
  { to: '/insights',             label: 'Insights',   icon: InsightsIcon   },
  { to: '/categories',           label: 'Categories', icon: FriendsIcon    },
  { to: '/currencies',           label: 'Currencies', icon: CurrenciesIcon },
]

function HomeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function ActivityIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

function FriendsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function CurrenciesIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M14.5 8.5a3.5 3.5 0 0 0-5 0v7a3.5 3.5 0 0 0 5 0"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
    </svg>
  )
}

function InsightsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
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
          <CatAvatar className="sidebar-logo-icon" />
          <span>Split<span className="sidebar-logo-accent">ty</span></span>
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
            <CatAvatar className="app-logo-icon" />
            <span>Split<span className="app-logo-accent">ty</span></span></Link>
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
