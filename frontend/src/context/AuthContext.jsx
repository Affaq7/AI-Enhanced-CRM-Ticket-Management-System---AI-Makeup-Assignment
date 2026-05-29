import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('crm_token')
    const storedUser = localStorage.getItem('crm_user')

    if (storedToken && storedUser) {
      try {
        const decoded = jwtDecode(storedToken)
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        } else {
          _clear()
        }
      } catch {
        _clear()
      }
    }
    setLoading(false)
  }, [])

  function _clear() {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
  }

  const login = (tokenStr, userData) => {
    localStorage.setItem('crm_token', tokenStr)
    localStorage.setItem('crm_user', JSON.stringify(userData))
    setToken(tokenStr)
    setUser(userData)
  }

  const logout = () => {
    _clear()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
