import { useEffect, useState } from "react";

/**
 * Recomputes the remaining time from the given ISO endTime on every tick.
 * Re-syncs automatically whenever endTime changes (e.g. anti-sniper extension
 * pushes it forward) since it's a hook dependency, not cached local state.
 */
export function useCountdown(endTime) {
  const [remainingMs, setRemainingMs] = useState(() => toRemaining(endTime));

  useEffect(() => {
    setRemainingMs(toRemaining(endTime));
    const id = setInterval(() => setRemainingMs(toRemaining(endTime)), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return formatRemaining(remainingMs);
}

function toRemaining(endTime) {
  if (!endTime) return 0;
  return Math.max(0, new Date(endTime).getTime() - Date.now());
}

function formatRemaining(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalMs: ms, days, hours, minutes, seconds, expired: ms <= 0 };
}
