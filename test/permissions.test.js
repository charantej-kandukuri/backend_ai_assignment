import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { resolvePermissions, visibleShipments, canAccessShipment } from '../src/permissions.js';

const ids = (shipments) => shipments.map((s) => s.id).sort();

test('owner sees every shipment in their own org only', () => {
  const store = createStore();
  assert.deepEqual(ids(visibleShipments(store, 'alice', 'acme')), ['shp-1', 'shp-2', 'shp-3']);
  assert.deepEqual(ids(visibleShipments(store, 'gus', 'globex')), ['shp-4']);
});

test('custom group sees only shipments with its tags, not untagged ones', () => {
  const store = createStore();
  assert.deepEqual(ids(visibleShipments(store, 'cara', 'acme')), ['shp-2']);
});

test('member with no group is treated as viewer', () => {
  const store = createStore();
  assert.equal(resolvePermissions(store, 'erin', 'acme').systemKey, 'viewer');
  assert.equal(canAccessShipment(store, 'erin', 'acme', 'shp-1', 'view'), true);
  assert.equal(canAccessShipment(store, 'erin', 'acme', 'shp-1', 'edit'), false);
});

test('suspended members and non-members get no access', () => {
  const store = createStore();
  assert.equal(resolvePermissions(store, 'frank', 'acme'), null);
  assert.equal(resolvePermissions(store, 'gus', 'acme'), null);
});

test('a user in two orgs has separate permissions in each', () => {
  const store = createStore();
  assert.equal(resolvePermissions(store, 'max', 'acme').systemKey, 'viewer');
  assert.equal(resolvePermissions(store, 'max', 'globex').systemKey, 'admin');
});

test('shipments from another org are never accessible', () => {
  const store = createStore();
  assert.equal(canAccessShipment(store, 'alice', 'acme', 'shp-4', 'view'), false);
});
