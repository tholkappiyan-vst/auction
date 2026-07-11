import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuction } from "../api/auctions";
import { getCurrentBidState, placeBid } from "../api/bids";
import { registerForAuction, unregisterFromAuction, getMyRegistrations } from "../api/bidder";
import { useAuctionSocket } from "../hooks/useAuctionSocket";
import { useCountdown } from "../hooks/useCountdown";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency, formatLotNumber, formatDateTime } from "../utils/format";

export default function AuctionDetail() {
  const { id } = useParams();
  const auctionId = Number(id);
  const { user, isAuthenticated } = useAuth();

  const [auction, setAuction] = useState(null);
  const [bidState, setBidState] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'error'|'success', text }
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  const { connected, lastUpdate } = useAuctionSocket(auctionId);

  // Initial load: auction details + current bid snapshot (+ registration status for bidders)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getAuction(auctionId),
      isAuthenticated ? getCurrentBidState(auctionId).catch(() => null) : Promise.resolve(null),
      user?.role === "BIDDER" ? getMyRegistrations().catch(() => []) : Promise.resolve([]),
    ]).then(([auctionRes, bidRes, registrations]) => {
      if (cancelled) return;
      setAuction(auctionRes);
      if (bidRes) setBidState(bidRes);
      const mine = registrations.find((r) => r.auctionId === auctionId);
      setRegistration(mine || null);
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [auctionId, isAuthenticated, user?.role]);

  // Live pushes from STOMP replace the snapshot and build a running ledger.
  useEffect(() => {
    if (!lastUpdate) return;
    setBidState(lastUpdate);
    setBidHistory((h) => [lastUpdate, ...h].slice(0, 20));
  }, [lastUpdate]);

  const endTime = useMemo(() => {
    // Auto-extension may push endTime forward server-side; auction refetch
    // isn't wired per-tick, so we trust the last known value from either
    // source, preferring the freshest.
    return auction?.endTime;
  }, [auction]);

  const countdown = useCountdown(endTime);
  const currentBid = bidState?.currentHighestBid ?? auction?.currentHighestBid ?? auction?.startingPrice;
  const minNext = currentBid != null && auction ? Number(currentBid) + Number(auction.minimumIncrement) : null;

  async function handleBid(e) {
    e.preventDefault();
    setFeedback(null);
    const value = Number(amount);
    if (!value || (minNext != null && value < minNext)) {
      setFeedback({ type: "error", text: `Bid must be at least ${formatCurrency(minNext)}.` });
      return;
    }
    setBusy(true);
    try {
      const res = await placeBid(auctionId, value);
      if (res.status && res.status !== "ACCEPTED" && res.status !== "SUCCESS") {
        setFeedback({ type: "error", text: res.reason || "Bid was not accepted." });
      } else {
        setFeedback({ type: "success", text: "Bid placed." });
        setAmount("");
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Couldn't place that bid." });
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await registerForAuction(auctionId);
      setRegistration(res);
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Registration failed." });
    } finally {
      setBusy(false);
    }
  }

  async function handleUnregister() {
    setBusy(true);
    try {
      await unregisterFromAuction(auctionId);
      setRegistration(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-6 py-16 font-body text-paper-dim">Loading lot…</div>;
  }
  if (!auction) {
    return <div className="max-w-5xl mx-auto px-6 py-16 font-body text-auction-red">Lot not found.</div>;
  }

  const isBidder = user?.role === "ROLE_BIDDER";
  const canBid = isBidder && auction.status === "ACTIVE" && (!requiresRegistration(auction) || registration?.approved);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-5 gap-10">
      {/* Image + item details */}
      <div className="md:col-span-3 flex flex-col gap-6">
        <div className="aspect-[4/3] bg-line rounded-lg overflow-hidden border border-line">
          {auction.itemImageUrl ? (
            <img src={auction.itemImageUrl} alt={auction.itemName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-6xl text-paper-dim/40">
              {formatLotNumber(auction.auctionId)}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[11px] text-paper-dim tracking-widest">LOT {formatLotNumber(auction.auctionId)}</span>
            <StatusBadge status={auction.status} />
          </div>
          <h1 className="font-display text-3xl text-paper">{auction.itemName}</h1>
          <p className="font-body text-sm text-paper-dim mt-3 leading-relaxed">{auction.itemDescription}</p>

          <dl className="grid grid-cols-2 gap-y-2 mt-6 font-body text-sm">
            <DetailRow label="Category" value={auction.itemCategory} />
            <DetailRow label="Condition" value={auction.itemCondition} />
            <DetailRow label="Estimated value" value={formatCurrency(auction.estimatedValue)} />
            <DetailRow label="Auctioneer" value={auction.companyName || auction.auctioneerUsername} />
            {auction.certifiedAuthentic && <DetailRow label="Provenance" value="Certified authentic" />}
          </dl>
        </div>
      </div>

      {/* Live bid panel */}
      <div className="md:col-span-2">
        <div className="sticky top-24 border border-line rounded-lg bg-ink-soft p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              {auction.status === "ACTIVE" ? "Live now" : "Closes"}
            </span>
            <ConnectionDot connected={connected} />
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase text-paper-dim tracking-wide">
              {bidState?.currentHighestBid ? "Current bid" : "Opening price"}
            </div>
            <div className="font-mono text-4xl text-brass-bright leading-tight">{formatCurrency(currentBid)}</div>
            {bidState?.currentLeader && (
              <div className="font-body text-xs text-paper-dim mt-1">Leading: {bidState.currentLeader}</div>
            )}
          </div>

          <Countdown countdown={countdown} />

          {auction.status === "ACTIVE" && isAuthenticated && isBidder && (
            <form onSubmit={handleBid} className="flex flex-col gap-2 pt-4 border-t border-line">
              <label className="font-mono text-[11px] uppercase tracking-wide text-paper-dim">
                Your bid {minNext != null && <span className="text-paper-dim/70">(min {formatCurrency(minNext)})</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min={minNext || 0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input flex-1"
                  disabled={!canBid || busy}
                  placeholder={minNext ? String(minNext) : ""}
                />
                <button type="submit" disabled={!canBid || busy} className="btn-primary whitespace-nowrap">
                  {busy ? "Placing…" : "Place bid"}
                </button>
              </div>
              {!canBid && requiresRegistration(auction) && (
                <p className="font-body text-xs text-paper-dim">Register below before bidding on this lot.</p>
              )}
            </form>
          )}

          {feedback && (
            <p className={`font-body text-sm ${feedback.type === "error" ? "text-auction-red" : "text-ledger-bright"}`}>
              {feedback.text}
            </p>
          )}

          {isBidder && auction.status === "SCHEDULED" && (
            <div className="pt-4 border-t border-line">
              {registration ? (
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-ledger-bright">
                    {registration.approved ? "Registered" : "Registration pending approval"}
                  </span>
                  <button onClick={handleUnregister} disabled={busy} className="btn-secondary text-xs">
                    Unregister
                  </button>
                </div>
              ) : (
                <button onClick={handleRegister} disabled={busy} className="btn-primary w-full">
                  Register to bid
                </button>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <p className="font-body text-sm text-paper-dim pt-4 border-t border-line">
              Sign in as a bidder to register and bid on this lot.
            </p>
          )}

          {bidHistory.length > 0 && (
            <div className="pt-4 border-t border-line">
              <div className="font-mono text-[10px] uppercase tracking-widest text-paper-dim mb-2">Ledger</div>
              <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {bidHistory.map((b, i) => (
                  <li key={i} className="flex justify-between font-mono text-xs text-paper-dim">
                    <span>{b.currentLeader || "—"}</span>
                    <span className="text-brass-bright">{formatCurrency(b.currentHighestBid)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function requiresRegistration(auction) {
  return auction.status === "SCHEDULED" || auction.status === "ACTIVE";
}

function DetailRow({ label, value }) {
  return (
    <>
      <dt className="text-paper-dim">{label}</dt>
      <dd className="text-paper text-right">{value ?? "—"}</dd>
    </>
  );
}

function ConnectionDot({ connected }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] text-paper-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-ledger-bright animate-pulse" : "bg-line"}`} />
      {connected ? "live feed" : "connecting…"}
    </span>
  );
}

function Countdown({ countdown }) {
  if (countdown.expired) {
    return <div className="font-mono text-sm text-auction-red">Lot closed</div>;
  }
  const parts = [
    countdown.days > 0 && `${countdown.days}d`,
    `${String(countdown.hours).padStart(2, "0")}h`,
    `${String(countdown.minutes).padStart(2, "0")}m`,
    `${String(countdown.seconds).padStart(2, "0")}s`,
  ].filter(Boolean);
  return (
    <div>
      <div className="font-mono text-[11px] uppercase text-paper-dim tracking-wide">Time remaining</div>
      <div className="font-mono text-2xl text-paper">{parts.join(" ")}</div>
    </div>
  );
}
