import { useEffect, useState } from "react";
import { listPublicAuctions } from "../api/auctions";
import LotCard from "../components/LotCard";

export default function AuctionList() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listPublicAuctions()
      .then(setAuctions)
      .catch(() => setError("Couldn't load the catalog. Try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10 border-b border-line pb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-bright">Current catalog</span>
        <h1 className="font-display text-4xl mt-1 text-paper">Lots up for bid</h1>
      </div>

      {loading && <p className="font-body text-paper-dim">Loading catalog…</p>}
      {error && <p className="font-body text-auction-red">{error}</p>}

      {!loading && !error && auctions.length === 0 && (
        <p className="font-body text-paper-dim">No lots are listed right now. Check back soon.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((a) => (
          <LotCard key={a.auctionId} auction={a} />
        ))}
      </div>
    </div>
  );
}
