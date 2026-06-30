"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  RecommendationResponse,
  SavedPlan,
  describeEmergencyStatus,
  describeRecommendationType,
  formatPercent,
  formatWon,
  requestApiWithAuth,
  translateEmergencyStatus,
  translateRecommendationType,
} from "@/lib/money-coach";

function buildTopSummary(result: RecommendationResponse) {
  const { surplusAmount, monthlyIncome } = result.summary;
  const recommended = result.savingAmounts.recommended;
  const type = result.recommendation.type;

  if (type === "EXPENSE_CONTROL") {
    return "이번 달은 저축 규모를 키우기보다 지출 구조를 먼저 정리하는 쪽이 더 중요합니다.";
  }

  if (type === "LIQUIDITY_FIRST") {
    return "급하게 쓸 수 있는 현금성 자산을 먼저 확보하는 흐름이 지금 상황에 더 잘 맞습니다.";
  }

  if (surplusAmount <= 0) {
    return "현재는 남는 돈이 거의 없거나 부족한 상태라서, 저축보다 지출 조정이 우선입니다.";
  }

  return `예상 잔여 자금 ${formatWon(surplusAmount)} 중 약 ${formatPercent(
    recommended,
    monthlyIncome,
  )} 수준을 저축 루틴으로 가져가는 구성이 적절합니다.`;
}

function getActionLabel(actionType: string) {
  switch (actionType) {
    case "SAVE_PLAN":
      return "이 추천 저장하기";
    case "RETRY_DIAGNOSIS":
      return "다시 진단하기";
    case "EDIT_INPUT":
      return "입력값 수정하기";
    default:
      return actionType;
  }
}

function getActionDescription(actionType: string) {
  switch (actionType) {
    case "SAVE_PLAN":
      return "지금 추천 결과를 플랜 목록에 저장해두고 나중에 다시 볼 수 있습니다.";
    case "RETRY_DIAGNOSIS":
      return "입력 월을 유지한 채 다시 계산해 현재 상황을 한 번 더 확인합니다.";
    case "EDIT_INPUT":
      return "월급, 지출, 비상금 같은 입력값을 바꿔 다른 결과를 비교합니다.";
    default:
      return "다음 단계로 이어지는 액션입니다.";
  }
}

export default function ResultPage() {
  const params = useParams<{ inputId: string }>();
  const router = useRouter();
  const { isAuthenticated, isHydrated, userName, logout } = useAuth();
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "추천 결과를 불러오는 중입니다.",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [savedPlanCount, setSavedPlanCount] = useState(0);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    async function loadSavedPlanCount() {
      try {
        const payload = await requestApiWithAuth<SavedPlan[]>("/saved-plans", {
          method: "GET",
        });
        setSavedPlanCount(payload.data.length);
      } catch {
        setSavedPlanCount(0);
      }
    }

    void loadSavedPlanCount();
  }, [isAuthenticated, isHydrated]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isHydrated || !isAuthenticated) {
      return;
    }

    async function loadResult() {
      try {
        const payload = await requestApiWithAuth<RecommendationResponse>(
          `/recommendations/${params.inputId}`,
          {
            method: "GET",
          },
        );

        setResult(payload.data);
        setStatusMessage("추천 결과를 불러왔습니다.");
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "결과 조회에 실패했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadResult();
  }, [isAuthenticated, isHydrated, params.inputId, router]);

  function handleAction(actionType: string) {
    if (!result) {
      return;
    }

    if (actionType === "SAVE_PLAN") {
      void (async () => {
        try {
          await requestApiWithAuth<SavedPlan>("/saved-plans", {
            method: "POST",
            body: JSON.stringify({
              inputId: result.inputId,
            }),
          });

          const plansPayload = await requestApiWithAuth<SavedPlan[]>(
            "/saved-plans",
            {
              method: "GET",
            },
          );

          setSavedPlanCount(plansPayload.data.length);
          setStatusMessage("추천 계획을 저장했습니다.");
        } catch (error) {
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "추천 계획 저장에 실패했습니다.",
          );
        }
      })();
      return;
    }

    if (actionType === "RETRY_DIAGNOSIS" || actionType === "EDIT_INPUT") {
      router.push(`/diagnosis?targetMonth=${result.targetMonth}`);
    }
  }

  const allocationCards = useMemo(
    () =>
      result
        ? [
            {
              label: "파킹통장",
              value: result.recommendation.parkingAccountAmount,
              description: "단기 유동성과 비상금 성격을 함께 챙기는 구간입니다.",
            },
            {
              label: "적금",
              value: result.recommendation.installmentSavingsAmount,
              description: "매달 자동으로 쌓이는 고정 저축 구간입니다.",
            },
            {
              label: "ISA",
              value: result.recommendation.isaAmount,
              description: "중장기 목적 자금을 모으는 축으로 보는 금액입니다.",
            },
            {
              label: "투자 준비",
              value: result.recommendation.investmentAmount,
              description: "공격 성향일 때만 일부가 배정되는 확장 구간입니다.",
            },
          ]
        : [],
    [result],
  );

  const headlineCards = useMemo(
    () =>
      result
        ? [
            {
              label: "예상 잔여 자금",
              value: result.summary.surplusAmount,
              tone: "text-stone-900",
            },
            {
              label: "권장 저축액",
              value: result.savingAmounts.recommended,
              tone: "text-emerald-700",
            },
            {
              label: "소득 대비 저축 비중",
              value: formatPercent(
                result.savingAmounts.recommended,
                result.summary.monthlyIncome,
              ),
              tone: "text-amber-700",
            },
          ]
        : [],
    [result],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,233,194,0.9),_rgba(245,244,239,1)_45%,_rgba(227,232,224,1)_100%)] px-5 py-8 text-stone-900 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Result
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
                추천 결과 요약
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                입력한 현금 흐름을 바탕으로 이번 달 저축 가능 금액과 배분 방식을
                정리한 결과입니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/diagnosis${result ? `?targetMonth=${result.targetMonth}` : ""}`}
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                진단 입력으로 돌아가기
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                저장 플랜 보기
              </Link>
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
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <p className="text-sm font-medium text-stone-500">진행 상태</p>
              <p className="mt-3 text-lg font-semibold">{statusMessage}</p>
            </div>

            {result ? (
              <>
                <div className="rounded-[32px] border border-emerald-300/60 bg-emerald-50/80 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.08)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-emerald-700">
                        {result.targetMonth} 진단 결론
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold text-emerald-950">
                        {translateRecommendationType(result.recommendation.type)}
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-900">
                        {buildTopSummary(result)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm font-semibold text-emerald-900">
                      inputId {result.inputId}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {headlineCards.map((card) => (
                      <article
                        key={card.label}
                        className="rounded-2xl border border-emerald-200 bg-white/70 p-4"
                      >
                        <p className="text-sm text-emerald-700">{card.label}</p>
                        <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>
                          {typeof card.value === "number"
                            ? formatWon(card.value)
                            : card.value}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] bg-stone-950 p-8 text-white shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
                  <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
                    추천 해석
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {translateRecommendationType(result.recommendation.type)}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-stone-300">
                    {describeRecommendationType(result.recommendation.type)}
                  </p>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-stone-400">비상금 상태</p>
                    <p className="mt-2 text-xl font-semibold">
                      {translateEmergencyStatus(result.summary.emergencyFundStatus)}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-stone-300">
                      {describeEmergencyStatus(result.summary.emergencyFundStatus)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-stone-500">
                        저축 가이드
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold">
                        추천 금액 구간
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    {[
                      ["예상 잔여 자금", result.summary.surplusAmount],
                      ["안전 저축액", result.savingAmounts.safe],
                      ["권장 저축액", result.savingAmounts.recommended],
                      ["도전 저축액", result.savingAmounts.challenge],
                    ].map(([label, value]) => (
                      <article
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                        key={label}
                      >
                        <p className="text-sm text-stone-500">{label}</p>
                        <p className="mt-3 text-2xl font-semibold">
                          {formatWon(Number(value))}
                        </p>
                        <p className="mt-2 text-xs font-medium text-stone-500">
                          소득 대비 {formatPercent(Number(value), result.summary.monthlyIncome)}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
                  <p className="text-sm font-medium text-stone-500">배분 방식</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    권장 저축액을 이렇게 나눕니다
                  </h2>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {allocationCards.map(({ label, value, description }) => (
                      <article
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                        key={label}
                      >
                        <p className="text-sm text-stone-500">{label}</p>
                        <p className="mt-2 text-2xl font-semibold">
                          {formatWon(value)}
                        </p>
                        <p className="mt-2 text-xs font-medium text-stone-500">
                          권장 저축액 대비 {formatPercent(value, result.savingAmounts.recommended)}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-stone-600">
                          {description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <p className="text-sm font-medium text-stone-500">세션 정보</p>
              <p className="mt-3 text-lg font-semibold">{userName || "확인 중"}</p>
              <p className="mt-2 text-sm text-stone-500">
                저장한 추천 플랜 수 {savedPlanCount}
              </p>
            </div>

            {result ? (
              <>
                <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
                  <p className="text-sm font-semibold text-stone-500">왜 이런 추천이 나왔나</p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-700">
                    {result.reasons.map((reason) => (
                      <li key={reason} className="rounded-2xl bg-stone-50 px-4 py-3">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
                  <p className="text-sm font-semibold text-stone-500">이번 달 주의 포인트</p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-700">
                    {result.cautions.map((caution) => (
                      <li key={caution} className="rounded-2xl bg-amber-50 px-4 py-3">
                        {caution}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[32px] border border-dashed border-stone-300 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
                  <p className="text-sm font-semibold text-stone-500">지금 바로 할 일</p>
                  <div className="mt-4 space-y-3">
                    {result.actions.map((action) => (
                      <article
                        key={`${action.type}-${action.label}`}
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                      >
                        <p className="text-base font-semibold text-stone-900">
                          {getActionLabel(action.type)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          {getActionDescription(action.type)}
                        </p>
                        <button
                          className="mt-4 rounded-2xl border border-amber-400/40 bg-white px-4 py-3 text-sm font-semibold text-amber-800 transition hover:border-amber-500 hover:bg-amber-100"
                          onClick={() => handleAction(action.type)}
                          type="button"
                        >
                          실행하기
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            ) : isLoading ? null : (
              <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
                <p className="text-sm leading-7 text-stone-600">
                  결과를 불러오지 못했습니다. 입력 화면으로 돌아가 다시 진단해 주세요.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
