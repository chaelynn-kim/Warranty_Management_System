/**
 * Firebase 웹 앱 공개 설정 (warranty-management-common — 운영 Hosting과 동일).
 * .env가 없어도 로컬 개발 시 운영과 같은 Firestore를 사용합니다.
 */
export const EMBEDDED_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAkUwm1_ytz7JuK-gDdUBSn5H_KJthZCNY',
  authDomain: 'warranty-management-common.firebaseapp.com',
  projectId: 'warranty-management-common',
  storageBucket: 'warranty-management-common.firebasestorage.app',
  messagingSenderId: '688570818869',
  appId: '1:688570818869:web:c353c9b2b82f9c441cac7c',
} as const
