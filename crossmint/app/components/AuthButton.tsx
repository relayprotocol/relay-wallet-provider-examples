"use client";

import { useAuth } from "@crossmint/client-sdk-react-ui";

export function AuthButton() {
  const { status, login, logout } = useAuth();

  if (status === "logged-in") {
    return (
      <button
        onClick={logout}
        className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-600"
      >
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={login}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
    >
      Sign In
    </button>
  );
}
