# Money Coach

가계부 기반 현금 흐름 분석과 월별 저축 가이드를 제공하는 개인 재무 코칭 MVP 프로젝트입니다.

## 프로젝트 개요

이 프로젝트는 사용자가 다음 흐름을 한 번에 이어서 사용할 수 있도록 만드는 것을 목표로 합니다.

- 월 수입과 지출 기록
- 월별 재무 진단 입력
- 저축 가능 금액 계산
- 추천 저축 방식 확인
- 추천 플랜 저장
- 가계부 데이터와 진단 결과 연결

현재는 실제 서비스 전 단계의 MVP 수준으로, 핵심 기능 검증과 사용자 흐름 확인에 초점을 두고 있습니다.

## 현재 구현된 범위

구현 완료된 기능:

- 회원가입 / 로그인 / 로그아웃
- 액세스 토큰 / 리프레시 토큰 기반 인증
- 월별 진단 입력
- 추천 결과 계산 및 조회
- 추천 플랜 저장
- 월별 가계부 CRUD
- 가계부 요약 조회
- 가계부 월과 진단 월 연결
- 홈 / 로그인 / 진단 / 결과 / 플랜 / 가계부 화면
- PostgreSQL + Prisma 연동
- 백엔드 e2e 테스트

## 기술 스택

- 프론트엔드: Next.js 16, React 19, TypeScript, Tailwind CSS
- 백엔드: NestJS, TypeScript
- 데이터베이스: PostgreSQL
- ORM: Prisma
- 패키지 매니저: pnpm workspace

## 폴더 구조

```text
.
├─ apps/
│  ├─ api/        # NestJS 백엔드
│  └─ web/        # Next.js 프론트엔드
├─ docs/          # 기획 및 개발 준비 문서
├─ packages/
├─ package.json
└─ pnpm-workspace.yaml
```

## 실행 전 준비 사항

필수:

- Node.js 24 이상
- pnpm 11 이상
- Docker Desktop 또는 로컬 PostgreSQL

Windows에서 `pnpm`이 바로 인식되지 않으면 현재 터미널 세션에 아래를 추가해서 사용할 수 있습니다.

```powershell
$env:Path += ";$env:APPDATA\npm"
```

## 시작 방법

### 1. 의존성 설치

루트 디렉토리에서 실행:

```powershell
pnpm install
```

### 2. PostgreSQL 실행

Docker를 사용할 경우, 현재 프로젝트에서 사용한 예시는 아래와 같습니다.

```powershell
docker run --name money-coach-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=money_coach `
  -p 5432:5432 `
  -d postgres
```

정상 실행 확인:

```powershell
docker ps
```

### 3. 백엔드 환경 변수 설정

`apps/api/.env` 파일을 만들고 아래처럼 설정합니다.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/money_coach?schema=public"
JWT_ACCESS_SECRET="dev-access-secret"
JWT_REFRESH_SECRET="dev-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
```

선택 사항:

프론트에서 API 주소를 따로 지정하고 싶다면 `apps/web/.env.local`을 만들고 아래처럼 설정할 수 있습니다.

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api/v1"
```

### 4. Prisma 마이그레이션 실행

루트에서 실행:

```powershell
pnpm --filter api exec prisma migrate dev
```

Prisma Client 생성이 필요하면:

```powershell
pnpm --filter api prisma:generate
```

### 5. 백엔드 실행

루트에서 실행:

```powershell
pnpm dev:api
```

기본 주소:

- 서버: `http://localhost:3000`
- API Base: `http://localhost:3000/api/v1`

### 6. 프론트엔드 실행

다른 터미널을 열고 루트에서 실행:

```powershell
pnpm dev:web
```

기본 주소:

- `http://localhost:3001`

환경에 따라 `3000` 포트가 비어 있으면 그 포트를 사용할 수 있지만, 현재는 API가 `3000`을 쓰므로 보통 프론트는 `3001`에서 열립니다.

## 자주 쓰는 명령어

### 루트

```powershell
pnpm dev:api
pnpm dev:web
```

### 백엔드

```powershell
pnpm --filter api start:dev
pnpm --filter api test:e2e
pnpm --filter api prisma:migrate
pnpm --filter api prisma:studio
```

### 프론트엔드

```powershell
pnpm --filter web dev
pnpm --filter web build
```

## 테스트

백엔드 e2e 테스트:

```powershell
pnpm --filter api test:e2e
```

개발 중 사용한 타입체크 예시:

```powershell
pnpm exec tsc -p apps/web/tsconfig.json --noEmit --incremental false
pnpm exec tsc -p apps/api/tsconfig.json --noEmit --incremental false
```

## 주요 화면

- `/` : 로그인 상태에 따라 랜딩 또는 대시보드
- `/login` : 로그인 / 회원가입
- `/diagnosis` : 월별 재무 진단 입력
- `/result/:inputId` : 추천 결과 화면
- `/plans` : 저장한 추천 플랜
- `/ledger` : 월별 가계부

## 데이터 모델 요약

핵심 모델:

- `User`
- `MonthlyFinanceInput`
- `RecommendationResult`
- `SavedRecommendationPlan`
- `LedgerEntry`

전체 스키마는 `apps/api/prisma/schema.prisma`를 참고하면 됩니다.

## 참고 사항

- 현재 추천 결과는 규칙 기반 로직입니다.
- 특정 종목 추천이 아니라 저축 방식과 배분 방향을 제안하는 구조입니다.
- MVP 단계이므로 운영 환경 기준의 보안, 배포, 모니터링 설정은 아직 포함되지 않았습니다.

## 다음 작업 후보

- Swagger / OpenAPI 문서 정리
- 루트 `package.json` 스크립트 정리
- 프론트 실제 사용자 테스트
- 배포 설정 추가
- AI 기반 추천 고도화
- README에 화면 스크린샷 추가
