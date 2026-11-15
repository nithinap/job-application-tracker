import { useEffect, useRef, useState } from "react";
import { STATUSES, today } from "../lib/opportunities.js";

function dateValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function Field({ label, className = "field-half", children }) {
  return <label className={`field ${className}`}><span>{label}</span>{children}</label>;
}

export default function OpportunityDialog({ opportunity, quickCapture = false, onSave, onClose }) {
  const dialogRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(opportunity?.id);
  const values = opportunity || {};

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await onSave(data);
    } catch (saveError) {
      setError(saveError.message || "The role could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const roleFields = (
    <>
      <Field label={<>Job title <b>*</b></>}>
        <input autoFocus name="title" required maxLength="180" placeholder="e.g. Product Manager" defaultValue={values.title || ""} />
      </Field>
      <Field label={<>Company <b>*</b></>}>
        <input name="company" required maxLength="180" placeholder="Company name" defaultValue={values.company || ""} />
      </Field>
      <Field label="Location">
        <input name="location" maxLength="180" placeholder="City, state, or remote" defaultValue={values.location || ""} />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={values.status || "Saved"}>
          {STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
      </Field>
      <Field label="Posting URL" className="field-full">
        <input name="url" type="url" maxLength="2048" placeholder="https://…" defaultValue={values.url || ""} />
      </Field>
    </>
  );

  const detailFields = (
    <>
      <Field label="Work arrangement" className="field-third">
        <select name="work_mode" defaultValue={values.work_mode || ""}>
          <option value="">Not specified</option><option>Remote</option><option>Hybrid</option><option>On-site</option>
        </select>
      </Field>
      <Field label="Employment type" className="field-third">
        <select name="employment_type" defaultValue={values.employment_type || ""}>
          <option value="">Not specified</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option><option>Other</option>
        </select>
      </Field>
      <Field label="Compensation" className="field-third">
        <input name="compensation" maxLength="160" placeholder="Optional" defaultValue={values.compensation || ""} />
      </Field>
      <Field label="Source">
        <input name="source" maxLength="100" placeholder="LinkedIn, company site…" defaultValue={values.source || ""} />
      </Field>
      <Field label="Date saved" className="field-third">
        <input name="discovered_at" type="date" defaultValue={dateValue(values.discovered_at) || today()} />
      </Field>
      <Field label="Date applied" className="field-third">
        <input name="applied_at" type="date" defaultValue={dateValue(values.applied_at)} />
      </Field>
      <Field label="Follow-up date" className="field-third">
        <input name="next_action_due" type="date" defaultValue={dateValue(values.next_action_due)} />
      </Field>
      <Field label="Next step" className="field-full">
        <input name="next_action" maxLength="500" placeholder="e.g. Ask Maya for a referral" defaultValue={values.next_action || ""} />
      </Field>
      <Field label="Job description" className="field-full">
        <textarea name="description" rows="5" maxLength="40000" placeholder="Paste the job description here when available." defaultValue={values.description || ""} />
      </Field>
      <Field label="Notes" className="field-full">
        <textarea name="notes" rows="3" maxLength="10000" placeholder="Contacts, application notes, or anything to remember…" defaultValue={values.notes || ""} />
      </Field>
    </>
  );

  return (
    <dialog ref={dialogRef} className="dialog" aria-labelledby="dialog-title" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="dialog-header">
          <h2 id="dialog-title">{editing ? "Edit role" : quickCapture ? "Track this job" : "Add a role"}</h2>
          <button className="icon-button" type="button" aria-label="Close form" onClick={() => dialogRef.current?.close()}>×</button>
        </div>
        <div className="dialog-content">
          <input type="hidden" name="id" value={opportunity?.id || ""} readOnly />
          <div className="form-grid">
            {roleFields}
            {quickCapture ? (
              <details className="form-details field-full">
                <summary>More details</summary>
                <div className="form-grid form-grid-nested">{detailFields}</div>
              </details>
            ) : detailFields}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="dialog-footer">
          <button className="button button-quiet" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button>
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Save role"}</button>
        </div>
      </form>
    </dialog>
  );
}
