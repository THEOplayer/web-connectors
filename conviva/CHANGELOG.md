# @theoplayer/conviva-connector-web

## 3.1.1

### 🐛 Issues

- Fixed an issue that prevented the ESM build from being loaded using an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap).
    - The ESM build now imports the Conviva SDK using a default import (`import Conviva from '@convivainc/conviva-js-coresdk'`)
      rather than a named import (`import { Analytics, Constants } from '@convivainc/conviva-js-coresdk'`).

## 3.1.0

### ✨ Features

- Moved the ad start tracking to when the first frame has loaded.
- Added reporting of `encoding_type` (either "DASH", "HLS" or "HESP"), as well as `Constant.defaultResource` and `intentToFallback` reason for THEOlive sources.

## 3.0.0

### 💥 Breaking Changes

- Dropped support for THEOplayer version 8.11.0 and lower.

### ✨ Features

- Added support for THEOplayer version 10.

## 2.9.0

### ✨ Features

- Added play-out configuration values such as `liveOffset`, `targetBuffer`, `bufferLookbackWindow`, `abrStrategy` and `abrMetadata` as custom metadata fields.
- Fixed an issue where the `streamType` value set through the connector API could be overriden with a different value by the connector.

## 2.8.0

### ✨ Features

- Added full call stack info to an error report by splitting it in multiple entries.

## 2.7.0

### ✨ Features

- Added the ability to include the player name in the metadata object passed when creating the ConvivaConnector.
- Added support for THEOplayer `9.0`.

## 2.6.0

### ✨ Features

- Added a check to differentiate between Samsung, LG, Xbox and Vizio when defining the default device category in the metadata.
- Added a detailed report, containing the current player buffer and last fetched segments, in case of a playback failure.

### 🐛 Issues

- Added 'Server Guided' as ad type passed when reporting a THEOads ad break has started.

## 2.5.1

### 🐛 Issues

- Fixed an issue where the stream type, either `VOD` or `Live`, would sometimes be set with a wrong value for live streams.

## 2.5.0

### ✨ Features

- Added `deviceMetadata` property to `ConvivaConfiguration`.

### 🐛 Issues

- Fixed an issue where an asset name, provided via a `ConvivaMetadata` object in the `ConvivaConnector` initialization, stops getting reported after a `sourcechange` event.
- Fixed an issue where the content type of an ad would sometimes be reported as "Live".

## 2.4.0

### ✨ Features

- Added 'Server Guided' ad technology.

## 2.3.0

### ✨ Features

- Added reporting of slate for THEOads.
- Added additional error details on playback failure.

## 2.2.0

### ✨ Features

- Added support for THEOplayer `8.0`.

## 2.1.4

### 🐛 Issues

- Fixed an issue where we could throw an error for non Google-IMA ads.

## 2.1.3

### 🐛 Issues

- Fixed an issue where the metadata is not passed correctly after a replay.

## 2.1.2

### 🐛 Issues

- Fixed an issue where the `segmentnotfound` event was reported as a fatal error.

## 2.1.1

### 🐛 Issues

- Report average bitrate to Conviva.

## 2.1.0

### ✨ Features

- Changed Conviva SDK to a peer dependency, enabling users to update it independently from the Conviva connector.

### 🐛 Issues

- Fixed an issue where TypeScript could throw a TS2307 type error on the generated type definitions when the optional `@theoplayer/yospace-connector-web` peer dependency is not installed.

### 📦 Dependency Updates

- @theoplayer/yospace-connector-web@2.1.2

## 2.0.2

### 🐛 Issues

- Fixed an issue where the THEOplayer library and the Yospace connector were accidentally bundled together with the Conviva connector.

### 📦 Dependency Updates

- @theoplayer/yospace-connector-web@2.1.1

## 2.0.1

### 🐛 Issues

- Added functionality to listen for external ad events using the `convivaAdEventsExtension` property.

## 2.0.0

### 📦 Dependency Updates

- @theoplayer/yospace-connector-web@2.1.0

## 1.3.0

### ✨ Features

- Updated to be compatible with THEOplayer `6.X`.

## 1.2.0

### ✨ Features

- Added error event with addition error information on playback failed.

## 1.1.7

### 🐛 Issues

- Removed reporting a buffering state on getting an `emptied` event.

## 1.1.6

### ✨ Features

- Added ad metadata for CSAI.

### 🐛 Issues

- Fixed an issue where the ad break position would be incorrectly reported.

## 1.1.5

### 🐛 Issues

- Updated yospace connector peer dependency.

## 1.1.4

### 🐛 Issues

- Fixed an issue where a session could be created without a source.

## 1.1.3

### Changed

- Made THEOplayer an external dependency.

## 1.1.2

### 🐛 Issues

- Fixed passing content length for a live stream or on early error.

## 1.1.1

### Changed

- Updated THEOplayer version to 5.X.

## 1.1.0

### ✨ Features

- Added `setContentInfo` to pass video metadata during playback.
- Added `setAdInfo` to pass ad metadata during playback.
- Added `reportPlaybackFailed` to notify Conviva of non-video errors.
- Added `stopAndStartNewSession` to enable explicitly stopping the current session and starting a new one.
- Added visibility change reporting.
- Updated THEOplayer version to 4.X.
- Improved error handling.
- Improved default metadata.

### 🐛 Issues

- Fixed handling a replay of the same source.

## 1.0.0

### ✨ Features

- Initial release
