import { useMemo } from 'react'
import type { ProductWarranty } from '../../types'
import { parseMultiValue } from '../../constants/warrantyOptions'
import { resolveChalkMode, resolveColorFadingMode } from '../../utils/productWarrantyHelpers'
import {
  findCompanyWarrantyProducts,
  regionToRiskSection,
} from '../../utils/warrantyPeriodLookup'
import { loadWarrantyPeriod } from '../../utils/warrantyPeriodStorage'
import { GuideCell } from '../warranty-period/GuideCell'
import {
  periodDataColCount,
  periodRiskBorderClass,
  periodRiskHeaderBorderClass,
  periodRowClass,
  periodTableClass,
  periodTdClass,
  periodThClass,
  periodThGroupClass,
  periodThStackedClass,
  periodThStickyRow1,
  periodThStickyRow2,
  periodThStickyRowSpan,
  periodThSubClass,
} from '../warranty-period/periodTheme'

interface CompanyWarrantyPreviewProps {
  productItem: string
  resin: string
  region: string
  coatingStructure: string
}

function PreviewTable({ products }: { products: ProductWarranty[] }) {
  const groupHeader = <span className="font-semibold text-text-secondary">제품군</span>

  return (
    <table className={periodTableClass}>
      <colgroup>
        {Array.from({ length: periodDataColCount }, (_, index) => (
          <col key={index} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th
            rowSpan={2}
            className={`${periodThClass} ${periodThStickyRow1} ${periodThStickyRowSpan} align-middle`}
          >
            {groupHeader}
          </th>
          <th rowSpan={2} className={`${periodThStackedClass} ${periodThStickyRow1} ${periodThStickyRowSpan}`}>
            <span className="block break-all">PEEL/FLAKE</span>
            <span className="block">(도막박리)</span>
          </th>
          <th rowSpan={2} className={`${periodThStackedClass} ${periodThStickyRow1} ${periodThStickyRowSpan}`}>
            <span className="block break-all">PERFORATION</span>
            <span className="block">(천공)</span>
          </th>
          <th colSpan={3} className={`${periodThGroupClass} ${periodThStickyRow1}`}>
            COLOR FADING (변색/탈색)
          </th>
          <th colSpan={3} className={`${periodThGroupClass} ${periodThStickyRow1}`}>
            CHALK (백화/묻어남)
          </th>
        </tr>
        <tr>
          <th className={`${periodThSubClass} ${periodThStickyRow2}`}>기간</th>
          <th className={`${periodThSubClass} ${periodThStickyRow2}`}>ROOF</th>
          <th className={`${periodThSubClass} ${periodThStickyRow2}`}>WALL</th>
          <th className={`${periodThSubClass} ${periodThStickyRow2}`}>기간</th>
          <th className={`${periodThSubClass} ${periodThStickyRow2}`}>ROOF</th>
          <th className={`${periodThSubClass} ${periodThStickyRow2}`}>WALL</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          const colorFadingMode = resolveColorFadingMode(product)
          const chalkMode = resolveChalkMode(product)
          const isColorFadingMerged = colorFadingMode === 'merged'
          const isChalkMerged = chalkMode === 'merged'

          return (
            <tr key={product.productGroup} className={periodRowClass}>
              <td className={periodTdClass}>
                {product.productGroup.includes('\n') ? (
                  <span className="flex h-full w-full items-center justify-center whitespace-pre-line text-center text-sm text-text-primary">
                    {product.productGroup}
                  </span>
                ) : (
                  <GuideCell value={product.productGroup} editing={false} onChange={() => {}} />
                )}
              </td>
              <td className={periodTdClass}>
                <GuideCell value={product.peelFlake} editing={false} onChange={() => {}} />
              </td>
              <td className={periodTdClass}>
                <GuideCell value={product.perforation} editing={false} onChange={() => {}} />
              </td>
              {isColorFadingMerged ? (
                <td colSpan={3} className={periodTdClass}>
                  <GuideCell value={product.colorFading} editing={false} onChange={() => {}} />
                </td>
              ) : (
                <>
                  <td className={periodTdClass}>
                    <GuideCell value={product.colorFading} editing={false} onChange={() => {}} />
                  </td>
                  <td className={periodTdClass}>
                    <GuideCell
                      value={product.colorFadingRoof}
                      editing={false}
                      formatSplit
                      onChange={() => {}}
                    />
                  </td>
                  <td className={periodTdClass}>
                    <GuideCell
                      value={product.colorFadingWall}
                      editing={false}
                      formatSplit
                      onChange={() => {}}
                    />
                  </td>
                </>
              )}
              {isChalkMerged ? (
                <td colSpan={3} className={periodTdClass}>
                  <GuideCell value={product.chalk} editing={false} onChange={() => {}} />
                </td>
              ) : (
                <>
                  <td className={periodTdClass}>
                    <GuideCell value={product.chalk} editing={false} onChange={() => {}} />
                  </td>
                  <td className={periodTdClass}>
                    <GuideCell value={product.chalkRoof} editing={false} formatSplit onChange={() => {}} />
                  </td>
                  <td className={periodTdClass}>
                    <GuideCell value={product.chalkWall} editing={false} formatSplit onChange={() => {}} />
                  </td>
                </>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function CompanyWarrantyPreview({
  productItem,
  resin,
  region,
  coatingStructure,
}: CompanyWarrantyPreviewProps) {
  const riskVariant = regionToRiskSection(region) === 'highRisk' ? 'high' : 'low'
  const isPrint = productItem === 'PRINT'

  const products = useMemo(() => {
    const data = loadWarrantyPeriod()
    return findCompanyWarrantyProducts(data, {
      productItem,
      resin,
      region,
      coatingStructure,
    })
  }, [productItem, resin, region, coatingStructure])

  const missingFields =
    !productItem ||
    !region ||
    !parseMultiValue(resin).length ||
    (isPrint && !parseMultiValue(coatingStructure).length)

  if (missingFields) {
    return (
      <p className="rounded-lg border border-border/70 bg-bg-primary/30 px-3 py-2.5 text-sm text-text-muted">
        {isPrint
          ? '품목, 수지, 도장구조, 국가를 선택하면 당사 보증 연한이 표시됩니다.'
          : '품목, 수지, 국가를 선택하면 당사 보증 연한이 표시됩니다.'}
      </p>
    )
  }

  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-border/70 bg-bg-primary/30 px-3 py-2.5 text-sm text-text-muted">
        선택한 조건에 해당하는 당사 보증 연한이 없습니다.
      </p>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border-2 bg-bg-secondary/50 ${periodRiskBorderClass(riskVariant)}`}
    >
      <div
        className={`border-b bg-bg-tertiary px-4 py-2.5 ${periodRiskHeaderBorderClass(riskVariant)}`}
      >
        <span className="text-xs font-bold tracking-[0.14em] text-text-primary">{productItem}</span>
      </div>
      <div className="overflow-x-auto">
        <PreviewTable products={products} />
      </div>
    </div>
  )
}
