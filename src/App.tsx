import { useState } from 'react'
import { Header } from './components/layout/Header'
import { WarrantyIssuanceRequestPage } from './pages/WarrantyIssuanceRequestPage'
import { WarrantyIssuancePage } from './pages/WarrantyIssuancePage'
import { WarrantyPeriodPage } from './pages/WarrantyPeriodPage'
import { ExternalTestPage } from './pages/ExternalTestPage'
import type { TabId } from './types'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('issuance')

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === 'issuanceRequest' && <WarrantyIssuanceRequestPage />}
        {activeTab === 'issuance' && <WarrantyIssuancePage />}
        {activeTab === 'period' && <WarrantyPeriodPage />}
        {activeTab === 'externalTest' && <ExternalTestPage />}
      </main>
    </div>
  )
}

export default App
