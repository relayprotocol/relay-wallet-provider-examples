"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getRelayStatus, type RelayStatusResponse } from "../actions/relay";

interface StatusTrackerProps {
  requestId: string;
}

export function StatusTracker({ requestId }: StatusTrackerProps) {
  const [status, setStatus] = useState<RelayStatusResponse | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await getRelayStatus(requestId);
      setStatus(res);

      // Stop polling on terminal states
      if (res.status === "success" || res.status === "failure") {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch {
      // Silently retry on network errors — the next poll will try again
    }
  }, [requestId]);

  useEffect(() => {
    // Poll immediately, then every 2 seconds
    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  if (!status || status.status === "pending") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-yellow-700/50 bg-yellow-900/20 p-4">
        {/* Simple CSS spinner */}
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        <span className="text-sm text-yellow-300">Transaction pending...</span>
      </div>
    );
  }

  if (status.status === "success") {
    // Link to Relay's transaction explorer using the requestId
    const explorerUrl = `https://relay.link/transaction/${requestId}`;
    return (
      <div className="rounded-xl border border-green-700/50 bg-green-900/20 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg text-green-400">&#10003;</span>
          <span className="text-sm font-semibold text-green-300">
            Transaction complete!
          </span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-blue-400 underline hover:text-blue-300"
        >
          View on Relay &rarr;
        </a>
      </div>
    );
  }

  // Failure
  return (
    <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg text-red-400">&#10007;</span>
        <span className="text-sm font-semibold text-red-300">
          Transaction failed
        </span>
      </div>
    </div>
  );
}
