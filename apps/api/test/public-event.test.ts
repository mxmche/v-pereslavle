import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPublicEvent } from '../src/events/public-event';

test('toPublicEvent hides the image unless a source allows it and strips the flag', () => {
  const event = (allowImages: boolean) => ({
    imageUrl: 'https://x/img.jpg',
    sources: [{ url: 'https://x/e', source: { name: 'X', allowImages } }],
  });
  assert.equal(toPublicEvent(event(false)).imageUrl, null);
  assert.equal(toPublicEvent(event(true)).imageUrl, 'https://x/img.jpg');
  assert.deepEqual(toPublicEvent(event(true)).sources, [{ url: 'https://x/e', source: { name: 'X' } }]);
});
