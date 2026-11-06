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

Create one connector per player. The configuration takes the options of `Lens.join`, except `player`:

```javascript
import { Player } from 'theoplayer';
import { LensConnector } from '@theoplayer/lens-connector-web';

const player = new Player(element, configuration);

const lensConnector = new LensConnector(player, {
    namespace: 'my_app',
    destinations: [{ url: 'https://collector.example.com/lens', format: 'json' }]
});
```

`namespace` names your product in Lens: its heartbeats and your own events carry it. The playback reports themselves
are sent in Lens's `lens` namespace, so a destination that filters on namespaces must list `lens` to receive them.

Lens reports to the OptiView ingest by default. To report only to your own destinations, call
`Lens.configure({ backend: 'disabled' })` from `@dolby-optiview/lens-sdk` before creating the connector.

### Content ID

Lens derives the content ID (`cid`) from the source URL. To report your own, or to report sources without a URL, such
as Google DAI streams, return it from `contentId`:

```javascript
const lensConnector = new LensConnector(player, {
    namespace: 'my_app',
    contentId: (source) => source.metadata?.title
});
```

### Your own events

`lensConnector.handle` is the Lens handle the connector joined with. Use it to emit your own events, to set consent, or
to flush:

```javascript
lensConnector.handle.emitCustom('chapterStart', { custom: { chapter: 3 } });
```

### Other SDKs

Lens reports one session per player adapter. Another SDK that reports this player to Lens should join with
`lensConnector.adapter`, so that both report into the same session.

### Destroying

The connector ends the session and stops reporting when the player is destroyed, or when you destroy it:

```javascript
lensConnector.destroy();
```

## Limitations

- THEOplayer exposes the quality being played, not the one being loaded. Lens therefore reports the top and lowest
  bitrates (`tb`/`lb`, or `tab`/`lab` for HLS), and the playhead bitrate (`pb`) outside HLS, but not the encoded
  bitrate (`br`) or bitrate changes (`bc`).
- Ads are not reported as such: Lens sees what the content player does during an ad break.
