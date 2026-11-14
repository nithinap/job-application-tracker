import { useEffect, useRef } from "react";
import { formatDateTime } from "../lib/opportunities.js";

export default function HistoryDialog({ opportunity, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  const events = Array.isArray(opportunity.activities) ? opportunity.activities : [];

  return (
    <dialog ref={dialogRef} className="dialog dialog-small" aria-labelledby="history-title" onClose={onClose}>
      <div className="dialog-header">
        <h2 id="history-title">{opportunity.company} · {opportunity.title}</h2>
        <button className="icon-button" type="button" aria-label="Close history" onClick={() => dialogRef.current?.close()}>×</button>
      </div>
      <ol className="activity-list">
        {events.length ? events.map((event) => {
          const text = event.event_type === "status_changed"
            ? `Status changed from ${event.details?.from || "—"} to ${event.details?.to || "—"}`
            : `Role saved · ${event.details?.status || "Saved"}`;
          return (
            <li className="activity-item" key={event.id}>
              <span className="activity-dot" aria-hidden="true" />
              <div>
                <div className="activity-title">{text}</div>
                <div className="activity-time">{formatDateTime(event.created_at)}</div>
              </div>
            </li>
          );
        }) : <li className="activity-title">No activity recorded yet.</li>}
      </ol>
      <div className="dialog-footer">
        <button className="button button-quiet" type="button" onClick={() => dialogRef.current?.close()}>Done</button>
      </div>
    </dialog>
  );
}
