import { z } from 'zod';

export const EventCategory = z.enum([
  'concert', 'exhibition', 'excursion', 'festival', 'theatre', 'cinema',
  'kids', 'lecture', 'sport', 'religious', 'other',
]);
export type EventCategory = z.infer<typeof EventCategory>;

export const EventClassification = z.object({
  is_event: z.boolean(),
  confidence: z.number().min(0).max(1),
});
export type EventClassification = z.infer<typeof EventClassification>;

export const EventExtraction = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).optional(),
  locationText: z.string().optional(),
  priceFrom: z.number().nonnegative().optional(),
  priceTo: z.number().nonnegative().optional(),
  isFree: z.boolean().optional(),
  category: EventCategory,
  ticketUrl: z.string().url().optional(),
  confidence: z.number().min(0).max(1),
});
export type EventExtraction = z.infer<typeof EventExtraction>;

export const DEFAULT_SOURCE_CRON = '0 */3 * * *';
