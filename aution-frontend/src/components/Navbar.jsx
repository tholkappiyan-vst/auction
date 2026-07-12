import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-line bg-ink/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl tracking-tight text-paper group-hover:text-brass-bright transition-colors">
            Lodestar
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper-dim border border-line rounded-full px-2 py-0.5">
            Auctions
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-body text-sm text-paper-dim">
          <Link to="/" className="hover:text-paper transition-colors">Catalog</Link>
          {isAuthenticated && user?.role === "AUCTIONEER" && (
            <>
              <Link to="/my-auctions" className="hover:text-paper transition-colors">My Lots</Link>
              <Link to="/create-auction" className="hover:text-paper transition-colors">New Lot</Link>
            </>
          )}
          {isAuthenticated && user?.role === "BIDDER" && (
            <Link to="/my-registrations" className="hover:text-paper transition-colors">My Registrations</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:inline font-mono text-xs text-paper-dim">
                {user.username} · <span className="text-brass-bright">{user.role}</span>
              </span>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="focus-ring font-body text-sm px-3 py-1.5 rounded border border-line text-paper-dim hover:text-paper hover:border-paper-dim transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="focus-ring font-body text-sm px-3 py-1.5 rounded text-paper-dim hover:text-paper transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="focus-ring font-body text-sm px-3 py-1.5 rounded bg-brass text-ink font-medium hover:bg-brass-bright transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
