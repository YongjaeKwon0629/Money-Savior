export type AuthMode = "signup" | "login";

export type RecommendationType =
  | "EXPENSE_CONTROL"
  | "LIQUIDITY_FIRST"
  | "STABLE_SAVING"
  | "BALANCED_SAVING"
  | "DIVERSIFIED_ALLOCATION";

export type RecommendationResponse = {
  inputId: number;
  recommendationId: number;
  targetMonth: string;
  summary: {
    monthlyIncome: number;
    fixedExpense: number;
    variableExpense: number;
    surplusAmount: number;
    emergencyFundStatus: "NONE" | "INSUFFICIENT" | "SUFFICIENT";
  };
  savingAmounts: {
    safe: number;
    recommended: number;
    challenge: number;
  };
  recommendation: {
    type: RecommendationType;
    parkingAccountAmount: number;
    installmentSavingsAmount: number;
    isaAmount: number;
    investmentAmount: number;
  };
  reasons: string[];
  cautions: string[];
  actions: Array<{
    type: "SAVE_PLAN" | "RETRY_DIAGNOSIS" | "EDIT_INPUT";
    label: string;
  }>;
};

export type MonthlyDiagnosisLookup = {
  inputId: number;
  targetMonth: string;
  recommendationId: number | null;
  hasRecommendation: boolean;
  summary: {
    monthlyIncome: number;
    fixedExpense: number;
    variableExpense: number;
    surplusAmount: number;
  } | null;
  recommendation: {
    recommendedType: RecommendationType;
    recommendedSavingAmount: number;
  } | null;
} | null;

export type SavedPlan = {
  planId: number;
  inputId: number;
  recommendationId: number;
  targetMonth: string;
  recommendedType: RecommendationType;
  recommendedSavingAmount: number;
  surplusAmount: number;
  savedAt: string;
};

export type LedgerEntryType = "INCOME" | "EXPENSE";

export type LedgerEntry = {
  entryId: number;
  targetMonth: string;
  entryDate: string;
  type: LedgerEntryType;
  category: string;
  amount: number;
  memo: string | null;
  isFixed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LedgerSummary = {
  targetMonth: string;
  totals: {
    income: number;
    expense: number;
    fixedExpense: number;
    variableExpense: number;
    balance: number;
  };
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  entryCount: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: {
    id: number;
    email: string;
    name: string;
  };
  tokens: AuthTokens;
};

type RefreshResponse = {
  tokens: AuthTokens;
};

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  userName: string;
  savedInputId: number | null;
};

class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export const defaultFinanceForm = {
  targetMonth: "2026-06",
  monthlyIncome: "2500000",
  paydayDay: "25",
  fixedExpense: "900000",
  variableExpense: "1100000",
  emergencyFundAmount: "300000",
  savingGoal: "EMERGENCY_FUND",
  savingPreference: "BALANCED",
};

export function formatWon(value: number) {
  return `${value.toLocaleString()}원`;
}

export function formatPercent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateOnly(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function translateRecommendationType(type: RecommendationType) {
  switch (type) {
    case "EXPENSE_CONTROL":
      return "지출 조정 우선형";
    case "LIQUIDITY_FIRST":
      return "유동성 우선형";
    case "STABLE_SAVING":
      return "안정 저축형";
    case "BALANCED_SAVING":
      return "균형 저축형";
    case "DIVERSIFIED_ALLOCATION":
      return "분산 운용형";
  }
}

export function describeRecommendationType(type: RecommendationType) {
  switch (type) {
    case "EXPENSE_CONTROL":
      return "이번 달은 저축 확대보다 지출 구조를 먼저 정리하는 편이 더 적절합니다.";
    case "LIQUIDITY_FIRST":
      return "당장 꺼내 쓸 수 있는 현금성 자산을 먼저 쌓는 흐름이 더 잘 맞습니다.";
    case "STABLE_SAVING":
      return "무리하지 않는 범위에서 적금 중심으로 차근차근 모으는 방식입니다.";
    case "BALANCED_SAVING":
      return "유동성과 저축 효율을 함께 챙기는 균형 잡힌 배분 방식입니다.";
    case "DIVERSIFIED_ALLOCATION":
      return "저축과 투자 준비를 함께 가져가며 확장성을 보는 배분 방식입니다.";
  }
}

export function translateEmergencyStatus(
  status: RecommendationResponse["summary"]["emergencyFundStatus"],
) {
  switch (status) {
    case "NONE":
      return "없음";
    case "INSUFFICIENT":
      return "부족";
    case "SUFFICIENT":
      return "충분";
  }
}

export function describeEmergencyStatus(
  status: RecommendationResponse["summary"]["emergencyFundStatus"],
) {
  switch (status) {
    case "NONE":
      return "비상금이 아직 없어 갑작스러운 상황에 대응할 여력이 부족한 상태입니다.";
    case "INSUFFICIENT":
      return "비상금은 있지만 아직 목표 수준까지는 조금 더 쌓아야 하는 상태입니다.";
    case "SUFFICIENT":
      return "기본 비상금이 어느 정도 확보되어 다음 단계의 저축이나 운용으로 이어가기 좋습니다.";
  }
}

export function translateGoal(goal: string) {
  switch (goal) {
    case "EMERGENCY_FUND":
      return "비상금 확보";
    case "LIFE_STABILITY":
      return "생활 안정";
    case "TRAVEL":
      return "여행";
    case "HOUSING_MARRIAGE":
      return "주거 / 결혼";
    case "INVESTMENT_PREP":
      return "투자 준비";
    default:
      return goal;
  }
}

export function translatePreference(preference: string) {
  switch (preference) {
    case "STABLE":
      return "안정형";
    case "BALANCED":
      return "균형형";
    case "AGGRESSIVE":
      return "공격형";
    default:
      return preference;
  }
}

export function translateLedgerEntryType(type: LedgerEntryType) {
  switch (type) {
    case "INCOME":
      return "수입";
    case "EXPENSE":
      return "지출";
  }
}

export function getStoredSession(): StoredSession {
  if (typeof window === "undefined") {
    return {
      accessToken: "",
      refreshToken: "",
      userName: "",
      savedInputId: null,
    };
  }

  const accessToken =
    window.localStorage.getItem("money-coach-access-token") ?? "";
  const refreshToken =
    window.localStorage.getItem("money-coach-refresh-token") ?? "";
  const userName = window.localStorage.getItem("money-coach-user-name") ?? "";
  const rawInputId = window.localStorage.getItem("money-coach-input-id");

  return {
    accessToken,
    refreshToken,
    userName,
    savedInputId: rawInputId ? Number(rawInputId) : null,
  };
}

export function saveSession(payload: AuthResponse) {
  if (typeof window === "undefined") {
    return;
  }

  saveTokens(payload.tokens);
  window.localStorage.setItem("money-coach-user-name", payload.user.name);
}

export function saveTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("money-coach-access-token", tokens.accessToken);
  window.localStorage.setItem("money-coach-refresh-token", tokens.refreshToken);
}

export function saveInputId(inputId: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("money-coach-input-id", String(inputId));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("money-coach-access-token");
  window.localStorage.removeItem("money-coach-refresh-token");
  window.localStorage.removeItem("money-coach-user-name");
  window.localStorage.removeItem("money-coach-input-id");
}

function createJsonHeaders(headers?: HeadersInit) {
  const normalizedHeaders = new Headers(headers);

  if (!normalizedHeaders.has("Content-Type")) {
    normalizedHeaders.set("Content-Type", "application/json");
  }

  return normalizedHeaders;
}

function withAuthorization(init: RequestInit | undefined, accessToken: string) {
  const headers = createJsonHeaders(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return {
    ...init,
    headers,
  };
}

export async function requestApi<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: createJsonHeaders(init?.headers),
  });

  const payload = (await response.json()) as
    | ApiEnvelope<T>
    | { message?: string; error?: string };

  if (!response.ok) {
    throw new ApiRequestError(
      "message" in payload && payload.message
        ? payload.message
        : "요청 처리 중 오류가 발생했습니다.",
      response.status,
    );
  }

  return payload as ApiEnvelope<T>;
}

async function refreshAccessToken() {
  const session = getStoredSession();

  if (!session.refreshToken) {
    clearSession();
    throw new Error("다시 로그인해 주세요.");
  }

  try {
    const payload = await requestApi<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refreshToken: session.refreshToken,
      }),
    });

    saveTokens(payload.data.tokens);
    return payload.data.tokens.accessToken;
  } catch {
    clearSession();
    throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
  }
}

export async function requestApiWithAuth<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const session = getStoredSession();

  if (!session.accessToken) {
    throw new Error("로그인이 필요합니다.");
  }

  try {
    return await requestApi<T>(path, withAuthorization(init, session.accessToken));
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401) {
      throw error;
    }

    const refreshedAccessToken = await refreshAccessToken();

    return requestApi<T>(path, withAuthorization(init, refreshedAccessToken));
  }
}
