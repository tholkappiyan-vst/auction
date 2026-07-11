import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="font-mono text-6xl text-line mb-4">404</div>
      <h1 className="font-display text-2xl text-paper mb-2">Lot withdrawn</h1>
      <p className="font-body text-sm text-paper-dim mb-6">
        Nothing here matches this address.
      </p>
      <Link to="/" className="btn-primary inline-block">Back to catalog</Link>
    </div>
  );
}
