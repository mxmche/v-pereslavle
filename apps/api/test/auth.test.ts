import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signJwt, verifyJwt } from '../src/auth/jwt';
import { buildPublicWhere, startOfMskDay } from '../src/events/events-query';

test('jwt round-trips and rejects tampering and expiry', () => {
  const exp = Math.floor(Date.now() / 1000) + 60;
  const token = signJwt({ sub: 'a@b.c', role: 'ADMIN', exp }, 'secret');
  assert.equal(verifyJwt(token, 'secret')?.sub, 'a@b.c');
  assert.equal(verifyJwt(token, 'other'), null);
  assert.equal(verifyJwt(token.slice(0, -2) + 'xx', 'secret'), null);
  assert.equal(verifyJwt(token, 'secret', Date.now() + 120_000), null);
  assert.equal(verifyJwt('garbage', 'secret'), null);
});

test('buildPublicWhere defaults to upcoming published events and ignores bad dates', () => {
  const now = new Date('2026-10-16T10:00:00Z');
  const where = buildPublicWhere({ from: 'nope', category: 'kids', location: 'museum' }, now);
  assert.equal(where.status, 'PUBLISHED');
  const and = where.AND as object[];
  const midnight = new Date('2026-10-15T21:00:00Z'); // 16 Oct 00:00 MSK
  assert.deepEqual(and[0], { OR: [{ endsAt: { gte: midnight } }, { endsAt: null, startsAt: { gte: midnight } }] });
  assert.deepEqual(and.slice(1), [{ category: 'kids' }, { location: { slug: 'museum' } }]);
});

test('startOfMskDay rolls over at Moscow midnight', () => {
  assert.equal(startOfMskDay(new Date('2026-10-15T20:59:00Z')).toISOString(), '2026-10-14T21:00:00.000Z');
  assert.equal(startOfMskDay(new Date('2026-10-15T21:01:00Z')).toISOString(), '2026-10-15T21:00:00.000Z');
});
