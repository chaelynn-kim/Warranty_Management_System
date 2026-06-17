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
  const [activeTab, setActiveTab] = useState<TabId>('issuance')
  const canAccessExternalTest = canAccessExternalTestTab(user?.email)

  useEffect(() => {
    if (activeTab === 'externalTest' && !canAccessExternalTest) {
      setActiveTab('issuance')
    }
  }, [activeTab, canAccessExternalTest])

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === 'issuanceRequest' && <WarrantyIssuanceRequestPage />}
        {activeTab === 'issuance' && <WarrantyIssuancePage />}
        {activeTab === 'period' && <WarrantyPeriodPage />}
        {activeTab === 'externalTest' && canAccessExternalTest && <ExternalTestPage />}
      </main>
    </div>
  )
}

export default App
