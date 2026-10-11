# CHICHKA Control — TypeScript technology spike

Private single-owner workspace for Marichka. **Not** a CMS for the public Astro portfolio.

## Decision under evaluation

- **Refine + React + Supabase/PostgreSQL**: custom Today UI, backend through Supabase.
- **Payload + PostgreSQL**: integrated TypeScript backend/auth/admin, but defaults to data-centric UI.

Neither option is approved for production yet. No real user records, service keys, or database credentials should be committed.

## Comparable prototype task

A private Today page should show:
- active projects, with status and next milestone;
- tasks due today / overdue, priority and associated project;
- a way to export an assignment brief to Markdown without granting team access;
- a simple, readable editorial workspace — not the public portfolio.

Evaluation: time to implement, usability, authentication/RLS, deploy complexity, custom workflows, migration flexibility, cost.

### Refine prototype (runnable local UI, demo data only)

```bash
cd control/spikes/refine-today
npm install
npm run dev
```

Open the Vite URL. The UI uses an in-memory Refine data provider: **no database, no login, no persistence**. It is a UX/prototype spike only.

### Payload comparison

See `spikes/payload-today/README.md` for a reproducible scaffold and equivalent entities. Do not deploy either prototype publicly.

## Proposed later production data model

Owner: exactly one pre-provisioned authenticated user. Turn off public registration. PostgreSQL entities: `projects`, `tasks`, `notes`, `exports`, `activity`. Project/task ownership must be enforced server-side, not just hidden in the UI. Supabase requires owner-scoped RLS policies on every private table.

The Astro portfolio and this private workspace must have independent deployments.
