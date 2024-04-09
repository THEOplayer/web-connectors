# @theoplayer/conviva-connector-web

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
