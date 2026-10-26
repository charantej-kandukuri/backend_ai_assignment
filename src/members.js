// Moving users between groups. See docs/DOMAIN.md.
import { withTransaction, forbidden, notFound, conflict, AccessError } from './store.js';
import { resolvePermissions, can, membership, activeAssignment, getGroup } from './permissions.js';

export function ownerCount(store, orgId) {
  const owner = store.groups.find((g) => g.org_id === orgId && g.system_key === 'owner' && !g.deleted);
  return store.assignments.filter((a) => a.org_id === orgId && !a.deleted && a.group_id === owner?.id).length;
}

// Moves userId into groupId (or adds them if they have no group yet).
export function changeGroup(store, { actorId, orgId, groupId, userId }) {
  const actor = resolvePermissions(store, actorId, orgId);
  if (!can(actor, 'groups.manage')) throw forbidden('You cannot change groups in this org.');

  const target = getGroup(store, orgId, groupId);
  if (!target) throw notFound('Group not found.');
  if (!membership(store, userId, orgId)) throw notFound('User is not a member of this org.');

  if (target.system_key === 'owner' && actor.systemKey !== 'owner') {
    throw forbidden('Only owners can make someone an owner.');
  }

  return withTransaction(store, () => {
    const current = activeAssignment(store, userId, orgId);
    if (current?.group_id === groupId) return current;

    if (current) {
      const currentGroup = getGroup(store, orgId, current.group_id);
      if (currentGroup?.system_key === 'owner' && ownerCount(store, orgId) <= 1) {
        throw conflict('last_owner', 'An org must keep at least one owner.');
      }
      current.deleted = true;
    }

    const assignment = { org_id: orgId, user_id: userId, group_id: groupId, deleted: false, created_by: actorId };
    store.assignments.push(assignment);
    store.audit_log.push({
      org_id: orgId,
      actor_id: actorId,
      user_id: userId,
      from: current?.group_id ?? null,
      to: groupId,
    });
    return assignment;
  });
}

// Moves several users into groupId in one request ("Move selected" in the UI).
// Returns a result per user so the UI can show partial failures.
export function moveUsers(store, { actorId, orgId, groupId, userIds }) {
  const actor = resolvePermissions(store, actorId, orgId);
  if (!can(actor, 'groups.manage')) throw forbidden('You cannot change groups in this org.');

  const target = getGroup(store, orgId, groupId);
  if (!target) throw notFound('Group not found.');
  if (target.system_key === 'owner' && actor.systemKey !== 'owner') {
    throw forbidden('Only owners can make someone an owner.');
  }

  // Each user goes through changeGroup, so the owner count is re-checked after every
  // move and each change gets its own audit entry with the previous group.
  const results = [];
  for (const userId of new Set(userIds)) {
    try {
      changeGroup(store, { actorId, orgId, groupId, userId });
      results.push({ userId, ok: true });
    } catch (err) {
      if (!(err instanceof AccessError)) throw err;
      results.push({ userId, ok: false, error: err.code });
    }
  }
  return results;
}
