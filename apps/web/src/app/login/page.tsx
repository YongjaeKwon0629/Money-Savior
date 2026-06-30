"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AuthMode, AuthResponse, requestApi } from "@/lib/money-coach";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, login } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "테스트 계정으로 로그인하거나 새 계정을 만들어 시작해 주세요.",
  );
  const [authForm, setAuthForm] = useState({
    email: "test@example.com",
    password: "Password123!",
    name: "Tester",
  });

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isHydrated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setStatusMessage(
      authMode === "signup" ? "회원가입을 처리하는 중입니다." : "로그인하는 중입니다.",
    );

    try {
      const path = authMode === "signup" ? "/auth/signup" : "/auth/login";
      const body =
        authMode === "signup"
          ? authForm
          : { email: authForm.email, password: authForm.password };

      const payload = await requestApi<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      login(payload.data);
      setStatusMessage(payload.message ?? "인증이 완료되었습니다.");
      router.push("/");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "인증 처리에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,233,194,0.9),_rgba(245,244,239,1)_45%,_rgba(227,232,224,1)_100%)] px-5 py-8 text-stone-900 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
          <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Auth
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
            로그인 / 회원가입
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-stone-600">
            인증이 끝나면 바로 머니 코치 홈으로 이동해서 진단, 가계부, 저장 플랜을
            이어서 사용할 수 있습니다.
          </p>

          <div className="mt-8 flex rounded-full border border-stone-200 bg-stone-100 p-1 text-sm">
            <button
              className={`rounded-full px-4 py-2 transition ${
                authMode === "login"
                  ? "bg-white font-semibold text-stone-950 shadow-sm"
                  : "text-stone-500"
              }`}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              로그인
            </button>
            <button
              className={`rounded-full px-4 py-2 transition ${
                authMode === "signup"
                  ? "bg-white font-semibold text-stone-950 shadow-sm"
                  : "text-stone-500"
              }`}
              onClick={() => setAuthMode("signup")}
              type="button"
            >
              회원가입
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-600">
                이메일
              </span>
              <input
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-600">
                비밀번호
              </span>
              <input
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </label>

            {authMode === "signup" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-600">
                  이름
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                  type="text"
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center rounded-2xl bg-stone-950 px-4 py-4 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              type="submit"
            >
              {authMode === "signup"
                ? "회원가입하고 시작하기"
                : "로그인하고 시작하기"}
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-[32px] border border-stone-300/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
            <p className="text-sm font-medium text-stone-500">진행 상태</p>
            <p className="mt-3 text-lg font-semibold">{statusMessage}</p>
          </div>

          <div className="rounded-[32px] border border-stone-300/60 bg-stone-950 p-8 text-stone-50 shadow-[0_30px_80px_rgba(60,42,18,0.12)]">
            <p className="text-sm font-medium text-stone-300">시작 안내</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-stone-300">
              <p>기존 계정이 있으면 바로 로그인하면 됩니다.</p>
              <p>
                처음이라면 회원가입 탭에서 이메일, 비밀번호, 이름을 입력하고
                시작하면 됩니다.
              </p>
              <p>
                인증이 끝나면 대시보드로 이동하고, 거기서 진단 시작이나 가계부
                입력으로 이어갈 수 있습니다.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
