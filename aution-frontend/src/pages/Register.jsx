import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field } from "./Login";

const USER_TYPES = ["BIDDER", "AUCTIONEER"];

export default function Register() {
  const { registerAccount, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    username: "",
    password: "",
    userType: "BIDDER",
    companyName: "",
  });
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await registerAccount(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Check your details and try again.");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <div className="mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-bright">New account</span>
        <h1 className="font-display text-3xl mt-1 text-paper">Join the house</h1>
        <p className="font-body text-sm text-paper-dim mt-2">
          Register as a bidder to place bids, or as an auctioneer to list lots of your own.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name">
            <input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="input" />
          </Field>
          <Field label="Last name">
            <input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Email">
          <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input" />
        </Field>

        <Field label="Phone number">
          <input
            required
            value={form.phoneNumber}
            onChange={(e) => update("phoneNumber", e.target.value)}
            className="input"
            placeholder="10-digit mobile number"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Username">
            <input required minLength={4} maxLength={30} value={form.username} onChange={(e) => update("username", e.target.value)} className="input" />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <p className="font-mono text-[10px] text-paper-dim -mt-2">
          8+ characters, with upper &amp; lower case, a number, and a symbol.
        </p>

        <Field label="Account type">
          <div className="flex gap-2">
            {USER_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => update("userType", t)}
                className={`flex-1 font-mono text-xs uppercase tracking-wide rounded border px-3 py-2 transition-colors ${
                  form.userType === t
                    ? "border-brass-bright text-brass-bright bg-brass/10"
                    : "border-line text-paper-dim hover:text-paper"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        {form.userType === "AUCTIONEER" && (
          <Field label="Company name">
            <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="input" />
          </Field>
        )}

        {error && <p className="text-auction-red text-sm font-body">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="font-body text-sm text-paper-dim mt-6">
        Already registered?{" "}
        <Link to="/login" className="text-brass-bright hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
