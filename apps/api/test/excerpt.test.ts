import { test } from 'node:test';
import assert from 'node:assert/strict';
import { excerpt } from '../src/crawl/excerpt';

test('excerpt keeps short text and normalises whitespace', () => {
  assert.equal(excerpt('  Короткий\n текст  '), 'Короткий текст');
  assert.equal(excerpt(undefined), undefined);
  assert.equal(excerpt('   '), undefined);
});

test('excerpt cuts long text at a sentence end', () => {
  const sentence = 'Это достаточно длинное предложение про выставку и её экспонаты в музее.';
  const text = `${sentence} ${sentence} ${sentence} ${sentence} ${sentence}`;
  const out = excerpt(text)!;
  assert.ok(out.length <= 300);
  assert.ok(out.endsWith('.'));
});

test('excerpt cuts at a word boundary with an ellipsis when no sentence ends', () => {
  const out = excerpt('слово '.repeat(100), 50)!;
  assert.ok(out.length <= 51);
  assert.ok(out.endsWith('слово…'));
});
