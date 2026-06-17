/**
 * Firebase 웹 앱 공개 설정 (Console → 프로젝트 설정 → 일반 → 내 앱).
 * .env가 없어도 인증이 동작하도록 폴백으로 사용합니다.
 */
export const EMBEDDED_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAIGUKL4fj1mOPQw94tRD64DwRzejJez8M',
  authDomain: 'seah-monitoring-system.firebaseapp.com',
  projectId: 'seah-monitoring-system',
  storageBucket: 'seah-monitoring-system.firebasestorage.app',
  messagingSenderId: '715674461320',
  appId: '1:715674461320:web:cc55046936315e89706b3d',
} as const
