const STYLES = {
  SCHEDULED: "text-paper-dim border-line",
  ACTIVE: "text-ledger-bright border-ledger",
  PAUSED: "text-brass-bright border-brass",
  COMPLETED: "text-paper-dim border-line",
  CANCELLED: "text-auction-red border-auction-red/60",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-[0.15em] border rounded-full px-2 py-0.5 ${STYLES[status] || STYLES.SCHEDULED}`}
    >
      {status === "ACTIVE" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-ledger-bright mr-1.5 align-middle animate-pulse" />
      )}
      {status}
    </span>
  );
}
