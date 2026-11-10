# lens-connector-web

The Lens connector reports playback of THEOplayer to [Dolby OptiView Lens](https://www.npmjs.com/package/@dolby-optiview/lens-sdk).

The connector implements a Lens player adapter for THEOplayer and joins Lens with it. Lens then reports playback on its
own, as CMCD (CTA-5004-B) event-mode reports: a session per source from the first play request, playback states,
errors, and the player keys it can derive, such as the playhead, buffer length, throughput and bitrates.

## Prerequisites

In order to use this connector, a [THEOplayer](https://www.npmjs.com/package/theoplayer) build with a valid license is
required. You can use your existing THEOplayer HTML5 SDK license or request yours via
[THEOportal](https://portal.theoplayer.com/).

The connector requires the [Lens SDK](https://www.npmjs.com/package/@dolby-optiview/lens-sdk) as a peer dependency, so
that your app holds one copy of it, shared with any other SDK that reports to Lens.

## Installation

```bash
npm install @theoplayer/lens-connector-web @dolby-optiview/lens-sdk
```

## Usage

Create one connector per player:

```javascript
import { Player } from 'theoplayer';
import { LensConnector } from '@theoplayer/lens-connector-web';

const player = new Player(element, configuration);

const lensConnector = new LensConnector(player);
```

Lens reports to the OptiView ingest by default. The configuration takes the options of `Lens.join`, except `namespace`
and `player`, for example to add destinations of your own:

```javascript
const lensConnector = new LensConnector(player, {
    destinations: [{ url: 'https://collector.example.com/lens', format: 'json' }]
});
```

To report only to your own destinations, call `Lens.configure({ backend: 'disabled' })` from `@dolby-optiview/lens-sdk`
before creating the connector.

The playback reports are sent in Lens's `lens` namespace, and the connector's heartbeats in the `theoplayer` namespace.
A destination that filters on namespaces must list them to receive them.

### Content ID

Lens derives the content ID (`cid`) from the source URL. A Google DAI stream is named by its asset key, or by
`contentSourceID/videoID`. To report your own, return it from `contentId`; return `undefined` to keep the default:

```javascript
const lensConnector = new LensConnector(player, {
    contentId: (source) => source.metadata?.title
});
```

### Your own events

To report events of your own, join Lens in your own registered namespace with the player. Lens keys a session on the
player, so your events and the player's playback share that session. Another SDK that reports this player to Lens joins
with the player the same way.

```javascript
import { Lens } from '@dolby-optiview/lens-sdk';

const lens = Lens.join({ namespace: 'my_namespace', player });
lens.emitCustom('chapterStart', { custom: { chapter: 3 } });
```

`lensConnector.handle` is the Lens handle the connector joined with. Use it to set consent or to flush.

### Destroying

The connector ends the session and stops reporting when the player is destroyed, or when you destroy it:

```javascript
lensConnector.destroy();
```

## Demo

`test/pages/main_esm.html` plays sources through the connector and shows, in the page, the reports Lens sends and the
facts the connector gives it. Build the connector and serve the repository:

```bash
npm run build -w lens
npm run serve -w lens
```

Paste a THEOplayer license in the page's settings. With "Send to the OptiView staging ingest" on, the reports go to the
development ingest through the Lens SDK's dev add-on; with it off, they stay in the page. "Your destination" adds an
endpoint of your own, in CMCD or JSON; it must answer the CORS preflight from the page. "Run scenario" plays a fixed
sequence of about a minute (play, pause, seek, mute, rate, picture-in-picture, play to the end) under the content ID
`lens-connector-demo-scenario`, meant to be repeated by the other platforms' demos so their sessions can be compared in
the backend.

## Limitations

- THEOplayer exposes the quality being played, not the one being loaded. Lens therefore reports the top and lowest
  bitrates (`tb`/`lb`, or `tab`/`lab` for HLS), and the playhead bitrate (`pb`) outside HLS, but not the encoded
  bitrate (`br`) or bitrate changes (`bc`).
- Only errors that stop playback are reported. Recoverable ones, such as a failed segment request that is retried, are
  not.
- Ads are not reported as such: Lens sees what the content player does during an ad break.
