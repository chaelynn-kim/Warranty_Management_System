import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppGate from './AppGate.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ExternalTestPage } from './pages/ExternalTestPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.MODE === 'external' ? (
      <ExternalTestPage />
    ) : (
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    )}
  </StrictMode>
)
