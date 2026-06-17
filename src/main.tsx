import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { LoginPage } from './pages/LoginPage'

function AppGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner label="로그인 상태 확인 중" />
  }

  if (!user) {
    return <LoginPage />
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  </StrictMode>
)
