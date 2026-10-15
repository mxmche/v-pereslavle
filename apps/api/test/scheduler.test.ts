import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDue } from '../src/sources/sources.scheduler';

test('isDue follows the source cron', () => {
  const cron = '0 */3 * * *';
  const last = new Date('2026-10-15T09:05:00Z'); // 12:05 MSK
  assert.equal(isDue(cron, null), true);
  assert.equal(isDue(cron, last, new Date('2026-10-15T11:59:00Z')), false); // before 15:00 MSK
  assert.equal(isDue(cron, last, new Date('2026-10-15T12:00:00Z')), true); // 15:00 MSK
});
