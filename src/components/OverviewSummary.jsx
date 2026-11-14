import { FINISHED_STATUSES, today } from "../lib/opportunities.js";

export default function OverviewSummary({ opportunities }) {
  const active = opportunities.filter((item) => !FINISHED_STATUSES.has(item.status));
  const applied = opportunities.filter((item) => ["Applied", "Recruiter Screen", "Interview", "Offer"].includes(item.status));
  const interviews = opportunities.filter((item) => item.status === "Interview");
  const due = active.filter((item) => item.next_action_due && item.next_action_due <= today());

  return (
    <p className="overview-summary" aria-live="polite">
      {active.length} active <span aria-hidden="true">·</span> {applied.length} applied <span aria-hidden="true">·</span> {interviews.length} interviews <span aria-hidden="true">·</span> {due.length} follow-ups due
    </p>
  );
}
