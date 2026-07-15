# Warranty Management System

SeAH Coated Metal 보증서 관리 웹 애플리케이션

## 기능

- **보증서 발행 관리**: 발행 내역 조회, 필터링, KPI 통계
- **당사 보증연한**: 고위험/저위험 국가별 보증연한 기준표

## 기술 스택

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Lucide React (아이콘)

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5174` 접속

> **포트 안내:** Process Data Monitoring System(판재라인)은 `http://localhost:5173`, 보증서 관리 시스템은 `http://localhost:5174`를 사용합니다.

## 빌드

```bash
npm run build
npm run preview
```

## Firebase Hosting 배포

프로젝트에 `firebase-tools`가 포함되어 있어 전역 설치 없이 배포할 수 있습니다.

```bash
npm run deploy:hosting
```

또는 단계별로 실행할 때 (PowerShell):

```powershell
npm run build
npx firebase deploy --only hosting
```

> PowerShell에서 한 줄로 실행할 때는 `&&` 대신 `;`를 사용하세요.  
> 예: `npm run build; npx firebase deploy --only hosting`

최초 1회 Firebase 로그인이 필요합니다.

```bash
npx firebase login
```

배포 URL: https://warranty-management-common.web.app

Storage·Firestore 보안 규칙(첨부 파일, Warranty Guide 등)을 반영하려면 Hosting 배포와 별도로 한 번 실행하세요.

```bash
npm run deploy:rules
```
