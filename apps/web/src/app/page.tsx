"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  LedgerSummary,
  MonthlyDiagnosisLookup,
  SavedPlan,
  formatWon,
  requestApiWithAuth,
  translateRecommendationType,
} from "@/lib/money-coach";

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, userName, savedInputId, logout } = useAuth();
  const [currentMonth] = useState(currentMonthValue);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [monthlyDiagnosis, setMonthlyDiagnosis] =
    useState<MonthlyDiagnosisLookup>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    "대시보드 정보를 불러오는 중입니다.",
  );

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    async function loadDashboard() {
      try {
        const [summaryPayload, diagnosisPayload, plansPayload] = await Promise.all([
          requestApiWithAuth<LedgerSummary>(
            `/ledger-entries/summary?targetMonth=${currentMonth}`,
            { method: "GET" },
          ),
          requestApiWithAuth<MonthlyDiagnosisLookup>(
            `/financial-inputs/month/${currentMonth}`,
            { method: "GET" },
          ),
          requestApiWithAuth<SavedPlan[]>("/saved-plans", {
            method: "GET",
          }),
        ]);

        setSummary(summaryPayload.data);
        setMonthlyDiagnosis(diagnosisPayload.data);
        setSavedPlans(plansPayload.data);
        setStatusMessage("이번 달 기준 대시보드를 불러왔습니다.");
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "대시보드 정보를 불러오지 못했습니다.",
        );
      }
    }

    void loadDashboard();
  }, [currentMonth, isAuthenticated, isHydrated]);

  const dashboardCards = useMemo(() => {
    if (!summary) {
      return [
        {
          label: "이번 달 수입",
          value: formatWon(0),
          description: "가계부를 입력하면 월 요약이 여기에 표시됩니다.",
        },
        {
          label: "이번 달 지출",
          value: formatWon(0),
          description: "고정비와 변동비가 자동으로 합산됩니다.",
        },
        {
          label: "현재 잔액",
          value: formatWon(0),
          description: "수입에서 지출을 뺀 단순 잔액입니다.",
        },
      ];
    }

    return [
      {
        label: "이번 달 수입",
        value: formatWon(summary.totals.income),
        description: `${currentMonth}에 기록된 전체 수입입니다.`,
      },
      {
        label: "이번 달 지출",
        value: formatWon(summary.totals.expense),
        description: `고정 ${formatWon(summary.totals.fixedExpense)} / 변동 ${formatWon(summary.totals.variableExpense)}`,
      },
      {
        label: "현재 잔액",
        value: formatWon(summary.totals.balance),
        description: "가계부 기준 월 잔여 자금입니다.",
      },
    ];
  }, [currentMonth, summary]);

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,233,194,0.9),_rgba(245,244,239,1)_45%,_rgba(227,232,224,1)_100%)] px-5 py-8 text-stone-900 md:px-8">
        <div className="mx-auto max-w-6xl rounded-[36px] border border-stone-300/60 bg-white/80 p-10 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
          <p className="text-lg font-semibold">세션 정보를 확인하는 중입니다.</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,233,194,0.9),_rgba(245,244,239,1)_45%,_rgba(227,232,224,1)_100%)] px-5 py-8 text-stone-900 md:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
          <section className="w-full overflow-hidden rounded-[36px] border border-stone-300/60 bg-white/80 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)] backdrop-blur md:p-12">
            <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
              <div className="space-y-6">
                <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Money Coach MVP
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">
                    가계부 입력을 기반으로 저축 방향까지 연결해 주는 개인 재무 코치
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-stone-600 md:text-lg">
                    월급과 지출을 입력하면 이번 달에 얼마를 저축하면 좋은지,
                    어떤 방식으로 나누는 게 맞는지 한 번에 확인할 수 있습니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white transition hover:bg-stone-800"
                  >
                    로그인하러 가기
                  </Link>
                  <Link
                    href="/diagnosis"
                    className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-5 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                  >
                    진단 화면 보기
                  </Link>
                  <Link
                    href="/ledger"
                    className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-5 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                  >
                    가계부 화면 보기
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-stone-200 bg-stone-950 p-6 text-stone-50">
                <p className="text-sm font-medium text-stone-300">서비스 흐름</p>
                <div className="mt-5 space-y-4">
                  {[
                    [
                      "1",
                      "로그인과 기본 정보 입력",
                      "회원가입 후 월 수입, 고정지출, 변동지출, 비상금 규모를 입력합니다.",
                    ],
                    [
                      "2",
                      "월별 진단 생성",
                      "입력한 현금 흐름을 기준으로 남는 돈과 저축 가능 금액을 계산합니다.",
                    ],
                    [
                      "3",
                      "추천 방식 확인",
                      "적금, 파킹통장, ISA 같은 방식으로 어떻게 나눌지 가이드를 제공합니다.",
                    ],
                  ].map(([step, title, description]) => (
                    <article
                      key={step}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        Step {step}
                      </p>
                      <p className="mt-2 text-lg font-semibold">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-300">
                        {description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,233,194,0.9),_rgba(245,244,239,1)_45%,_rgba(227,232,224,1)_100%)] px-5 py-8 text-stone-900 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Dashboard
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
                {userName || "사용자"}님의 머니 코치 홈
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                이번 달 현금 흐름, 최근 진단, 저장한 플랜을 한 화면에서 보고
                다음 행동으로 바로 이어갈 수 있게 정리했습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white transition hover:bg-stone-800"
              >
                새 진단 시작
              </Link>
              <button
                className="rounded-2xl border border-stone-300 px-5 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
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

        <section className="grid gap-4 md:grid-cols-3">
          {dashboardCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[28px] border border-stone-300/60 bg-white/85 p-6 shadow-[0_30px_80px_rgba(60,42,18,0.12)]"
            >
              <p className="text-sm font-medium text-stone-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-emerald-300/60 bg-emerald-50/80 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.08)]">
              <p className="text-sm font-medium text-emerald-700">이번 달 진단 상태</p>
              {monthlyDiagnosis?.hasRecommendation ? (
                <>
                  <h2 className="mt-2 text-3xl font-semibold text-emerald-950">
                    {translateRecommendationType(
                      monthlyDiagnosis.recommendation!.recommendedType,
                    )}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-emerald-900">
                    {currentMonth} 기준 진단이 이미 있습니다. 권장 저축액은{" "}
                    {formatWon(
                      monthlyDiagnosis.recommendation!.recommendedSavingAmount,
                    )}
                    이고, 예상 잔여 자금은{" "}
                    {formatWon(monthlyDiagnosis.summary!.surplusAmount)}입니다.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/result/${monthlyDiagnosis.inputId}`}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-900 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
                    >
                      이번 달 결과 보기
                    </Link>
                    <Link
                      href={`/diagnosis?targetMonth=${currentMonth}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-emerald-400 px-5 py-3 font-semibold text-emerald-900 transition hover:bg-emerald-100"
                    >
                      다시 진단하기
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-3xl font-semibold text-emerald-950">
                    아직 이번 달 진단이 없습니다
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-emerald-900">
                    가계부를 먼저 입력했든, 수입과 지출만 바로 넣든 상관없습니다.
                    이번 달 기준 진단을 한 번 돌려두면 결과와 추천 저축 방식이
                    이어서 저장됩니다.
                  </p>
                  <div className="mt-5">
                    <Link
                      href={`/diagnosis?targetMonth=${currentMonth}`}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-900 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
                    >
                      이번 달 진단 시작
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-500">저장한 플랜</p>
                  <h2 className="mt-1 text-2xl font-semibold">최근 보관한 추천</h2>
                </div>
                <Link
                  href="/plans"
                  className="text-sm font-semibold text-stone-600 transition hover:text-stone-900"
                >
                  전체 보기
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {savedPlans.slice(0, 3).length > 0 ? (
                  savedPlans.slice(0, 3).map((plan) => (
                    <article
                      key={plan.planId}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-stone-500">{plan.targetMonth}</p>
                          <p className="mt-1 text-lg font-semibold">
                            {translateRecommendationType(plan.recommendedType)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-stone-600">
                            권장 저축액 {formatWon(plan.recommendedSavingAmount)} / 잔여 자금{" "}
                            {formatWon(plan.surplusAmount)}
                          </p>
                        </div>
                        <Link
                          href={`/result/${plan.inputId}`}
                          className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                        >
                          결과 보기
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6">
                    <p className="text-sm leading-7 text-stone-600">
                      아직 저장한 추천 플랜이 없습니다. 진단 결과 화면에서 플랜을
                      저장하면 이곳에 최근 내역이 보입니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-stone-300/60 bg-stone-950 p-8 text-stone-50 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <p className="text-sm font-medium text-stone-300">빠른 실행</p>
              <div className="mt-5 grid gap-3">
                <Link
                  href="/ledger"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold transition hover:bg-white/10"
                >
                  가계부 입력하러 가기
                </Link>
                <Link
                  href={`/diagnosis?targetMonth=${currentMonth}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold transition hover:bg-white/10"
                >
                  이번 달 진단 시작
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold transition hover:bg-white/10"
                >
                  저장 플랜 보러 가기
                </Link>
                {savedInputId ? (
                  <Link
                    href={`/result/${savedInputId}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-amber-400 px-4 py-3 font-semibold text-stone-950 transition hover:bg-amber-300"
                  >
                    최근 결과 다시 보기
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <p className="text-sm font-medium text-stone-500">지금 상태</p>
              <div className="mt-4 space-y-3">
                <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">조회 기준 월</p>
                  <p className="mt-2 text-xl font-semibold">{currentMonth}</p>
                </article>
                <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">최근 결과 ID</p>
                  <p className="mt-2 text-xl font-semibold">
                    {savedInputId ?? "없음"}
                  </p>
                </article>
                <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">상태 메시지</p>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    {statusMessage}
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
