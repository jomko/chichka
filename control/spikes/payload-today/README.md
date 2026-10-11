# Payload comparison — equivalent Today prototype

Payload is not yet installed in this repository. This documents a **reproducible scaffold**, not a working Payload prototype. The Refine UI spike lives in the sibling directory.

Start with the official generator (select Next.js + PostgreSQL, blank template, TypeScript):

```bash
cd control/spikes
npx create-payload-app@latest payload-evaluation
```

Then create two collections `projects` and `tasks`, with private authenticated access. Configure an owner user through the built-in auth collection. **Never expose real records anonymously.**

Compare the same Today interactions:
1. list tasks due now and overdue;
2. mark tasks done;
3. see active projects;
4. select tasks and export a human-readable brief.

A plain generated Payload admin will cover editing and listing, but **Today is a custom dashboard component**, not a built-in feature. Record that implementation cost as part of the comparison rather than claiming feature parity.

Reference: https://payloadcms.com/docs/getting-started/what-is-payload
