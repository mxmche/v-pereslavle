const MAX_LENGTH = 300;
const MIN_SENTENCE_LENGTH = 80;

/**
 * Stores only a short excerpt of a source's description, not the full text:
 * facts are free to reuse, long creative copy is not. Cuts at a sentence end when
 * one falls late enough, otherwise at a word boundary with an ellipsis.
 */
export function excerpt(text: string | undefined, max = MAX_LENGTH): string | undefined {
  const clean = text?.replace(/\s+/g, ' ').trim();
  if (!clean) return undefined;
  if (clean.length <= max) return clean;

  const head = clean.slice(0, max);
  const sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
  if (sentenceEnd >= MIN_SENTENCE_LENGTH) return head.slice(0, sentenceEnd + 1);

  const wordEnd = head.lastIndexOf(' ');
  return `${head.slice(0, wordEnd > 0 ? wordEnd : max).replace(/[\s,;:\-–—]+$/, '')}…`;
}
