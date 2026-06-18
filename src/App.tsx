import { useEffect, useState } from 'react'
import { Header } from './components/layout/Header'
import { WarrantyIssuanceRequestPage } from './pages/WarrantyIssuanceRequestPage'
import { WarrantyIssuancePage } from './pages/WarrantyIssuancePage'
import { WarrantyPeriodPage } from './pages/WarrantyPeriodPage'
import { ExternalTestPage } from './pages/ExternalTestPage'
import { useAuth } from './contexts/AuthContext'
import { canAccessExternalTestTab } from './utils/authValidation'
import type { TabId } from './types'

function App() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('issuanceRequest')
  const canAccessExternalTest = canAccessExternalTestTab(user?.email)

  useEffect(() => {
    if (activeTab === 'externalTest' && !canAccessExternalTest) {
      setActiveTab('issuanceRequest')
    }
  }, [activeTab, canAccessExternalTest])

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        <div className={activeTab === 'issuanceRequest' ? undefined : 'hidden'}>
          <WarrantyIssuanceRequestPage />
        </div>
        <div className={activeTab === 'issuance' ? undefined : 'hidden'}>
          <WarrantyIssuancePage />
        </div>
        <div className={activeTab === 'period' ? undefined : 'hidden'}>
          <WarrantyPeriodPage />
        </div>
        {canAccessExternalTest && (
          <div className={activeTab === 'externalTest' ? undefined : 'hidden'}>
            <ExternalTestPage />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
