import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAuction } from "../api/auctions";
import { Field } from "./Login";

const initialForm = {
  itemName: "",
  itemDescription: "",
  itemCategory: "",
  itemCondition: "",
  estimatedValue: "",
  itemImageUrl: "",
  startTime: "",
  endTime: "",
  startingPrice: "",
  reservePrice: "",
  minimumIncrement: "",
  enableAutoExtension: false,
  extensionWindowMinutes: 2,
  extensionDurationMinutes: 5,
  certifiedAuthentic: false,
  certificateNumber: "",
  provenance: "",
};

function formatToLocalDateTime(dateString) {
  if (!dateString) return "";
  // If the input gives "2026-07-11T11:25", this appends ":00" to make it "2026-07-11T11:25:00"
  return dateString.length === 16 ? `${dateString}:00` : dateString;
}

export default function CreateAuction() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        ...form,
        estimatedValue: Number(form.estimatedValue),
        startingPrice: Number(form.startingPrice),
        reservePrice: form.reservePrice ? Number(form.reservePrice) : undefined,
        minimumIncrement: Number(form.minimumIncrement),
        extensionWindowMinutes: Number(form.extensionWindowMinutes),
        extensionDurationMinutes: Number(form.extensionDurationMinutes),
        startTime: formatToLocalDateTime(form.startTime),
        endTime: formatToLocalDateTime(form.endTime),
      };
      const res = await createAuction(payload);
      navigate(`/auctions/${res.auctionId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the lot. Check the required fields.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-bright">Auctioneer</span>
        <h1 className="font-display text-3xl mt-1 text-paper">List a new lot</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Item name">
          <input required value={form.itemName} onChange={(e) => update("itemName", e.target.value)} className="input" />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows={4}
            maxLength={2000}
            value={form.itemDescription}
            onChange={(e) => update("itemDescription", e.target.value)}
            className="input resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <input required value={form.itemCategory} onChange={(e) => update("itemCategory", e.target.value)} className="input" />
          </Field>
          <Field label="Condition">
            <input required value={form.itemCondition} onChange={(e) => update("itemCondition", e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Image URL">
          <input value={form.itemImageUrl?.trim()} onChange={(e) => update("itemImageUrl", e.target.value)} className="input" placeholder="https://…" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start time">
            <input required type="datetime-local" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} className="input" />
          </Field>
          <Field label="End time">
            <input required type="datetime-local" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Starting price">
            <input required type="number" step="0.01" min="0.01" value={form.startingPrice} onChange={(e) => update("startingPrice", e.target.value)} className="input" />
          </Field>
          <Field label="Reserve price">
            <input type="number" step="0.01" min="0.01" value={form.reservePrice} onChange={(e) => update("reservePrice", e.target.value)} className="input" />
          </Field>
          <Field label="Min. increment">
            <input required type="number" step="0.01" min="0.01" value={form.minimumIncrement} onChange={(e) => update("minimumIncrement", e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Estimated value">
          <input required type="number" step="0.01" min="0.01" value={form.estimatedValue} onChange={(e) => update("estimatedValue", e.target.value)} className="input" />
        </Field>

        <label className="flex items-center gap-2 font-body text-sm text-paper-dim mt-2">
          <input
            type="checkbox"
            checked={form.enableAutoExtension}
            onChange={(e) => update("enableAutoExtension", e.target.checked)}
            className="accent-brass"
          />
          Enable anti-sniper auto-extension
        </label>

        <label className="flex items-center gap-2 font-body text-sm text-paper-dim mt-2">
          <input
            type="checkbox"
            checked={form.certifiedAuthentic}
            onChange={(e) => update("certifiedAuthentic", e.target.checked)}
            className="accent-brass"
          />
          Certified authentic
        </label>

        {form.certifiedAuthentic && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Certificate number">
              <input value={form.certificateNumber} onChange={(e) => update("certificateNumber", e.target.value)} className="input" />
            </Field>
            <Field label="Provenance">
              <input value={form.provenance} onChange={(e) => update("provenance", e.target.value)} className="input" />
            </Field>
          </div>
        )}

        {form.enableAutoExtension && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Extension window (min)">
              <input type="number" min="1" value={form.extensionWindowMinutes} onChange={(e) => update("extensionWindowMinutes", e.target.value)} className="input" />
            </Field>
            <Field label="Extension duration (min)">
              <input type="number" min="1" value={form.extensionDurationMinutes} onChange={(e) => update("extensionDurationMinutes", e.target.value)} className="input" />
            </Field>
          </div>
        )}

        {error && <p className="text-auction-red text-sm font-body">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary mt-2">
          {busy ? "Listing…" : "List lot"}
        </button>
      </form>
    </div>
  );
}