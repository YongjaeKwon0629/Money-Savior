"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  SavedPlan,
  formatDateTime,
  formatWon,
  requestApiWithAuth,
  translateRecommendationType,
} from "@/lib/money-coach";

export default function PlansPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, userName, logout } = useAuth();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    "저장한 추천 계획을 불러오는 중입니다.",
  );

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isHydrated || !isAuthenticated) {
      return;
    }

    async function loadPlans() {
      try {
        const payload = await requestApiWithAuth<SavedPlan[]>("/saved-plans", {
          method: "GET",
        });

        setPlans(payload.data);
        setStatusMessage(
          payload.data.length > 0
            ? `저장한 추천 계획 ${payload.data.length}건을 불러왔습니다.`
            : "아직 저장한 추천 계획이 없습니다.",
        );
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "추천 계획 조회에 실패했습니다.",
        );
      }
    }

    void loadPlans();
  }, [isAuthenticated, isHydrated, router]);

  async function handleDelete(planId: number) {
    try {
      await requestApiWithAuth<null>(`/saved-plans/${planId}`, {
        method: "DELETE",
      });

      const nextPlans = plans.filter((plan) => plan.planId !== planId);
      setPlans(nextPlans);
      setStatusMessage(
        nextPlans.length > 0
          ? "선택한 추천 계획을 삭제했습니다."
          : "모든 저장 계획이 비워졌습니다.",
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "저장 계획 삭제에 실패했습니다.",
      );
    }
  }

  async function handleClear() {
    try {
      await requestApiWithAuth<null>("/saved-plans", {
        method: "DELETE",
      });

      setPlans([]);
      setStatusMessage("저장한 추천 계획을 모두 삭제했습니다.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "저장 계획 전체 삭제에 실패했습니다.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,233,194,0.9),_rgba(245,244,239,1)_45%,_rgba(227,232,224,1)_100%)] px-5 py-8 text-stone-900 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Plans
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
                저장한 추천 계획
              </h1>
              <p className="mt-3 text-base leading-7 text-stone-600">
                이전에 저장한 추천 결과를 다시 보고, 필요하면 결과 화면으로 바로
                이동할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/ledger"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                가계부 보러 가기
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

            {plans.length > 0 ? (
              plans.map((plan) => (
                <article
                  key={plan.planId}
                  className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-stone-500">
                        {plan.targetMonth} 추천
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold">
                        {translateRecommendationType(plan.recommendedType)}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-stone-600">
                        권장 저축액 {formatWon(plan.recommendedSavingAmount)} /
                        잔여 자금 {formatWon(plan.surplusAmount)}
                      </p>
                      <p className="mt-2 text-xs font-medium text-stone-500">
                        저장 시각 {formatDateTime(plan.savedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/result/${plan.inputId}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 font-semibold text-white transition hover:bg-stone-800"
                      >
                        결과 다시 보기
                      </Link>
                      <button
                        className="rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                        onClick={() => handleDelete(plan.planId)}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[32px] border border-dashed border-stone-300 bg-white/85 p-12 text-center shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
                <p className="text-lg font-semibold text-stone-700">
                  아직 저장한 추천 계획이 없습니다.
                </p>
                <p className="mt-3 text-sm leading-7 text-stone-500">
                  결과 화면에서 추천 계획 저장하기를 누르면 이 목록에 쌓입니다.
                </p>
                <div className="mt-6">
                  <Link
                    href="/diagnosis"
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-stone-950 transition hover:bg-amber-400"
                  >
                    진단 시작하기
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-stone-300/60 bg-stone-950 p-8 text-stone-50 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <p className="text-sm font-medium text-stone-300">세션 정보</p>
              <p className="mt-3 text-lg font-semibold">{userName || "확인 중"}</p>
              <p className="mt-2 text-sm text-stone-400">
                현재 저장한 계획 수 {plans.length}
              </p>
            </div>

            <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <p className="text-sm font-semibold text-stone-500">빠른 이동</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  홈으로 가기
                </Link>
                <Link
                  href="/diagnosis"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  재무 진단 입력하기
                </Link>
                <Link
                  href="/ledger"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  월별 가계부 보기
                </Link>
                {plans.length > 0 ? (
                  <button
                    className="rounded-2xl border border-rose-300 px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-50"
                    onClick={handleClear}
                    type="button"
                  >
                    저장 계획 전체 삭제
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
