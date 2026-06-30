"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  LedgerSummary,
  RecommendationResponse,
  defaultFinanceForm,
  formatPercent,
  formatWon,
  requestApiWithAuth,
  translateGoal,
  translatePreference,
} from "@/lib/money-coach";

type FinanceForm = typeof defaultFinanceForm;
type FinanceField = keyof FinanceForm;
type FinanceErrors = Partial<Record<FinanceField, string>>;

const FIELD_META: Array<{
  key: Extract<
    FinanceField,
    | "targetMonth"
    | "monthlyIncome"
    | "paydayDay"
    | "fixedExpense"
    | "variableExpense"
    | "emergencyFundAmount"
  >;
  label: string;
  description: string;
  type: string;
}> = [
  {
    key: "targetMonth",
    label: "진단 대상 월",
    description: "예: 2026-06",
    type: "month",
  },
  {
    key: "monthlyIncome",
    label: "월 실수령 수입",
    description: "세후 기준의 실제 월 수입을 입력합니다.",
    type: "number",
  },
  {
    key: "paydayDay",
    label: "월급일",
    description: "매달 급여가 들어오는 날짜입니다.",
    type: "number",
  },
  {
    key: "fixedExpense",
    label: "고정 지출",
    description: "월세, 통신비, 보험료처럼 반복되는 지출입니다.",
    type: "number",
  },
  {
    key: "variableExpense",
    label: "변동 지출",
    description: "식비, 쇼핑, 교통비처럼 달라지는 지출입니다.",
    type: "number",
  },
  {
    key: "emergencyFundAmount",
    label: "현재 비상금",
    description: "급하게 바로 꺼내 쓸 수 있는 현금성 자산입니다.",
    type: "number",
  },
];

function parseAmount(value: string) {
  if (value.trim() === "") {
    return null;
  }

  return Number(value);
}

function validateFinanceForm(form: FinanceForm): FinanceErrors {
  const errors: FinanceErrors = {};
  const monthlyIncome = parseAmount(form.monthlyIncome);
  const paydayDay = parseAmount(form.paydayDay);
  const fixedExpense = parseAmount(form.fixedExpense);
  const variableExpense = parseAmount(form.variableExpense);
  const emergencyFundAmount = parseAmount(form.emergencyFundAmount);

  if (!/^\d{4}-\d{2}$/.test(form.targetMonth)) {
    errors.targetMonth = "대상 월은 YYYY-MM 형식으로 입력해 주세요.";
  }

  if (
    monthlyIncome === null ||
    !Number.isInteger(monthlyIncome) ||
    monthlyIncome < 1
  ) {
    errors.monthlyIncome = "월 수입은 1원 이상 정수로 입력해 주세요.";
  }

  if (
    paydayDay === null ||
    !Number.isInteger(paydayDay) ||
    paydayDay < 1 ||
    paydayDay > 31
  ) {
    errors.paydayDay = "월급일은 1일부터 31일 사이 정수여야 합니다.";
  }

  if (
    fixedExpense === null ||
    !Number.isInteger(fixedExpense) ||
    fixedExpense < 0
  ) {
    errors.fixedExpense = "고정 지출은 0원 이상 정수로 입력해 주세요.";
  }

  if (
    variableExpense === null ||
    !Number.isInteger(variableExpense) ||
    variableExpense < 0
  ) {
    errors.variableExpense = "변동 지출은 0원 이상 정수로 입력해 주세요.";
  }

  if (
    emergencyFundAmount === null ||
    !Number.isInteger(emergencyFundAmount) ||
    emergencyFundAmount < 0
  ) {
    errors.emergencyFundAmount = "비상금은 0원 이상 정수로 입력해 주세요.";
  }

  return errors;
}

export default function DiagnosisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isHydrated,
    userName,
    savedInputId,
    logout,
    setLatestInputId,
  } = useAuth();
  const [financeForm, setFinanceForm] = useState(defaultFinanceForm);
  const [errors, setErrors] = useState<FinanceErrors>({});
  const [statusMessage, setStatusMessage] = useState(
    "이번 달 수입과 지출 정보를 입력하면 추천 결과 페이지로 이동합니다.",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isImportingLedger, setIsImportingLedger] = useState(false);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  useEffect(() => {
    const targetMonth = searchParams.get("targetMonth");

    if (!targetMonth || !/^\d{4}-\d{2}$/.test(targetMonth)) {
      return;
    }

    setFinanceForm((current) =>
      current.targetMonth === targetMonth
        ? current
        : {
            ...current,
            targetMonth,
          },
    );
  }, [searchParams]);

  const monthlyIncome = Number(financeForm.monthlyIncome || 0);
  const fixedExpense = Number(financeForm.fixedExpense || 0);
  const variableExpense = Number(financeForm.variableExpense || 0);
  const emergencyFundAmount = Number(financeForm.emergencyFundAmount || 0);
  const surplusAmount = monthlyIncome - fixedExpense - variableExpense;
  const expenseRatioBase = fixedExpense + variableExpense;

  const summaryCards = useMemo(
    () => [
      {
        label: "예상 잔여 자금",
        value: formatWon(surplusAmount),
        description:
          surplusAmount >= 0
            ? "이번 달에 저축이나 추가 배분에 사용할 수 있는 남는 돈입니다."
            : "현재 입력 기준으로는 지출이 수입을 넘고 있습니다.",
      },
      {
        label: "지출 비중",
        value: formatPercent(expenseRatioBase, monthlyIncome),
        description: "월 수입 대비 고정 지출과 변동 지출의 합계 비중입니다.",
      },
      {
        label: "비상금 상태",
        value:
          emergencyFundAmount <= 0
            ? "미보유"
            : emergencyFundAmount < monthlyIncome
              ? "부족"
              : "보유 중",
        description: "한 달 생활비 수준과 비교한 간단한 상태입니다.",
      },
    ],
    [emergencyFundAmount, expenseRatioBase, monthlyIncome, surplusAmount],
  );

  function updateField(key: FinanceField, value: string) {
    setFinanceForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleImportLedgerSummary() {
    if (!isAuthenticated) {
      setStatusMessage("먼저 로그인해 주세요.");
      return;
    }

    setIsImportingLedger(true);
    setStatusMessage("가계부 요약을 불러와 진단 입력값에 반영하는 중입니다.");

    try {
      const payload = await requestApiWithAuth<LedgerSummary>(
        `/ledger-entries/summary?targetMonth=${financeForm.targetMonth}`,
        {
          method: "GET",
        },
      );

      setFinanceForm((current) => ({
        ...current,
        monthlyIncome: String(payload.data.totals.income),
        fixedExpense: String(payload.data.totals.fixedExpense),
        variableExpense: String(payload.data.totals.variableExpense),
      }));

      setStatusMessage(
        payload.data.entryCount > 0
          ? `${financeForm.targetMonth} 가계부 요약을 반영했습니다. 수입과 지출 입력값을 확인해 주세요.`
          : `${financeForm.targetMonth}에는 가계부 항목이 없어 반영할 값이 없습니다.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "가계부 요약 불러오기에 실패했습니다.",
      );
    } finally {
      setIsImportingLedger(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      setStatusMessage("먼저 로그인해 주세요.");
      return;
    }

    const nextErrors = validateFinanceForm(financeForm);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatusMessage("입력값을 다시 확인해 주세요.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("추천 결과를 계산하는 중입니다.");

    try {
      const payload = await requestApiWithAuth<RecommendationResponse>(
        "/financial-inputs",
        {
          method: "POST",
          body: JSON.stringify({
            targetMonth: financeForm.targetMonth,
            monthlyIncome: Number(financeForm.monthlyIncome),
            paydayDay: Number(financeForm.paydayDay),
            fixedExpense: Number(financeForm.fixedExpense),
            variableExpense: Number(financeForm.variableExpense),
            emergencyFundAmount: Number(financeForm.emergencyFundAmount),
            savingGoal: financeForm.savingGoal,
            savingPreference: financeForm.savingPreference,
          }),
        },
      );

      setLatestInputId(payload.data.inputId);
      setStatusMessage("진단이 완료되어 결과 페이지로 이동합니다.");
      router.push(`/result/${payload.data.inputId}`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "추천 생성에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,233,194,0.9),_rgba(245,244,239,1)_45%,_rgba(227,232,224,1)_100%)] px-5 py-8 text-stone-900 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Diagnosis
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
                월간 재무 진단 입력
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-stone-600">
                수입, 지출, 비상금, 저축 목표를 입력하면 이번 달에 맞는 저축
                방식과 권장 금액을 계산합니다.
              </p>
            </div>

            <button
              className="rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              type="button"
            >
              로그아웃
            </button>
          </div>

          <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5">
            <p className="text-sm font-semibold text-stone-700">
              입력 전에 확인하면 좋은 기준
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-600">
              <li>- 월 수입은 세후 기준의 실제 통장 수령액으로 맞추는 것이 좋습니다.</li>
              <li>- 반복되는 카드값이나 자동이체는 고정 지출에 넣는 편이 안정적입니다.</li>
              <li>- 비상금은 투자금이 아니라 바로 꺼내 쓸 수 있는 현금성 자산 기준입니다.</li>
            </ul>
          </div>

          <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            {FIELD_META.map(({ key, label, description, type }) => (
              <label className="block" key={key}>
                <span className="mb-2 block text-sm font-medium text-stone-600">
                  {label}
                </span>
                <input
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:bg-white ${
                    errors[key]
                      ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                      : "border-stone-200 bg-stone-50 focus:border-amber-500"
                  }`}
                  type={type}
                  value={financeForm[key]}
                  onChange={(event) => updateField(key, event.target.value)}
                />
                <span className="mt-2 block text-xs text-stone-500">
                  {description}
                </span>
                {errors[key] ? (
                  <span className="mt-2 block text-sm font-medium text-rose-600">
                    {errors[key]}
                  </span>
                ) : null}
              </label>
            ))}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-600">
                저축 목표
              </span>
              <select
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                value={financeForm.savingGoal}
                onChange={(event) => updateField("savingGoal", event.target.value)}
              >
                <option value="EMERGENCY_FUND">비상금 확보</option>
                <option value="LIFE_STABILITY">생활 안정</option>
                <option value="TRAVEL">여행</option>
                <option value="HOUSING_MARRIAGE">주거 / 결혼</option>
                <option value="INVESTMENT_PREP">투자 준비</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-600">
                저축 성향
              </span>
              <select
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                value={financeForm.savingPreference}
                onChange={(event) =>
                  updateField("savingPreference", event.target.value)
                }
              >
                <option value="STABLE">안정형</option>
                <option value="BALANCED">균형형</option>
                <option value="AGGRESSIVE">공격형</option>
              </select>
            </label>

            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 md:col-span-2">
              <p className="text-sm font-semibold text-stone-700">현재 선택값 요약</p>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                목표: {translateGoal(financeForm.savingGoal)} / 성향:{" "}
                {translatePreference(financeForm.savingPreference)}
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                입력 기준 예상 잔여 자금: {formatWon(surplusAmount)}
              </p>
              {surplusAmount < 0 ? (
                <p className="mt-2 text-sm font-medium text-amber-700">
                  현재 입력값 기준으로는 적자 상태입니다. 그래도 진단을 진행하면
                  결과 화면에서 지출 조정 우선 안내가 나올 수 있습니다.
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <button
                className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-4 font-semibold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
                type="submit"
              >
                추천 결과 생성하기
              </button>
            </div>
          </form>
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-[32px] border border-stone-300/60 bg-stone-950 p-8 text-stone-50 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
            <p className="text-sm font-medium text-stone-300">세션 정보</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  현재 사용자
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {userName || "확인 중"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  최근 결과 ID
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {savedInputId ?? "없음"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
            <p className="text-sm font-medium text-stone-500">입력 미리보기</p>
            <div className="mt-4 grid gap-3">
              {summaryCards.map((card) => (
                <article
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  key={card.label}
                >
                  <p className="text-sm text-stone-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
            <p className="text-sm font-medium text-stone-500">진행 상태</p>
            <p className="mt-3 text-lg font-semibold">{statusMessage}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isImportingLedger}
                onClick={handleImportLedgerSummary}
                type="button"
              >
                가계부 요약 불러오기
              </button>
              {savedInputId ? (
                <Link
                  href={`/result/${savedInputId}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  최근 결과 다시 보기
                </Link>
              ) : null}
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                저장 플랜 보기
              </Link>
              <Link
                href="/ledger"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                월별 가계부 보기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
