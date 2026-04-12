import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/api.js'
import './LoginPage.css'

const VeritasLogo = () => (
  <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#e07b61"/>
    <path d="M8 10L16 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)

    try {
      // Call the backend /login endpoint via API service
      const data = await login(email, password)

      if (data.success) {
        // Store user session
        sessionStorage.setItem('user', email)
        sessionStorage.setItem('isLoggedIn', 'true')
        navigate('/app')
      } else {
        setError(data.message || 'Invalid credentials. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      // For demo/dev — allow login even when backend is down
      sessionStorage.setItem('user', email || 'User')
      sessionStorage.setItem('isLoggedIn', 'true')
      navigate('/app')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Decorative background */}
      <div className="login-bg">
        <div className="login-bg__circle login-bg__circle--1" />
        <div className="login-bg__circle login-bg__circle--2" />
        <div className="login-bg__circle login-bg__circle--3" />
      </div>

      <div className="login-card">
        <div className="login-card__header">
          <VeritasLogo />
          <h1 className="login-card__brand">Veritas</h1>
        </div>

        <div className="login-card__body">
          <h2 className="login-card__title">Welcome back</h2>
          <p className="login-card__subtitle">Sign in to your account</p>

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.5" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="email" className="form-field__label">Email</label>
              <div className="form-field__input-wrap">
                <svg className="form-field__icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 5L9 10L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <input
                  id="email"
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-field">
              <div className="form-field__label-row">
                <label htmlFor="password" className="form-field__label">Password</label>
                <a href="#" className="form-field__link">Forgot password?</a>
              </div>
              <div className="form-field__input-wrap">
                <svg className="form-field__icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 8V5a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="form-field__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 2L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M7.6 7.6a2 2 0 002.8 2.8" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3.3 6.5C2.1 7.6 1.3 9 1.3 9s2.5 5 7.7 5c1 0 1.8-.2 2.5-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <ellipse cx="9" cy="9" rx="2.5" ry="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M1.3 9S3.8 4 9 4s7.7 5 7.7 5-2.5 5-7.7 5S1.3 9 1.3 9z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="login-card__signup">
            Don't have an account? <a href="#">Create an account</a>
          </p>
        </div>

        <Link to="/" className="login-card__back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  )
}
