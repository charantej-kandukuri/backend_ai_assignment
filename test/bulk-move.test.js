import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { moveUsers, ownerCount } from '../src/members.js';
import { activeAssignment } from '../src/permissions.js';

test('bulk move reports a result per user', () => {
  const store = createStore();
  const results = moveUsers(store, { actorId: 'bob', orgId: 'acme', groupId: 'acme:eu-ops', userIds: ['erin', 'max', 'nobody'] });
  assert.deepEqual(results, [
    { userId: 'erin', ok: true },
    { userId: 'max', ok: true },
    { userId: 'nobody', ok: false, error: 'not_found' },
  ]);
  assert.equal(activeAssignment(store, 'erin', 'acme').group_id, 'acme:eu-ops');
});

test('bulk move keeps the last owner', () => {
  const store = createStore();
  const results = moveUsers(store, { actorId: 'gus', orgId: 'globex', groupId: 'globex:admin', userIds: ['gus'] });
  assert.deepEqual(results, [{ userId: 'gus', ok: false, error: 'last_owner' }]);
  assert.equal(ownerCount(store, 'globex'), 1);
});

test('bulk move cannot remove every owner at once', () => {
  const store = createStore();
  const results = moveUsers(store, { actorId: 'alice', orgId: 'acme', groupId: 'acme:admin', userIds: ['alice', 'olga'] });
  assert.deepEqual(results, [
    { userId: 'alice', ok: true },
    { userId: 'olga', ok: false, error: 'last_owner' },
  ]);
  assert.equal(ownerCount(store, 'acme'), 1);
  assert.equal(activeAssignment(store, 'olga', 'acme').group_id, 'acme:owner');
});

test('bulk move audits each user with their previous group', () => {
  const store = createStore();
  moveUsers(store, { actorId: 'bob', orgId: 'acme', groupId: 'acme:viewer', userIds: ['cara', 'erin', 'max', 'nobody'] });
  assert.deepEqual(store.audit_log, [
    { org_id: 'acme', actor_id: 'bob', user_id: 'cara', from: 'acme:eu-ops', to: 'acme:viewer' },
    { org_id: 'acme', actor_id: 'bob', user_id: 'erin', from: null, to: 'acme:viewer' },
  ]);
});

test('admins cannot bulk move users into owner', () => {
  const store = createStore();
  assert.throws(
    () => moveUsers(store, { actorId: 'bob', orgId: 'acme', groupId: 'acme:owner', userIds: ['cara'] }),
    { code: 'forbidden' },
  );
});
