import {
  HIGH_RISK_DETAIL_REGIONS,
  LOW_RISK_DETAIL_REGIONS,
} from '../../constants/warrantyRequestOptions'

const COUNTRY_EN: Record<string, string> = {
  에콰도르: 'Ecuador',
  파나마: 'Panama',
  과테말라: 'Guatemala',
  콜롬비아: 'Colombia',
  페루: 'Peru',
  브라질: 'Brazil',
  '칠레(일부)': 'Chile (partial)',
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
  미국: 'United States',
  캐나다: 'Canada',
  러시아: 'Russia',
  일본: 'Japan',
  중국: 'China',
  한국: 'Korea',
  유럽: 'Europe',
  포르투갈: 'Portugal',
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

export function translateDetailRegionToEnglish(detailRegionKo: string): string {
  const parts = detailRegionKo
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return ''
  return parts.map((part) => translateCountryToEnglish(part)).join(', ')
}
