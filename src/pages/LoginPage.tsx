import { useAuth } from '../contexts/AuthContext'
import seahLogoPng from '../assets/seah-coated-metal-logo.png'

export function LoginPage() {
  const { signInWithGoogle, authConfigured } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#2a2d35] p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-8 py-10 text-center shadow-2xl">
        <div className="mb-5 flex justify-center">
          <img
            src={seahLogoPng}
            alt="SeAH Coated Metal"
            className="h-8 w-auto max-w-[280px] object-contain"
          />
        </div>

        <div className="relative mb-3 mx-auto w-max pt-3.5">
          <p className="absolute inset-x-0 top-0 flex justify-between gap-1 text-[10px] font-semibold uppercase leading-none text-accent">
            <span>Warranty</span>
            <span>Management</span>
            <span>System</span>
          </p>
          <h1 className="whitespace-nowrap text-[1.35rem] font-bold leading-tight text-gray-800">
            보증서 관리 시스템
          </h1>
        </div>

        <p className="mb-7 text-sm leading-relaxed text-gray-500">
          회사 Google 계정(@seah.co.kr)으로 로그인해 주세요.
        </p>

        {!authConfigured ? (
          <p className="text-sm text-red-500" role="alert">
            로그인 설정이 없습니다. Firebase 환경 변수(VITE_FIREBASE_*)를 확인해 주세요.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-100"
          >
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-bold text-[#4285f4]"
              aria-hidden="true"
            >
              G
            </span>
            Google로 로그인
          </button>
        )}
      </div>
    </div>
  )
}
