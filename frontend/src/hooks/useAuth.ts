import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '@/api/client'
import type { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      auth.me()
        .then((data) => setUser(data as User))
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await auth.login(email, password)
    localStorage.setItem('token', response.token)
    setUser(response.user)
    navigate('/admin')
  }, [navigate])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/admin/login')
  }, [navigate])

  return { user, loading, login, logout, isAuthenticated: !!user }
}
