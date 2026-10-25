// Works out what a user can do in an org. See docs/DOMAIN.md.

export function membership(store, userId, orgId) {
  return store.members.find((m) => m.org_id === orgId && m.user_id === userId) ?? null;
}

export function activeAssignment(store, userId, orgId) {
  return store.assignments.find((a) => a.org_id === orgId && a.user_id === userId && !a.deleted) ?? null;
}

export function getGroup(store, orgId, groupId) {
  return store.groups.find((g) => g.id === groupId && g.org_id === orgId && !g.deleted) ?? null;
}

export function systemGroup(store, orgId, systemKey) {
  return store.groups.find((g) => g.org_id === orgId && g.system_key === systemKey && !g.deleted) ?? null;
}

// The user's group and permissions in this org, or null if they have no access.
export function resolvePermissions(store, userId, orgId) {
  const member = membership(store, userId, orgId);
  if (!member || member.suspended) return null;

  const assignment = activeAssignment(store, userId, orgId);
  const group = (assignment && getGroup(store, orgId, assignment.group_id)) ?? systemGroup(store, orgId, 'viewer');
  if (!group) return null;

  return {
    userId,
    orgId,
    groupId: group.id,
    systemKey: group.system_key,
    allTags: group.all_tags,
    tags: group.tags,
    permissions: group.permissions,
  };
}

// can(resolved, 'shipments.edit')
export function can(resolved, permission) {
  const [area, action] = permission.split('.');
  return Boolean(resolved?.permissions?.[area]?.[action]);
}

// action is 'view' or 'edit'.
export function canAccessShipment(store, userId, orgId, shipmentId, action) {
  const shipment = store.shipments.find((s) => s.id === shipmentId && s.org_id === orgId);
  if (!shipment) return false;

  const resolved = resolvePermissions(store, userId, orgId);
  if (!can(resolved, `shipments.${action}`)) return false;
  if (resolved.allTags) return true;
  return shipment.tags.some((tag) => resolved.tags.includes(tag));
}

export function visibleShipments(store, userId, orgId) {
  return store.shipments.filter(
    (s) => s.org_id === orgId && canAccessShipment(store, userId, orgId, s.id, 'view'),
  );
}
