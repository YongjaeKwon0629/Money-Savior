# 가계부 기반 저축 운영 추천 서비스 MVP API 명세

## 1. 문서 개요

본 문서는 가계부 기반 저축 운영 추천 서비스 MVP 구현에 필요한 API를 정의하기 위한 문서이다.  
MVP 단계에서는 입력값 저장, 추천 결과 생성, 추천 결과 조회를 중심으로 최소 API 세트를 설계한다.

## 2. API 설계 원칙

- API는 화면 흐름 기준으로 최소 개수만 정의한다.
- 추천 결과 생성은 입력 저장, 계산 수행, 결과 저장을 하나의 요청에서 처리한다.
- 결과 응답은 프론트가 결과 화면을 바로 렌더링할 수 있는 형태로 제공한다.
- 결과 화면 액션은 DB 저장이 아니라 응답 시점에 조합한다.
- MVP에서는 이메일/비밀번호 기반 인증과 JWT 토큰 발급을 포함한다.

## 3. 공통 규칙

### 3.1 Base URL 예시

`/api/v1`

### 3.2 공통 응답 형식

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

### 3.3 공통 에러 응답 형식

```json
{
  "success": false,
  "data": null,
  "message": "유효하지 않은 입력값입니다."
}
```

## 4. MVP 확정 API 목록

| 메서드 | 경로 | 설명 | 필수 여부 |
|---|---|---|---|
| POST | `/auth/signup` | 회원가입 | 필수 |
| POST | `/auth/login` | 로그인 및 토큰 발급 | 필수 |
| POST | `/auth/refresh` | 액세스 토큰 재발급 | 필수 |
| POST | `/auth/logout` | 로그아웃 및 리프레시 토큰 무효화 | 필수 |
| GET | `/auth/me` | 현재 로그인 사용자 조회 | 필수 |
| POST | `/financial-inputs` | 월별 입력값 저장 및 추천 결과 생성 | 필수 |
| GET | `/recommendations/{inputId}` | 특정 입력 기준 추천 결과 조회 | 필수 |
| GET | `/financial-inputs/{inputId}` | 기존 입력값 조회 | 선택 |
| PUT | `/financial-inputs/{inputId}` | 입력값 수정 후 추천 결과 재생성 | 선택 |

### 4.1 MVP 1차 구현 권장 범위

초기 구현에서는 아래 API부터 우선 구현하는 것을 권장한다.

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /financial-inputs`
- `GET /recommendations/{inputId}`

`POST /auth/logout`, `GET /financial-inputs/{inputId}`, `PUT /financial-inputs/{inputId}`는 다음 순서로 추가한다.

## 5. 상세 API 명세

### 5.1 회원가입

#### POST `/auth/signup`

이메일과 비밀번호로 신규 사용자를 생성한다.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동"
}
```

#### Validation Rule

- `email`: 이메일 형식, 최대 255자
- `password`: 8자 이상, 영문/숫자/특수문자 조합 권장
- `name`: 1자 이상 50자 이하

#### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "홍길동"
    },
    "tokens": {
      "accessToken": "access-token",
      "refreshToken": "refresh-token"
    }
  },
  "message": "회원가입이 완료되었습니다."
}
```

### 5.2 로그인

#### POST `/auth/login`

등록된 이메일과 비밀번호로 로그인하고 토큰을 발급한다.

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### Validation Rule

- `email`: 이메일 형식
- `password`: 필수

#### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "홍길동"
    },
    "tokens": {
      "accessToken": "access-token",
      "refreshToken": "refresh-token"
    }
  },
  "message": "로그인이 완료되었습니다."
}
```

### 5.3 토큰 재발급

#### POST `/auth/refresh`

유효한 리프레시 토큰으로 새로운 액세스 토큰과 리프레시 토큰을 재발급한다.

#### Request Body

```json
{
  "refreshToken": "refresh-token"
}
```

#### Validation Rule

- `refreshToken`: 필수

#### Response

```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "new-access-token",
      "refreshToken": "new-refresh-token"
    }
  },
  "message": "토큰이 재발급되었습니다."
}
```

### 5.4 로그아웃

#### POST `/auth/logout`

현재 사용자의 리프레시 토큰을 무효화한다.

#### Header

- `Authorization: Bearer {accessToken}`

#### Response

```json
{
  "success": true,
  "data": null,
  "message": "로그아웃되었습니다."
}
```

### 5.5 현재 로그인 사용자 조회

#### GET `/auth/me`

현재 액세스 토큰 기준 로그인 사용자 정보를 조회한다.

#### Header

- `Authorization: Bearer {accessToken}`

#### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동"
  },
  "message": null
}
```

### 5.6 월별 입력값 저장 및 추천 결과 생성

#### POST `/financial-inputs`

사용자가 입력한 월별 재무 정보를 저장하고, 추천 결과를 생성한 뒤 결과 화면 렌더링에 필요한 데이터를 함께 반환한다.

#### Request Body

```json
{
  "targetMonth": "2026-04",
  "monthlyIncome": 2500000,
  "paydayDay": 25,
  "fixedExpense": 900000,
  "variableExpense": 1100000,
  "emergencyFundAmount": 300000,
  "savingGoal": "EMERGENCY_FUND",
  "savingPreference": "BALANCED"
}
```

#### Validation Rule

- `targetMonth`: YYYY-MM 형식
- `monthlyIncome`: 1 이상
- `paydayDay`: 1~31
- `fixedExpense`: 0 이상
- `variableExpense`: 0 이상
- `emergencyFundAmount`: 0 이상
- `savingGoal`: 정의된 enum 중 하나
- `savingPreference`: 정의된 enum 중 하나

#### 처리 규칙

- 동일한 `userId + targetMonth`가 이미 존재하면 기존 입력과 추천 결과를 갱신할지, 생성 차단할지 서버 정책을 정해야 한다.
- MVP 권장안은 `upsert` 방식이다.

#### Response

```json
{
  "success": true,
  "data": {
    "inputId": 1,
    "recommendationId": 10,
    "targetMonth": "2026-04",
    "summary": {
      "monthlyIncome": 2500000,
      "fixedExpense": 900000,
      "variableExpense": 1100000,
      "surplusAmount": 500000,
      "emergencyFundStatus": "INSUFFICIENT"
    },
    "savingAmounts": {
      "safe": 250000,
      "recommended": 350000,
      "challenge": 450000
    },
    "recommendation": {
      "type": "BALANCED_SAVING",
      "parkingAccountAmount": 100000,
      "installmentSavingsAmount": 150000,
      "isaAmount": 100000,
      "investmentAmount": 0
    },
    "reasons": [
      "잉여자금이 안정적으로 확보되어 있습니다.",
      "비상금이 아직 목표 수준에 도달하지 않았습니다.",
      "균형형 성향을 반영해 안정 저축과 적립식 운용을 함께 제안합니다."
    ],
    "cautions": [
      "비상금이 부족해 유동성 확보를 병행하는 것이 좋습니다."
    ],
    "actions": [
      {
        "type": "SAVE_PLAN",
        "label": "추천 계획 저장"
      },
      {
        "type": "RETRY_DIAGNOSIS",
        "label": "다시 진단하기"
      }
    ]
  },
  "message": null
}
```

#### Header

- `Authorization: Bearer {accessToken}`

### 5.7 추천 결과 조회

#### GET `/recommendations/{inputId}`

특정 월별 입력에 대한 추천 결과를 조회한다.

#### Path Parameter

- `inputId`: 월별 입력 ID

#### Response

```json
{
  "success": true,
  "data": {
    "inputId": 1,
    "recommendationId": 10,
    "targetMonth": "2026-04",
    "summary": {
      "monthlyIncome": 2500000,
      "fixedExpense": 900000,
      "variableExpense": 1100000,
      "surplusAmount": 500000,
      "emergencyFundStatus": "INSUFFICIENT"
    },
    "savingAmounts": {
      "safe": 250000,
      "recommended": 350000,
      "challenge": 450000
    },
    "recommendation": {
      "type": "BALANCED_SAVING",
      "parkingAccountAmount": 100000,
      "installmentSavingsAmount": 150000,
      "isaAmount": 100000,
      "investmentAmount": 0
    },
    "reasons": [
      "잉여자금이 안정적으로 확보되어 있습니다.",
      "비상금이 아직 목표 수준에 도달하지 않았습니다.",
      "균형형 성향을 반영해 안정 저축과 적립식 운용을 함께 제안합니다."
    ],
    "cautions": [
      "비상금이 부족해 유동성 확보를 병행하는 것이 좋습니다."
    ],
    "actions": [
      {
        "type": "SAVE_PLAN",
        "label": "추천 계획 저장"
      },
      {
        "type": "RETRY_DIAGNOSIS",
        "label": "다시 진단하기"
      }
    ]
  },
  "message": null
}
```

#### Header

- `Authorization: Bearer {accessToken}`

### 5.8 월별 입력값 조회

#### GET `/financial-inputs/{inputId}`

입력 수정 화면 또는 결과 재확인을 위해 기존 입력값을 조회한다.

#### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "targetMonth": "2026-04",
    "monthlyIncome": 2500000,
    "paydayDay": 25,
    "fixedExpense": 900000,
    "variableExpense": 1100000,
    "emergencyFundAmount": 300000,
    "savingGoal": "EMERGENCY_FUND",
    "savingPreference": "BALANCED"
  },
  "message": null
}
```

#### Header

- `Authorization: Bearer {accessToken}`

### 5.9 월별 입력값 수정 및 추천 결과 재생성

#### PUT `/financial-inputs/{inputId}`

기존 입력값을 수정하고 추천 결과를 다시 생성한다.

#### Path Parameter

- `inputId`: 월별 입력 ID

#### Request Body

POST `/financial-inputs`와 동일

#### Response

```json
{
  "success": true,
  "data": {
    "inputId": 1,
    "recommendationId": 10,
    "targetMonth": "2026-04"
  },
  "message": "입력값이 수정되고 추천 결과가 갱신되었습니다."
}
```

#### Header

- `Authorization: Bearer {accessToken}`

## 6. 토큰 정책

- `accessToken`은 짧은 만료 시간 기준으로 운영한다. MVP 권장안은 1시간 이내이다.
- `refreshToken`은 더 긴 만료 시간 기준으로 운영한다. MVP 권장안은 14일이다.
- 서버는 `refreshToken` 원문을 저장하지 않고 해시값만 `users.refresh_token_hash`에 저장한다.
- 로그인 또는 재발급 시 새 `refreshToken`으로 교체한다.
- 로그아웃 시 `refresh_token_hash`를 `null`로 갱신한다.

## 7. 응답 필드 정의

### 7.1 summary

- `monthlyIncome`
- `fixedExpense`
- `variableExpense`
- `surplusAmount`
- `emergencyFundStatus`

### 7.2 savingAmounts

- `safe`
- `recommended`
- `challenge`

### 7.3 recommendation

- `type`
- `parkingAccountAmount`
- `installmentSavingsAmount`
- `isaAmount`
- `investmentAmount`

### 7.4 actions

`actions`는 DB 저장값이 아니라 서버 응답 조합값이다.

예시 규칙:

- `EXPENSE_CONTROL` -> `EDIT_INPUT`, `RETRY_DIAGNOSIS`
- 일반 추천 결과 -> `SAVE_PLAN`, `RETRY_DIAGNOSIS`

## 8. 에러 케이스

| 상황 | 상태 코드 | 메시지 예시 |
|---|---|---|
| 이미 존재하는 이메일로 회원가입 | 409 | 이미 가입된 이메일입니다. |
| 로그인 정보 불일치 | 401 | 이메일 또는 비밀번호가 올바르지 않습니다. |
| 리프레시 토큰 불일치 또는 만료 | 401 | 다시 로그인해 주세요. |
| 인증 헤더 누락 | 401 | 인증이 필요합니다. |
| 필수 입력값 누락 | 400 | 필수 입력값이 누락되었습니다. |
| 입력값 형식 오류 | 400 | 유효하지 않은 입력값입니다. |
| 존재하지 않는 inputId | 404 | 입력 정보를 찾을 수 없습니다. |
| 추천 결과 생성 실패 | 500 | 추천 결과 생성 중 오류가 발생했습니다. |

## 9. 프론트 구현 메모

- 로그인 성공 시 `accessToken`, `refreshToken`을 함께 저장해야 한다.
- 보호 API 호출 시 `Authorization` 헤더에 `Bearer accessToken`을 포함해야 한다.
- 액세스 토큰 만료 시 `POST /auth/refresh`로 재발급 후 재시도한다.
- `POST /financial-inputs` 응답만으로 결과 화면을 바로 렌더링할 수 있어야 한다.
- 결과 조회 API는 재방문 또는 새로고침 대응용으로 사용한다.
- 액션 버튼은 응답의 `actions`를 그대로 사용하면 된다.
- MVP 1차에서는 입력 수정 기능 없이도 전체 흐름 구현이 가능하다.

## 10. 향후 확장 항목

- 월별 추천 이력 리스트 조회 API
- 추천 계획 저장 API 분리
- 홈 대시보드 조회 API
- 지출 카테고리 상세 입력 API
- AI 코칭 결과 생성 API

## 11. 결론

MVP API는 입력 저장, 추천 생성, 결과 조회를 중심으로 최소한의 흐름만 다룬다.  
초기 단계에서는 화면 구현 속도와 로직 검증이 중요하므로, 프론트가 바로 사용할 수 있는 응답 구조와 단순한 엔드포인트 구성을 우선한다.
