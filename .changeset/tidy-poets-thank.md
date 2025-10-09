---
'@theoplayer/conviva-connector-web': patch
---

Fixed an issue that prevented the ESM build from being loaded using an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap).
  - The ESM build now imports the Conviva SDK using a default import (`import Conviva from '@convivainc/conviva-js-coresdk'`)
    rather than a named import (`import { Analytics, Constants } from '@convivainc/conviva-js-coresdk'`).
