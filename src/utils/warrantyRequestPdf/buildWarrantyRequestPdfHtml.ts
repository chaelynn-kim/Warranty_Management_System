import { joinMultiValue, parseMultiValue } from '../../constants/warrantyOptions'
import { WARRANTY_TERM_COMPANY } from '../../constants/warrantyRequestOptions'
import type { ProductWarranty, WarrantyIssuanceRequest } from '../../types'
import { parseFileAttachments } from '../warrantyAttachments'
import { findCompanyWarrantyProducts, joinCoatingStructures, parseCoatingStructures } from '../warrantyPeriodLookup'
import { loadWarrantyPeriod } from '../warrantyPeriodStorage'
import {
  displayRequestValue,
  formatRequestDetailRegion,
  formatRequestMaterial,
  formatRequestPaintCompany,
  formatRequestResin,
  formatRequestTeam,
  formatRequestWarrantyTerm,
} from '../warrantyRequestStorage'
import { resolveChalkMode, resolveColorFadingMode } from '../productWarrantyHelpers'
import { escapeHtml } from './escapeHtml'

const PDF_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; color: #111; background: #fff; }
  .pdf-root { width: 794px; padding: 32px 40px 40px; background: #fff; }
  .pdf-title { font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 28px; letter-spacing: -0.02em; }
  .pdf-section { margin-bottom: 24px; }
  .pdf-section-title {
    font-size: 14px; font-weight: 700; color: #1e3a5f; margin-bottom: 12px;
    padding-bottom: 6px; border-bottom: 2px solid #d1d5db;
  }
  .pdf-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px 16px; }
  .pdf-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
  .pdf-field { min-width: 0; }
  .pdf-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600; }
  .pdf-value {
    font-size: 13px; color: #111; line-height: 1.5; word-break: break-word;
    min-height: 20px; padding: 6px 8px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;
  }
  .pdf-value-block { white-space: pre-wrap; }
  .pdf-table-wrap { overflow: hidden; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 8px; }
  .pdf-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  .pdf-table th, .pdf-table td {
    border: 1px solid #d1d5db; padding: 6px 4px; text-align: center; vertical-align: middle;
    word-break: break-word;
  }
  .pdf-table th { background: #f3f4f6; font-weight: 700; color: #374151; }
  .pdf-table td { background: #fff; }
  .pdf-muted { font-size: 12px; color: #6b7280; padding: 8px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; }
  .pdf-product-label { font-size: 11px; font-weight: 700; padding: 6px 10px; background: #f3f4f6; border-bottom: 1px solid #d1d5db; }
`

function fieldBlock(label: string, value: string, multiline = false): string {
  const safeValue = escapeHtml(displayRequestValue(value))
  return `
    <div class="pdf-field">
      <div class="pdf-label">${escapeHtml(label)}</div>
      <div class="pdf-value${multiline ? ' pdf-value-block' : ''}">${safeValue}</div>
    </div>
  `
}

function cellValue(value: string): string {
  return escapeHtml(value.trim() || '-')
}

function buildCompanyWarrantyTableHtml(request: WarrantyIssuanceRequest): string {
  const products = findCompanyWarrantyProducts(loadWarrantyPeriod(), {
    productItem: request.productItem,
    resin: request.resin,
    region: request.region,
    coatingStructure: request.coatingStructure,
  })

  if (products.length === 0) {
    return '<p class="pdf-muted">선택한 조건에 해당하는 당사 보증 연한이 없습니다.</p>'
  }

  const rows = products.map((product) => buildProductRowHtml(product)).join('')

  return `
    <div class="pdf-table-wrap">
      <div class="pdf-product-label">${escapeHtml(request.productItem || '-')}</div>
      <table class="pdf-table">
        <thead>
          <tr>
            <th rowspan="2">제품군</th>
            <th rowspan="2">PERFORATION<br/>(천공)</th>
            <th rowspan="2">PEEL/FLAKE<br/>(도막박리)</th>
            <th colspan="3">COLOR FADING (변색/탈색)</th>
            <th colspan="3">CHALK (백화/묻어남)</th>
          </tr>
          <tr>
            <th>기간</th><th>ROOF</th><th>WALL</th>
            <th>기간</th><th>ROOF</th><th>WALL</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function buildProductRowHtml(product: ProductWarranty): string {
  const colorFadingMode = resolveColorFadingMode(product)
  const chalkMode = resolveChalkMode(product)
  const group = cellValue(product.productGroup.replace(/\n/g, ' '))

  const colorCells =
    colorFadingMode === 'merged'
      ? `<td colspan="3">${cellValue(product.colorFading)}</td>`
      : `<td>${cellValue(product.colorFading)}</td><td>${cellValue(product.colorFadingRoof)}</td><td>${cellValue(product.colorFadingWall)}</td>`

  const chalkCells =
    chalkMode === 'merged'
      ? `<td colspan="3">${cellValue(product.chalk)}</td>`
      : `<td>${cellValue(product.chalk)}</td><td>${cellValue(product.chalkRoof)}</td><td>${cellValue(product.chalkWall)}</td>`

  return `
    <tr>
      <td>${group}</td>
      <td>${cellValue(product.perforation)}</td>
      <td>${cellValue(product.peelFlake)}</td>
      ${colorCells}
      ${chalkCells}
    </tr>
  `
}

function formatAttachmentNames(raw: string): string {
  const files = parseFileAttachments(raw)
  if (files.length === 0) return '-'
  return files.map((file) => file.name).join(', ')
}

export function buildWarrantyRequestPdfHtml(request: WarrantyIssuanceRequest): string {
  const coatingStructure = joinCoatingStructures(parseCoatingStructures(request.coatingStructure))
  const language = joinMultiValue(parseMultiValue(request.language))
  const warrantyTermBlock =
    request.warrantyTermMode === WARRANTY_TERM_COMPANY
      ? `
        <div class="pdf-field" style="grid-column: 1 / -1;">
          <div class="pdf-label">당사 보증 연한</div>
          ${buildCompanyWarrantyTableHtml(request)}
        </div>
      `
      : request.warrantyTermMode
        ? fieldBlock('요청 연한', formatRequestWarrantyTerm(request), true)
        : ''

  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <style>${PDF_STYLES}</style>
      </head>
      <body>
        <div class="pdf-root">
          <h1 class="pdf-title">보증 발행 의뢰서</h1>

          <section class="pdf-section">
            <h2 class="pdf-section-title">요청자 정보</h2>
            <div class="pdf-grid">
              ${fieldBlock('요청일자', request.requestDate)}
              ${fieldBlock('요청팀', formatRequestTeam(request))}
              ${fieldBlock('요청자명', request.requesterName)}
            </div>
          </section>

          <section class="pdf-section">
            <h2 class="pdf-section-title">제품 정보</h2>
            <div class="pdf-grid">
              ${fieldBlock('품목', request.productItem)}
              ${fieldBlock('제품명(색상명)', request.colorName)}
              ${fieldBlock('수지', formatRequestResin(request))}
              ${fieldBlock('도료사', formatRequestPaintCompany(request))}
              ${fieldBlock('소재', formatRequestMaterial(request))}
              ${fieldBlock('도장구조', coatingStructure)}
            </div>
          </section>

          <section class="pdf-section">
            <h2 class="pdf-section-title">보증 국가 정보</h2>
            <div class="pdf-grid-2">
              ${fieldBlock('국가', request.region)}
              ${fieldBlock('세부 국가명', formatRequestDetailRegion(request))}
            </div>
          </section>

          <section class="pdf-section">
            <h2 class="pdf-section-title">보증 발행 상세 정보</h2>
            <div class="pdf-grid">
              ${fieldBlock('수요가명', request.customer)}
              ${fieldBlock('발행 목적', request.usage)}
              ${fieldBlock('발행 언어', language)}
              ${fieldBlock('요청 보증 연한', request.warrantyTermMode)}
              ${warrantyTermBlock}
              ${fieldBlock('추가 요청 사항', request.additionalRequest, true)}
              ${fieldBlock('추가 요청 첨부', formatAttachmentNames(request.additionalRequestAttachments))}
            </div>
          </section>
        </div>
      </body>
    </html>
  `
}
