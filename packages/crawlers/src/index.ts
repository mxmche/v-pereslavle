import { registerAdapter } from './registry';
import { admPereslavlAdapter } from './admpereslavl';
import { museumPereslavlAdapter } from './museumpereslavl';
import { tourismPereslavlAdapter } from './tourismpereslavl';

export * from './types';
export * from './registry';
export { parseRuDateRange, parseDottedDateRange } from './dates';
export { parseCalendarHtml, tourismPereslavlAdapter } from './tourismpereslavl';

export { museumPereslavlAdapter, parseExhibitionDetail, parseTemporaryExhibitionLinks } from './museumpereslavl';
export { admPereslavlAdapter, parseDayAnnouncements, parseMonthDays } from './admpereslavl';

registerAdapter(tourismPereslavlAdapter);
registerAdapter(museumPereslavlAdapter);
registerAdapter(admPereslavlAdapter);
