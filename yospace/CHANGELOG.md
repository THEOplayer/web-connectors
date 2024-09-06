# @theoplayer/yospace-connector-web

## 2.4.0

### ✨ Features

- Added support for THEOplayer `8.0`.

## 2.3.0

### ✨ Features

- Added `YospaceServerSideAdInsertionConfiguration` type definition to the connector,
  superseding the type defined by the THEOplayer Web SDK.

## 2.2.0

### ✨ Features

- The connector now integrates with the [custom server-side ad integration API](https://www.theoplayer.com/docs/theoplayer/v7/api-reference/web/interfaces/Ads.html#registerServerSideIntegration.registerServerSideIntegration-1) introduced in THEOplayer 7.4.0. This allows Yospace adverts to show up through the `player.ads` API of THEOplayer.

## 2.1.3

### 🐛 Issues

- Fixed playback position reporting for live DVR streams (with `streamType` set to `"livepause"`).

## 2.1.2

### 🐛 Issues

- Fix missing API types in TypeScript type definitions.

## 2.1.1

### 🐛 Issues

- Added support for THEOplayer 7.0.

## 2.1.0

### ✨ Features

- Exposed SessionErrorCode.

## 2.0.0

### ✨ Features

- Upgrade to latest Yospace Ad Management SDK

## 1.4.0

### ✨ Features

- Allow THEOplayer 6.0.0 as peer dependency

## 1.3.0

### ✨ Features

- Update THEOplayer peer dependency

## 1.2.0

### ✨ Features

- Expose typings

### 🐛 Issues

- Handle empty `activeCues` list

## 1.1.0

### ✨ Features

- Add support for custom Analytics Event Observers

## 1.0.0

### ✨ Features

- Initial release
