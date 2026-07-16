import {
  HIGH_RISK_DETAIL_REGIONS,
  LOW_RISK_DETAIL_REGIONS,
} from '../../constants/warrantyRequestOptions'

/** 영문 보증서 3페이지 — 세부 국가명 고정 번역 (의뢰서 세부 국가명 기준) */
const COUNTRY_EN: Record<string, string> = {
  // 저위험국가
  미국: 'U.S.A',
  캐나다: 'Canada',
  러시아: 'Russia',
  일본: 'Japan',
  중국: 'China',
  한국: 'Korea',
  유럽: 'Europe',
  포르투갈: 'Portugal',
  // 고위험국가
  에콰도르: 'Ecuador',
  파나마: 'Panama',
  과테말라: 'Guatemala',
  콜롬비아: 'Colombia',
  페루: 'Peru',
  브라질: 'Brazil',
  '칠레(일부)': 'Chile',
  칠레: 'Chile',
  멕시코: 'Mexico',
  사우디: 'Saudi Arabia',
  쿠웨이트: 'Kuwait',
  리비아: 'Libya',
  이집트: 'Egypt',
  호주: 'Australia',
  뉴질랜드: 'New Zealand',
  가나: 'Ghana',
  남아공: 'South Africa',
  케냐: 'Kenya',
  인도: 'India',
  스리랑카: 'Sri Lanka',
  말레이시아: 'Malaysia',
  태국: 'Thailand',
  필리핀: 'Philippines',
  베트남: 'Vietnam',
}

for (const country of [...HIGH_RISK_DETAIL_REGIONS, ...LOW_RISK_DETAIL_REGIONS]) {
  if (!COUNTRY_EN[country]) {
    COUNTRY_EN[country] = country
  }
}

export function translateCountryToEnglish(countryKo: string): string {
  const trimmed = countryKo.trim()
  if (!trimmed) return ''
  return COUNTRY_EN[trimmed] ?? trimmed
}

/** 영문 보증서 3페이지 — 세부 국가명 고정 번역 (마침표는 템플릿/호출측에서 처리) */
export function translateDetailRegionToEnglish(detailRegionKo: string): string {
  const parts = detailRegionKo
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== '-')

  if (parts.length === 0) return ''
  return parts.map((part) => translateCountryToEnglish(part)).join(', ')
}

/**
 * PAINT 영문: 템플릿에 국가명 뒤 `.`이 있어 마침표 없이 치환.
 * PRINT 영문: 빨간 자리표시자에 마침표가 포함되어 있어 끝에 `.`을 붙임.
 */
export function formatDetailRegionEnForSlide3(
  detailRegionKo: string,
  options: { includeTrailingPeriod: boolean }
): string {
  const name = translateDetailRegionToEnglish(detailRegionKo).replace(/\.+$/, '').trim()
  if (!name) return ''
  return options.includeTrailingPeriod ? `${name}.` : name
}
