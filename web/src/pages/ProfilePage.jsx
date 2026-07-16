import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/Avatar.jsx'
import BackLink from '../components/BackLink.jsx'

// The original Splitty ProfilePage covers avatar editing, push
// notifications, passkeys, and password/email changes -- none of
// which api-cobol implements (there's no /dash/profile endpoint, no
// /auth/passkey/*, nothing for changing a USER-AUTH-REC password).
// Rather than ship buttons that 404 when clicked, this shows only
// what's actually real: who you're logged in as, and a way to log out.
export default function ProfilePage() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="page-content">
      <BackLink to="/groups" />
      <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Avatar name={currentUser?.name} size={56} />
        <div>
          <h1 style={{ margin: 0 }}>{currentUser?.name}</h1>
          <p style={{ margin: 0, color: 'var(--text-2)' }}>{currentUser?.email}</p>
        </div>
      </div>
      <p style={{ color: 'var(--text-2)', maxWidth: 480 }}>
        This is a fixed demo account (see <code>cobol/seed-data/README.md</code> in the repo) --
        there's no profile editing, password changes, or notification settings here.
      </p>
      <button className="btn btn-ghost" onClick={handleLogout} style={{ marginTop: 24 }}>
        Log out
      </button>
    </div>
  )
}
