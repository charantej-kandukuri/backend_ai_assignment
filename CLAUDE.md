# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`uag-service`: a small access-control service deciding which shipments a user can view/edit and who can move users between groups, on a multi-tenant (multi-org) platform. It is also a **live review exercise** (see `EXERCISE.md`): two open PRs live on the branches `pr-102-bulk-move` (do first) and `pr-101-shipment-alerts`, described in `PULL_REQUESTS.md`. The task is to review each against the requirements in `docs/DOMAIN.md`, prove any bug with a failing test, fix it on the PR branch, and commit.

Ground rules from `EXERCISE.md`, as adjusted by the user:
- Commit fixes only on the user's own branches, `charan/pr-102-bulk-move` and `charan/pr-101-shipment-alerts`, created from the PR branches. Keep `pr-102-bulk-move` and `pr-101-shipment-alerts` identical to `origin`. **Do not change `main`.**
- Do not push, and do not open PRs, issues or comments on the upstream repo.
- When fixing a PR, you may rewrite function internals but **keep the names and signatures of the functions the PR adds** (e.g. `moveUsers(store, { actorId, orgId, groupId, userIds })`, `usersToNotify(store, shipmentId)`).

## Commands

Node 20+, ES modules, zero dependencies, nothing to install. Tests use the built-in `node:test` runner and `node:assert/strict`.

```bash
npm start                                   # http://localhost:3000 (PORT env overrides)
node --test test/*.test.js                  # run all tests
node --test test/members.test.js            # one file
node --test --test-name-pattern="last owner" test/*.test.js   # one test by name
git diff main...pr-102-bulk-move            # view a PR's changes
```

Note: `npm test` runs `node --test test/`, which fails on Node 22+ (a directory argument is treated as a module path, giving `Cannot find module .../test`). Use the glob form above instead.

Login is faked via the `x-user-id` header: `curl -H "x-user-id: cara" http://localhost:3000/orgs/acme/shipments`.

## Architecture

- `src/store.js` — in-memory "database": `createStore()` returns a `structuredClone` of the fixtures in `src/seed.js`, so each test gets a fresh store. `withTransaction(store, fn)` snapshots the whole store and restores every table if `fn` throws — wrap mutations in it so a failed check leaves no partial writes. Errors are `AccessError` (`forbidden` 403, `notFound` 404, `conflict` 409 with a custom code); the HTTP layer in `src/app.js` maps them to responses, and tests assert on `{ code }`.
- `src/permissions.js` — read-side primitives everything else builds on: `membership`, `activeAssignment` (the non-deleted assignment), `getGroup` (always scoped by `orgId`), `systemGroup`, and `resolvePermissions(store, userId, orgId)`, which returns `null` for non-members and suspended members, and falls back to the Viewer group when there is no assignment. `can(resolved, 'area.action')` checks `shipments.view`, `shipments.edit`, `groups.manage`. Tag visibility: `all_tags: true` covers every shipment in the org, otherwise the shipment needs at least one matching tag (untagged shipments are visible only to all-tags groups).
- `src/members.js` — `changeGroup` is the reference implementation of a group move and encodes the rules any new mutation must reproduce: actor needs `groups.manage`; target group and target membership must exist **in the same org**; only an owner may assign to the owner group; moving the last owner out throws `conflict('last_owner')`; the old assignment is soft-deleted (`deleted: true`) and a new one pushed; an `audit_log` entry `{ org_id, actor_id, user_id, from, to }` is appended.

Data model: `groups.system_key` is `'owner' | 'admin' | 'viewer' | null` (custom). Group IDs are `${orgId}:${key}` in fixtures, but always look groups up with `orgId` rather than trusting the ID prefix. Users may be members of several orgs (e.g. `max` is viewer in `acme`, admin in `globex`), so every lookup must be scoped by org.

## Requirements to review against (`docs/DOMAIN.md`)

1. **Org isolation** — nothing from one org may be shown to, sent to (including notifications), or changed by anyone outside it.
2. **Access follows membership** — suspended members have no access; members with no group are Viewers.
3. **Always an Owner** — only Owners can create Owners; an org must never reach zero Owners.
4. **Every group change is audited** — actor, user, previous and new group; old assignments soft-deleted, never removed.

**Requirement update** (`README.md`, added mid-exercise): a bulk move is all or nothing — either every selected user is moved or none are. This overrides PR-102's original "partial failures" description. On `charan/pr-102-bulk-move`, `moveUsers` runs each user through `changeGroup` inside one `withTransaction`; if any user fails, everything (assignments and audit entries) is rolled back, and the per-user results show the failing users' error codes while the rest report `rolled_back`.

Fixture users and shipments are tabulated in `README.md`. Useful edge cases: `frank` (suspended admin), `erin` (no group → viewer), `max` (in two orgs), `cara` (custom group, `tag-eu` only), and `alice`/`olga` (acme's two owners).
