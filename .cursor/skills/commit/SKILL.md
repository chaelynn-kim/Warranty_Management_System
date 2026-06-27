---
name: commit
description: >-
  Generates Korean Conventional Commits messages from git changes and creates
  commits safely. Use when the user invokes /commit, asks to commit, write a
  commit message, or review staged changes.
disable-model-invocation: true
---

# /commit

## Message format

```
<type>: <제목>

<본문 (선택)>
```

## 타입

| Type       | 설명                         | 예시                          |
| ---------- | ---------------------------- | ----------------------------- |
| `feat`     | 새 기능                      | `feat: 카카오 로그인 추가`    |
| `fix`      | 버그 수정                    | `fix: 날짜 포맷팅 오류 수정`  |
| `chore`    | 빌드, 설정 변경              | `chore: 의존성 업데이트`      |
| `refactor` | 코드 리팩토링                | `refactor: useAuth 훅 간소화` |
| `style`    | 코드 포맷팅 (로직 변경 없음) | `style: eslint 경고 수정`     |
| `docs`     | 문서 변경                    | `docs: README 업데이트`       |
| `test`     | 테스트 추가/수정             | `test: 유닛 테스트 추가`      |

## 규칙

1. **제목**: 최대 50자, 마침표 없음, 한글로 작성
2. **타입**: 영문 소문자 유지 (feat, fix, chore 등)
3. **본문**: 선택사항, "무엇"과 "왜"를 설명

## Workflow

### 1. Inspect changes (always)

Run in parallel:

```bash
git status
git diff
git diff --staged
git log -5 --oneline
```

- Prefer **staged** changes when present; otherwise use unstaged.
- Match recent `git log` tone and scope.
- Do not commit `.env`, credentials, or other secrets. Warn if the user asks to include them.

### 2. Draft message

- One type per commit; pick the dominant change.
- Title: imperative Korean, ≤50 chars, no period.
- Body: 1–3 lines on why, only when helpful.

### 3. Commit (only if user explicitly asks)

Do **not** commit unless the user clearly requests it.

1. Stage relevant files (`git add`); skip secret-like paths.
2. Commit with HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
<type>: <제목>

<본문>
EOF
)"
```

3. `git status` to verify success.

**Git safety**

- Never update git config, force-push, or skip hooks unless the user explicitly asks.
- Never amend unless the user asked, HEAD was created in this conversation, and the commit was not pushed.
- If a hook fails, fix and create a **new** commit (do not amend a failed commit).
- Do not push unless the user asks.

## Examples

**새 기능:**

```
feat: 감정 태그 선택 기능 추가

20개의 사전 정의된 감정 태그 멀티 선택 지원
```

**버그 수정:**

```
fix: 모바일에서 카드 오버플로우 수정
```

**설정 변경:**

```
chore: tailwind 업데이트 및 컴포넌트 추가

- tailwindcss 4.1.9로 업그레이드
- shadcn/ui button, card 컴포넌트 추가
```

**리팩토링:**

```
refactor: 기록 목록 컴포넌트 분리
```
