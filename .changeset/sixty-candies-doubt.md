---
'@theoplayer/conviva-connector-web': patch
---

Fixed an issue that prevented the ESM build from being loaded by certain bundlers.
 - The ESM build now imports the Conviva SDK using a namespace import (`import * as Conviva from '@convivainc/conviva-js-coresdk'`) and will auto-detect if the Conviva SDK was exported as a single `default` export or as named exports.