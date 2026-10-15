import { registerAdapter } from './registry';
import { tourismPereslavlAdapter } from './tourismpereslavl';

export * from './types';
export * from './registry';
export { parseRuDateRange } from './dates';
export { parseCalendarHtml, tourismPereslavlAdapter } from './tourismpereslavl';

registerAdapter(tourismPereslavlAdapter);
