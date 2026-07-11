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

  async function handleUnregister(auctionId) {
    await unregisterFromAuction(auctionId);
    load();
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
        {regs.map((r) => (
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
            <button onClick={() => handleUnregister(r.auctionId)} className="btn-secondary text-xs">
              Unregister
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
