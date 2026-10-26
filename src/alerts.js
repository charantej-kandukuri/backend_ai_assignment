// Temperature alerts: notify everyone who can see the shipment. See docs/DOMAIN.md.
import { canAccessShipment } from './permissions.js';

// Groups in the shipment's org whose tags cover it.
export function groupsForShipment(store, shipment) {
  return store.groups.filter(
    (g) =>
      g.org_id === shipment.org_id &&
      !g.deleted &&
      (g.all_tags || g.tags.some((tag) => shipment.tags.includes(tag))),
  );
}

// Members of the shipment's org who can view it: canAccessShipment covers
// suspension, the viewer default for members with no group, and tags.
export function usersToNotify(store, shipmentId) {
  const shipment = store.shipments.find((s) => s.id === shipmentId);
  if (!shipment) return [];

  const users = store.members
    .filter((m) => m.org_id === shipment.org_id)
    .map((m) => m.user_id)
    .filter((userId) => canAccessShipment(store, userId, shipment.org_id, shipment.id, 'view'));
  return [...new Set(users)].sort();
}
