import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Editor from './pages/dashboard/Editor'
import Preview from './pages/dashboard/Preview'
import JobsManager from './pages/dashboard/JobsManager'
import CareersPage from './pages/public/CareersPage'

function AppRoutes() {
  const { company, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard redirect */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {company ? (
              <Navigate to={`/${company.slug}/edit`} replace />
            ) : (
              <Dashboard />
            )}
          </ProtectedRoute>
        }
      />

      {/* Recruiter Dashboard Routes */}
      <Route
        path="/:companySlug/edit"
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/:companySlug/preview"
        element={
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/:companySlug/jobs"
        element={
          <ProtectedRoute>
            <JobsManager />
          </ProtectedRoute>
        }
      />

      {/* Public Careers Page */}
      <Route path="/:companySlug/careers" element={<CareersPage />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider> {/* Everything inside can access the box */}
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
