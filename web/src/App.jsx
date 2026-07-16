import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const LoginPage             = lazy(() => import('./pages/LoginPage'))
const GroupsPage            = lazy(() => import('./pages/GroupsPage'))
const GroupDetailPage       = lazy(() => import('./pages/GroupDetailPage'))
const ExpenseFormPage       = lazy(() => import('./pages/ExpenseFormPage'))
const ExpenseDetailPage     = lazy(() => import('./pages/ExpenseDetailPage'))
const ProfilePage           = lazy(() => import('./pages/ProfilePage'))

// Registration, password reset, email verification, invites, and
// passkeys are all deliberately absent -- this is a fixed demo with
// three pre-seeded logins (see cobol/seed-data/README.md), not a
// general-purpose app, and api-cobol doesn't implement any of that
// surface. Activity/Insights/Friends are cut for the same reason:
// api-cobol has no backing endpoints for them.

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/groups" replace />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/groups/:id" element={<GroupDetailPage />} />
              <Route path="/groups/:groupId/expenses/:id" element={<ExpenseDetailPage />} />
              <Route path="/groups/:groupId/expenses/new" element={<ExpenseFormPage />} />
              <Route path="/groups/:groupId/expenses/:id/edit" element={<ExpenseFormPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}