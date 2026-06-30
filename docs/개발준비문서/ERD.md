# 가계부 기반 저축 운영 추천 서비스 MVP ERD

## 1. 문서 개요

본 문서는 가계부 기반 저축 운영 추천 서비스 MVP에 필요한 데이터 구조를 정의하기 위한 문서이다.  
MVP 단계에서는 사용자 입력값, 계산 결과, 추천 결과를 저장하고 조회할 수 있는 최소한의 구조를 우선 설계한다.

본 문서의 목적은 다음과 같다.

- MVP 기준 저장 대상 데이터 식별
- 엔티티 간 관계 정의
- DB 테이블 설계의 기준 제공
- API 및 프론트 데이터 구조 정의의 기준 제공

## 2. MVP 데이터 설계 원칙

- MVP에서는 복잡한 자산 포트폴리오 구조보다 입력, 계산, 추천 기록 중심으로 설계한다.
- 월별 추천 결과를 재현할 수 있도록 사용자 입력과 계산 결과를 함께 저장한다.
- 추천 로직 변경에 대비해 추천 결과는 계산 시점 스냅샷으로 저장한다.
- 지출 카테고리 세분화는 제외하고 총액 기반 구조를 우선 적용한다.

## 3. 핵심 엔티티 목록

MVP에서 필요한 핵심 엔티티는 다음과 같다.

- `users`
- `monthly_finance_inputs`
- `recommendation_results`

선택적으로 아래 엔티티를 후속 확장용으로 고려할 수 있다.

- `goals`
- `monthly_reports`
- `user_preferences`
- `recommendation_actions`

## 4. 엔티티 관계 요약

- 한 명의 사용자(`users`)는 여러 개의 월별 입력(`monthly_finance_inputs`)을 가질 수 있다.
- 하나의 월별 입력은 하나의 추천 결과(`recommendation_results`)를 가진다.

## 5. 엔티티 상세 정의

### 5.1 users

사용자의 기본 식별 정보와 인증 정보를 저장하는 엔티티이다.

| 필드명 | 타입 | 설명 | 제약 |
|---|---|---|---|
| id | bigint | 사용자 PK | PK, auto increment |
| email | varchar(255) | 로그인 이메일 | unique, not null |
| password_hash | varchar(255) | 비밀번호 해시값 | not null |
| name | varchar(50) | 사용자 이름 | not null |
| refresh_token_hash | varchar(255) | 리프레시 토큰 해시값 | nullable |
| last_login_at | datetime | 마지막 로그인 시각 | nullable |
| created_at | datetime | 생성일시 | not null |
| updated_at | datetime | 수정일시 | not null |

#### 인덱스 및 제약

- `unique(email)`

MVP에서는 소셜 로그인 없이 이메일/비밀번호 기반 인증을 우선 적용한다.  
리프레시 토큰 원문은 저장하지 않고, 해시값만 저장하는 것을 권장한다.

### 5.2 monthly_finance_inputs

사용자가 월별로 입력한 재무 정보를 저장하는 엔티티이다.

| 필드명 | 타입 | 설명 | 제약 |
|---|---|---|---|
| id | bigint | 월별 입력 PK | PK, auto increment |
| user_id | bigint | 사용자 ID | FK -> users.id |
| target_month | varchar(7) | 입력 대상 월 | YYYY-MM 형식 |
| monthly_income | integer | 월 실수령액 | not null |
| payday_day | tinyint | 월급일 | 1~31 |
| fixed_expense | integer | 월 고정비 총액 | not null |
| variable_expense | integer | 월 변동지출 총액 | not null |
| emergency_fund_amount | integer | 현재 비상금 보유액 | not null |
| saving_goal | varchar(50) | 저축 목표 | not null |
| saving_preference | varchar(20) | 저축 성향 | not null |
| created_at | datetime | 생성일시 | not null |
| updated_at | datetime | 수정일시 | not null |

#### 인덱스 및 제약

- `unique(user_id, target_month)`

#### saving_goal enum 예시

- `EMERGENCY_FUND`
- `LIFE_STABILITY`
- `TRAVEL`
- `HOUSING_MARRIAGE`
- `INVESTMENT_PREP`

#### saving_preference enum 예시

- `STABLE`
- `BALANCED`
- `AGGRESSIVE`

### 5.3 recommendation_results

월별 입력을 바탕으로 계산된 재무 상태와 추천 결과를 저장하는 엔티티이다.

| 필드명 | 타입 | 설명 | 제약 |
|---|---|---|---|
| id | bigint | 추천 결과 PK | PK, auto increment |
| monthly_finance_input_id | bigint | 월별 입력 ID | FK -> monthly_finance_inputs.id |
| surplus_amount | integer | 월 잉여자금 | not null |
| fixed_expense_ratio | decimal(5,2) | 고정비 비중 | not null |
| living_cost_base | integer | 생활비 기준액 | not null |
| emergency_fund_target | integer | 비상금 목표액 | not null |
| emergency_fund_ratio | decimal(7,2) | 비상금 충족률 | not null |
| savings_capacity_level | varchar(20) | 저축 여력 단계 | not null |
| emergency_fund_status | varchar(20) | 비상금 상태 | not null |
| recommended_type | varchar(30) | 추천 방식 유형 | not null |
| safe_saving_amount | integer | 안전 저축액 | not null |
| recommended_saving_amount | integer | 권장 저축액 | not null |
| challenge_saving_amount | integer | 도전 저축액 | not null |
| parking_account_amount | integer | 파킹통장 추천 금액 | not null default 0 |
| installment_savings_amount | integer | 적금 추천 금액 | not null default 0 |
| isa_amount | integer | ISA 적립 추천 금액 | not null default 0 |
| investment_amount | integer | 일반 적립식 운용 추천 금액 | not null default 0 |
| recommendation_reason_1 | varchar(255) | 추천 이유 1 | nullable |
| recommendation_reason_2 | varchar(255) | 추천 이유 2 | nullable |
| recommendation_reason_3 | varchar(255) | 추천 이유 3 | nullable |
| caution_message_1 | varchar(255) | 주의 메시지 1 | nullable |
| caution_message_2 | varchar(255) | 주의 메시지 2 | nullable |
| exception_code | varchar(20) | 예외 코드 | nullable |
| created_at | datetime | 생성일시 | not null |
| updated_at | datetime | 수정일시 | not null |

#### 인덱스 및 제약

- `unique(monthly_finance_input_id)`

#### savings_capacity_level enum 예시

- `DEFICIT`
- `LOW`
- `MID`
- `HIGH`

#### emergency_fund_status enum 예시

- `NONE`
- `INSUFFICIENT`
- `SUFFICIENT`

#### recommended_type enum 예시

- `EXPENSE_CONTROL`
- `LIQUIDITY_FIRST`
- `STABLE_SAVING`
- `BALANCED_SAVING`
- `DIVERSIFIED_ALLOCATION`

### 5.4 recommendation_actions 제외 결정

MVP에서는 실행 액션을 별도 테이블로 저장하지 않는다.

제외 이유는 다음과 같다.

- 결과 화면 액션은 추천 결과 유형과 예외 상태에 따라 서버 또는 프론트에서 조합 가능하다.
- 액션 자체는 사용자 고유 데이터가 아니라 화면 정책에 가깝다.
- MVP 단계에서 액션 저장 테이블은 복잡도만 높이고 실질적 이점을 주지 않는다.

따라서 `recommendation_actions`는 후속 확장 시 필요할 때 추가한다.

## 6. ERD 텍스트 다이어그램

```text
users
 └── monthly_finance_inputs
      └── recommendation_results
```

## 7. 저장 흐름

1. 사용자가 입력 화면에서 월별 재무 정보를 입력한다.
2. 입력값을 `monthly_finance_inputs`에 저장한다.
3. 시스템이 계산 및 추천 로직을 수행한다.
4. 계산 결과와 추천 결과를 `recommendation_results`에 저장한다.
5. 결과 화면에 노출할 CTA는 추천 결과 유형과 예외 상태를 기준으로 서버 또는 프론트에서 조합한다.

## 8. MVP에서 제외하는 데이터 구조

다음 항목은 MVP ERD에서 제외한다.

- 지출 카테고리 상세 테이블
- 금융상품 메타데이터 테이블
- 사용자 자산 포트폴리오 테이블
- 월별 비교 리포트 전용 집계 테이블
- 알림 및 자동이체 연동 테이블
- 추천 결과 액션 저장 테이블

## 9. 구현 메모

- `target_month`를 두어 월별 이력 관리가 가능하도록 한다.
- 추천 결과는 계산 시점 스냅샷으로 저장해, 이후 로직 변경 시 과거 결과가 달라지지 않도록 한다.
- `recommendation_reason`과 `caution_message`는 MVP에서 정규화보다 단순 저장을 우선한다.
- 추천 결과를 재생성할 때는 기존 레코드를 갱신할지, 새 레코드를 만들지 구현 전에 확정이 필요하다.

## 10. 인증 적용 후 MVP 확정안

MVP에서는 아래 3개 테이블을 저장 구조 확정안으로 본다.

- `users`
- `monthly_finance_inputs`
- `recommendation_results`

즉, 현재 단계에서는 인증 가능한 사용자 정보와 입력 데이터, 추천 결과 스냅샷만 저장하면 서비스 핵심 흐름 구현이 가능하다.

## 11. 결론

MVP ERD는 사용자 입력값과 추천 결과를 연결하는 최소 구조를 중심으로 설계한다.  
초기 단계에서는 복잡한 금융 도메인 모델링보다, 추천 결과를 일관되게 저장하고 재조회할 수 있는 구조가 더 중요하다.
