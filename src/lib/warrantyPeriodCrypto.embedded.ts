/**
 * 보증연한 저장 암호화용 시크릿 (빌드에 포함).
 * 운영에서 교체하려면 .env 의 VITE_WARRANTY_PERIOD_ENCRYPTION_KEY 를 설정하세요.
 * 주의: 프론트엔드 키이므로 Firestore/localStorage 평문 노출 방지용이며,
 * 번들 접근이 가능한 공격자까지 막는 서버측 비밀키는 아닙니다.
 */
export const EMBEDDED_WARRANTY_PERIOD_ENCRYPTION_SECRET =
  'seah-cm-warranty-period-aes-2026-v1' as const
