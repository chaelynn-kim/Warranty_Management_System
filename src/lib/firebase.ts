import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { EMBEDDED_FIREBASE_CONFIG } from './firebase.embedded'

function envOr(raw: string | undefined, fallback: string): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  return trimmed !== '' ? trimmed : fallback
}

const firebaseConfig = {
  apiKey: envOr(import.meta.env.VITE_FIREBASE_API_KEY, EMBEDDED_FIREBASE_CONFIG.apiKey),
  authDomain: envOr(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, EMBEDDED_FIREBASE_CONFIG.authDomain),
  projectId: envOr(import.meta.env.VITE_FIREBASE_PROJECT_ID, EMBEDDED_FIREBASE_CONFIG.projectId),
  storageBucket: envOr(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    EMBEDDED_FIREBASE_CONFIG.storageBucket
  ),
  messagingSenderId: envOr(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    EMBEDDED_FIREBASE_CONFIG.messagingSenderId
  ),
  appId: envOr(import.meta.env.VITE_FIREBASE_APP_ID, EMBEDDED_FIREBASE_CONFIG.appId),
}

export const isFirebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
)

export const firebaseApp = isFirebaseEnabled ? initializeApp(firebaseConfig) : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null
