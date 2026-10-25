import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { changeGroup, ownerCount } from '../src/members.js';
import { activeAssignment } from '../src/permissions.js';

test('admin moves a user, with soft delete and audit entry', () => {
  const store = createStore();
  changeGroup(store, { actorId: 'bob', orgId: 'acme', groupId: 'acme:viewer', userId: 'cara' });

  const rows = store.assignments.filter((a) => a.org_id === 'acme' && a.user_id === 'cara');
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.group_id === 'acme:eu-ops').deleted, true);
  assert.equal(activeAssignment(store, 'cara', 'acme').group_id, 'acme:viewer');
  assert.deepEqual(store.audit_log.at(-1), {
    org_id: 'acme',
    actor_id: 'bob',
    user_id: 'cara',
    from: 'acme:eu-ops',
    to: 'acme:viewer',
  });
});

test('viewers cannot change groups', () => {
  const store = createStore();
  assert.throws(
    () => changeGroup(store, { actorId: 'erin', orgId: 'acme', groupId: 'acme:viewer', userId: 'bob' }),
    { code: 'forbidden' },
  );
});

test('admins cannot make someone an owner; owners can', () => {
  const store = createStore();
  assert.throws(
    () => changeGroup(store, { actorId: 'bob', orgId: 'acme', groupId: 'acme:owner', userId: 'cara' }),
    { code: 'forbidden' },
  );
  changeGroup(store, { actorId: 'alice', orgId: 'acme', groupId: 'acme:owner', userId: 'cara' });
  assert.equal(ownerCount(store, 'acme'), 3);
});

test('the last owner cannot be moved out', () => {
  const store = createStore();
  assert.throws(
    () => changeGroup(store, { actorId: 'gus', orgId: 'globex', groupId: 'globex:admin', userId: 'gus' }),
    { code: 'last_owner' },
  );
  assert.equal(ownerCount(store, 'globex'), 1);
});

test('groups from another org cannot be used', () => {
  const store = createStore();
  assert.throws(
    () => changeGroup(store, { actorId: 'alice', orgId: 'acme', groupId: 'globex:ops', userId: 'cara' }),
    { code: 'not_found' },
  );
});
