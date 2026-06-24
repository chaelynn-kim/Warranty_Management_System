import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import type { ProductWarranty } from '../../types'
import { parseCompanyWarrantyTerms } from '../../utils/companyWarrantyTerms'
import {
  buildWarrantyCertificateFilename,
  downloadWarrantyCertificate,
  generateWarrantyCertificate,
  validateWarrantyCertificateInput,
  type WarrantyCertificateLanguage,
} from '../../utils/warrantyCertificate/generateWarrantyCertificate'

interface WarrantyCertificateSectionProps {
  productItem: string
  resin: string
  resinCustom: string
  colorName: string
  coatingStructure: string
  detailRegionLabel: string
  issueDate: string
  totalCoatingThickness: string
  primerThickness: string
  companyWarrantyTerms: string
}

export function WarrantyCertificateSection({
  productItem,
  resin,
  resinCustom,
  colorName,
  coatingStructure,
  detailRegionLabel,
  issueDate,
  totalCoatingThickness,
  primerThickness,
  companyWarrantyTerms,
}: WarrantyCertificateSectionProps) {
  const [loadingLang, setLoadingLang] = useState<WarrantyCertificateLanguage | null>(null)
  const [error, setError] = useState('')

  const products: ProductWarranty[] = parseCompanyWarrantyTerms(companyWarrantyTerms)

  const input = {
    productItem,
    resin,
    resinCustom,
    colorName,
    coatingStructure,
    detailRegionLabel,
    issueDate,
    totalCoatingThickness,
    primerThickness,
    companyWarrantyTerms: products,
  }

  const validation = validateWarrantyCertificateInput(input)

  const handleGenerate = async (language: WarrantyCertificateLanguage) => {
    setError('')
    setLoadingLang(language)

    try {
      const blob = await generateWarrantyCertificate(input, language)
      const filename = buildWarrantyCertificateFilename(input, language)
      downloadWarrantyCertificate(blob, filename)
    } catch (err) {
      const message = err instanceof Error ? err.message : '보증서 생성에 실패했습니다.'
      setError(message)
    } finally {
      setLoadingLang(null)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/5 p-4">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">보증서 작성</p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            의뢰서·검토 결과를 바탕으로 보증서 양식(PPTX)을 자동 작성합니다. 품목에 따라
            PAINT/PRINT 양식이 적용됩니다.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!validation.ok || loadingLang !== null}
          onClick={() => void handleGenerate('ko')}
          className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-sm font-medium text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingLang === 'ko' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          국문
        </button>
        <button
          type="button"
          disabled={!validation.ok || loadingLang !== null}
          onClick={() => void handleGenerate('en')}
          className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-sm font-medium text-fuchsia-200 transition-colors hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingLang === 'en' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          영문
        </button>
      </div>

      {!validation.ok && validation.message && (
        <p className="text-xs text-amber-400">{validation.message}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
