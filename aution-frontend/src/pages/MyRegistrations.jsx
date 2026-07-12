import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyRegistrations, unregisterFromAuction } from "../api/bidder";
import { formatCurrency, formatDateTime } from "../utils/format";

export default function MyRegistrations() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getMyRegistrations().then(setRegs).finally(() => setLoading(false));
  }
  useEffect(load, []);

  // FIXED: Added error handling and user confirmation alert
  async function handleUnregister(auctionId, itemName) {
    if (!window.confirm(`Are you sure you want to unregister from "${itemName}"?`)) {
      return;
    }

    try {
      await unregisterFromAuction(auctionId);
      alert("Successfully unregistered!");
      load(); // Refresh the list from the server
    } catch (error) {
      console.error("Unregister failed:", error);
      // Alerts the real backend error (e.g. "Cannot unregister from an active auction")
      alert(error.response?.data?.message || "Failed to unregister. The auction may have already started.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10 border-b border-line pb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-bright">Bidder</span>
        <h1 className="font-display text-4xl mt-1 text-paper">My registrations</h1>
      </div>

      {loading && <p className="font-body text-paper-dim">Loading…</p>}
      {!loading && regs.length === 0 && (
        <p className="font-body text-paper-dim">
          You haven't registered for any lots yet. <Link to="/" className="text-brass-bright hover:underline">Browse the catalog</Link>.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {regs.map((r) => {
          // DYNAMIC CHECK: Hide button if the current system time is past the start time
          const now = Date.now();
          const startTimeMs = r.auctionStartTime ? new Date(r.auctionStartTime).getTime() : 0;
          const hasStarted = now >= startTimeMs;

          return (
            <li key={r.registrationId} className="border border-line rounded-lg p-4 flex items-center justify-between bg-ink-soft">
              <div>
                <Link to={`/auctions/${r.auctionId}`} className="font-display text-lg text-paper hover:text-brass-bright transition-colors">
                  {r.itemName}
                </Link>
                <div className="font-mono text-xs text-paper-dim mt-1">
                  {r.auctioneerCompany} · Starts {formatDateTime(r.auctionStartTime)}
                </div>
                <div className={`font-mono text-[10px] uppercase mt-1 ${r.approved ? "text-ledger-bright" : "text-brass-bright"}`}>
                  {r.approved ? "Approved" : "Pending approval"}
                </div>
              </div>

              {/* DYNAMIC HIDING: Only show the button if the auction HAS NOT started yet */}
              {!hasStarted && (
                <button 
                  onClick={() => handleUnregister(r.auctionId, r.itemName)} 
                  className="btn-secondary text-xs"
                >
                  Unregister
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}