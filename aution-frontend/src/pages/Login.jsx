import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(form.username, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password.");
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-bright">Bidder entry</span>
        <h1 className="font-display text-3xl mt-1 text-paper">Sign in to bid</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Username">
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="input"
            autoComplete="username"
          />
        </Field>
        <Field label="Password">
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input"
            autoComplete="current-password"
          />
        </Field>

        {error && <p className="text-auction-red text-sm font-body">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="font-body text-sm text-paper-dim mt-6">
        New here?{" "}
        <Link to="/register" className="text-brass-bright hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-paper-dim">{label}</span>
      {children}
    </label>
  );
}
