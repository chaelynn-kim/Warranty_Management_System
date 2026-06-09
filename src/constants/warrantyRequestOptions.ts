export const WARRANTY_REQUEST_RESINS = [
  'RMP',
  'HDP',
  'SMP',
  'ADP',
  'NDP',
  'URETHANE',
  'SQP40',
  'PVDF',
  'RMP MATT',
] as const

export const WARRANTY_REQUEST_MATERIALS = ['GI', 'GL', 'AL'] as const

export const WARRANTY_REQUEST_REGIONS = ['고위험지역', '저위험지역'] as const

export const HIGH_RISK_DETAIL_REGIONS = [
  '에콰도르',
  '파나마',
  '과테말라',
  '콜롬비아',
  '페루',
  '브라질',
  '칠레(일부)',
  '멕시코',
  '사우디',
  '쿠웨이트',
  '리비아',
  '이집트',
  '호주',
  '뉴질랜드',
  '가나',
  '남아공',
  '케냐',
  '인도',
  '스리랑카(인도 남부)',
  '말레이시아',
  '태국',
  '인도네시아',
  '필리핀',
  '베트남',
] as const

export const LOW_RISK_DETAIL_REGIONS = [
  '미국',
  '캐나다',
  '러시아',
  '일본',
  '중국',
  '한국',
  '포르투갈',
] as const

export const WARRANTY_REQUEST_LANGUAGES = ['영문', '국문'] as const

export const WARRANTY_TERM_OPTIONS = ['당사 보증 연한', '기타'] as const

export const WARRANTY_TERM_OTHER = '기타'

export function detailRegionsForArea(region: string): readonly string[] {
  if (region === '고위험지역') return HIGH_RISK_DETAIL_REGIONS
  if (region === '저위험지역') return LOW_RISK_DETAIL_REGIONS
  return []
}
