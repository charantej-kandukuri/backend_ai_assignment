// HTTP routes. Login is faked: the caller's user ID comes from the x-user-id header.
import { AccessError } from './store.js';
import { resolvePermissions, visibleShipments } from './permissions.js';
import { changeGroup } from './members.js';

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

const routes = [
  {
    method: 'GET',
    pattern: /^\/orgs\/([^/]+)\/me$/,
    handle: ({ store, userId, params: [orgId] }) => {
      const resolved = resolvePermissions(store, userId, orgId);
      return resolved ? [200, resolved] : [403, { error: 'forbidden' }];
    },
  },
  {
    method: 'GET',
    pattern: /^\/orgs\/([^/]+)\/shipments$/,
    handle: ({ store, userId, params: [orgId] }) => {
      if (!resolvePermissions(store, userId, orgId)) return [403, { error: 'forbidden' }];
      return [200, visibleShipments(store, userId, orgId)];
    },
  },
  {
    method: 'POST',
    pattern: /^\/orgs\/([^/]+)\/groups\/([^/]+)\/members$/,
    handle: ({ store, userId, params: [orgId, groupId], body }) => {
      return [200, changeGroup(store, { actorId: userId, orgId, groupId, userId: body.userId })];
    },
  },
];

export function createApp(store) {
  return async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return send(res, 401, { error: 'unauthenticated' });

    const path = new URL(req.url, 'http://localhost').pathname;
    for (const route of routes) {
      const match = route.method === req.method && path.match(route.pattern);
      if (!match) continue;
      try {
        const body = req.method === 'POST' ? await readJson(req) : undefined;
        const [status, payload] = route.handle({ store, userId, params: match.slice(1), body });
        return send(res, status, payload);
      } catch (err) {
        if (err instanceof AccessError) return send(res, err.status, { error: err.code, message: err.message });
        if (err instanceof SyntaxError) return send(res, 400, { error: 'invalid_json' });
        console.error(err);
        return send(res, 500, { error: 'internal' });
      }
    }
    return send(res, 404, { error: 'not_found' });
  };
}
