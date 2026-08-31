import * as Conviva from '@convivainc/conviva-js-coresdk';

// Conviva is distributed as CommonJS, so depending on the user's bundler choice
// we will either get a single default export or separate named exports.
const { Analytics, Constants } = 'Constants' in Conviva ? Conviva : ((Conviva as any).default as typeof Conviva);

// Re-export the Conviva SDK as *actual* named exports.
export { Analytics, Constants };
export type * from '@convivainc/conviva-js-coresdk';
