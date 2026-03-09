"use client";

import type { QuoteResponse } from "../actions/relay";

interface QuoteDisplayProps {
  quote: QuoteResponse;
}

export function QuoteDisplay({ quote }: QuoteDisplayProps) {
  const { details, fees } = quote;
  const { currencyIn, currencyOut, timeEstimate } = details;

  const formatUsd = (val: string) => `$${parseFloat(val).toFixed(2)}`;
  const timeLabel =
    timeEstimate < 60
      ? `~${timeEstimate}s`
      : `~${Math.ceil(timeEstimate / 60)} min`;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Quote Summary
      </h3>
      <div className="space-y-2 text-sm">
        <Row
          label="You send"
          value={`${currencyIn.amountFormatted} ${currencyIn.currency.symbol}`}
          sub={currencyIn.amountUsd ? formatUsd(currencyIn.amountUsd) : undefined}
        />
        <Row
          label="You receive"
          value={`${currencyOut.amountFormatted} ${currencyOut.currency.symbol}`}
          sub={currencyOut.amountUsd ? formatUsd(currencyOut.amountUsd) : undefined}
          highlight
        />
        <Row label="Est. time" value={timeLabel} />
        {fees?.gas && (
          <Row
            label="Gas fee"
            value={fees.gas.amountFormatted}
            sub={fees.gas.amountUsd ? formatUsd(fees.gas.amountUsd) : undefined}
          />
        )}
        {fees?.relayer && (
          <Row
            label="Relayer fee"
            value={fees.relayer.amountFormatted}
            sub={fees.relayer.amountUsd ? formatUsd(fees.relayer.amountUsd) : undefined}
          />
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? "font-semibold text-green-600" : "text-black"}>
        {value}
        {sub && <span className="ml-1.5 text-xs text-gray-400">{sub}</span>}
      </span>
    </div>
  );
}
