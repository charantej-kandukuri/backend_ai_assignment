# Open pull requests

Descriptions as written by each author.

## PR-101: Notify users on shipment alerts

**Author:** Priya Nair · **Branch:** `pr-101-shipment-alerts`

When a shipment has a temperature alert, everyone who can see that shipment should be notified.
This adds `usersToNotify(store, shipmentId)`: it finds the groups whose tags match the shipment
(or that have all tags) and returns their members.

Tests: added `test/alerts.test.js`. All green.

## PR-102: Bulk move users between groups

**Author:** Sam Okafor · **Branch:** `pr-102-bulk-move`

Product wants "Move selected" on the group Users page. This adds
`moveUsers(store, { actorId, orgId, groupId, userIds })`. Each user gets the same checks as a
single move (membership, last owner), and the result reports success or failure per user so the
UI can show partial failures.

Tests: added `test/bulk-move.test.js`. All green.
