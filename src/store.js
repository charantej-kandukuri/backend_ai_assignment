// In-memory data store. Stands in for a database so the exercise needs no setup.
import { seed } from './seed.js';

export function createStore(data = seed) {
  return structuredClone(data);
}

// Runs fn and restores every table if it throws, like a database transaction.
export function withTransaction(store, fn) {
  const snapshot = structuredClone(store);
  try {
    return fn(store);
  } catch (err) {
    for (const key of Object.keys(snapshot)) store[key] = snapshot[key];
    throw err;
  }
}

export class AccessError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const forbidden = (message) => new AccessError(403, 'forbidden', message);
export const notFound = (message) => new AccessError(404, 'not_found', message);
export const conflict = (code, message) => new AccessError(409, code, message);
