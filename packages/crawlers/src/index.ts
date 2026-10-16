import { registerAdapter } from './registry';
import { museumPereslavlAdapter } from './museumpereslavl';
import { tourismPereslavlAdapter } from './tourismpereslavl';

export * from './types';
export * from './registry';
export { parseRuDateRange, parseDottedDateRange } from './dates';
export { parseCalendarHtml, tourismPereslavlAdapter } from './tourismpereslavl';

export { museumPereslavlAdapter, parseExhibitionDetail, parseTemporaryExhibitionLinks } from './museumpereslavl';

registerAdapter(tourismPereslavlAdapter);
registerAdapter(museumPereslavlAdapter);
