export type ActivityAction =
  | 'auth.login'
  | 'auth.logout'
  | 'request.submit'
  | 'request.duplicate_prompt'
  | 'request.duplicate_view_existing'
  | 'request.duplicate_continue'
  | 'request.status_change'
  | 'request.approve'
  | 'request.save'
  | 'certificate.generate'
  | 'period.save'
  | 'guide.upload'
  | 'permission.save'
  | 'email_mail.save'
  | 'email_mail.test'
  | 'template.upload'
  | 'template.reset'

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  'auth.login': '로그인',
  'auth.logout': '로그아웃',
  'request.submit': '보증서 발행 의뢰',
  'request.duplicate_prompt': '동일 의뢰 알림 표시',
  'request.duplicate_view_existing': '동일 의뢰 — 기존 확인',
  'request.duplicate_continue': '동일 의뢰 — 신규 계속',
  'request.status_change': '의뢰 상태 변경',
  'request.approve': '팀장 승인',
  'request.save': '의뢰서 저장',
  'certificate.generate': '보증서 자동 작성',
  'period.save': '보증연한 저장',
  'guide.upload': 'Warranty Guide 업로드',
  'permission.save': '권한 설정 저장',
  'email_mail.save': '메일 수신인 저장',
  'email_mail.test': '메일 테스트 발송',
  'template.upload': '보증서 양식 업로드',
  'template.reset': '보증서 양식 초기화',
}

export interface ActivityLogEntry {
  id: string
  createdAt: string
  userEmail: string
  userName?: string
  action: ActivityAction | string
  actionLabel: string
  detail?: string
  meta?: Record<string, string | number | boolean | null>
}

export interface ActivityLogWriteInput {
  action: ActivityAction
  detail?: string
  meta?: Record<string, string | number | boolean | null>
  userEmail?: string | null
  userName?: string | null
}
