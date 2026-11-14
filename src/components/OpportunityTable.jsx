import { formatDate, safeJobUrl, STATUSES, statusClass, today } from "../lib/opportunities.js";

function RoleCell({ opportunity }) {
  const postingUrl = safeJobUrl(opportunity.url);
  return (
    <td className="role-cell">
      <span className="role-name">{opportunity.title}</span>
      {(opportunity.work_mode || opportunity.employment_type || postingUrl) && (
        <span className="role-meta">
          {opportunity.work_mode && <span>{opportunity.work_mode}</span>}
          {opportunity.employment_type && <span>{opportunity.employment_type}</span>}
          {postingUrl && <a href={postingUrl} target="_blank" rel="noopener noreferrer">Posting ↗</a>}
        </span>
      )}
    </td>
  );
}

function StatusSelect({ opportunity, disabled, onChange }) {
  return (
    <td>
      <select
        className={`status-select ${statusClass(opportunity.status)}`}
        aria-label={`Status for ${opportunity.title} at ${opportunity.company}`}
        value={opportunity.status}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {STATUSES.map((status) => <option key={status}>{status}</option>)}
      </select>
    </td>
  );
}

function NextAction({ opportunity }) {
  const dueDate = opportunity.next_action_due;
  const isOverdue = dueDate && dueDate < today();
  const dueLabel = !dueDate
    ? ""
    : isOverdue
      ? `Overdue · ${formatDate(dueDate)}`
      : dueDate === today()
        ? "Due today"
        : `Due ${formatDate(dueDate)}`;

  return (
    <td className="next-action">
      <strong>{opportunity.next_action || "No next step set"}</strong>
      {dueLabel && <span className={isOverdue ? "overdue" : ""}>{dueLabel}</span>}
    </td>
  );
}

export default function OpportunityTable({
  opportunities,
  updatingId,
  onStatusChange,
  onHistory,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Role</th>
            <th scope="col">Company</th>
            <th scope="col">Location</th>
            <th scope="col">Status</th>
            <th scope="col">Next step</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity) => (
            <tr key={opportunity.id}>
              <RoleCell opportunity={opportunity} />
              <td className="company-cell">{opportunity.company}</td>
              <td className="location-cell">{opportunity.location || "—"}</td>
              <StatusSelect
                opportunity={opportunity}
                disabled={updatingId === opportunity.id}
                onChange={(status) => onStatusChange(opportunity, status)}
              />
              <NextAction opportunity={opportunity} />
              <td className="action-cell">
                <button className="text-button" type="button" onClick={() => onHistory(opportunity)}>History</button>
                <button className="text-button" type="button" onClick={() => onEdit(opportunity)}>Edit</button>
                <button className="text-button text-button-danger" type="button" onClick={() => onDelete(opportunity)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
