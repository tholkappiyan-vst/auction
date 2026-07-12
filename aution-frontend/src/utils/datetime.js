// The backend stores and returns all times in true UTC, but as a zoneless
// LocalDateTime string (e.g. "2026-07-12T06:30:00" -- no trailing "Z").
// JS's `new Date(str)` treats a date-time string WITHOUT a "Z"/offset as
// LOCAL time, not UTC, so every timestamp coming FROM the backend must be
// explicitly marked as UTC before being displayed/compared, or it'll be off
// by the browser's UTC offset (e.g. +5:30 for IST).
//
// Sending times TO the backend is unaffected by this: `date.toISOString()`
// already produces a real UTC instant with "Z", which the backend correctly
// stores as-is.

export function parseServerDate(value) {
  if (!value) return null;
  const hasZone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}