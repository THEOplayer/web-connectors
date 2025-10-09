// Use default import, so Rollup can insert its interop helpers.
import Conviva from '@convivainc/conviva-js-coresdk';

// Re-create Conviva's namespace.
export const Analytics = Conviva.Analytics;
export const Constants = Conviva.Constants;
export type * from '@convivainc/conviva-js-coresdk';
