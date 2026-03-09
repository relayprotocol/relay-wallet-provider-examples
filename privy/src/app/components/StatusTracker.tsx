"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getStatus, type StatusResponse } from "../actions/relay";

interface StatusTrackerProps {
  requestId: string;
}

export function StatusTracker({ requestId }: StatusTrackerProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await getStatus(requestId);
      setStatus(res);

      if (res.status === "success" || res.status === "failure") {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch {
      // Silently retry — next poll will try again
    }
  }, [requestId]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  const explorerUrl = `https://relay.link/transaction/${requestId}`;

  if (!status || status.status === "pending" || status.status === "waiting") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
        <span className="text-sm text-gray-600">Transaction pending...</span>
      </div>
    );
  }

  if (status.status === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg text-green-600">&#10003;</span>
          <span className="text-sm font-semibold text-green-700">
            Transaction complete!
          </span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-gray-600 underline hover:text-black"
        >
          View on Relay &rarr;
        </a>
      </div>
    );
  }

  // Failure / refunded
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg text-red-500">&#10007;</span>
        <span className="text-sm font-semibold text-red-600">
          Transaction failed
        </span>
      </div>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm text-gray-600 underline hover:text-black"
      >
        View on Relay &rarr;
      </a>
    </div>
  );
}
