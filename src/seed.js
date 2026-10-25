// Fixture data: two orgs. IDs are readable strings instead of UUIDs.

const ALL = { shipments: { view: true, edit: true }, groups: { manage: true } };
const VIEW_ONLY = { shipments: { view: true, edit: false }, groups: { manage: false } };

function systemGroups(orgId) {
  const base = { org_id: orgId, all_tags: true, tags: [], deleted: false };
  return [
    { ...base, id: `${orgId}:owner`, name: 'Owner', system_key: 'owner', permissions: ALL },
    { ...base, id: `${orgId}:admin`, name: 'Admin', system_key: 'admin', permissions: ALL },
    { ...base, id: `${orgId}:viewer`, name: 'Viewer', system_key: 'viewer', permissions: VIEW_ONLY },
  ];
}

function assign(orgId, userId, groupId) {
  return { org_id: orgId, user_id: userId, group_id: groupId, deleted: false, created_by: 'system' };
}

export const seed = {
  orgs: [
    { id: 'acme', name: 'Acme Pharma' },
    { id: 'globex', name: 'Globex Logistics' },
  ],

  members: [
    { org_id: 'acme', user_id: 'alice', suspended: false },
    { org_id: 'acme', user_id: 'olga', suspended: false },
    { org_id: 'acme', user_id: 'bob', suspended: false },
    { org_id: 'acme', user_id: 'cara', suspended: false },
    { org_id: 'acme', user_id: 'erin', suspended: false },
    { org_id: 'acme', user_id: 'frank', suspended: true },
    { org_id: 'acme', user_id: 'max', suspended: false },
    { org_id: 'globex', user_id: 'gus', suspended: false },
    { org_id: 'globex', user_id: 'hana', suspended: false },
    { org_id: 'globex', user_id: 'max', suspended: false },
  ],

  groups: [
    ...systemGroups('acme'),
    ...systemGroups('globex'),
    {
      id: 'acme:eu-ops',
      org_id: 'acme',
      name: 'EU Ops',
      system_key: null,
      all_tags: false,
      tags: ['tag-eu'],
      permissions: { shipments: { view: true, edit: true }, groups: { manage: false } },
      deleted: false,
    },
    {
      id: 'globex:ops',
      org_id: 'globex',
      name: 'Globex Ops',
      system_key: null,
      all_tags: true,
      tags: [],
      permissions: { shipments: { view: true, edit: true }, groups: { manage: false } },
      deleted: false,
    },
  ],

  assignments: [
    assign('acme', 'alice', 'acme:owner'),
    assign('acme', 'olga', 'acme:owner'),
    assign('acme', 'bob', 'acme:admin'),
    assign('acme', 'cara', 'acme:eu-ops'),
    assign('acme', 'frank', 'acme:admin'),
    assign('acme', 'max', 'acme:viewer'),
    // erin has no group, so she is treated as viewer.
    assign('globex', 'gus', 'globex:owner'),
    assign('globex', 'hana', 'globex:ops'),
    assign('globex', 'max', 'globex:admin'),
  ],

  shipments: [
    { id: 'shp-1', org_id: 'acme', reference: 'ACME-001', tags: ['tag-cold'] },
    { id: 'shp-2', org_id: 'acme', reference: 'ACME-002', tags: ['tag-eu'] },
    { id: 'shp-3', org_id: 'acme', reference: 'ACME-003', tags: [] },
    { id: 'shp-4', org_id: 'globex', reference: 'GLX-001', tags: ['tag-north'] },
  ],

  audit_log: [],
};
