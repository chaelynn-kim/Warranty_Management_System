import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { WarrantyIssuanceRequest } from '../../types'
import { buildWarrantyRequestPdfHtml } from './buildWarrantyRequestPdfHtml'

function buildPdfFilename(request: WarrantyIssuanceRequest, sequenceNo?: number): string {
  const datePart = request.requestDate.replace(/[^\d]/g, '') || '날짜미상'
  const noPart = sequenceNo != null ? `No${sequenceNo}_` : ''
  return `보증발행의뢰서_${noPart}${datePart}.pdf`
}

export async function downloadWarrantyRequestPdf(
  request: WarrantyIssuanceRequest,
  options?: { sequenceNo?: number }
): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-10000px'
  iframe.style.top = '0'
  iframe.style.width = '794px'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    document.body.removeChild(iframe)
    throw new Error('PDF 문서를 준비하지 못했습니다.')
  }

  doc.open()
  doc.write(buildWarrantyRequestPdfHtml(request))
  doc.close()

  await new Promise<void>((resolve) => {
    if (doc.readyState === 'complete') {
      resolve()
      return
    }
    iframe.onload = () => resolve()
  })

  const root = doc.querySelector('.pdf-root') as HTMLElement | null
  if (!root) {
    document.body.removeChild(iframe)
    throw new Error('PDF 내용을 불러오지 못했습니다.')
  }

  try {
    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: root.scrollWidth,
      windowHeight: root.scrollHeight,
    })

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0
    const imgData = canvas.toDataURL('image/png')

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(buildPdfFilename(request, options?.sequenceNo))
  } finally {
    document.body.removeChild(iframe)
  }
}
