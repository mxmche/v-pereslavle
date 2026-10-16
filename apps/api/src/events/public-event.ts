export interface WithSources {
  imageUrl: string | null;
  sources: { url: string | null; source: { name: string; allowImages: boolean } }[];
}

/**
 * Public view of an event: the image is only exposed when at least one of its
 * sources has allowImages set; the flag itself is not leaked.
 */
export function toPublicEvent<T extends WithSources>(event: T) {
  const allowImage = event.sources.some((s) => s.source.allowImages);
  return {
    ...event,
    imageUrl: allowImage ? event.imageUrl : null,
    sources: event.sources.map((s) => ({ url: s.url, source: { name: s.source.name } })),
  };
}
