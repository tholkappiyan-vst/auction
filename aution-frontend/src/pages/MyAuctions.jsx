import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAuctions, deleteAuction } from "../api/auctions";
import LotCard from "../components/LotCard";

export default function MyAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    getMyAuctions()
      .then(setAuctions)
      .catch(() => setError("Couldn't load your lots."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!confirm("Delete this scheduled lot? This can't be undone.")) return;
    try {
      await deleteAuction(id);
      load();
    } catch {
      alert("Only scheduled lots you own can be deleted.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10 border-b border-line pb-6 flex items-end justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-bright">Auctioneer</span>
          <h1 className="font-display text-4xl mt-1 text-paper">My lots</h1>
        </div>
        <Link to="/create-auction" className="btn-primary">List a new lot</Link>
      </div>

      {loading && <p className="font-body text-paper-dim">Loading…</p>}
      {error && <p className="font-body text-auction-red">{error}</p>}
      {!loading && !error && auctions.length === 0 && (
        <p className="font-body text-paper-dim">You haven't listed any lots yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((a) => (
          <div key={a.auctionId} className="relative">
            <LotCard auction={a} />
            {a.status === "SCHEDULED" && (
              <button
                onClick={() => handleDelete(a.auctionId)}
                className="absolute top-3 right-3 font-mono text-[10px] uppercase bg-ink/80 border border-auction-red/60 text-auction-red rounded px-2 py-1 hover:bg-auction-red hover:text-ink transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
