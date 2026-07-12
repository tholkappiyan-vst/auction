import { useEffect, useState } from "react";
import { parseServerDate } from "../utils/datetime";

/**
 * Tracks both startTime and endTime to dynamically show if an auction
 * is upcoming ("STARTS IN") or live ("TIME REMAINING").
 */
export function useCountdown(startTime, endTime) {
  const [timerState, setTimerState] = useState(() => calculateState(startTime, endTime));

  useEffect(() => {
    // Sync state immediately when variables change
    setTimerState(calculateState(startTime, endTime));
    
    // Set up the 1-second interval loop
    const id = setInterval(() => {
      setTimerState(calculateState(startTime, endTime));
    }, 1000);

    return () => clearInterval(id);
  }, [startTime, endTime]);

  return timerState;
}

function calculateState(startTime, endTime) {
  const now = Date.now();
  const startMs = startTime ? parseServerDate(startTime).getTime() : 0;
  const endMs = endTime ? parseServerDate(endTime).getTime() : 0;

  let targetMs = 0;
  let statusLabel = "LOADING";
  let phase = "UNKNOWN"; // 'UPCOMING', 'LIVE', or 'COMPLETED'

  if (now < startMs) {
    // 1. Auction hasn't started yet
    statusLabel = "STARTS IN";
    phase = "UPCOMING";
    targetMs = Math.max(0, startMs - now);
  } else if (now >= startMs && now < endMs) {
    // 2. Auction is currently active
    statusLabel = "TIME REMAINING"; // Or "CLOSES IN"
    phase = "LIVE";
    targetMs = Math.max(0, endMs - now);
  } else {
    // 3. Auction is finished
    statusLabel = "CLOSED";
    phase = "COMPLETED";
    targetMs = 0;
  }

  const totalSeconds = Math.floor(targetMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    statusLabel,
    phase,
    hours,
    minutes,
    seconds,
    expired: phase === "COMPLETED"
  };
}