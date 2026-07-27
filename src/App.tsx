import { useState } from 'react'
import { Header } from './components/layout/Header'
import { WarrantyCertificateTemplatePage } from './pages/WarrantyCertificateTemplatePage'
import { WarrantyIssuancePage } from './pages/WarrantyIssuancePage'
import { WarrantyIssuanceRequestPage } from './pages/WarrantyIssuanceRequestPage'
import { WarrantyPeriodPage } from './pages/WarrantyPeriodPage'
import { useAuth } from './contexts/AuthContext'
import { canEditWarrantyCertificateTemplate } from './utils/authValidation'
import type { TabId } from './types'

function App() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('issuance')
  const [highlightRequestId, setHighlightRequestId] = useState<string | null>(null)
  const showCertificateTemplateTab = canEditWarrantyCertificateTemplate(user?.email)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showCertificateTemplateTab={showCertificateTemplateTab}
      />
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
        {showCertificateTemplateTab ? (
          <div className={activeTab === 'certificateTemplate' ? undefined : 'hidden'}>
            <WarrantyCertificateTemplatePage userEmail={user?.email} />
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default App
