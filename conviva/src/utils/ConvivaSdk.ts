// Use default import, so Rollup can insert its interop helpers.
import Conviva from '@convivainc/conviva-js-coresdk';

// Re-create Conviva's namespace.
const { Analytics, Constants } = Conviva;
export { Analytics, Constants };
export type * from '@convivainc/conviva-js-coresdk';
