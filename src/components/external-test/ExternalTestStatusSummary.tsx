import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, Clock, FlaskConical } from 'lucide-react'
import type { ExternalTestRecord } from '../../types'
import { countExternalTestByStatus } from '../../utils/externalTestStatus'
import { StatCard } from '../ui/StatCard'

interface ExternalTestStatusSummaryProps {
  records: ExternalTestRecord[]
}

export function ExternalTestStatusSummary({ records }: ExternalTestStatusSummaryProps) {
  const counts = useMemo(() => countExternalTestByStatus(records), [records])

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        variant="amber"
        icon={Clock}
        label="진행대기"
        value={`${counts['진행대기'] ?? 0}건`}
        subtext="시험 대기 중인 건"
      />
      <StatCard
        variant="blue"
        icon={FlaskConical}
        label="진행중"
        value={`${counts['진행중'] ?? 0}건`}
        subtext="시험 진행 중인 건"
      />
      <StatCard
        variant="green"
        icon={CheckCircle2}
        label="종결"
        value={`${counts['종결'] ?? 0}건`}
        subtext="시험 종결된 건"
      />
      <StatCard
        variant="red"
        icon={AlertTriangle}
        label="취소"
        value={`${counts['취소'] ?? 0}건`}
        subtext="시험 취소된 건"
      />
    </div>
  )
}
