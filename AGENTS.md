# Working on state transitions

Read `docs/state-machines/README.md` before changing a user flow. It records transition ownership, guards, regression coverage and unresolved risks. `docs/state-machines/source-index.json` provides searchable source evidence; it is a candidate census, not semantic proof of completeness.

- Keep server authorization, hello limits, token rotation and persisted formats authoritative. Preserve both `/api` and `/api/v1` contracts and prior release-hardening work.
- Use small typed states or pure reducers for coupled flags. Keep independent form fields/toggles local; add no framework solely to model simple state.
- Scope async results to account, resource and request. Use a synchronous guard for duplicate mutations; React state alone does not lock same-tick callbacks.
- Preserve drafts on failure, show recovery, distinguish partial completion from success, and do not automatically retry non-idempotent mutations.
- For changed flows, update the inventory and add meaningful regression tests for failure/overlap/stale results when relevant. Regenerate `node scripts/state-index.mjs` and verify `node scripts/state-index.mjs --check`.
- Run root `npm test` and `npm run build`; for mobile changes run `npm test`, `npm run typecheck`, and `npm run lint` from `mobile`. Native changes also require matching Expo docs and device validation. Existing `mobile/AGENTS.md` applies.
- Do not log credentials or private message contents for transition diagnostics. Keep existing production release gates; passing tests does not certify a launch.
