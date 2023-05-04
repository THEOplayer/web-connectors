# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.1.4] - 2023-04-26

### Fixed

- Fixed an issue where a session could be created without a source.

## [1.1.3] - 2023-04-20

### Changed

- Made THEOplayer an external dependency.

## [1.1.2] - 2023-04-14

### Fixed

- Fixed passing content length for a live stream or on early error.

## [1.1.1] - 2023-04-07

### Changed

- Updated THEOplayer version to 5.X.

## [1.1.0] - 2023-03-30

### Added

- Added `setContentInfo` to pass video metadata during playback.
- Added `setAdInfo` to pass ad metadata during playback.
- Added `reportPlaybackFailed` to notify Conviva of non-video errors.
- Added `stopAndStartNewSession` to enable explicitly stopping the current session and starting a new one.
- Added visibility change reporting.

### Changed

- Updated THEOplayer version to 4.X.
- Improved error handling.
- Improved default metadata.

### Fixed

- Fixed handling a replay of the same source.

## [1.0.0] - 2022-08-03

Initial release
