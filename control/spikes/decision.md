# Decision pending: Payload or Refine

Date: 2026-10-11 · CHICHKA Control

## Constraints

Single owner, private data, no collaborative user accounts, no public CMS.
Tasks can be delegated by exporting a brief, not granting access.
Public Astro website remains untouched.

## What is ready

- Refine-based local **UI** prototype with illustrative data and Markdown task export.
- Payload evaluation instructions, but no Payload application scaffold yet.

## What is not ready

No database, persistence, authentication, production RLS, backup, monitoring or CI for the new app.
No framework winner has been chosen.

## Acceptance criteria for technology choice

- Production auth is private by default, signup disabled; owner scoped server rules.
- PostgreSQL tables and migrations are explicit and recoverable.
- Today is a fast purpose-built workspace, not a wall of generic admin tables.
- Export has an editable brief and produces a clean file.
- Adding scheduling, partners, finance and AI later doesn't require a rewrite.
- Confirmed deploy and monthly operating cost.

## Preliminary hypothesis

Refine is more promising for a bespoke daily workspace; Payload may be faster for backend/auth/data. Verify both with the same real workflow before adopting a stack.
