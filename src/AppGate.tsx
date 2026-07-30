import { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { LoginPage } from './pages/LoginPage'
import App from './App.tsx'
import { pullAllFromFirestore, forceMigrateConfidentialAppData, setFirestoreSyncUser } from './utils/firestoreSync'
import { migrateAllWarrantyRequestAttachments } from './utils/attachmentMigration'
import {
  clearWarrantyPeriodCache,
  hydrateWarrantyPeriodStorage,
} from './utils/warrantyPeriodStorage'

function AppGate() {
  const { user, loading } = useAuth()
  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    setFirestoreSyncUser(user?.email ?? undefined)

    if (!user) {
      clearWarrantyPeriodCache()
      setDataReady(false)
      return
    }

    let cancelled = false
    setDataReady(false)

    void pullAllFromFirestore(user.email ?? undefined)
      .then(async () => {
        try {
          await migrateAllWarrantyRequestAttachments()
        } catch (migrationError) {
          console.error('[Storage] 첨부 파일 마이그레이션 실패', migrationError)
        }
        // 기존 평문 Firestore 문서를 암호문으로 강제 교체
        await forceMigrateConfidentialAppData(user.email ?? undefined)
        clearWarrantyPeriodCache()
        await hydrateWarrantyPeriodStorage()
      })
      .catch((error) => {
        console.error('[Firestore] 데이터 동기화 실패', error)
      })
      .finally(() => {
        if (!cancelled) {
          setDataReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) {
    return <LoadingSpinner label="로그인 상태 확인 중" />
  }

  if (!user) {
    return <LoginPage />
  }

  if (!dataReady) {
    return <LoadingSpinner label="데이터 불러오는 중" />
  }

  return <App />
}

export default AppGate
