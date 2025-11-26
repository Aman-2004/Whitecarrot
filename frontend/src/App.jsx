import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Login from './pages/auth/Login'
import Editor from './pages/dashboard/Editor'
import Preview from './pages/dashboard/Preview'
import CareersPage from './pages/public/CareersPage'

function AppRoutes() {
  const { company, loading } = useAuth()

  if (loading) {// Only 1 Scenario: App Start with Token loading is true initially
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

      {/* Redirect to edit page */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to={`/${company?.slug}/edit`} replace />
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
