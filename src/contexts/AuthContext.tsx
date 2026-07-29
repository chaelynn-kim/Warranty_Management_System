import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseEnabled } from '../lib/firebase'
import { logActivity, writeActivityLog } from '../utils/activityLogStorage'
import { enforceCompanyEmail } from '../utils/authValidation'

interface AuthContextValue {
  user: User | null
  loading: boolean
  authConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ hd: 'seah.co.kr' })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const applyUser = useCallback(async (nextUser: User | null) => {
    if (!auth) {
      setUser(null)
      setLoading(false)
      return
    }

    if (nextUser) {
      const allowed = await enforceCompanyEmail(auth, nextUser.email)
      if (!allowed) {
        setUser(null)
        setLoading(false)
        return
      }
    }

    setUser(nextUser)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      void applyUser(nextUser)
    })

    return unsubscribe
  }, [applyUser])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) return
    try {
      const result = await signInWithPopup(auth, googleProvider)
      logActivity({
        action: 'auth.login',
        detail: 'Google 로그인',
        userEmail: result.user.email,
        userName: result.user.displayName,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      window.alert(`로그인에 실패했습니다: ${message}`)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!auth) return
    await writeActivityLog({
      action: 'auth.logout',
      detail: '로그아웃',
      userEmail: auth.currentUser?.email,
      userName: auth.currentUser?.displayName,
    })
    await firebaseSignOut(auth)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authConfigured: isFirebaseEnabled,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, signInWithGoogle, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
