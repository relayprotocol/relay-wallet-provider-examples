"use client";

interface SessionExpiredBannerProps {
  onLogin: () => void;
}

export function SessionExpiredBanner({ onLogin }: SessionExpiredBannerProps) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 flex items-center justify-between">
      <span className="text-sm text-yellow-700">
        Your session has expired.
      </span>
      <button
        onClick={onLogin}
        className="rounded-md bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-500"
      >
        Sign in again
      </button>
    </div>
  );
}
