export type PermissionRoleId =
  | 'admin'
  | 'quality'
  | 'teamLeader'
  | 'receiptAssignee'

export interface PermissionRoleConfig {
  id: PermissionRoleId
  label: string
  description: string
  /** 이메일 목록 (소문자 정규화되어 저장) */
  emails: string[]
}

export interface PermissionConfigRecord {
  roles: Record<PermissionRoleId, PermissionRoleConfig>
}

/** 권한 관리 탭 표시 순서 */
export const PERMISSION_ROLE_ORDER: PermissionRoleId[] = [
  'admin',
  'teamLeader',
  'receiptAssignee',
  'quality',
]

/** UI 전용 — Firestore에는 저장하지 않음 */
export const PERMISSION_ROLE_UI: Record<
  PermissionRoleId,
  {
    accent: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'yellow'
    capabilities: string[]
  }
> = {
  admin: {
    accent: 'green',
    capabilities: [
      '보증연한 수정',
      'Warranty Guide 파일 업로드',
      '보증서 양식·메일 수신인·권한 관리 탭',
      '발행 로그 수정',
    ],
  },
  teamLeader: {
    accent: 'blue',
    capabilities: ['승인 대기 → 승인 처리'],
  },
  receiptAssignee: {
    accent: 'purple',
    capabilities: ['승인 → 접수 처리'],
  },
  quality: {
    accent: 'yellow',
    capabilities: [
      '보증서 발행 관리의 품질 영역 작성·수정',
      '발행 완료 처리',
      '보증 불가 처리',
    ],
  },
}

export function createDefaultPermissionConfig(): PermissionConfigRecord {
  const qualityTeamEmails = [
    'sachunsa@seah.co.kr',
    'kss2000@seah.co.kr',
    'jeongyeon.hwang@seah.co.kr',
    'jonghyuk.lee@seah.co.kr',
    'jeongkyu.choi@seah.co.kr',
    'chaelynn.kim@seah.co.kr',
  ]

  return {
    roles: {
      admin: {
        id: 'admin',
        label: '시스템 관리자',
        description:
          '보증연한 수정, Warranty Guide 파일 업로드, 보증서 양식·메일 수신인·권한 관리 탭, 발행 로그 수정',
        emails: ['chaelynn.kim@seah.co.kr'],
      },
      teamLeader: {
        id: 'teamLeader',
        label: '의뢰 승인',
        description: '승인 대기 → 승인 처리',
        emails: ['sachunsa@seah.co.kr', 'chaelynn.kim@seah.co.kr'],
      },
      receiptAssignee: {
        id: 'receiptAssignee',
        label: '접수 및 작성',
        description: '의뢰 접수 처리',
        emails: [...qualityTeamEmails],
      },
      quality: {
        id: 'quality',
        label: '보증서 작성 및 발행',
        description: '보증서 발행 관리의 품질 영역 작성·수정, 발행 완료·보증 불가 처리',
        emails: [...qualityTeamEmails],
      },
    },
  }
}
