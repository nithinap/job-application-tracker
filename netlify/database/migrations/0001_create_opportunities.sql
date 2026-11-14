CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  work_mode text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT '',
  compensation text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Saved'
    CHECK (status IN ('Saved', 'Interested', 'Preparing', 'Applied', 'Recruiter Screen', 'Interview', 'Offer', 'Rejected', 'Withdrawn', 'Closed')),
  discovered_at date,
  applied_at date,
  next_action text NOT NULL DEFAULT '',
  next_action_due date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunity_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS opportunities_status_idx ON opportunities(status);
CREATE INDEX IF NOT EXISTS opportunities_next_action_due_idx ON opportunities(next_action_due);
CREATE INDEX IF NOT EXISTS opportunity_activity_opportunity_id_idx ON opportunity_activity(opportunity_id, created_at DESC);
