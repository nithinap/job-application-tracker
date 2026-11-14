import { getDatabase } from "@netlify/database";

const db = getDatabase();
const statuses = ["Saved", "Interested", "Preparing", "Applied", "Recruiter Screen", "Interview", "Offer", "Rejected", "Withdrawn", "Closed"];
const maxBodyBytes = 120_000;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function field(value: unknown, name: string, max: number, required = false) {
  if (typeof value !== "string") throw new Error(`${name} must be text.`);
  const result = value.trim();
  if (required && !result) throw new Error(`${name} is required.`);
  if (result.length > max) throw new Error(`${name} must be ${max} characters or fewer.`);
  return result;
}

function dateField(value: unknown, name: string) {
  const date = field(value ?? "", name, 10);
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`${name} must be a valid date.`);
  }
  return date;
}

function validate(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Send a JSON object.");
  const data = input as Record<string, unknown>;
  const status = field(data.status ?? "Saved", "Status", 30);
  if (!statuses.includes(status)) throw new Error("Choose a valid status.");

  const url = field(data.url ?? "", "Job URL", 2048);
  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Job URL must be a valid HTTPS link.");
    }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Job URL must be a valid HTTPS link.");
  }

  return {
    company: field(data.company, "Company", 180, true),
    title: field(data.title, "Job title", 180, true),
    location: field(data.location ?? "", "Location", 180),
    work_mode: field(data.work_mode ?? "", "Work arrangement", 40),
    employment_type: field(data.employment_type ?? "", "Employment type", 40),
    compensation: field(data.compensation ?? "", "Compensation", 160),
    source: field(data.source ?? "", "Source", 100),
    url,
    description: field(data.description ?? "", "Job description", 40_000),
    status,
    discovered_at: dateField(data.discovered_at ?? "", "Date saved"),
    applied_at: dateField(data.applied_at ?? "", "Date applied"),
    next_action: field(data.next_action ?? "", "Next action", 500),
    next_action_due: dateField(data.next_action_due ?? "", "Follow-up date"),
    notes: field(data.notes ?? "", "Notes", 10_000),
  };
}

function validId(value: string | null) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new Error("Send application/json.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBodyBytes) throw new Error("Request is too large.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export default async (request: Request, context: { user?: unknown }) => {
  if (process.env.CONTEXT !== "dev" && !context.user) return json({ error: "Sign in to the private Netlify project to continue." }, 401);

  const method = request.method.toUpperCase();
  if (!["GET", "POST", "PUT", "DELETE"].includes(method)) return json({ error: "Method not allowed." }, 405);
  if (method !== "GET") {
    const origin = request.headers.get("origin");
    try {
      if (!origin || new URL(origin).origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
    } catch {
      return json({ error: "Request origin is not allowed." }, 403);
    }
  }

  try {
    if (method === "GET") {
      const opportunities = await db.sql`
        SELECT o.*,
          COALESCE(
            json_agg(json_build_object(
              'id', a.id,
              'event_type', a.event_type,
              'details', a.details,
              'created_at', a.created_at
            ) ORDER BY a.created_at DESC) FILTER (WHERE a.id IS NOT NULL),
            '[]'::json
          ) AS activities
        FROM opportunities o
        LEFT JOIN opportunity_activity a ON a.opportunity_id = o.id
        GROUP BY o.id
        ORDER BY o.updated_at DESC
      `;
      return json(opportunities);
    }

    if (method === "POST") {
      let opportunity;
      try {
        opportunity = validate(await readBody(request));
      } catch (error) {
        return json({ error: (error as Error).message }, 400);
      }
      const [created] = await db.sql`
        WITH inserted AS (
          INSERT INTO opportunities (
            company, title, location, work_mode, employment_type, compensation,
            source, url, description, status, discovered_at, applied_at,
            next_action, next_action_due, notes
          ) VALUES (
            ${opportunity.company}, ${opportunity.title}, ${opportunity.location},
            ${opportunity.work_mode}, ${opportunity.employment_type}, ${opportunity.compensation},
            ${opportunity.source}, ${opportunity.url}, ${opportunity.description},
            ${opportunity.status}, ${opportunity.discovered_at}, ${opportunity.applied_at},
            ${opportunity.next_action}, ${opportunity.next_action_due}, ${opportunity.notes}
          ) RETURNING *
        ), logged AS (
          INSERT INTO opportunity_activity (opportunity_id, event_type, details)
          SELECT id, 'created', jsonb_build_object('status', status) FROM inserted
          RETURNING id
        )
        SELECT * FROM inserted
      `;
      return json(created, 201);
    }

    const url = new URL(request.url);
    const id = validId(url.searchParams.get("id"));
    if (!id) return json({ error: "A valid opportunity ID is required." }, 400);

    if (method === "PUT") {
      let opportunity;
      try {
        opportunity = validate(await readBody(request));
      } catch (error) {
        return json({ error: (error as Error).message }, 400);
      }
      const [updated] = await db.sql`
        WITH previous AS (
          SELECT status FROM opportunities WHERE id = ${id}::uuid
        ), changed AS (
          UPDATE opportunities SET
            company = ${opportunity.company}, title = ${opportunity.title},
            location = ${opportunity.location}, work_mode = ${opportunity.work_mode},
            employment_type = ${opportunity.employment_type}, compensation = ${opportunity.compensation},
            source = ${opportunity.source}, url = ${opportunity.url},
            description = ${opportunity.description}, status = ${opportunity.status},
            discovered_at = ${opportunity.discovered_at}, applied_at = ${opportunity.applied_at},
            next_action = ${opportunity.next_action}, next_action_due = ${opportunity.next_action_due},
            notes = ${opportunity.notes}, updated_at = now()
          WHERE id = ${id}::uuid
          RETURNING *
        ), logged AS (
          INSERT INTO opportunity_activity (opportunity_id, event_type, details)
          SELECT changed.id, 'status_changed', jsonb_build_object('from', previous.status, 'to', changed.status)
          FROM changed CROSS JOIN previous
          WHERE previous.status <> changed.status
          RETURNING id
        )
        SELECT * FROM changed
      `;
      return updated ? json(updated) : json({ error: "Opportunity not found." }, 404);
    }

    const [deleted] = await db.sql`DELETE FROM opportunities WHERE id = ${id}::uuid RETURNING id`;
    return deleted ? json({ id: deleted.id }) : json({ error: "Opportunity not found." }, 404);
  } catch (error) {
    console.error("Opportunity API failed", error);
    return json({ error: "The request could not be completed. Check that Netlify Database is set up, then try again." }, 500);
  }
};

export const config = { path: "/api/opportunities" };
