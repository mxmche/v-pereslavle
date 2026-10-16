import { SITE_URL, getEvent } from '../../../lib/api';
import { buildIcs } from '../../../lib/ics';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return new Response('Not found', { status: 404 });
  return new Response(buildIcs(event, `${SITE_URL}/events/${slug}`), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  });
}
