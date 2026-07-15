/**
 * PPTX→PDF 변환 서버(Cloud Run) URL.
 * .env의 VITE_PPTX_TO_PDF_API_URL이 있으면 우선하고, 없을 때 이 폴백을 사용합니다.
 */
export const EMBEDDED_PPTX_TO_PDF_CONFIG = {
  apiUrl: 'https://pptx-to-pdf-converter-688570818869.asia-northeast3.run.app',
  apiKey: '',
} as const
