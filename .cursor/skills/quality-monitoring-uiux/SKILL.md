---
name: quality-monitoring-uiux
description: >-
  Designs and implements UI/UX for the quality management monitoring dashboard
  extending the Warranty Management System (steel company QC team). Use when
  building dashboard layouts, KPI cards, charts, filters, alerts, monitoring
  screens, or when the user asks for dashboard UI/UX, 품질 모니터링, or
  대시보드 디자인.
disable-model-invocation: true
---

# 품질 모니터링 대시보드 UI/UX

## 맥락

- **사용자**: 철강회사 품질경영팀 (팀장·담당자·영업 연계)
- **목적**: 보증서 발행·의뢰·검토 흐름을 한눈에 모니터링하고 이상·지연을 빠르게 파악
- **범위**: 기존 **보증서 관리 시스템** 확장 — 새 화면도 동일 디자인 언어 유지
- **톤**: 다크 테마, 산업용 B2B, 정보 밀도 높음, 장식보다 가독성·신뢰감

## 디자인 원칙

1. **한 화면 = 한 질문** — 예: "오늘 처리해야 할 건은?", "어디서 지연되나?"
2. **숫자 → 맥락 → 행동** — KPI → 보조 설명 → 클릭 시 상세(테이블·모달)
3. **상태는 색만이 아니라 라벨+아이콘** — 색약·다크 환경 고려
4. **과한 네온·글로우 금지** — 기존 `StatCard`·버튼 수준의 subtle glow만 허용
5. **한국어 우선** — 영문 약어는 업무에서 쓰는 것만 (PRINT, PAINT, KO/EN 등)

## 디자인 토큰 (기존 시스템 준수)

`src/index.css` / Tailwind 시맨틱 클래스 사용. 새 hex 임의 추가 금지.

| 용도 | 클래스 |
|------|--------|
| 페이지 배경 | `bg-bg-primary` |
| 카드·패널 | `bg-bg-secondary`, `border border-border`, `rounded-xl` |
| 표·입력 배경 | `bg-bg-tertiary`, `bg-bg-primary/50` |
| 본문 | `text-text-primary` |
| 라벨·보조 | `text-text-secondary`, `text-text-muted` |
| 주요 액션 | `bg-accent`, `hover:bg-accent-hover`, `text-white` |
| 포커스 | `focus:border-accent` |

## 상태 색상 (보증 의뢰와 통일)

| 상태 | 의미 | variant / 색 |
|------|------|----------------|
| 승인 대기 | 팀장 승인 전 | `amber` |
| 접수 | 검토·작성 중 | `sky` |
| 발행 완료 | 정상 종료 | `green` / `emerald` |
| 보증 불가 | 거절·불가 | `red` |
| 경고·임계치 | SLA 임박 등 | `amber` (대기와 구분 시 아이콘·라벨 필수) |
| 정상·추세 양호 | — | `emerald` / `blue` |

기존 `RequestStatusBadge`, `StatCard` variant 재사용.

## 레이아웃 패턴

### 페이지 골격

```
PageHeader (subtitle + title + description)
  ↓
KPI StatCard 그리드 (1×4 또는 2×2, sm/lg 브레이크포인트)
  ↓
필터·기간 (sticky optional) — FilterActions 스타일
  ↓
메인 콘텐츠 (차트 | 테이블 | 분할)
```

- `PageHeader`: `src/components/layout/PageHeader.tsx`
- KPI: `StatCard` — `src/components/ui/StatCard.tsx`
- 참고: `WarrantyRequestStatusSummary` — 의뢰 상태 요약 패턴

### 그리드

- KPI: `grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4`
- 차트 2열: `grid grid-cols-1 gap-6 lg:grid-cols-2`
- 본문 카드: `rounded-xl border border-border bg-bg-secondary p-4 sm:p-6`

### 밀도

- **요약(대시보드)**: 여백 넉넉, 카드·차트 위주
- **운영(목록)**: `periodTheme` 표 스타일 — `src/components/warranty-period/periodTheme.ts`
- 한 카드에 KPI 6개 이상 넣지 않음 → 그룹 분리

## 컴포넌트 재사용 우선순위

1. `StatCard`, `PageHeader`, `FilterActions` (`filterSearchButtonClass` / `filterResetButtonClass`)
2. `WarrantyRequestTable` / `WarrantyRequestPeriodSearch` 패턴 (기간·검색)
3. `RequestStatusBadge`, `FormSectionHeader` (섹션 구분)
4. `DatePicker`, `OptionDropdown*` (필터)
5. 차트는 **프로젝트에 이미 있는 라이브러리**가 있으면 그것만 사용; 없으면 추가 전 사용자에게 확인

## 모니터링 대시보드 정보 구조

### 상단 KPI (예시 — 실제 지표는 요구에 맞게)

| KPI | 설명 |
|-----|------|
| 승인 대기 | 팀장 액션 필요 |
| 접수·진행 중 | 담당자 큐 |
| 금주 발행 완료 | 처리량 |
| 평균 처리 일수 | SLA 추세 |

각 카드: **숫자 + 짧은 subtext + (선택) 전주 대비·progress bar**

### 중단 — 추세·분포

- **막대/선**: 월별·주별 의뢰·발행 건수
- **도넛/막대**: 품목(PRINT/PAINT), 국가(고·저위험), 상태 비율
- 차트 제목·축·범례 **한글**
- Y축 0부터; 불필요한 3D·그라데이션 금지

### 하단 — 액션 테이블

- 지연 건, 승인 대기 오래된 건, 최근 발행 완료
- 행 클릭 → 기존 `WarrantyIssuanceRequestModal` 등 상세로 연결
- `highlightedRowId` 패턴으로 대시보드에서 진입 시 강조

## 필터·기간 UX

- 기본: **최근 30일** 또는 **당월**
- `발행일자` / `요청일자` 라벨 명확히
- 리셋 버튼 항상 제공 (`filterResetButtonClass`)
- 적용된 필터가 있으면 상단에 요약 칩 또는 짧은 문구 표시

## 알림·빈 상태

- **빈 데이터**: "해당 기간에 데이터가 없습니다" + 기간 넓히기 안내
- **로딩**: 스피너 + `Loader2` + `text-accent` (기존 패턴)
- **오류**: `text-red-400`, `role="alert"`
- **임계치 초과**: 카드 border 강조 + `StatCard` red/amber; 소리·깜빡임 금지

## 접근성·가독성

- KPI 숫자: `tabular-nums`
- 클릭 가능 영역: 최소 44×44px 터치 타깃
- 테이블: 헤더 `sticky`, 긴 텍스트 `truncate` + `title` 툴팁
- 키보드: 모달·드롭다운 Esc 닫기 (기존 모달 패턴 따름)

## 구현 워크플로우

1. **화면이 답할 질문** 1문장으로 정의
2. **KPI ≤4개** 선정; 나머지는 드릴다운
3. 기존 컴포넌트 목록 확인 후 재사용
4. 와이어 수준으로 섹션 순서 확정 → 코드
5. `sm` / `lg` 브레이크포인트에서 깨짐 확인
6. 실제 시드·빈·대량 데이터로 표/차트 검증

## 하지 말 것

- 라이트 테마·새 브랜드 컬러 도입 (이 프로젝트 범위)
- KPI마다 다른 레이아웃 (카드 구조 통일)
- 차트만 있고 다음 행동(상세 링크)이 없는 화면
- 보증 업무와 무관한 게이미피케이션 UI
- 모바일 전용 별도 IA (반응형으로 충분; 모바일은 요약만)

## 추가 참고

- 발행 의뢰 상태 정의: `src/constants/warrantyRequestStatus.ts`
- 발행 관리 페이지 구조: `src/pages/WarrantyIssuancePage.tsx`
- 의뢰 요약 카드: `src/components/warranty-request/WarrantyRequestStatusSummary.tsx`
