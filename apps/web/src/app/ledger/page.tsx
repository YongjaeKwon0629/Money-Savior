"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  LedgerEntry,
  LedgerEntryType,
  LedgerSummary,
  MonthlyDiagnosisLookup,
  formatDateOnly,
  formatPercent,
  formatWon,
  requestApiWithAuth,
  translateLedgerEntryType,
  translateRecommendationType,
} from "@/lib/money-coach";

const INCOME_CATEGORY_PRESETS = [
  "월급",
  "보너스",
  "부수입",
  "용돈",
  "환급",
  "이자",
];

const EXPENSE_CATEGORY_PRESETS = [
  "식비",
  "카페",
  "교통",
  "쇼핑",
  "주거",
  "통신",
  "보험",
  "구독",
  "의료",
  "여가",
];

const defaultLedgerForm = {
  targetMonth: "2026-06",
  entryDate: "2026-06-26",
  type: "EXPENSE" as LedgerEntryType,
  category: "식비",
  amount: "15000",
  memo: "점심",
  isFixed: false,
};

type LedgerForm = typeof defaultLedgerForm;
type LedgerFormErrors = Partial<Record<keyof LedgerForm, string>>;

function validateLedgerForm(form: LedgerForm): LedgerFormErrors {
  const errors: LedgerFormErrors = {};
  const amount = Number(form.amount);

  if (!/^\d{4}-\d{2}$/.test(form.targetMonth)) {
    errors.targetMonth = "대상 월은 YYYY-MM 형식으로 입력해 주세요.";
  }

  if (!form.entryDate) {
    errors.entryDate = "날짜를 입력해 주세요.";
  }

  if (!form.category.trim()) {
    errors.category = "카테고리를 입력해 주세요.";
  }

  if (!Number.isInteger(amount) || amount < 1) {
    errors.amount = "금액은 1원 이상 정수로 입력해 주세요.";
  }

  if (form.memo.length > 255) {
    errors.memo = "메모는 255자 이하여야 합니다.";
  }

  return errors;
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function shiftMonth(value: string, delta: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function firstDateOfMonth(value: string) {
  return `${value}-01`;
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function LedgerPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, userName, logout } = useAuth();
  const [ledgerForm, setLedgerForm] = useState(defaultLedgerForm);
  const [errors, setErrors] = useState<LedgerFormErrors>({});
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [monthlyDiagnosis, setMonthlyDiagnosis] =
    useState<MonthlyDiagnosisLookup>(null);
  const [statusMessage, setStatusMessage] = useState(
    "이번 달 가계부 내역을 불러오는 중입니다.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    void loadLedgerData(defaultLedgerForm.targetMonth);
  }, [isAuthenticated, isHydrated]);

  const activeCategoryPresets = useMemo(
    () =>
      ledgerForm.type === "INCOME"
        ? INCOME_CATEGORY_PRESETS
        : EXPENSE_CATEGORY_PRESETS,
    [ledgerForm.type],
  );

  const monthlyCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        label: "총 수입",
        value: formatWon(summary.totals.income),
        description: "이번 달에 기록된 전체 수입입니다.",
      },
      {
        label: "총 지출",
        value: formatWon(summary.totals.expense),
        description: "이번 달에 기록된 전체 지출입니다.",
      },
      {
        label: "고정 지출",
        value: formatWon(summary.totals.fixedExpense),
        description: "반복적으로 나가는 정기성 지출입니다.",
      },
      {
        label: "잔액",
        value: formatWon(summary.totals.balance),
        description: "수입에서 지출을 뺀 단순 월간 잔액입니다.",
      },
    ];
  }, [summary]);

  async function loadLedgerData(targetMonth: string) {
    try {
      const [entriesPayload, summaryPayload, diagnosisPayload] = await Promise.all([
        requestApiWithAuth<LedgerEntry[]>(
          `/ledger-entries?targetMonth=${targetMonth}`,
          {
            method: "GET",
          },
        ),
        requestApiWithAuth<LedgerSummary>(
          `/ledger-entries/summary?targetMonth=${targetMonth}`,
          {
            method: "GET",
          },
        ),
        requestApiWithAuth<MonthlyDiagnosisLookup>(
          `/financial-inputs/month/${targetMonth}`,
          {
            method: "GET",
          },
        ),
      ]);

      setEntries(entriesPayload.data);
      setSummary(summaryPayload.data);
      setMonthlyDiagnosis(diagnosisPayload.data);
      setStatusMessage(
        entriesPayload.data.length > 0
          ? `${targetMonth} 가계부 항목 ${entriesPayload.data.length}건을 불러왔습니다.`
          : `${targetMonth}에는 아직 저장된 가계부 항목이 없습니다.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "가계부 데이터를 불러오지 못했습니다.",
      );
    }
  }

  function resetForm() {
    setLedgerForm((current) => ({
      ...defaultLedgerForm,
      targetMonth: current.targetMonth,
      entryDate: current.entryDate,
      type: current.type,
      category:
        current.type === "INCOME"
          ? INCOME_CATEGORY_PRESETS[0]
          : EXPENSE_CATEGORY_PRESETS[0],
    }));
    setErrors({});
    setEditingEntryId(null);
  }

  function updateField<Key extends keyof LedgerForm>(
    key: Key,
    value: LedgerForm[Key],
  ) {
    setLedgerForm((current) => ({
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

  async function moveToMonth(targetMonth: string) {
    setLedgerForm((current) => ({
      ...current,
      targetMonth,
      entryDate: firstDateOfMonth(targetMonth),
    }));

    if (editingEntryId !== null) {
      setEditingEntryId(null);
    }

    await loadLedgerData(targetMonth);
    setStatusMessage(`${targetMonth} 데이터로 이동했습니다.`);
  }

  function handleTypeChange(nextType: LedgerEntryType) {
    setLedgerForm((current) => ({
      ...current,
      type: nextType,
      category:
        nextType === "INCOME"
          ? INCOME_CATEGORY_PRESETS[0]
          : EXPENSE_CATEGORY_PRESETS[0],
      isFixed: nextType === "INCOME" ? false : current.isFixed,
    }));
  }

  function handleCategoryPresetSelect(category: string) {
    updateField("category", category);
  }

  function handleEdit(entry: LedgerEntry) {
    setEditingEntryId(entry.entryId);
    setLedgerForm({
      targetMonth: entry.targetMonth,
      entryDate: toDateInputValue(entry.entryDate),
      type: entry.type,
      category: entry.category,
      amount: String(entry.amount),
      memo: entry.memo ?? "",
      isFixed: entry.isFixed,
    });
    setErrors({});
    setStatusMessage("선택한 가계부 항목을 수정 모드로 불러왔습니다.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLedgerForm(ledgerForm);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatusMessage("입력값을 다시 확인해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(
      editingEntryId === null
        ? "가계부 항목을 저장하는 중입니다."
        : "가계부 항목을 수정하는 중입니다.",
    );

    try {
      const path =
        editingEntryId === null
          ? "/ledger-entries"
          : `/ledger-entries/${editingEntryId}`;

      await requestApiWithAuth<LedgerEntry>(path, {
        method: editingEntryId === null ? "POST" : "PUT",
        body: JSON.stringify({
          targetMonth: ledgerForm.targetMonth,
          entryDate: ledgerForm.entryDate,
          type: ledgerForm.type,
          category: ledgerForm.category,
          amount: Number(ledgerForm.amount),
          memo: ledgerForm.memo.trim() || undefined,
          isFixed: ledgerForm.type === "INCOME" ? false : ledgerForm.isFixed,
        }),
      });

      const targetMonth = ledgerForm.targetMonth;
      const entryDate = ledgerForm.entryDate;
      const type = ledgerForm.type;

      setLedgerForm({
        ...defaultLedgerForm,
        targetMonth,
        entryDate,
        type,
        category:
          type === "INCOME"
            ? INCOME_CATEGORY_PRESETS[0]
            : EXPENSE_CATEGORY_PRESETS[0],
        amount: "",
        memo: "",
        isFixed: false,
      });
      setEditingEntryId(null);
      await loadLedgerData(targetMonth);
      setStatusMessage(
        editingEntryId === null
          ? "가계부 항목이 저장되었습니다."
          : "가계부 항목이 수정되었습니다.",
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : editingEntryId === null
            ? "가계부 항목 저장에 실패했습니다."
            : "가계부 항목 수정에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(entryId: number) {
    try {
      await requestApiWithAuth<null>(`/ledger-entries/${entryId}`, {
        method: "DELETE",
      });

      if (editingEntryId === entryId) {
        resetForm();
      }

      await loadLedgerData(ledgerForm.targetMonth);
      setStatusMessage("가계부 항목을 삭제했습니다.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "가계부 항목 삭제에 실패했습니다.",
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
                Ledger
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
                월별 가계부
              </h1>
              <p className="mt-3 text-base leading-7 text-stone-600">
                수입과 지출 항목을 직접 기록하고, 월별 요약과 카테고리 비중을
                한 화면에서 확인할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                재무 진단 가기
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                저장 계획 보기
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

        <section className="rounded-[32px] border border-stone-300/60 bg-white/85 p-6 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">월 이동</p>
              <h2 className="mt-1 text-2xl font-semibold">{ledgerForm.targetMonth}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={() => void moveToMonth(shiftMonth(ledgerForm.targetMonth, -1))}
                type="button"
              >
                이전 달
              </button>
              <button
                className="rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={() => void moveToMonth(currentMonthValue())}
                type="button"
              >
                이번 달
              </button>
              <button
                className="rounded-2xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={() => void moveToMonth(shiftMonth(ledgerForm.targetMonth, 1))}
                type="button"
              >
                다음 달
              </button>
            </div>
          </div>
        </section>

        {monthlyDiagnosis?.hasRecommendation ? (
          <section className="rounded-[32px] border border-emerald-300/60 bg-emerald-50/80 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.08)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">월간 진단 결과</p>
                <h2 className="mt-2 text-3xl font-semibold text-emerald-950">
                  {translateRecommendationType(
                    monthlyDiagnosis.recommendation!.recommendedType,
                  )}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-900">
                  {ledgerForm.targetMonth} 기준 진단 결과가 이미 저장되어 있습니다.
                  가계부를 보면서 바로 추천 결과까지 이어서 확인할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/result/${monthlyDiagnosis.inputId}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-900 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
                >
                  이 월 결과 보기
                </Link>
                <Link
                  href={`/diagnosis?targetMonth=${ledgerForm.targetMonth}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-400 px-5 py-3 font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  다시 진단하기
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-emerald-200 bg-white/70 p-4">
                <p className="text-sm text-emerald-700">권장 저축액</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-950">
                  {formatWon(monthlyDiagnosis.recommendation!.recommendedSavingAmount)}
                </p>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-white/70 p-4">
                <p className="text-sm text-emerald-700">예상 잔여 자금</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-950">
                  {formatWon(monthlyDiagnosis.summary!.surplusAmount)}
                </p>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-white/70 p-4">
                <p className="text-sm text-emerald-700">입력 기반 지출</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-950">
                  {formatWon(
                    monthlyDiagnosis.summary!.fixedExpense +
                      monthlyDiagnosis.summary!.variableExpense,
                  )}
                </p>
              </article>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <form
              className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]"
              onSubmit={handleSubmit}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-500">
                    {editingEntryId === null ? "새 항목 추가" : "항목 수정 중"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    가계부 입력 폼
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/diagnosis?targetMonth=${ledgerForm.targetMonth}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                  >
                    이 월로 진단하기
                  </Link>
                  <button
                    className="rounded-2xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                    onClick={() => void loadLedgerData(ledgerForm.targetMonth)}
                    type="button"
                  >
                    월 다시 불러오기
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-600">
                    대상 월
                  </span>
                  <input
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                    type="month"
                    value={ledgerForm.targetMonth}
                    onChange={(event) =>
                      updateField("targetMonth", event.target.value)
                    }
                  />
                  {errors.targetMonth ? (
                    <span className="mt-2 block text-sm text-rose-600">
                      {errors.targetMonth}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-600">
                    날짜
                  </span>
                  <input
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                    type="date"
                    value={ledgerForm.entryDate}
                    onChange={(event) =>
                      updateField("entryDate", event.target.value)
                    }
                  />
                  {errors.entryDate ? (
                    <span className="mt-2 block text-sm text-rose-600">
                      {errors.entryDate}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-600">
                    항목 유형
                  </span>
                  <select
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                    value={ledgerForm.type}
                    onChange={(event) =>
                      handleTypeChange(event.target.value as LedgerEntryType)
                    }
                  >
                    <option value="EXPENSE">지출</option>
                    <option value="INCOME">수입</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-600">
                    카테고리
                  </span>
                  <input
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                    type="text"
                    value={ledgerForm.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                  />
                  {errors.category ? (
                    <span className="mt-2 block text-sm text-rose-600">
                      {errors.category}
                    </span>
                  ) : null}
                </label>

                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 md:col-span-2">
                  <p className="text-sm font-medium text-stone-600">
                    빠른 카테고리 선택
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeCategoryPresets.map((category) => (
                      <button
                        key={category}
                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                          ledgerForm.category === category
                            ? "border-amber-500 bg-amber-100 text-amber-900"
                            : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                        }`}
                        onClick={() => handleCategoryPresetSelect(category)}
                        type="button"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-6 text-stone-500">
                    preset을 눌러 빠르게 채우고 필요하면 직접 수정해도 됩니다.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-600">
                    금액
                  </span>
                  <input
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                    type="number"
                    value={ledgerForm.amount}
                    onChange={(event) =>
                      updateField("amount", event.target.value)
                    }
                  />
                  {errors.amount ? (
                    <span className="mt-2 block text-sm text-rose-600">
                      {errors.amount}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-600">
                    메모
                  </span>
                  <input
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                    type="text"
                    value={ledgerForm.memo}
                    onChange={(event) => updateField("memo", event.target.value)}
                  />
                  {errors.memo ? (
                    <span className="mt-2 block text-sm text-rose-600">
                      {errors.memo}
                    </span>
                  ) : null}
                </label>
              </div>

              {ledgerForm.type === "EXPENSE" ? (
                <label className="mt-4 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                  <input
                    checked={ledgerForm.isFixed}
                    onChange={(event) =>
                      updateField("isFixed", event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span className="text-sm text-stone-700">
                    월세, 통신비처럼 반복되는 고정 항목으로 저장
                  </span>
                </label>
              ) : (
                <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                  수입 항목은 고정 지출 구분이 적용되지 않습니다.
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-amber-500 px-4 py-4 font-semibold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {editingEntryId === null
                    ? "가계부 항목 저장하기"
                    : "가계부 항목 수정하기"}
                </button>
                {editingEntryId !== null ? (
                  <button
                    className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-4 py-4 font-semibold text-stone-700 transition hover:bg-stone-100"
                    onClick={resetForm}
                    type="button"
                  >
                    수정 취소
                  </button>
                ) : null}
              </div>
            </form>

            <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <p className="text-sm font-medium text-stone-500">진행 상태</p>
              <p className="mt-3 text-lg font-semibold">{statusMessage}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-stone-300/60 bg-stone-950 p-8 text-stone-50 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <p className="text-sm font-medium text-stone-300">세션 정보</p>
              <p className="mt-3 text-lg font-semibold">{userName || "확인 중"}</p>
              <p className="mt-2 text-sm text-stone-400">
                조회 중인 월 {ledgerForm.targetMonth}
              </p>
              <p className="mt-2 text-sm text-stone-400">
                월별 진단 상태{" "}
                {monthlyDiagnosis?.hasRecommendation ? "결과 있음" : "아직 진단 전"}
              </p>
            </div>

            {summary ? (
              <div className="grid gap-3 md:grid-cols-2">
                {monthlyCards.map((card) => (
                  <article
                    key={card.label}
                    className="rounded-[28px] border border-stone-300/60 bg-white/85 p-6 shadow-[0_30px_80px_rgba(60,42,18,0.12)]"
                  >
                    <p className="text-sm text-stone-500">{card.label}</p>
                    <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {card.description}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}

            <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-500">카테고리 비중</p>
                  <h2 className="mt-1 text-2xl font-semibold">지출 분포</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {summary && summary.categoryBreakdown.length > 0 ? (
                  summary.categoryBreakdown.map((item) => (
                    <article
                      key={item.category}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.category}</p>
                        <p className="text-sm text-stone-500">
                          {formatWon(item.amount)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-stone-500">
                        전체 지출 대비{" "}
                        {formatPercent(item.amount, summary.totals.expense)}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-stone-600">
                    아직 지출 카테고리 데이터가 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-500">월별 내역</p>
                  <h2 className="mt-1 text-2xl font-semibold">기록 목록</h2>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                  {entries.length}건
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <article
                      key={entry.entryId}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-stone-500">
                            {formatDateOnly(entry.entryDate)} /{" "}
                            {translateLedgerEntryType(entry.type)}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold">
                            {entry.category}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-stone-600">
                            {entry.memo || "메모 없음"}
                          </p>
                          <p className="mt-2 text-xs font-medium text-stone-500">
                            {entry.isFixed ? "고정 항목" : "변동 항목"}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <p className="text-xl font-semibold">
                            {entry.type === "EXPENSE" ? "-" : "+"}
                            {formatWon(entry.amount)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              className="rounded-2xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                              onClick={() => handleEdit(entry)}
                              type="button"
                            >
                              수정
                            </button>
                            <button
                              className="rounded-2xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                              onClick={() => void handleDelete(entry.entryId)}
                              type="button"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-stone-600">
                    아직 저장된 가계부 항목이 없습니다. 왼쪽 입력 폼에서 첫 항목을
                    추가해 보세요.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
