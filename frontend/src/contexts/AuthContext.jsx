import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI, companiesAPI } from '../lib/api'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
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

  const signUp = async (email, password, name, companyName, companySlug) => {
    try {
      const data = await authAPI.register({
        email,
        password,
        name,
        companyName,
        companySlug,
      })

      // Store token
      localStorage.setItem('token', data.token)

      setUser(data.user)
      setCompany(data.company)

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
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
    signUp,
    signIn,
    signOut,
    refreshCompany,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
