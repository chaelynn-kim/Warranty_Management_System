export const WARRANTY_REQUEST_RESIN_ALL = '전체'

export const WARRANTY_REQUEST_RESIN_OTHER = '기타'

export const WARRANTY_REQUEST_RESINS = [
  'RMP',
  'HDP',
  'SMP',
  'ADP',
  'NDP',
  'URETHANE',
  'MVP',
  'SQP40',
  'PVDF',
  'RMP MATT',
] as const

export const WARRANTY_REQUEST_PRODUCT_ITEMS = ['PRINT', 'PAINT'] as const

export const WARRANTY_REQUEST_TEAMS = ['영업1팀', '영업2팀', '수출팀', '기타'] as const

export const WARRANTY_REQUEST_TEAM_OTHER = '기타'

export const WARRANTY_REQUEST_COATING_STRUCTURES = ['2COAT, 2BAKE', '3COAT, 3BAKE'] as const

export const WARRANTY_REQUEST_MATERIALS = ['GI', 'GL', 'AL'] as const

export const WARRANTY_REQUEST_MATERIAL_OTHER = '기타'

export const WARRANTY_REQUEST_PAINT_COMPANIES = ['NCC', 'KCC', 'AK', 'PPG', '삼화', '발스파'] as const

export const WARRANTY_REQUEST_REGIONS = ['고위험국가', '저위험국가'] as const

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
  '스리랑카',
  '말레이시아',
  '태국',
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
  '유럽',
  '포르투갈',
] as const

export const WARRANTY_REQUEST_DETAIL_REGION_CUSTOM = '기타'

export const WARRANTY_REQUEST_LANGUAGES = ['영문', '국문'] as const

export const WARRANTY_TERM_COMPANY = '당사 보증 연한'

export const WARRANTY_TERM_OPTIONS = [WARRANTY_TERM_COMPANY, '직접 입력'] as const

export const WARRANTY_TERM_OTHER = '직접 입력'

export function detailRegionsForArea(region: string): readonly string[] {
  if (region === '고위험국가') return HIGH_RISK_DETAIL_REGIONS
  if (region === '저위험국가') return LOW_RISK_DETAIL_REGIONS
  return []
}
