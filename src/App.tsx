import { useEffect, useState } from 'react'
import { Header } from './components/layout/Header'
import { WarrantyIssuancePage } from './pages/WarrantyIssuancePage'
import { WarrantyIssuanceRequestPage } from './pages/WarrantyIssuanceRequestPage'
import { WarrantyPeriodPage } from './pages/WarrantyPeriodPage'
import { ExternalTestPage } from './pages/ExternalTestPage'
import { useAuth } from './contexts/AuthContext'
import { canAccessExternalTestTab } from './utils/authValidation'
import type { TabId } from './types'

function App() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('issuance')
  const [highlightRequestId, setHighlightRequestId] = useState<string | null>(null)
  const canAccessExternalTest = canAccessExternalTestTab(user?.email)

  useEffect(() => {
    if (activeTab === 'externalTest' && !canAccessExternalTest) {
      setActiveTab('issuance')
    }
  }, [activeTab, canAccessExternalTest])

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6 sm:py-8">
        <div className={activeTab === 'issuanceRequest' ? undefined : 'hidden'}>
          <WarrantyIssuanceRequestPage
            onRequestSubmitted={(recordId) => {
              setHighlightRequestId(recordId)
              setActiveTab('issuance')
            }}
          />
        </div>
        <div className={activeTab === 'issuance' ? undefined : 'hidden'}>
          <WarrantyIssuancePage
            isActive={activeTab === 'issuance'}
            highlightRequestId={highlightRequestId}
            onHighlightRequestHandled={() => setHighlightRequestId(null)}
          />
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
