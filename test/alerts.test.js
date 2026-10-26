import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { usersToNotify, groupsForShipment } from '../src/alerts.js';

test('EU shipment alert reaches EU Ops and all-tags groups', () => {
  const users = usersToNotify(createStore(), 'shp-2');
  assert.ok(users.includes('cara'));
  assert.ok(users.includes('alice'));
  assert.ok(users.includes('bob'));
});

test('2-8C shipment alert does not reach EU Ops', () => {
  const users = usersToNotify(createStore(), 'shp-1');
  assert.ok(users.includes('alice'));
  assert.ok(!users.includes('cara'));
});

test('alerts reach exactly the users who can view the shipment', () => {
  const store = createStore();
  // erin has no group, so she is a viewer; frank is suspended; gus and hana are globex only.
  assert.deepEqual(usersToNotify(store, 'shp-1'), ['alice', 'bob', 'erin', 'max', 'olga']);
  assert.deepEqual(usersToNotify(store, 'shp-2'), ['alice', 'bob', 'cara', 'erin', 'max', 'olga']);
  assert.deepEqual(usersToNotify(store, 'shp-4'), ['gus', 'hana', 'max']);
});

test('groups without view permission are not alerted', () => {
  const store = createStore();
  store.groups.push({
    id: 'acme:cold-audit',
    org_id: 'acme',
    name: 'Cold Audit',
    system_key: null,
    all_tags: false,
    tags: ['tag-cold'],
    permissions: { shipments: { view: false, edit: false }, groups: { manage: false } },
    deleted: false,
  });
  store.assignments.push({ org_id: 'acme', user_id: 'erin', group_id: 'acme:cold-audit', deleted: false, created_by: 'alice' });
  assert.ok(!usersToNotify(store, 'shp-1').includes('erin'));
});

test('groupsForShipment only returns groups in the shipment org', () => {
  const store = createStore();
  const shipment = store.shipments.find((s) => s.id === 'shp-4');
  assert.deepEqual(groupsForShipment(store, shipment).map((g) => g.org_id), ['globex', 'globex', 'globex', 'globex']);
});

test('unknown shipment notifies nobody', () => {
  assert.deepEqual(usersToNotify(createStore(), 'nope'), []);
});
