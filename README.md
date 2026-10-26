# uag-service

Decides which shipments a user can view or edit, and who can change other users' access, on a
multi-company platform. **Start with [EXERCISE.md](EXERCISE.md)**, then [docs/DOMAIN.md](docs/DOMAIN.md).

Node 20+, no dependencies, nothing to install.

```bash
npm test     # run the tests
npm start    # http://localhost:3000
```

## Code

| File | What it does |
| --- | --- |
| `src/permissions.js` | Finds a user's group in an org and checks shipment access |
| `src/members.js` | Moves users between groups and enforces the owner rules |
| `src/app.js` | HTTP routes |
| `src/store.js` | In-memory data store (stands in for a database) |
| `src/seed.js` | Fixture orgs, users, groups and shipments |

## API

Login is faked: send the caller's user ID in the `x-user-id` header.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/orgs/:orgId/me` | Caller's group and permissions |
| GET | `/orgs/:orgId/shipments` | Shipments the caller can view |
| POST | `/orgs/:orgId/groups/:groupId/members` | Move `{ "userId": "..." }` into the group |

```bash
curl -H "x-user-id: cara" http://localhost:3000/orgs/acme/shipments
```

## Fixture data

| User | Org | Group |
| --- | --- | --- |
| alice, olga | acme | owner |
| bob | acme | admin |
| cara | acme | EU Ops (custom: view and edit, `tag-eu` only) |
| erin | acme | no group, so viewer |
| frank | acme | admin, but **suspended** |
| max | acme / globex | viewer / admin |
| gus | globex | owner |
| hana | globex | Globex Ops (custom: view and edit, all tags) |

| Shipment | Org | Tags (ID in code, display name) |
| --- | --- | --- |
| shp-1 | acme | `tag-cold` (2-8C) |
| shp-2 | acme | `tag-eu` (EU lanes) |
| shp-3 | acme | none |
| shp-4 | globex | `tag-north` (North) |

`2-8C` is a storage temperature range (2 to 8 °C), a common requirement for medicines.

## Requirement update
Either all users are moved from one group to other or none of them users are migrated.