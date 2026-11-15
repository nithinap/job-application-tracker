import { useEffect, useState } from "react";
import HistoryDialog from "./components/HistoryDialog.jsx";
import BookmarkletDialog from "./components/BookmarkletDialog.jsx";
import OpportunityDialog from "./components/OpportunityDialog.jsx";
import OpportunityTable from "./components/OpportunityTable.jsx";
import OverviewSummary from "./components/OverviewSummary.jsx";
import { safeJobUrl, STATUSES, today } from "./lib/opportunities.js";

const API_URL = "/api/opportunities";

async function request(url = API_URL, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}

function EmptyState({ hasRoles, onAdd }) {
  return (
    <div className="empty-state">
      <h2>{hasRoles ? "No matching roles" : "No roles yet"}</h2>
      <p>{hasRoles ? "Try a different search or status filter." : "Add a role to track its status, posting link, or job description."}</p>
      {!hasRoles && <button className="button button-primary" type="button" onClick={onAdd}>Add role</button>}
    </div>
  );
}

export default function App() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [captureHelpOpen, setCaptureHelpOpen] = useState(false);
  const [quickCapture, setQuickCapture] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [historyOpportunity, setHistoryOpportunity] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadOpportunities() {
    setLoading(true);
    setPageError("");
    try {
      setOpportunities(await request());
    } catch (error) {
      setPageError(error.message.includes("private Netlify project")
        ? error.message
        : `${error.message} Make sure Netlify Database is set up for this project.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOpportunities();
    const params = new URLSearchParams(window.location.search);
    if (params.get("capture") !== "1") return;

    setSelectedOpportunity({
      title: (params.get("title") || "").slice(0, 180),
      company: (params.get("company") || "").slice(0, 180),
      location: (params.get("location") || "").slice(0, 180),
      source: (params.get("source") || "").slice(0, 100),
      url: safeJobUrl(params.get("url") || ""),
      status: "Saved",
      discovered_at: today(),
    });
    setQuickCapture(true);
    setDialogOpen(true);
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.hash);
  }, []);

  function addRole() {
    setSelectedOpportunity(null);
    setQuickCapture(false);
    setDialogOpen(true);
  }

  async function saveRole(data) {
    const id = data.id;
    delete data.id;
    if (data.status === "Applied" && !data.applied_at) data.applied_at = today();
    await request(id ? `${API_URL}?id=${encodeURIComponent(id)}` : API_URL, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(data),
    });
    setDialogOpen(false);
    await loadOpportunities();
  }

  async function changeStatus(opportunity, status) {
    setUpdatingId(opportunity.id);
    try {
      const updated = { ...opportunity, status };
      if (status === "Applied" && !opportunity.applied_at) updated.applied_at = today();
      await request(`${API_URL}?id=${encodeURIComponent(opportunity.id)}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      await loadOpportunities();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRole(opportunity) {
    if (!window.confirm(`Delete ${opportunity.title} at ${opportunity.company}? This also removes its status history.`)) return;
    try {
      await request(`${API_URL}?id=${encodeURIComponent(opportunity.id)}`, { method: "DELETE" });
      await loadOpportunities();
    } catch (error) {
      setPageError(error.message);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visible = opportunities.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (!normalizedQuery) return true;
    return [item.title, item.company, item.location, item.source, item.description, item.notes, item.next_action]
      .some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
  });
  const isFiltered = Boolean(normalizedQuery || statusFilter);

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Job Search Workspace home">
          <span className="brand-mark" aria-hidden="true">J</span>
          <span>Job Search <span className="brand-light">Workspace</span></span>
        </a>
        <div className="topbar-right">
          <span className="privacy-label"><span className="privacy-dot" aria-hidden="true" />Netlify sign-in required</span>
          <button className="button button-quiet quick-capture-open" type="button" onClick={() => setCaptureHelpOpen(true)}>
            <span className="quick-capture-long">Quick capture</span><span className="quick-capture-short">Capture</span>
          </button>
          <button className="button button-primary" type="button" onClick={addRole}><span aria-hidden="true">＋</span> Add role</button>
        </div>
      </header>

      <main className="page-shell">
        <section className="list-section" aria-labelledby="list-title">
          <div className="section-heading">
            <div>
              <h1 id="list-title">Applications</h1>
              <OverviewSummary opportunities={opportunities} />
            </div>
            <span className="result-count" aria-live="polite">
              {isFiltered ? `${visible.length} of ${opportunities.length}` : `${opportunities.length} ${opportunities.length === 1 ? "role" : "roles"}`}
            </span>
          </div>

          <div className="toolbar">
            <label className="search-box">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <span className="sr-only">Search roles</span>
              <input type="search" placeholder="Search roles, companies, or notes…" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <label className="filter-box">
              <span className="sr-only">Filter by status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>

          {pageError && <div className="notice notice-error" role="alert">{pageError}</div>}
          {loading && <div className="loading-state" role="status">Loading your roles…</div>}
          {!loading && !pageError && visible.length > 0 && (
            <OpportunityTable
              opportunities={visible}
              updatingId={updatingId}
              onStatusChange={changeStatus}
              onHistory={setHistoryOpportunity}
              onEdit={(opportunity) => { setQuickCapture(false); setSelectedOpportunity(opportunity); setDialogOpen(true); }}
              onDelete={deleteRole}
            />
          )}
          {!loading && !pageError && visible.length === 0 && (
            <EmptyState hasRoles={opportunities.length > 0} onAdd={addRole} />
          )}
        </section>
      </main>

      {dialogOpen && (
        <OpportunityDialog
          key={selectedOpportunity?.id || (quickCapture ? "quick-capture" : "new-role")}
          opportunity={selectedOpportunity}
          quickCapture={quickCapture}
          onSave={saveRole}
          onClose={() => setDialogOpen(false)}
        />
      )}
      {captureHelpOpen && <BookmarkletDialog onClose={() => setCaptureHelpOpen(false)} />}
      {historyOpportunity && (
        <HistoryDialog opportunity={historyOpportunity} onClose={() => setHistoryOpportunity(null)} />
      )}
    </>
  );
}
