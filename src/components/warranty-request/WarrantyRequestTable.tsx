import { useEffect, useMemo, useRef, useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import type { WarrantyIssuanceRequestRecord } from '../../types'
import { formatDisplayDate } from '../../utils/helpers'
import { isTableRowInteractiveTarget } from '../../utils/tableRowInteraction'
import {
  downloadFileAttachment,
  parseFileAttachments,
} from '../../utils/warrantyAttachments'
import {
  displayRequestValue,
  formatRequestDetailRegion,
  formatRequestResin,
} from '../../utils/warrantyRequestStorage'
import { LanguageFlagIcon } from './LanguageFlagIcon'
import { RequestStatusBadge } from './RequestStatusBadge'
import { PageHeaderCautionIcon } from '../layout/PageHeader'

interface WarrantyRequestTableProps {
  records: WarrantyIssuanceRequestRecord[]
  editing?: boolean
  highlightedRowId?: string | null
  onDelete?: (id: string) => void
  onReorder?: (fromId: string, toId: string) => void
  onRowClick?: (record: WarrantyIssuanceRequestRecord) => void
}

const thClass =
  'whitespace-nowrap border-b border-r border-border px-2 py-2.5 text-xs font-semibold text-text-secondary last:border-r-0 sm:px-2 sm:text-sm'
const tdBorderClass = 'border-b border-r border-border last:border-r-0'
const cellClass = 'px-2 py-2 text-xs text-text-primary sm:text-sm'

function ReadOnlyCell({
  value,
  align = 'left',
  nowrap = false,
  truncate = false,
}: {
  value: string
  align?: 'center' | 'left'
  nowrap?: boolean
  truncate?: boolean
}) {
  const display = value.trim() || '-'

  return (
    <div
      title={truncate && display !== '-' ? display : undefined}
      className={`${cellClass} ${align === 'center' ? 'text-center' : 'text-left'} ${
        nowrap ? 'whitespace-nowrap' : truncate ? 'truncate' : 'whitespace-pre-wrap break-words'
      }`}
    >
      {display}
    </div>
  )
}

const attachmentButtonClass =
  'group/flag inline-flex items-center justify-center rounded-lg p-0.5 transition-all hover:shadow-[0_0_14px_rgba(59,130,246,0.55)] hover:ring-2 hover:ring-accent/45 active:shadow-[0_0_14px_rgba(59,130,246,0.55)] active:ring-2 active:ring-accent/45'

function CompanyWarrantyAttachmentCell({
  koValue,
  enValue,
}: {
  koValue: string
  enValue: string
}) {
  const attachments: {
    language: 'ko' | 'en'
    file: ReturnType<typeof parseFileAttachments>[number]
  }[] = []

  for (const file of parseFileAttachments(koValue)) {
    attachments.push({ language: 'ko', file })
  }
  for (const file of parseFileAttachments(enValue)) {
    attachments.push({ language: 'en', file })
  }

  if (attachments.length === 0) {
    return <div className={`${cellClass} text-center text-text-muted`}>-</div>
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 px-1 py-1.5">
      {attachments.map(({ language, file }) => (
        <button
          key={file.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            void downloadFileAttachment(file)
          }}
          aria-label={`당사 Warranty ${language === 'ko' ? '국문' : '영문'} 다운로드: ${file.name}`}
          title={`${language === 'ko' ? '국문' : '영문'} · ${file.name}`}
          className={attachmentButtonClass}
        >
          <LanguageFlagIcon language={language} />
        </button>
      ))}
    </div>
  )
}

export function WarrantyRequestTable({
  records,
  editing = false,
  highlightedRowId = null,
  onDelete,
  onReorder,
  onRowClick,
}: WarrantyRequestTableProps) {
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const canReorder = editing && Boolean(onReorder)

  const displayRecords = useMemo(() => {
    if (editing) return records
    return [...records].sort((a, b) => {
      const dateA = a.requestDate || ''
      const dateB = b.requestDate || ''
      if (dateA !== dateB) return dateB.localeCompare(dateA)
      return b.id.localeCompare(a.id)
    })
  }, [records, editing])

  useEffect(() => {
    if (!highlightedRowId) return

    const scrollToHighlightedRow = () => {
      const row = rowRefs.current.get(highlightedRowId)
      const container = scrollContainerRef.current
      if (!row || !container) return false

      const targetTop = row.offsetTop - container.clientHeight / 2 + row.offsetHeight / 2
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      })
      return true
    }

    const timer = window.setTimeout(() => {
      if (!scrollToHighlightedRow()) {
        window.setTimeout(scrollToHighlightedRow, 120)
      }
    }, 80)

    return () => clearTimeout(timer)
  }, [highlightedRowId, displayRecords.length])

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-bg-primary/20 px-4 py-12 text-center text-sm text-text-muted">
        등록된 보증서 발행 의뢰가 없습니다.
      </div>
    )
  }

  return (
    <div>
      {editing ? (
        <p className="mb-2 text-xs text-text-muted">
          ⋮⋮ 드래그로 순서를 변경할 수 있습니다.
        </p>
      ) : (
        onRowClick && (
          <p className="mb-2 flex items-center gap-1.5 text-[calc(0.75rem+1pt)] font-bold text-text-primary">
            <PageHeaderCautionIcon className="h-[1em] w-[1em]" />
            <span>행을 클릭하면 의뢰서 상세 내용을 확인할 수 있습니다.</span>
          </p>
        )
      )}
      <div ref={scrollContainerRef} className="max-h-[420px] overflow-auto rounded-lg border border-border">
        <table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-0">
          <thead>
            <tr className="sticky top-0 z-10 bg-bg-tertiary">
              {editing && (onDelete || onReorder) && <th className={`${thClass} w-14`} />}
              <th className={`${thClass} w-12 text-center`}>No</th>
              <th className={`${thClass} w-[6.5rem] text-center`}>요청일자</th>
              <th className={`${thClass} w-[6.5rem] text-center`}>발행일자</th>
              <th className={`${thClass} w-[5.5rem] text-center`}>요청자</th>
              <th className={`${thClass} w-[10rem] text-center`}>색상명</th>
              <th className={`${thClass} w-[6rem] text-center`}>도료사</th>
              <th className={`${thClass} w-[6rem] text-center`}>수지</th>
              <th className={`${thClass} text-center`}>세부국가명</th>
              <th className={`${thClass} w-[8rem]   text-center`}>수요가명</th>
              <th className={`${thClass} w-[7.5rem] text-center`}>파일첨부</th>
              <th className={`${thClass} w-[6.5rem] text-center`}>상태</th>
            </tr>
          </thead>
          <tbody>
            {displayRecords.map((record) => {
              const isHighlighted = highlightedRowId === record.id
              const isDragging = draggingId === record.id
              const isDragOver = dragOverId === record.id && draggingId !== record.id

              return (
                <tr
                  key={record.id}
                  ref={(element) => {
                    if (element) rowRefs.current.set(record.id, element)
                    else rowRefs.current.delete(record.id)
                  }}
                  onClick={(event) => {
                    if (editing || isTableRowInteractiveTarget(event.target)) return
                    onRowClick?.(record)
                  }}
                  title={!editing && onRowClick ? '클릭하여 상세 보기' : undefined}
                  onDragOver={(e) => {
                    if (!canReorder || draggingId === null) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverId(record.id)
                  }}
                  onDragLeave={() => {
                    setDragOverId((prev) => (prev === record.id ? null : prev))
                  }}
                  onDrop={(e) => {
                    if (!canReorder || draggingId === null) return
                    e.preventDefault()
                    if (draggingId !== record.id) {
                      onReorder?.(draggingId, record.id)
                    }
                    setDraggingId(null)
                    setDragOverId(null)
                  }}
                  className={`group transition-all duration-300 even:bg-bg-tertiary/10 ${
                    !editing && onRowClick ? 'cursor-pointer hover:bg-accent/5' : ''
                  } ${
                    isHighlighted
                      ? 'bg-accent/25 ring-2 ring-inset ring-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.4)]'
                      : ''
                  } ${isDragging ? 'opacity-40' : ''} ${
                    isDragOver ? 'bg-accent/15 ring-1 ring-inset ring-accent/50' : ''
                  }`}
                >
                  {editing && (onDelete || onReorder) && (
                    <td className={`${tdBorderClass} px-2 py-1 align-top`}>
                      <div className="flex items-center gap-0.5">
                        {onReorder && (
                          <div
                            draggable={canReorder}
                            onDragStart={(e) => {
                              if (!canReorder) {
                                e.preventDefault()
                                return
                              }
                              setDraggingId(record.id)
                              e.dataTransfer.effectAllowed = 'move'
                              e.dataTransfer.setData('text/plain', record.id)
                            }}
                            onDragEnd={() => {
                              setDraggingId(null)
                              setDragOverId(null)
                            }}
                            title="드래그하여 행 이동"
                            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted transition-colors ${
                              canReorder
                                ? 'cursor-grab opacity-70 hover:bg-bg-tertiary hover:text-text-primary active:cursor-grabbing group-hover:opacity-100'
                                : 'cursor-not-allowed opacity-30'
                            }`}
                            aria-label="행 순서 변경"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(record.id)}
                            aria-label="의뢰 삭제"
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-red-500/15 hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell value={String(record.sequenceNo)} align="center" />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell
                      value={formatDisplayDate(record.requestDate)}
                      align="center"
                      nowrap
                    />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell
                      value={formatDisplayDate(record.issueDate)}
                      align="center"
                      nowrap
                    />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell
                      value={displayRequestValue(record.requesterName)}
                      align="center"
                      nowrap
                    />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell
                      value={displayRequestValue(record.colorName)}
                      align="center"
                      truncate
                    />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell value={displayRequestValue(record.paintCompany)} align="center" />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell value={formatRequestResin(record)} align="center" />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell
                      value={formatRequestDetailRegion(record)}
                      align="center"
                      truncate
                    />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <ReadOnlyCell value={displayRequestValue(record.customer)} align="center" />
                  </td>
                  <td className={`${tdBorderClass} min-w-[120px] px-1 py-1 align-top`}>
                    <CompanyWarrantyAttachmentCell
                      koValue={record.companyWarrantyAttachmentKo}
                      enValue={record.companyWarrantyAttachmentEn}
                    />
                  </td>
                  <td className={`${tdBorderClass} px-1 py-1 align-top`}>
                    <div className="flex justify-center whitespace-nowrap py-1">
                      <RequestStatusBadge status={record.status} className="shrink-0 whitespace-nowrap" />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
