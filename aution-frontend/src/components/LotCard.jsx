import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatLotNumber, formatDateTime } from "../utils/format";

export default function LotCard({ auction }) {
  const price = auction.currentHighestBid || auction.startingPrice;

  return (
    <Link
      to={`/auctions/${auction.auctionId}`}
      className="lot-stub focus-ring group relative flex flex-col border border-line rounded-lg overflow-hidden bg-ink-soft hover:border-brass/60 transition-colors"
    >
      <div className="aspect-[4/3] bg-line overflow-hidden">
        {auction.itemImageUrl ? (
          <img
            src={auction.itemImageUrl}
            alt={auction.itemName}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-paper-dim/40 text-4xl">
            {formatLotNumber(auction.auctionId)}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-paper-dim tracking-widest">
            LOT {formatLotNumber(auction.auctionId)}
          </span>
          <StatusBadge status={auction.status} />
        </div>

        <h3 className="font-display text-lg leading-snug text-paper group-hover:text-brass-bright transition-colors">
          {auction.itemName}
        </h3>

        <p className="font-body text-xs text-paper-dim line-clamp-2">
          {auction.itemCategory} · {auction.itemCondition}
        </p>

        <div className="flex items-end justify-between mt-2 pt-3 border-t border-line">
          <div>
            <div className="font-mono text-[10px] uppercase text-paper-dim tracking-wide">
              {auction.currentHighestBid ? "Current bid" : "Opening"}
            </div>
            <div className="font-mono text-base text-brass-bright">{formatCurrency(price)}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase text-paper-dim tracking-wide">Closes</div>
            <div className="font-mono text-xs text-paper-dim">{formatDateTime(auction.endTime)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
