import { useMemo } from 'react'
import { CheckCircle2, Clock, Inbox } from 'lucide-react'
import type { WarrantyIssuanceRequestRecord } from '../../types'
import {
  WARRANTY_REQUEST_STATUS_COMPLETED,
  WARRANTY_REQUEST_STATUS_PENDING,
  WARRANTY_REQUEST_STATUS_RECEIVED,
} from '../../constants/warrantyRequestStatus'
import { countRequestsByStatus } from '../../utils/warrantyRequestStatus'
import { StatCard } from '../ui/StatCard'

interface WarrantyRequestStatusSummaryProps {
  records: WarrantyIssuanceRequestRecord[]
}

export function WarrantyRequestStatusSummary({ records }: WarrantyRequestStatusSummaryProps) {
  const counts = useMemo(() => countRequestsByStatus(records), [records])

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        variant="amber"
        icon={Clock}
        label="접수 대기"
        value={`${counts[WARRANTY_REQUEST_STATUS_PENDING] ?? 0}건`}
        subtext="품질 팀장 승인 대기 중"
      />
      <StatCard
        variant="sky"
        icon={Inbox}
        label="접수"
        value={`${counts[WARRANTY_REQUEST_STATUS_RECEIVED] ?? 0}건`}
        subtext="담당자 검토·작성 중"
      />
      <StatCard
        variant="green"
        icon={CheckCircle2}
        label="발행 완료"
        value={`${counts[WARRANTY_REQUEST_STATUS_COMPLETED] ?? 0}건`}
        subtext="발행 완료 처리"
      />
    </div>
  )
}
