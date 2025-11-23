import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI, companiesAPI } from '../lib/api'

// Create an empty box
const AuthContext = createContext({})

// Create a hook to easily access the box
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  // These are the "items" stored in the box
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token')
    if (token) {
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])
  // Function to update the box
  const fetchCurrentUser = async () => {
    try {
      const data = await authAPI.getMe()
      setUser(data.user)
      setCompany(data.company)
    } catch (error) {
      console.error('Error fetching user:', error)
      // Token invalid, clear it
      localStorage.removeItem('token')
      setUser(null)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      const data = await authAPI.login(email, password)

      // Store token
      localStorage.setItem('token', data.token)

      setUser(data.user)
      setCompany(data.company)

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    localStorage.removeItem('token')
    setUser(null)
    setCompany(null)
    return { error: null }
  }

  const refreshCompany = async () => {
    if (user) {
      try {
        const data = await authAPI.getMe()
        setCompany(data.company)
      } catch (error) {
        console.error('Error refreshing company:', error)
      }
    }
  }

  const value = {
    user,
    company,
    loading,
    signIn,
    signOut,
    refreshCompany,
  }

  return (
    <AuthContext.Provider value={value}>
     {children} {/*   <AppRoutes />    ← this becomes "children" */}
    </AuthContext.Provider>
  )
}

//  The Flow

//   1. AuthProvider wraps AppRoutes
//   2. Provider makes "value" available
//   3. Any component inside can call useAuth()
//   4. useAuth() grabs from "value"

//   That's it! Provider = wrapper that shares, children = what's wrapped inside. 🎁